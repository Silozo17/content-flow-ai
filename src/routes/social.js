const express = require('express');
const axios = require('axios');
const { authenticateToken, requireWorkspaceAccess } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/social/connect/{platform}:
 *   get:
 *     summary: Initiate OAuth connection to social platform
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter, facebook]
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Connect account for specific client (agencies only)
 */
router.get('/connect/:platform', authenticateToken, async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { clientId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate platform
    const supportedPlatforms = ['tiktok', 'instagram', 'youtube', 'linkedin', 'twitter', 'facebook'];
    if (!supportedPlatforms.includes(platform)) {
      return res.status(400).json({
        error: 'Unsupported platform',
        message: `Platform must be one of: ${supportedPlatforms.join(', ')}`
      });
    }

    // Validate client access if clientId provided
    if (clientId) {
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, creator_id')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return res.status(404).json({
          error: 'Client not found',
          message: 'The specified client does not exist'
        });
      }

      if (client.creator_id !== userId && userRole !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this client'
        });
      }
    }

    // Generate OAuth URL based on platform
    const oauthUrl = generateOAuthUrl(platform, userId, clientId);

    if (!oauthUrl) {
      return res.status(500).json({
        error: 'OAuth configuration missing',
        message: `OAuth credentials not configured for ${platform}`
      });
    }

    logger.info(`OAuth connection initiated for ${platform} by user ${userId}`);

    res.json({
      success: true,
      data: {
        platform,
        authUrl: oauthUrl,
        message: `Redirect to this URL to connect your ${platform} account`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/social/callback/{platform}:
 *   get:
 *     summary: Handle OAuth callback from social platform
 *     tags: [Social Media]
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter, facebook]
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from OAuth provider
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State parameter containing user and client info
 */
router.get('/callback/:platform', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_cancelled`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_invalid`);
    }

    // Decode state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (decodeError) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_invalid_state`);
    }

    const { userId, clientId } = stateData;

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(platform, code);

    if (!tokenData) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_token_failed`);
    }

    // Get user profile from platform
    const profileData = await getPlatformProfile(platform, tokenData.access_token);

    if (!profileData) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_profile_failed`);
    }

    // Save social account to database
    const { data: socialAccount, error: saveError } = await supabaseAdmin
      .from('social_accounts')
      .upsert({
        user_id: userId,
        client_id: clientId || null,
        platform,
        account_id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenData.expires_at,
        account_data: profileData,
        status: 'active',
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,account_id'
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Failed to save social account:', saveError);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=save_failed`);
    }

    logger.info(`Social account connected: ${platform} for user ${userId}`);

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=${platform}&username=${profileData.username}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=oauth_failed`);
  }
});

/**
 * @swagger
 * /api/social/accounts:
 *   get:
 *     summary: Get connected social media accounts
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter, facebook]
 *         description: Filter by platform
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by client (agencies only)
 */
router.get('/accounts', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { platform, clientId } = req.query;

    let query = supabaseAdmin
      .from('social_accounts')
      .select(`
        *,
        client:clients(id, name, brand)
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userRole === 'client') {
      query = query.eq('user_id', userId);
    } else if (userRole === 'creator' || userRole === 'agency') {
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.eq('user_id', userId);
      }
    }

    // Apply additional filters
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: accounts, error } = await query;

    if (error) {
      throw error;
    }

    // Remove sensitive data from response
    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      display_name: account.display_name,
      account_data: {
        followers_count: account.account_data?.followers_count,
        profile_image: account.account_data?.profile_image,
        verified: account.account_data?.verified
      },
      status: account.status,
      last_sync: account.last_sync,
      client: account.client,
      created_at: account.created_at
    }));

    res.json({
      success: true,
      data: sanitizedAccounts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/social/accounts/{id}:
 *   delete:
 *     summary: Disconnect social media account
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.delete('/accounts/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get account details
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'The requested social media account does not exist'
      });
    }

    // Check permissions
    if (userRole === 'client' && account.user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only disconnect your own accounts'
      });
    }

    if ((userRole === 'creator' || userRole === 'agency') && account.user_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only disconnect accounts you manage'
      });
    }

    // Revoke token on platform (if supported)
    try {
      await revokePlatformToken(account.platform, account.access_token);
    } catch (revokeError) {
      logger.warn(`Failed to revoke token for ${account.platform}:`, revokeError);
    }

    // Delete account from database
    const { error: deleteError } = await supabaseAdmin
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(`Social account disconnected: ${account.platform} (${account.username}) by user ${userId}`);

    res.json({
      success: true,
      message: `${account.platform} account disconnected successfully`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/social/accounts/{id}/sync:
 *   post:
 *     summary: Sync social media account data
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.post('/accounts/:id/sync', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get account details
    const { data: account, error: fetchError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'The requested social media account does not exist'
      });
    }

    // Check permissions
    if (account.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only sync accounts you own'
      });
    }

    // Check if token is still valid
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please reconnect your account to sync data'
      });
    }

    // Fetch fresh profile data
    const profileData = await getPlatformProfile(account.platform, account.access_token);

    if (!profileData) {
      return res.status(500).json({
        error: 'Sync failed',
        message: 'Unable to fetch fresh data from platform'
      });
    }

    // Update account data
    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('social_accounts')
      .update({
        display_name: profileData.display_name,
        account_data: profileData,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    logger.info(`Social account synced: ${account.platform} (${account.username}) by user ${userId}`);

    res.json({
      success: true,
      message: 'Account data synced successfully',
      data: {
        id: updatedAccount.id,
        platform: updatedAccount.platform,
        username: updatedAccount.username,
        display_name: updatedAccount.display_name,
        last_sync: updatedAccount.last_sync
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate OAuth URLs
function generateOAuthUrl(platform, userId, clientId) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const redirectUri = `${baseUrl}/api/social/callback/${platform}`;
  const state = Buffer.from(JSON.stringify({ userId, clientId })).toString('base64');

  switch (platform) {
    case 'tiktok':
      if (!process.env.TIKTOK_CLIENT_KEY) return null;
      return `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    case 'instagram':
    case 'facebook':
      if (!process.env.META_APP_ID) return null;
      const scope = platform === 'instagram' ? 'instagram_basic,instagram_content_publish' : 'pages_show_list,pages_read_engagement';
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
    
    case 'youtube':
      if (!process.env.YOUTUBE_CLIENT_ID) return null;
      return `https://accounts.google.com/oauth2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${state}`;
    
    case 'linkedin':
      if (!process.env.LINKEDIN_CLIENT_ID) return null;
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile,r_emailaddress,w_member_social&state=${state}`;
    
    case 'twitter':
      // Twitter OAuth 2.0 would require PKCE implementation
      return null;
    
    default:
      return null;
  }
}

// Helper function to exchange authorization code for access token
async function exchangeCodeForToken(platform, code) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const redirectUri = `${baseUrl}/api/social/callback/${platform}`;

  try {
    switch (platform) {
      case 'tiktok':
        const tiktokResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        });
        
        return {
          access_token: tiktokResponse.data.data.access_token,
          refresh_token: tiktokResponse.data.data.refresh_token,
          expires_at: new Date(Date.now() + tiktokResponse.data.data.expires_in * 1000).toISOString()
        };

      case 'instagram':
      case 'facebook':
        const metaResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code
        });
        
        return {
          access_token: metaResponse.data.access_token,
          expires_at: metaResponse.data.expires_in ? 
            new Date(Date.now() + metaResponse.data.expires_in * 1000).toISOString() : null
        };

      case 'youtube':
        const youtubeResponse = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.YOUTUBE_CLIENT_ID,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code
        });
        
        return {
          access_token: youtubeResponse.data.access_token,
          refresh_token: youtubeResponse.data.refresh_token,
          expires_at: new Date(Date.now() + youtubeResponse.data.expires_in * 1000).toISOString()
        };

      default:
        return null;
    }
  } catch (error) {
    logger.error(`Token exchange failed for ${platform}:`, error.response?.data || error.message);
    return null;
  }
}

// Helper function to get platform profile
async function getPlatformProfile(platform, accessToken) {
  try {
    switch (platform) {
      case 'tiktok':
        const tiktokResponse = await axios.get('https://open-api.tiktok.com/user/info/', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const tiktokUser = tiktokResponse.data.data.user;
        return {
          id: tiktokUser.open_id,
          username: tiktokUser.username,
          display_name: tiktokUser.display_name,
          followers_count: tiktokUser.follower_count,
          profile_image: tiktokUser.avatar_url,
          verified: tiktokUser.is_verified
        };

      case 'instagram':
        const igResponse = await axios.get('https://graph.instagram.com/me', {
          params: {
            fields: 'id,username,account_type,media_count',
            access_token: accessToken
          }
        });
        
        return {
          id: igResponse.data.id,
          username: igResponse.data.username,
          display_name: igResponse.data.username,
          account_type: igResponse.data.account_type,
          media_count: igResponse.data.media_count
        };

      case 'youtube':
        const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: {
            part: 'snippet,statistics',
            mine: true
          },
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const channel = ytResponse.data.items[0];
        return {
          id: channel.id,
          username: channel.snippet.customUrl || channel.snippet.title,
          display_name: channel.snippet.title,
          followers_count: parseInt(channel.statistics.subscriberCount),
          profile_image: channel.snippet.thumbnails.default.url,
          verified: channel.status?.isLinked
        };

      default:
        return null;
    }
  } catch (error) {
    logger.error(`Profile fetch failed for ${platform}:`, error.response?.data || error.message);
    return null;
  }
}

// Helper function to revoke platform tokens
async function revokePlatformToken(platform, accessToken) {
  try {
    switch (platform) {
      case 'youtube':
        await axios.post('https://oauth2.googleapis.com/revoke', {
          token: accessToken
        });
        break;
      
      // Other platforms may not support token revocation
      default:
        break;
    }
  } catch (error) {
    logger.error(`Token revocation failed for ${platform}:`, error.message);
    throw error;
  }
}

module.exports = router;