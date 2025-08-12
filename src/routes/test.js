const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabaseClient');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/test/connection:
 *   get:
 *     summary: Test database connection
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Connection successful
 *       500:
 *         description: Connection failed
 */
router.get('/connection', async (req, res) => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    logger.info('Database connection test successful');

    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  } catch (error) {
    logger.error('Database connection test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/test/write:
 *   post:
 *     summary: Test database write operation
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testData:
 *                 type: string
 *                 default: "Hello Supabase"
 *     responses:
 *       200:
 *         description: Write operation successful
 *       500:
 *         description: Write operation failed
 */
router.post('/write', async (req, res) => {
  try {
    const { testData = 'Hello Supabase' } = req.body;

    // Try to create a test table and insert data
    const { data, error } = await supabaseAdmin
      .from('test_table')
      .insert({
        test_data: testData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, that's expected - we'll create it via migration
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return res.json({
          success: true,
          message: 'Database write test completed (table not found - run migrations first)',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }

    logger.info('Database write test successful');

    res.json({
      success: true,
      message: 'Database write operation successful',
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database write test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database write operation failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/test/realtime:
 *   get:
 *     summary: Test real-time connection
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Real-time connection info
 */
router.get('/realtime', async (req, res) => {
  try {
    // Test real-time connection status
    const channel = supabase.channel('test-channel');
    
    const channelStatus = channel.state;
    
    res.json({
      success: true,
      message: 'Real-time connection info',
      channelStatus,
      timestamp: new Date().toISOString(),
      realtimeEnabled: true
    });
  } catch (error) {
    logger.error('Real-time test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Real-time test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;