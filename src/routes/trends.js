const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middlewares/auth');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/trends:
 *   get:
 *     summary: Get trending content and hashtags
 *     tags: [Trends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, twitter]
 *         description: Filter by platform
 *       - in: query
 *         name: niche
 *         schema:
 *           type: string
 *         description: Filter by niche/category
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region/country
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [hashtags, content, audio]
 *         description: Type of trends to fetch
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { platform = 'all', niche, region = 'global', type = 'all' } = req.query;

    // Get cached trends from database first
    let query = supabaseAdmin
      .from('trending_data')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('engagement_score', { ascending: false })
      .limit(50);

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (niche) {
      query = query.eq('niche', niche);
    }

    if (region !== 'global') {
      query = query.eq('region', region);
    }

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: cachedTrends, error } = await query;

    if (error) {
      throw error;
    }

    // If we have recent cached data, return it
    if (cachedTrends && cachedTrends.length > 0) {
      return res.json({
        success: true,
        data: cachedTrends,
        cached: true,
        lastUpdated: cachedTrends[0]?.updated_at
      });
    }

    // Otherwise, fetch fresh data from external APIs
    const freshTrends = await fetchFreshTrends(platform, niche, region, type);

    res.json({
      success: true,
      data: freshTrends,
      cached: false,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Trends fetch error:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/trends/hashtags:
 *   get:
 *     summary: Get trending hashtags with analytics
 *     tags: [Trends]
 *     security:
 *       - bearerAuth: []
 */
router.get('/hashtags', authenticateToken, async (req, res, next) => {
  try {
    const { platform = 'all', limit = 30 } = req.query;

    // Get trending hashtags from database
    let query = supabaseAdmin
      .from('trending_hashtags')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .order('usage_count', { ascending: false })
      .limit(parseInt(limit));

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    const { data: hashtags, error } = await query;

    if (error) {
      throw error;
    }

    // If no recent data, generate mock trending hashtags
    if (!hashtags || hashtags.length === 0) {
      const mockHashtags = generateMockTrendingHashtags(platform, parseInt(limit));
      
      res.json({
        success: true,
        data: mockHashtags,
        cached: false,
        lastUpdated: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: hashtags,
      cached: true,
      lastUpdated: hashtags[0]?.updated_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trends/content:
 *   get:
 *     summary: Get trending content formats and templates
 *     tags: [Trends]
 *     security:
 *       - bearerAuth: []
 */
router.get('/content', authenticateToken, async (req, res, next) => {
  try {
    const { platform = 'all', format, difficulty } = req.query;

    // Get trending content from database
    let query = supabaseAdmin
      .from('trending_content')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()) // Last 12 hours
      .order('viral_score', { ascending: false })
      .limit(20);

    if (platform !== 'all') {
      query = query.eq('platform', platform);
    }

    if (format) {
      query = query.eq('format', format);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: content, error } = await query;

    if (error) {
      throw error;
    }

    // If no recent data, generate mock trending content
    if (!content || content.length === 0) {
      const mockContent = generateMockTrendingContent(platform);
      
      res.json({
        success: true,
        data: mockContent,
        cached: false,
        lastUpdated: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: content,
      cached: true,
      lastUpdated: content[0]?.updated_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/trends/refresh:
 *   post:
 *     summary: Force refresh trending data
 *     tags: [Trends]
 *     security:
 *       - bearerAuth: []
 */
router.post('/refresh', authenticateToken, async (req, res, next) => {
  try {
    const { platform = 'all', type = 'all' } = req.body;

    // This would typically trigger a background job to fetch fresh data
    // For now, we'll simulate the refresh
    logger.info(`Trends refresh requested by user ${req.user.id} for platform: ${platform}, type: ${type}`);

    // In a real implementation, you would:
    // 1. Queue a background job to fetch fresh data from APIs
    // 2. Update the database with new trends
    // 3. Return a job ID or status

    res.json({
      success: true,
      message: 'Trends refresh initiated',
      jobId: `refresh_${Date.now()}`,
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to fetch fresh trends from external APIs
async function fetchFreshTrends(platform, niche, region, type) {
  // This is where you would integrate with actual social media APIs
  // For now, we'll return mock data
  
  const mockTrends = [
    {
      id: 'trend_1',
      title: 'Morning Routine Reality Check',
      platform: 'tiktok',
      type: 'content',
      niche: 'lifestyle',
      region: 'global',
      engagement_score: 95,
      growth_rate: '+142%',
      difficulty: 'easy',
      format: 'pov',
      description: 'Honest take on morning routines vs. reality',
      estimated_reach: '2.3M',
      dropoff_prediction: '7 days',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'trend_2',
      title: 'AI Tools That Actually Work',
      platform: 'youtube',
      type: 'content',
      niche: 'technology',
      region: 'global',
      engagement_score: 88,
      growth_rate: '+234%',
      difficulty: 'hard',
      format: 'tutorial',
      description: 'Practical AI tool reviews and demonstrations',
      estimated_reach: '4.1M',
      dropoff_prediction: '14 days',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Filter mock data based on parameters
  return mockTrends.filter(trend => {
    if (platform !== 'all' && trend.platform !== platform) return false;
    if (niche && trend.niche !== niche) return false;
    if (region !== 'global' && trend.region !== region) return false;
    if (type !== 'all' && trend.type !== type) return false;
    return true;
  });
}

// Helper function to generate mock trending hashtags
function generateMockTrendingHashtags(platform, limit) {
  const baseHashtags = [
    { tag: '#ContentCreator', usage: '2.5M', engagement: '8.4%', growth: '+12%' },
    { tag: '#SmallBusiness', usage: '1.8M', engagement: '12.7%', growth: '+24%' },
    { tag: '#MorningRoutine', usage: '890K', engagement: '15.2%', growth: '+89%' },
    { tag: '#ProductivityHacks', usage: '456K', engagement: '18.3%', growth: '+156%' },
    { tag: '#AITools2024', usage: '234K', engagement: '22.1%', growth: '+287%' },
    { tag: '#EntrepreneurLife', usage: '1.2M', engagement: '9.8%', growth: '+5%' },
    { tag: '#WorkFromHome', usage: '3.1M', engagement: '7.2%', growth: '+18%' },
    { tag: '#DigitalMarketing', usage: '2.8M', engagement: '11.5%', growth: '+32%' },
    { tag: '#SelfCare', usage: '4.2M', engagement: '14.8%', growth: '+67%' },
    { tag: '#TechTips', usage: '1.5M', engagement: '16.3%', growth: '+45%' }
  ];

  return baseHashtags.slice(0, limit).map((hashtag, index) => ({
    id: `hashtag_${index + 1}`,
    hashtag: hashtag.tag,
    platform: platform === 'all' ? 'tiktok' : platform,
    usage_count: parseInt(hashtag.usage.replace(/[^\d]/g, '')) * (hashtag.usage.includes('M') ? 1000000 : 1000),
    engagement_rate: parseFloat(hashtag.engagement.replace('%', '')),
    growth_rate: hashtag.growth,
    difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
    updated_at: new Date().toISOString()
  }));
}

// Helper function to generate mock trending content
function generateMockTrendingContent(platform) {
  const mockContent = [
    {
      id: 'content_1',
      title: 'Morning Routine That Actually Works',
      platform: platform === 'all' ? 'tiktok' : platform,
      format: 'pov',
      difficulty: 'easy',
      viral_score: 95,
      views: '2.3M',
      engagement_rate: '12.4%',
      hook_analysis: 'Strong problem-solution hook with personal storytelling',
      suggested_script: 'Start with: "I used to wake up at 6 AM and feel exhausted by 10 AM..." then reveal the 3 game-changing habits',
      audio_track: 'Aesthetic Morning Vibes - Trending',
      thumbnail_url: 'https://images.pexels.com/photos/6001558/pexels-photo-6001558.jpeg',
      category: 'lifestyle',
      updated_at: new Date().toISOString()
    },
    {
      id: 'content_2',
      title: 'AI Tool Review: Game Changer',
      platform: platform === 'all' ? 'youtube' : platform,
      format: 'tutorial',
      difficulty: 'hard',
      viral_score: 88,
      views: '1.5M',
      engagement_rate: '22.1%',
      hook_analysis: 'Authority-based hook with bold claim',
      suggested_script: 'Open with screen recording, voice-over: "I tested 10 AI tools. This one doubled my productivity..." Show before/after',
      audio_track: 'Tech Innovation - Trending',
      thumbnail_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      category: 'technology',
      updated_at: new Date().toISOString()
    }
  ];

  return mockContent;
}

module.exports = router;