const express = require('express');
const OpenAI = require('openai');
const { authenticateToken } = require('../middlewares/auth');
const { validateAIGeneration } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * @swagger
 * /api/ai/generate:
 *   post:
 *     summary: Generate AI content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *               - type
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The content generation prompt
 *               type:
 *                 type: string
 *                 enum: [hook, script, caption, hashtags, ideas]
 *               platform:
 *                 type: string
 *                 enum: [tiktok, instagram, youtube, linkedin, twitter]
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, funny, inspirational, educational]
 *               niche:
 *                 type: string
 *                 description: Content niche or industry
 */
router.post('/generate', authenticateToken, validateAIGeneration, async (req, res, next) => {
  try {
    const { prompt, type, platform, tone, niche } = req.body;
    const userId = req.user.id;

    // Build system prompt based on type
    const systemPrompts = {
      hook: `You are an expert social media content creator specializing in creating viral hooks. Generate compelling, scroll-stopping hooks that grab attention in the first 3 seconds. Focus on curiosity, controversy, or strong emotional triggers.`,
      
      script: `You are a professional scriptwriter for social media content. Create engaging scripts with clear structure: Hook (0-3s), Value/Story (4-45s), and Call-to-Action (46-60s). Include timing markers and visual cues.`,
      
      caption: `You are a social media caption expert. Write engaging captions that drive engagement, include relevant emojis, and end with strong calls-to-action. Optimize for the specific platform's best practices.`,
      
      hashtags: `You are a hashtag research specialist. Generate strategic hashtag combinations that balance reach and relevance. Include a mix of trending, niche, and branded hashtags with estimated reach potential.`,
      
      ideas: `You are a creative content strategist. Generate diverse, actionable content ideas that align with current trends and audience interests. Include content format suggestions and engagement strategies.`
    };

    // Build user prompt with context
    let contextualPrompt = prompt;
    
    if (platform) {
      contextualPrompt += ` for ${platform}`;
    }
    
    if (niche) {
      contextualPrompt += ` in the ${niche} niche`;
    }
    
    if (tone) {
      contextualPrompt += ` with a ${tone} tone`;
    }

    // Add platform-specific guidelines
    const platformGuidelines = {
      tiktok: 'Optimize for TikTok: vertical format, trending sounds, quick cuts, authentic feel.',
      instagram: 'Optimize for Instagram: visual storytelling, hashtag strategy, Stories/Reels format.',
      youtube: 'Optimize for YouTube: strong thumbnails, SEO titles, engaging intros, clear value.',
      linkedin: 'Optimize for LinkedIn: professional tone, industry insights, thought leadership.',
      twitter: 'Optimize for Twitter: concise messaging, trending topics, thread potential.'
    };

    if (platform && platformGuidelines[platform]) {
      contextualPrompt += ` ${platformGuidelines[platform]}`;
    }

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompts[type]
        },
        {
          role: 'user',
          content: contextualPrompt
        }
      ],
      max_tokens: type === 'script' ? 1000 : 500,
      temperature: 0.8
    });

    const generatedContent = completion.choices[0].message.content;

    // Save generation to database for analytics
    const { error: saveError } = await supabaseAdmin
      .from('ai_generations')
      .insert({
        user_id: userId,
        prompt: contextualPrompt,
        type,
        platform,
        tone,
        niche,
        generated_content: generatedContent,
        tokens_used: completion.usage.total_tokens,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      logger.error('Failed to save AI generation:', saveError);
    }

    logger.info(`AI content generated for user ${userId}: ${type}`);

    res.json({
      success: true,
      data: {
        content: generatedContent,
        type,
        platform,
        tone,
        niche,
        tokensUsed: completion.usage.total_tokens,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI generation error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        error: 'AI service quota exceeded',
        message: 'Please try again later or upgrade your plan'
      });
    }
    
    next(error);
  }
});

/**
 * @swagger
 * /api/ai/templates:
 *   get:
 *     summary: Get AI prompt templates
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/templates', authenticateToken, async (req, res, next) => {
  try {
    const templates = [
      {
        id: 'hook-generator',
        name: 'Hook Generator',
        description: 'Create scroll-stopping hooks for any topic',
        prompt: 'Create 5 scroll-stopping hooks for a [industry] about [topic]',
        type: 'hook',
        category: 'engagement'
      },
      {
        id: 'script-writer',
        name: 'Script Writer',
        description: 'Write complete video scripts with timing',
        prompt: 'Write a 60-second script for [platform] about [topic] using [formula]',
        type: 'script',
        category: 'content'
      },
      {
        id: 'caption-creator',
        name: 'Caption Creator',
        description: 'Generate engaging captions with CTAs',
        prompt: 'Create an engaging caption with CTA for [platform] post about [topic]',
        type: 'caption',
        category: 'engagement'
      },
      {
        id: 'content-ideas',
        name: 'Content Ideas',
        description: 'Get fresh content ideas for your niche',
        prompt: 'Give me 10 content ideas for [industry] targeting [audience] this week',
        type: 'ideas',
        category: 'strategy'
      },
      {
        id: 'hashtag-research',
        name: 'Hashtag Research',
        description: 'Find the best hashtags for your content',
        prompt: 'Research and suggest 30 hashtags for [topic] on [platform] - mix of trending and niche',
        type: 'hashtags',
        category: 'discovery'
      },
      {
        id: 'trend-adaptation',
        name: 'Trend Adaptation',
        description: 'Adapt trending content to your niche',
        prompt: 'Adapt this trending format [trend] for [niche] business on [platform]',
        type: 'ideas',
        category: 'trends'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ai/history:
 *   get:
 *     summary: Get user's AI generation history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('ai_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: generations, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('ai_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count } = await countQuery;

    res.json({
      success: true,
      data: generations,
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
 * /api/ai/usage:
 *   get:
 *     summary: Get user's AI usage statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 */
router.get('/usage', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Get usage statistics
    const { data: usage, error } = await supabaseAdmin
      .from('ai_generations')
      .select('type, tokens_used, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      totalGenerations: usage.length,
      totalTokens: usage.reduce((sum, gen) => sum + (gen.tokens_used || 0), 0),
      byType: {},
      dailyUsage: {}
    };

    // Group by type
    usage.forEach(gen => {
      if (!stats.byType[gen.type]) {
        stats.byType[gen.type] = { count: 0, tokens: 0 };
      }
      stats.byType[gen.type].count++;
      stats.byType[gen.type].tokens += gen.tokens_used || 0;
    });

    // Group by day
    usage.forEach(gen => {
      const date = new Date(gen.created_at).toISOString().split('T')[0];
      if (!stats.dailyUsage[date]) {
        stats.dailyUsage[date] = { count: 0, tokens: 0 };
      }
      stats.dailyUsage[date].count++;
      stats.dailyUsage[date].tokens += gen.tokens_used || 0;
    });

    res.json({
      success: true,
      data: stats,
      period
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;