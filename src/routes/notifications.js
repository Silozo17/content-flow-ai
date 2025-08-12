const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 */
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, read, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (read !== undefined) {
      query = query.eq('read', read === 'true');
    }
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (read !== undefined) {
      countQuery = countQuery.eq('read', read === 'true');
    }
    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count } = await countQuery;

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
router.put('/:id/read', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Update notification
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Notification not found',
          message: 'The requested notification does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.put('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      throw error;
    }

    logger.info(`${notifications.length} notifications marked as read for user ${userId}`);

    res.json({
      success: true,
      message: `${notifications.length} notifications marked as read`,
      data: { updatedCount: notifications.length }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
router.delete('/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Delete notification
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send notification (internal use)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               sendEmail:
 *                 type: boolean
 *                 default: false
 */
router.post('/send', authenticateToken, async (req, res, next) => {
  try {
    const { userId, type, title, message, data = {}, sendEmail = false } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, type, title, and message are required'
      });
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The target user does not exist'
      });
    }

    // Create notification
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: {
          ...data,
          sender_id: senderId
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send email notification if requested and configured
    if (sendEmail && process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      try {
        await sendEmailNotification(targetUser, notification);
      } catch (emailError) {
        logger.error('Email notification failed:', emailError);
        // Don't fail the request if email fails
      }
    }

    logger.info(`Notification sent to user ${userId}: ${type}`);

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/types:
 *   get:
 *     summary: Get notification types and counts
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/types', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get notification counts by type
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('type, read')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Process counts
    const typeCounts = notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = { total: 0, unread: 0 };
      }
      acc[notification.type].total++;
      if (!notification.read) {
        acc[notification.type].unread++;
      }
      return acc;
    }, {});

    res.json({
      success: true,
      data: typeCounts
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to send email notifications
async function sendEmailNotification(user, notification) {
  if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL) {
    throw new Error('Email service not configured');
  }

  const emailContent = {
    to: user.email,
    from: process.env.FROM_EMAIL,
    subject: `ContentFlow AI: ${notification.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ContentFlow AI</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">${notification.title}</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">${notification.message}</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>You received this email because you have notifications enabled in your ContentFlow AI account.</p>
          <p>© ${new Date().getFullYear()} ContentFlow AI. All rights reserved.</p>
        </div>
      </div>
    `
  };

  await sgMail.send(emailContent);
}

// Helper function to create notification (for use by other modules)
async function createNotification(userId, type, title, message, data = {}) {
  try {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}

// Export helper function for use in other modules
module.exports = router;
module.exports.createNotification = createNotification;