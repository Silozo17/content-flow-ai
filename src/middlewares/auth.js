const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

// Verify JWT token and extract user info
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found or token expired'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is malformed'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please log in again'
      });
    }

    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user can access specific workspace/client
const requireWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId, clientId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins have access to everything
    if (userRole === 'admin') {
      return next();
    }

    // Check workspace access
    if (workspaceId) {
      const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .select('*, workspace_members(*)')
        .eq('id', workspaceId)
        .single();

      if (error || !workspace) {
        return res.status(404).json({ 
          error: 'Workspace not found',
          message: 'The requested workspace does not exist'
        });
      }

      // Check if user is workspace owner or member
      const isOwner = workspace.owner_id === userId;
      const isMember = workspace.workspace_members.some(member => 
        member.user_id === userId && member.status === 'active'
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have access to this workspace'
        });
      }
    }

    // Check client access
    if (clientId) {
      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .select('*, workspace:workspaces(*)')
        .eq('id', clientId)
        .single();

      if (error || !client) {
        return res.status(404).json({ 
          error: 'Client not found',
          message: 'The requested client does not exist'
        });
      }

      // For client role, they can only access their own data
      if (userRole === 'client' && client.user_id !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only access your own client data'
        });
      }

      // For other roles, check workspace access
      if (userRole !== 'client') {
        const workspaceOwnerId = client.workspace?.owner_id;
        if (workspaceOwnerId !== userId) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'You do not have access to this client'
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Workspace access check error:', error);
    res.status(500).json({ 
      error: 'Access check failed',
      message: 'Internal server error during access verification'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireWorkspaceAccess
};