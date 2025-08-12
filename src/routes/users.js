const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { validateObjectId, validatePagination } = require('../middlewares/validation');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get users (admin only)
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, agency, creator, client]
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by status
 */
router.get('/', authenticateToken, requireRole(['admin']), validatePagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, created_at, last_login')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (role) countQuery = countQuery.eq('role', role);
    if (status) countQuery = countQuery.eq('status', status);
    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    res.json({
      success: true,
      data: users,
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
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Users can only view their own profile unless they're admin
    if (id !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own profile'
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, status, avatar_url, timezone, created_at, last_login')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'User not found',
          message: 'The requested user does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, agency, creator, client]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               timezone:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 */
router.put('/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const { firstName, lastName, email, role, status, timezone, avatarUrl } = req.body;

    // Users can only update their own profile unless they're admin
    if (id !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own profile'
      });
    }

    // Only admins can change role and status
    if ((role || status) && currentUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can change user roles and status'
      });
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Check if email is already taken (if changing email)
    if (email && email !== existingUser.email) {
      const { data: emailCheck } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailCheck) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Another user is already using this email address'
        });
      }
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (firstName) updateData.first_name = firstName.trim();
    if (lastName) updateData.last_name = lastName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (timezone) updateData.timezone = timezone;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    
    // Admin-only fields
    if (currentUserRole === 'admin') {
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    // Update user
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, first_name, last_name, role, status, avatar_url, timezone, created_at, last_login')
      .single();

    if (error) {
      throw error;
    }

    logger.info(`User updated: ${id} by user ${currentUserId}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 */
router.put('/:id/password', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password unless they're admin
    if (id !== currentUserId && currentUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only change your own password'
      });
    }

    // Validate input
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user's current password hash
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Verify current password (unless admin is changing someone else's password)
    if (id === currentUserId) {
      if (!currentPassword) {
        return res.status(400).json({
          error: 'Current password required',
          message: 'Please provide your current password'
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info(`Password changed for user: ${id} by user ${currentUserId}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
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
router.delete('/:id', authenticateToken, requireRole(['admin']), validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent admin from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    // Delete user (this will cascade to related records due to foreign key constraints)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info(`User deleted: ${id} (${existingUser.email}) by admin ${currentUserId}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    // Get user counts by role
    const { data: roleStats, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('status', 'active');

    if (roleError) {
      throw roleError;
    }

    // Get user counts by status
    const { data: statusStats, error: statusError } = await supabaseAdmin
      .from('users')
      .select('status');

    if (statusError) {
      throw statusError;
    }

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentUsers, error: recentError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) {
      throw recentError;
    }

    // Process statistics
    const roleCounts = roleStats.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = statusStats.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalUsers: statusStats.length,
      activeUsers: statusCounts.active || 0,
      inactiveUsers: statusCounts.inactive || 0,
      suspendedUsers: statusCounts.suspended || 0,
      roleDistribution: {
        admin: roleCounts.admin || 0,
        agency: roleCounts.agency || 0,
        creator: roleCounts.creator || 0,
        client: roleCounts.client || 0
      },
      recentRegistrations: recentUsers.length,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;