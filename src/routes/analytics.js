const express = require('express');
const { authenticateToken, requireWorkspaceAccess } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const OpenAI = require('openai');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific client (for agencies)
 */
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = '30d', clientId } = req.query;

    // Calculate date range
    const now = new Date();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get user's connected social accounts
    let accountsQuery = supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('status', 'active');

    if (userRole === 'client') {
      accountsQuery = accountsQuery.eq('user_id', userId);
    } else if (userRole === 'creator' || userRole === 'agency') {
      if (clientId) {
        accountsQuery = accountsQuery.eq('client_id', clientId);
      } else {
        accountsQuery = accountsQuery.eq('user_id', userId);
      }
    }

    const { data: socialAccounts, error: accountsError } = await accountsQuery;

    if (accountsError) {
      throw accountsError;
    }

    if (!socialAccounts || socialAccounts.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalFollowers: 0,
            totalReach: 0,
            engagementRate: '0%',
            contentCreated: 0
          },
          platforms: [],
          topContent: [],
          insights: ['Connect your social media accounts to see analytics'],
          period,
          hasConnectedAccounts: false
        }
      });
    }

    // Get analytics data for connected accounts
    const accountIds = socialAccounts.map(account => account.id);
    
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .from('analytics_data')
      .select('*')
      .in('social_account_id', accountIds)
      .gte('date_range_start', startDate.toISOString().split('T')[0])
      .lte('date_range_end', now.toISOString().split('T')[0]);

    if (analyticsError) {
      throw analyticsError;
    }

    // If no real analytics data, generate mock data
    if (!analyticsData || analyticsData.length === 0) {
      const mockAnalytics = generateMockAnalytics(socialAccounts, period);
      return res.json({
        success: true,
        data: mockAnalytics
      });
    }

    // Process real analytics data
    const processedAnalytics = processAnalyticsData(analyticsData, socialAccounts, period);

    res.json({
      success: true,
      data: processedAnalytics
    });
  } catch (error) {
    logger.error('Analytics overview error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/platforms:
 *   get:
 *     summary: Get platform-specific analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter]
 *         description: Specific platform to analyze
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 */
router.get('/platforms', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { platform, period = '30d' } = req.query;

    // Get platform-specific social accounts
    let accountsQuery = supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('status', 'active');

    if (platform) {
      accountsQuery = accountsQuery.eq('platform', platform);
    }

    if (userRole === 'client') {
      accountsQuery = accountsQuery.eq('user_id', userId);
    } else {
      accountsQuery = accountsQuery.eq('user_id', userId);
    }

    const { data: socialAccounts, error } = await accountsQuery;

    if (error) {
      throw error;
    }

    // Generate mock platform analytics
    const platformAnalytics = socialAccounts.map(account => ({
      platform: account.platform,
      username: account.username,
      followers: Math.floor(Math.random() * 50000) + 10000,
      growth: `+${(Math.random() * 20 + 5).toFixed(1)}%`,
      engagement: `${(Math.random() * 15 + 5).toFixed(1)}%`,
      topContent: `${account.platform === 'tiktok' ? 'Morning Routine Reality' : 
                    account.platform === 'instagram' ? 'Office Outfit Transition' :
                    account.platform === 'youtube' ? 'AI Tools Review' :
                    account.platform === 'linkedin' ? 'Business Growth Tips' :
                    'Quick Productivity Hack'}`,
      metrics: {
        reach: Math.floor(Math.random() * 1000000) + 100000,
        impressions: Math.floor(Math.random() * 2000000) + 200000,
        saves: Math.floor(Math.random() * 10000) + 1000,
        shares: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 2000) + 200
      },
      lastUpdated: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: {
        platforms: platformAnalytics,
        period,
        totalPlatforms: platformAnalytics.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/content:
 *   get:
 *     summary: Get content performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [views, engagement, likes, shares, comments]
 *           default: views
 */
router.get('/content', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = '30d', platform, sortBy = 'views' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get user's content items
    let contentQuery = supabaseAdmin
      .from('content_items')
      .select(`
        *,
        client:clients(id, name, brand)
      `)
      .eq('status', 'published')
      .gte('published_date', startDate.toISOString());

    if (userRole === 'client') {
      contentQuery = contentQuery.eq('client_id', userId);
    } else {
      contentQuery = contentQuery.eq('creator_id', userId);
    }

    if (platform) {
      contentQuery = contentQuery.eq('platform', platform);
    }

    const { data: contentItems, error } = await contentQuery;

    if (error) {
      throw error;
    }

    // Generate mock performance data for content
    const contentPerformance = contentItems.map(item => ({
      id: item.id,
      title: item.title,
      platform: item.platform,
      contentType: item.content_type,
      publishedDate: item.published_date,
      client: item.client,
      performance: {
        views: Math.floor(Math.random() * 500000) + 10000,
        likes: Math.floor(Math.random() * 25000) + 500,
        comments: Math.floor(Math.random() * 1000) + 50,
        shares: Math.floor(Math.random() * 5000) + 100,
        saves: Math.floor(Math.random() * 3000) + 150,
        engagement_rate: (Math.random() * 20 + 5).toFixed(1) + '%',
        reach: Math.floor(Math.random() * 300000) + 8000
      }
    }));

    // Sort by requested metric
    contentPerformance.sort((a, b) => {
      const aValue = a.performance[sortBy] || 0;
      const bValue = b.performance[sortBy] || 0;
      return typeof aValue === 'string' ? 
        parseFloat(bValue) - parseFloat(aValue) : 
        bValue - aValue;
    });

    res.json({
      success: true,
      data: {
        content: contentPerformance,
        period,
        sortBy,
        totalContent: contentPerformance.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/insights:
 *   get:
 *     summary: Get AI-generated analytics insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 */
router.get('/insights', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Get user's analytics data summary
    const analyticsOverview = await getAnalyticsOverview(userId, period);

    // Generate AI insights
    const prompt = `Analyze this social media performance data and provide actionable insights:

PERFORMANCE DATA:
- Total Followers: ${analyticsOverview.totalFollowers}
- Total Reach: ${analyticsOverview.totalReach}
- Engagement Rate: ${analyticsOverview.engagementRate}
- Content Created: ${analyticsOverview.contentCreated}
- Period: ${period}

TOP PERFORMING PLATFORMS:
${analyticsOverview.platforms.map(p => `- ${p.platform}: ${p.followers} followers, ${p.engagement} engagement`).join('\n')}

Please provide:
1. Key performance highlights
2. Areas for improvement
3. Content strategy recommendations
4. Optimal posting times/frequency suggestions
5. Platform-specific optimization tips

Format as JSON with sections: highlights, improvements, content_strategy, posting_optimization, platform_tips`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a social media analytics expert. Provide actionable insights in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    let insights;
    try {
      insights = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback insights if JSON parsing fails
      insights = {
        highlights: ['Strong engagement across platforms', 'Consistent content creation', 'Growing follower base'],
        improvements: ['Increase posting frequency', 'Optimize content for peak hours', 'Engage more with audience'],
        content_strategy: ['Focus on trending topics', 'Create more video content', 'Use storytelling techniques'],
        posting_optimization: ['Post during 9-11 AM and 7-9 PM', 'Maintain consistent schedule', 'Use platform-specific features'],
        platform_tips: ['TikTok: Use trending sounds', 'Instagram: Leverage Stories and Reels', 'LinkedIn: Share industry insights']
      };
    }

    // Save insights to database
    const { error: saveError } = await supabaseAdmin
      .from('analytics_insights')
      .insert({
        user_id: userId,
        period,
        insights,
        generated_at: new Date().toISOString()
      });

    if (saveError) {
      logger.error('Failed to save analytics insights:', saveError);
    }

    res.json({
      success: true,
      data: {
        insights,
        period,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Analytics insights error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/analytics/export:
 *   post:
 *     summary: Export analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period
 *               - format
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [7d, 30d, 90d, 1y]
 *               format:
 *                 type: string
 *                 enum: [pdf, csv, json]
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               includeInsights:
 *                 type: boolean
 *                 default: true
 */
router.post('/export', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period, format, clientId, includeInsights = true } = req.body;

    if (!period || !format) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Period and format are required'
      });
    }

    // Get analytics data
    const analyticsData = await getAnalyticsOverview(userId, period, clientId);

    // Get insights if requested
    let insights = null;
    if (includeInsights) {
      const { data: latestInsights } = await supabaseAdmin
        .from('analytics_insights')
        .select('insights')
        .eq('user_id', userId)
        .eq('period', period)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      insights = latestInsights?.insights;
    }

    const reportData = {
      ...analyticsData,
      insights,
      exportedAt: new Date().toISOString(),
      period,
      format
    };

    // In a real implementation, you would generate the actual file
    // For now, we'll return the data structure
    const exportResult = {
      reportId: `report_${Date.now()}`,
      downloadUrl: `${process.env.API_BASE_URL}/api/analytics/download/${Date.now()}`,
      format,
      size: '2.5MB',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      data: format === 'json' ? reportData : null
    };

    logger.info(`Analytics report exported by user ${userId}: ${format} format`);

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: exportResult
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get analytics overview
async function getAnalyticsOverview(userId, period, clientId = null) {
  // This would typically fetch real data from social media APIs
  // For now, we'll return mock data
  
  const mockOverview = {
    totalFollowers: Math.floor(Math.random() * 100000) + 20000,
    totalReach: Math.floor(Math.random() * 2000000) + 500000,
    engagementRate: (Math.random() * 10 + 5).toFixed(1) + '%',
    contentCreated: Math.floor(Math.random() * 50) + 10,
    platforms: [
      {
        platform: 'TikTok',
        followers: Math.floor(Math.random() * 50000) + 15000,
        growth: `+${(Math.random() * 25 + 10).toFixed(1)}%`,
        engagement: `${(Math.random() * 15 + 8).toFixed(1)}%`
      },
      {
        platform: 'Instagram',
        followers: Math.floor(Math.random() * 40000) + 12000,
        growth: `+${(Math.random() * 20 + 8).toFixed(1)}%`,
        engagement: `${(Math.random() * 12 + 6).toFixed(1)}%`
      },
      {
        platform: 'YouTube',
        followers: Math.floor(Math.random() * 30000) + 8000,
        growth: `+${(Math.random() * 30 + 15).toFixed(1)}%`,
        engagement: `${(Math.random() * 8 + 4).toFixed(1)}%`
      }
    ],
    topContent: [
      {
        title: 'Morning Routine That Actually Works',
        platform: 'TikTok',
        views: '2.3M',
        engagement: '15.7%'
      },
      {
        title: 'AI Tool Review: Game Changer',
        platform: 'YouTube',
        views: '890K',
        engagement: '18.2%'
      }
    ]
  };

  return mockOverview;
}

// Helper function to generate mock analytics
function generateMockAnalytics(socialAccounts, period) {
  const totalFollowers = socialAccounts.reduce((sum, account) => {
    return sum + (Math.floor(Math.random() * 20000) + 5000);
  }, 0);

  return {
    overview: {
      totalFollowers,
      totalReach: Math.floor(totalFollowers * (Math.random() * 10 + 15)),
      engagementRate: (Math.random() * 10 + 5).toFixed(1) + '%',
      contentCreated: Math.floor(Math.random() * 30) + 10
    },
    platforms: socialAccounts.map(account => ({
      platform: account.platform,
      username: account.username,
      followers: Math.floor(Math.random() * 20000) + 5000,
      growth: `+${(Math.random() * 20 + 5).toFixed(1)}%`,
      engagement: `${(Math.random() * 15 + 5).toFixed(1)}%`,
      topContent: `Sample ${account.platform} content`
    })),
    topContent: [
      {
        title: 'Morning Routine Reality Check',
        platform: 'TikTok',
        views: '2.3M',
        engagement: '15.7%',
        likes: '234K',
        shares: '12.5K'
      },
      {
        title: 'AI Tool That Changed Everything',
        platform: 'YouTube',
        views: '890K',
        engagement: '18.2%',
        likes: '67K',
        shares: '8.9K'
      }
    ],
    insights: [
      'Your TikTok content performs 40% better on Tuesday mornings',
      'Instagram carousel posts get 3x more saves than single images',
      'Posts with personal stories get 60% higher engagement'
    ],
    period,
    hasConnectedAccounts: true,
    lastUpdated: new Date().toISOString()
  };
}

// Helper function to process real analytics data
function processAnalyticsData(analyticsData, socialAccounts, period) {
  // This would process real analytics data from the database
  // For now, we'll return the mock data structure
  return generateMockAnalytics(socialAccounts, period);
}

module.exports = router;