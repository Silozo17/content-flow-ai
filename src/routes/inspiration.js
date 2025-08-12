const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');
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
 * /api/inspiration:
 *   get:
 *     summary: Get inspiration feed
 *     tags: [Inspiration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter]
 *         description: Filter by platform
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category/niche
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Items per page
 */
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { platform, category, difficulty, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get inspiration content from database
    let query = supabaseAdmin
      .from('trending_content')
      .select('*')
      .order('viral_score', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: inspirationContent, error } = await query;

    if (error) {
      throw error;
    }

    // If no data in database, generate mock inspiration content
    if (!inspirationContent || inspirationContent.length === 0) {
      const mockContent = generateMockInspirationContent(platform, category, difficulty, parseInt(limit));
      
      return res.json({
        success: true,
        data: mockContent,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockContent.length,
          pages: 1
        },
        cached: false
      });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('trending_content')
      .select('*', { count: 'exact', head: true });

    if (platform) countQuery = countQuery.eq('platform', platform);
    if (category) countQuery = countQuery.eq('category', category);
    if (difficulty) countQuery = countQuery.eq('difficulty', difficulty);

    const { count } = await countQuery;

    res.json({
      success: true,
      data: inspirationContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      cached: true
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inspiration/{id}:
 *   get:
 *     summary: Get inspiration content by ID
 *     tags: [Inspiration]
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
router.get('/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: content, error } = await supabaseAdmin
      .from('trending_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Content not found',
          message: 'The requested inspiration content does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inspiration/{id}/analyze:
 *   post:
 *     summary: Get AI analysis of inspiration content
 *     tags: [Inspiration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               niche:
 *                 type: string
 *                 description: Your niche/industry
 *               brand:
 *                 type: string
 *                 description: Your brand name
 *               audience:
 *                 type: string
 *                 description: Target audience description
 */
router.post('/:id/analyze', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { niche, brand, audience } = req.body;

    // Get the inspiration content
    const { data: content, error: fetchError } = await supabaseAdmin
      .from('trending_content')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !content) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested inspiration content does not exist'
      });
    }

    // Generate AI analysis
    const prompt = `Analyze this viral content and provide adaptation suggestions:

VIRAL CONTENT:
Title: ${content.title}
Platform: ${content.platform}
Format: ${content.format}
Hook Analysis: ${content.hook_analysis}
Views: ${content.views}
Engagement Rate: ${content.engagement_rate}

ADAPTATION FOR:
${niche ? `Niche: ${niche}` : ''}
${brand ? `Brand: ${brand}` : ''}
${audience ? `Target Audience: ${audience}` : ''}

Please provide:
1. Why this content went viral (key success factors)
2. How to adapt the format for the specified niche/brand
3. Specific script suggestions with hooks
4. Platform-specific optimization tips
5. Potential challenges and how to overcome them

Format as JSON with sections: viral_factors, adaptation_strategy, script_suggestions, optimization_tips, challenges`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a viral content strategist and social media expert. Provide detailed, actionable analysis in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback to text response if JSON parsing fails
      analysis = {
        viral_factors: ['Strong hook', 'Relatable content', 'Clear value proposition'],
        adaptation_strategy: completion.choices[0].message.content,
        script_suggestions: ['Adapt the hook to your niche', 'Include your brand story', 'Add your unique perspective'],
        optimization_tips: ['Post at optimal times', 'Use trending hashtags', 'Engage with comments quickly'],
        challenges: ['Standing out in saturated market', 'Maintaining authenticity while following trends']
      };
    }

    // Save analysis to database for future reference
    const { error: saveError } = await supabaseAdmin
      .from('content_analysis')
      .insert({
        user_id: userId,
        inspiration_content_id: id,
        niche,
        brand,
        audience,
        analysis,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      logger.error('Failed to save content analysis:', saveError);
    }

    logger.info(`Content analysis generated for user ${userId}: ${id}`);

    res.json({
      success: true,
      data: {
        originalContent: content,
        analysis,
        adaptationContext: {
          niche,
          brand,
          audience
        },
        analyzedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Content analysis error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/inspiration/save:
 *   post:
 *     summary: Save inspiration content to user's collection
 *     tags: [Inspiration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *             properties:
 *               contentId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               collectionName:
 *                 type: string
 */
router.post('/save', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentId, notes, tags, collectionName } = req.body;

    if (!contentId) {
      return res.status(400).json({
        error: 'Content ID required',
        message: 'Please provide a content ID to save'
      });
    }

    // Verify content exists
    const { data: content, error: fetchError } = await supabaseAdmin
      .from('trending_content')
      .select('id, title')
      .eq('id', contentId)
      .single();

    if (fetchError || !content) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested content does not exist'
      });
    }

    // Check if already saved
    const { data: existingSave } = await supabaseAdmin
      .from('saved_inspiration')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (existingSave) {
      return res.status(409).json({
        error: 'Already saved',
        message: 'This content is already in your saved collection'
      });
    }

    // Save to user's collection
    const { data: savedItem, error } = await supabaseAdmin
      .from('saved_inspiration')
      .insert({
        user_id: userId,
        content_id: contentId,
        notes: notes?.trim(),
        tags: tags || [],
        collection_name: collectionName?.trim() || 'Default',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        content:trending_content(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Inspiration content saved by user ${userId}: ${contentId}`);

    res.status(201).json({
      success: true,
      message: 'Content saved to your inspiration collection',
      data: savedItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inspiration/saved:
 *   get:
 *     summary: Get user's saved inspiration content
 *     tags: [Inspiration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: collection
 *         schema:
 *           type: string
 *         description: Filter by collection name
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 */
router.get('/saved', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { collection, tags, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('saved_inspiration')
      .select(`
        *,
        content:trending_content(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (collection) {
      query = query.eq('collection_name', collection);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.overlaps('tags', tagArray);
    }

    const { data: savedContent, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count
    let countQuery = supabaseAdmin
      .from('saved_inspiration')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (collection) countQuery = countQuery.eq('collection_name', collection);
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      countQuery = countQuery.overlaps('tags', tagArray);
    }

    const { count } = await countQuery;

    res.json({
      success: true,
      data: savedContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inspiration/collections:
 *   get:
 *     summary: Get user's inspiration collections
 *     tags: [Inspiration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/collections', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get collection names and counts
    const { data: collections, error } = await supabaseAdmin
      .from('saved_inspiration')
      .select('collection_name')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Group by collection name and count
    const collectionStats = collections.reduce((acc, item) => {
      const name = item.collection_name || 'Default';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    const collectionList = Object.entries(collectionStats).map(([name, count]) => ({
      name,
      count,
      lastUpdated: new Date().toISOString() // In a real app, you'd track this properly
    }));

    res.json({
      success: true,
      data: collectionList
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate mock inspiration content
function generateMockInspirationContent(platform, category, difficulty, limit) {
  const mockContent = [
    {
      id: 'inspiration_1',
      title: 'Morning Routine Reality Check',
      platform: platform || 'tiktok',
      format: 'pov',
      difficulty: difficulty || 'easy',
      viral_score: 95,
      views: '2.3M',
      engagement_rate: '12.4%',
      hook_analysis: 'Strong problem-solution hook with personal storytelling',
      suggested_script: 'Start with: "I used to wake up at 6 AM and feel exhausted by 10 AM..." then reveal the 3 game-changing habits',
      audio_track: 'Aesthetic Morning Vibes - Trending',
      thumbnail_url: 'https://images.pexels.com/photos/6001558/pexels-photo-6001558.jpeg',
      category: category || 'lifestyle',
      creator_handle: '@productivityguru',
      updated_at: new Date().toISOString()
    },
    {
      id: 'inspiration_2',
      title: 'Small Business Growth Hack',
      platform: platform || 'instagram',
      format: 'carousel',
      difficulty: difficulty || 'medium',
      viral_score: 88,
      views: '890K',
      engagement_rate: '18.7%',
      hook_analysis: 'Curiosity-driven hook with specific promise',
      suggested_script: 'Hook: "This one strategy grew my business 300% in 90 days" - then break down the 5-step process',
      audio_track: 'Inspiring Corporate - Original',
      thumbnail_url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
      category: category || 'business',
      creator_handle: '@businesscoach',
      updated_at: new Date().toISOString()
    },
    {
      id: 'inspiration_3',
      title: 'AI Tool Review: Game Changer',
      platform: platform || 'youtube',
      format: 'tutorial',
      difficulty: difficulty || 'hard',
      viral_score: 92,
      views: '1.5M',
      engagement_rate: '22.1%',
      hook_analysis: 'Authority-based hook with bold claim',
      suggested_script: 'Open with screen recording, voice-over: "I tested 10 AI tools. This one doubled my productivity..." Show before/after',
      audio_track: 'Tech Innovation - Trending',
      thumbnail_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      category: category || 'technology',
      creator_handle: '@techreview',
      updated_at: new Date().toISOString()
    },
    {
      id: 'inspiration_4',
      title: 'Office Outfit Transformation',
      platform: platform || 'instagram',
      format: 'transition',
      difficulty: difficulty || 'easy',
      viral_score: 85,
      views: '3.2M',
      engagement_rate: '15.8%',
      hook_analysis: 'Visual transformation hook with relatability',
      suggested_script: 'Start in casual clothes: "POV: You have 5 minutes to look professional" - quick transition reveal',
      audio_track: 'Fashion Transition - Viral',
      thumbnail_url: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
      category: category || 'fashion',
      creator_handle: '@styleguide',
      updated_at: new Date().toISOString()
    },
    {
      id: 'inspiration_5',
      title: 'Productivity Myth Busted',
      platform: platform || 'tiktok',
      format: 'educational',
      difficulty: difficulty || 'medium',
      viral_score: 90,
      views: '4.1M',
      engagement_rate: '19.3%',
      hook_analysis: 'Myth-busting hook with contrarian angle',
      suggested_script: 'Start: "Everyone says wake up at 5 AM for success. Here\'s why that\'s wrong..." Share data and alternatives',
      audio_track: 'Truth Reveal - Trending',
      thumbnail_url: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg',
      category: category || 'productivity',
      creator_handle: '@realproductivity',
      updated_at: new Date().toISOString()
    }
  ];

  return mockContent.slice(0, Math.min(limit, mockContent.length));
}

module.exports = router;