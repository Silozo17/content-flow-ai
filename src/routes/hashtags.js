const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { validateHashtagPack, validateObjectId } = require('../middlewares/validation');
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
 * /api/hashtags/research:
 *   post:
 *     summary: Research hashtags for a topic
 *     tags: [Hashtags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic or keyword to research
 *               platform:
 *                 type: string
 *                 enum: [tiktok, instagram, youtube, linkedin, twitter]
 *               goal:
 *                 type: string
 *                 enum: [reach, engagement, niche]
 *                 description: Hashtag strategy goal
 *               count:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 50
 *                 default: 30
 */
router.post('/research', authenticateToken, async (req, res, next) => {
  try {
    const { topic, platform = 'instagram', goal = 'reach', count = 30 } = req.body;
    const userId = req.user.id;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        error: 'Topic required',
        message: 'Please provide a topic to research hashtags for'
      });
    }

    // Generate hashtags using AI
    const prompt = `Generate ${count} strategic hashtags for "${topic}" on ${platform}. 
    Goal: ${goal === 'reach' ? 'Maximum reach and discoverability' : goal === 'engagement' ? 'High engagement and saves' : 'Niche authority and targeted audience'}.
    
    Include a mix of:
    - High-volume trending hashtags (5-10)
    - Medium-volume niche hashtags (15-20)
    - Low-volume specific hashtags (5-10)
    
    Format as JSON array with objects containing:
    - hashtag (with #)
    - category (trending/niche/specific)
    - estimated_usage (like "2.5M" or "450K")
    - relevancy_score (1-100)
    - competition_level (low/medium/high)
    
    Platform-specific guidelines:
    ${platform === 'instagram' ? 'Instagram: Mix of popular and niche, avoid banned hashtags' : ''}
    ${platform === 'tiktok' ? 'TikTok: Focus on trending and viral hashtags' : ''}
    ${platform === 'youtube' ? 'YouTube: SEO-focused, descriptive hashtags' : ''}
    ${platform === 'linkedin' ? 'LinkedIn: Professional, industry-specific hashtags' : ''}
    ${platform === 'twitter' ? 'Twitter: Trending topics and conversation starters' : ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a hashtag research expert. Generate strategic hashtag recommendations in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    let hashtags;
    try {
      hashtags = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback to generating hashtags manually if AI response isn't valid JSON
      hashtags = generateFallbackHashtags(topic, platform, count);
    }

    // Save research to database
    const { error: saveError } = await supabaseAdmin
      .from('hashtag_research')
      .insert({
        user_id: userId,
        topic,
        platform,
        goal,
        hashtags,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      logger.error('Failed to save hashtag research:', saveError);
    }

    logger.info(`Hashtag research completed for user ${userId}: ${topic}`);

    res.json({
      success: true,
      data: {
        topic,
        platform,
        goal,
        hashtags,
        totalCount: hashtags.length,
        researchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Hashtag research error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/hashtags/packs:
 *   get:
 *     summary: Get user's hashtag packs
 *     tags: [Hashtags]
 *     security:
 *       - bearerAuth: []
 */
router.get('/packs', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;

    const { data: packs, error } = await supabaseAdmin
      .from('hashtag_packs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('hashtag_packs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      success: true,
      data: packs,
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
 * /api/hashtags/packs:
 *   post:
 *     summary: Create a new hashtag pack
 *     tags: [Hashtags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - hashtags
 *             properties:
 *               name:
 *                 type: string
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               purpose:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [tiktok, instagram, youtube, linkedin, twitter]
 */
router.post('/packs', authenticateToken, validateHashtagPack, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, hashtags, purpose, platform } = req.body;

    // Clean and validate hashtags
    const cleanHashtags = hashtags.map(tag => {
      const cleanTag = tag.trim();
      return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
    });

    // Create hashtag pack
    const { data: pack, error } = await supabaseAdmin
      .from('hashtag_packs')
      .insert({
        user_id: userId,
        name: name.trim(),
        hashtags: cleanHashtags,
        purpose: purpose?.trim(),
        platform,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Hashtag pack created: ${pack.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Hashtag pack created successfully',
      data: pack
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hashtags/packs/{id}:
 *   get:
 *     summary: Get hashtag pack by ID
 *     tags: [Hashtags]
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
router.get('/packs/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: pack, error } = await supabaseAdmin
      .from('hashtag_packs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Pack not found',
          message: 'The requested hashtag pack does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: pack
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hashtags/packs/{id}:
 *   put:
 *     summary: Update hashtag pack
 *     tags: [Hashtags]
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
router.put('/packs/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, hashtags, purpose, platform } = req.body;

    // Verify pack exists and belongs to user
    const { data: existingPack, error: fetchError } = await supabaseAdmin
      .from('hashtag_packs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPack) {
      return res.status(404).json({
        error: 'Pack not found',
        message: 'The requested hashtag pack does not exist'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name.trim();
    if (purpose) updateData.purpose = purpose.trim();
    if (platform) updateData.platform = platform;
    
    if (hashtags) {
      const cleanHashtags = hashtags.map(tag => {
        const cleanTag = tag.trim();
        return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
      });
      updateData.hashtags = cleanHashtags;
    }

    // Update pack
    const { data: updatedPack, error } = await supabaseAdmin
      .from('hashtag_packs')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Hashtag pack updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Hashtag pack updated successfully',
      data: updatedPack
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hashtags/packs/{id}:
 *   delete:
 *     summary: Delete hashtag pack
 *     tags: [Hashtags]
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
router.delete('/packs/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify pack exists and belongs to user
    const { data: existingPack, error: fetchError } = await supabaseAdmin
      .from('hashtag_packs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingPack) {
      return res.status(404).json({
        error: 'Pack not found',
        message: 'The requested hashtag pack does not exist'
      });
    }

    // Delete pack
    const { error } = await supabaseAdmin
      .from('hashtag_packs')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info(`Hashtag pack deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Hashtag pack deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hashtags/analytics:
 *   post:
 *     summary: Get hashtag analytics
 *     tags: [Hashtags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hashtags
 *             properties:
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               platform:
 *                 type: string
 *                 enum: [tiktok, instagram, youtube, linkedin, twitter]
 */
router.post('/analytics', authenticateToken, async (req, res, next) => {
  try {
    const { hashtags, platform = 'instagram' } = req.body;

    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
      return res.status(400).json({
        error: 'Hashtags required',
        message: 'Please provide an array of hashtags to analyze'
      });
    }

    // In a real implementation, you would fetch actual analytics from social media APIs
    // For now, we'll generate mock analytics data
    const analytics = hashtags.map((hashtag, index) => {
      const cleanHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
      
      return {
        hashtag: cleanHashtag,
        platform,
        usage_count: Math.floor(Math.random() * 5000000) + 100000,
        engagement_rate: (Math.random() * 20 + 5).toFixed(1) + '%',
        growth_rate: (Math.random() > 0.7 ? '+' : '') + (Math.random() * 200 - 50).toFixed(0) + '%',
        difficulty: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        relevancy_score: Math.floor(Math.random() * 30) + 70,
        trending: Math.random() > 0.7,
        last_updated: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      data: {
        platform,
        hashtags: analytics,
        analyzed_at: new Date().toISOString(),
        total_hashtags: analytics.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate fallback hashtags when AI fails
function generateFallbackHashtags(topic, platform, count) {
  const baseHashtags = [
    { hashtag: `#${topic.replace(/\s+/g, '')}`, category: 'specific', estimated_usage: '500K', relevancy_score: 95, competition_level: 'medium' },
    { hashtag: '#ContentCreator', category: 'trending', estimated_usage: '2.5M', relevancy_score: 75, competition_level: 'high' },
    { hashtag: '#SmallBusiness', category: 'niche', estimated_usage: '1.8M', relevancy_score: 80, competition_level: 'medium' },
    { hashtag: '#Trending', category: 'trending', estimated_usage: '10M', relevancy_score: 60, competition_level: 'high' },
    { hashtag: '#Viral', category: 'trending', estimated_usage: '8M', relevancy_score: 65, competition_level: 'high' }
  ];

  // Generate additional hashtags based on topic
  const topicWords = topic.toLowerCase().split(' ');
  topicWords.forEach(word => {
    if (word.length > 3) {
      baseHashtags.push({
        hashtag: `#${word.charAt(0).toUpperCase() + word.slice(1)}`,
        category: 'specific',
        estimated_usage: Math.floor(Math.random() * 1000) + 100 + 'K',
        relevancy_score: Math.floor(Math.random() * 20) + 80,
        competition_level: 'low'
      });
    }
  });

  return baseHashtags.slice(0, Math.min(count, baseHashtags.length));
}

module.exports = router;