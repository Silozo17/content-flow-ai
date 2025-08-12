const express = require('express');
const { authenticateToken, requireWorkspaceAccess } = require('../middlewares/auth');
const { validateContentCreation, validateObjectId, validatePagination } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get content items
 *     tags: [Content]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, review, approved, scheduled, published]
 *         description: Filter by status
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [tiktok, instagram, youtube, linkedin, twitter]
 *         description: Filter by platform
 */
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20, status, platform, clientId } = req.query;
    
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('content_items')
      .select(`
        *,
        client:clients(id, name, brand),
        creator:users!content_items_creator_id_fkey(id, first_name, last_name),
        media_files(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (userRole === 'client') {
      query = query.eq('client_id', userId);
    } else if (userRole === 'creator' || userRole === 'agency') {
      query = query.eq('creator_id', userId);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (platform) {
      query = query.eq('platform', platform);
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: contentItems, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('content_items')
      .select('*', { count: 'exact', head: true });

    if (userRole === 'client') {
      countQuery = countQuery.eq('client_id', userId);
    } else if (userRole === 'creator' || userRole === 'agency') {
      countQuery = countQuery.eq('creator_id', userId);
    }

    if (status) countQuery = countQuery.eq('status', status);
    if (platform) countQuery = countQuery.eq('platform', platform);
    if (clientId) countQuery = countQuery.eq('client_id', clientId);

    const { count } = await countQuery;

    res.json({
      success: true,
      data: contentItems,
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
 * /api/content:
 *   post:
 *     summary: Create new content item
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - platform
 *               - contentType
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [tiktok, instagram, youtube, linkedin, twitter]
 *               contentType:
 *                 type: string
 *                 enum: [video, image, carousel, story, post]
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               script:
 *                 type: string
 *               caption:
 *                 type: string
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/', authenticateToken, validateContentCreation, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      platform,
      contentType,
      scheduledDate,
      clientId,
      script,
      caption,
      hashtags,
      status = 'draft'
    } = req.body;

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

      if (client.creator_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this client'
        });
      }
    }

    // Create content item
    const { data: contentItem, error } = await supabaseAdmin
      .from('content_items')
      .insert({
        title,
        description,
        platform,
        content_type: contentType,
        scheduled_date: scheduledDate,
        client_id: clientId,
        creator_id: userId,
        script,
        caption,
        hashtags,
        status,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        client:clients(id, name, brand),
        creator:users!content_items_creator_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Content item created: ${contentItem.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Content item created successfully',
      data: contentItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content item by ID
 *     tags: [Content]
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
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = supabaseAdmin
      .from('content_items')
      .select(`
        *,
        client:clients(id, name, brand),
        creator:users!content_items_creator_id_fkey(id, first_name, last_name),
        media_files(*),
        comments:content_comments(
          *,
          user:users(id, first_name, last_name)
        )
      `)
      .eq('id', id);

    // Apply role-based filtering
    if (userRole === 'client') {
      query = query.eq('client_id', userId);
    } else if (userRole === 'creator' || userRole === 'agency') {
      query = query.eq('creator_id', userId);
    }

    const { data: contentItem, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Content not found',
          message: 'The requested content item does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: contentItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   put:
 *     summary: Update content item
 *     tags: [Content]
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
router.put('/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = req.body;

    // Get existing content item
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested content item does not exist'
      });
    }

    // Check permissions
    if (userRole === 'client' && existingItem.client_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own content'
      });
    }

    if ((userRole === 'creator' || userRole === 'agency') && existingItem.creator_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update content you created'
      });
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.creator_id;
    delete updateData.created_at;

    // Update content item
    const { data: updatedItem, error } = await supabaseAdmin
      .from('content_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, brand),
        creator:users!content_items_creator_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Content item updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Content item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete content item
 *     tags: [Content]
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
    const userRole = req.user.role;

    // Get existing content item
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingItem) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested content item does not exist'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && existingItem.creator_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete content you created'
      });
    }

    // Delete content item (this will cascade to related records)
    const { error } = await supabaseAdmin
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info(`Content item deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Content item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/{id}/comments:
 *   post:
 *     summary: Add comment to content item
 *     tags: [Content]
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
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [comment, approval, rejection]
 *                 default: comment
 */
router.post('/:id/comments', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { comment, type = 'comment' } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment required',
        message: 'Comment text cannot be empty'
      });
    }

    // Verify content item exists and user has access
    const { data: contentItem, error: fetchError } = await supabaseAdmin
      .from('content_items')
      .select('id, creator_id, client_id')
      .eq('id', id)
      .single();

    if (fetchError || !contentItem) {
      return res.status(404).json({
        error: 'Content not found',
        message: 'The requested content item does not exist'
      });
    }

    // Check if user has access to comment
    const hasAccess = contentItem.creator_id === userId || 
                     contentItem.client_id === userId || 
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to comment on this content'
      });
    }

    // Create comment
    const { data: newComment, error } = await supabaseAdmin
      .from('content_comments')
      .insert({
        content_item_id: id,
        user_id: userId,
        comment: comment.trim(),
        type,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:users(id, first_name, last_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Update content status if this is an approval/rejection
    if (type === 'approval') {
      await supabaseAdmin
        .from('content_items')
        .update({ status: 'approved' })
        .eq('id', id);
    } else if (type === 'rejection') {
      await supabaseAdmin
        .from('content_items')
        .update({ status: 'draft' })
        .eq('id', id);
    }

    logger.info(`Comment added to content ${id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;