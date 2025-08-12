const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middlewares/auth');
const { validateObjectId } = require('../middlewares/validation');
const { supabase, supabaseAdmin } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload files to storage
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               contentItemId:
 *                 type: string
 *                 format: uuid
 *                 description: Associate files with content item
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: Associate files with client
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 */
router.post('/upload', authenticateToken, upload.array('files', 5), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentItemId, clientId, tags } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select at least one file to upload'
      });
    }

    // Validate content item access if provided
    if (contentItemId) {
      const { data: contentItem, error: contentError } = await supabaseAdmin
        .from('content_items')
        .select('id, creator_id, client_id')
        .eq('id', contentItemId)
        .single();

      if (contentError || !contentItem) {
        return res.status(404).json({
          error: 'Content item not found',
          message: 'The specified content item does not exist'
        });
      }

      if (contentItem.creator_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this content item'
        });
      }
    }

    // Validate client access if provided
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

    const uploadedFiles = [];
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Upload each file
    for (const file of files) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.originalname.split('.').pop();
        const filename = `${timestamp}_${randomString}.${fileExtension}`;
        
        // Determine storage path
        const storagePath = `uploads/${userId}/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-files')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          logger.error('File upload error:', uploadError);
          continue; // Skip this file and continue with others
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media-files')
          .getPublicUrl(storagePath);

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabaseAdmin
          .from('media_files')
          .insert({
            filename,
            original_name: file.originalname,
            file_type: getFileType(file.mimetype),
            file_size: file.size,
            mime_type: file.mimetype,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
            content_item_id: contentItemId || null,
            uploaded_by: userId,
            client_id: clientId || null,
            tags: tagArray,
            metadata: {
              upload_timestamp: new Date().toISOString(),
              user_agent: req.get('User-Agent')
            },
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) {
          logger.error('Database save error:', dbError);
          // Try to clean up uploaded file
          await supabase.storage.from('media-files').remove([storagePath]);
          continue;
        }

        uploadedFiles.push(fileRecord);
      } catch (fileError) {
        logger.error(`Error uploading file ${file.originalname}:`, fileError);
        continue;
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({
        error: 'Upload failed',
        message: 'All file uploads failed. Please try again.'
      });
    }

    logger.info(`${uploadedFiles.length} files uploaded by user ${userId}`);

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 10MB'
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 5 files allowed per upload'
        });
      }
    }

    next(error);
  }
});

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get user's files
 *     tags: [Files]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video, document]
 *         description: Filter by file type
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by client
 *       - in: query
 *         name: contentItemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by content item
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in filename and tags
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      clientId, 
      contentItemId, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('media_files')
      .select(`
        *,
        content_item:content_items(id, title),
        client:clients(id, name, brand)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (userRole === 'client') {
      query = query.eq('client_id', userId);
    } else {
      query = query.eq('uploaded_by', userId);
    }

    // Apply filters
    if (type) {
      query = query.eq('file_type', type);
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    if (contentItemId) {
      query = query.eq('content_item_id', contentItemId);
    }

    if (search) {
      query = query.or(`original_name.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data: files, error } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('media_files')
      .select('*', { count: 'exact', head: true });

    if (userRole === 'client') {
      countQuery = countQuery.eq('client_id', userId);
    } else {
      countQuery = countQuery.eq('uploaded_by', userId);
    }

    if (type) countQuery = countQuery.eq('file_type', type);
    if (clientId) countQuery = countQuery.eq('client_id', clientId);
    if (contentItemId) countQuery = countQuery.eq('content_item_id', contentItemId);
    if (search) {
      countQuery = countQuery.or(`original_name.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { count } = await countQuery;

    res.json({
      success: true,
      data: files,
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
 * /api/files/{id}:
 *   get:
 *     summary: Get file by ID
 *     tags: [Files]
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
      .from('media_files')
      .select(`
        *,
        content_item:content_items(id, title),
        client:clients(id, name, brand),
        uploader:users!media_files_uploaded_by_fkey(id, first_name, last_name)
      `)
      .eq('id', id);

    // Apply role-based filtering
    if (userRole === 'client') {
      query = query.eq('client_id', userId);
    } else if (userRole !== 'admin') {
      query = query.eq('uploaded_by', userId);
    }

    const { data: file, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'File not found',
          message: 'The requested file does not exist'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: Update file metadata
 *     tags: [Files]
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               contentItemId:
 *                 type: string
 *                 format: uuid
 *               clientId:
 *                 type: string
 *                 format: uuid
 */
router.put('/:id', authenticateToken, validateObjectId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { tags, contentItemId, clientId } = req.body;

    // Get existing file
    const { data: existingFile, error: fetchError } = await supabaseAdmin
      .from('media_files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingFile) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && existingFile.uploaded_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update files you uploaded'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (tags) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    if (contentItemId !== undefined) {
      updateData.content_item_id = contentItemId;
    }

    if (clientId !== undefined) {
      updateData.client_id = clientId;
    }

    // Update file
    const { data: updatedFile, error } = await supabaseAdmin
      .from('media_files')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        content_item:content_items(id, title),
        client:clients(id, name, brand)
      `)
      .single();

    if (error) {
      throw error;
    }

    logger.info(`File updated: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'File updated successfully',
      data: updatedFile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
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

    // Get existing file
    const { data: existingFile, error: fetchError } = await supabaseAdmin
      .from('media_files')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingFile) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file does not exist'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && existingFile.uploaded_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete files you uploaded'
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media-files')
      .remove([existingFile.storage_path]);

    if (storageError) {
      logger.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('media_files')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    logger.info(`File deleted: ${id} (${existingFile.original_name}) by user ${userId}`);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/files/stats:
 *   get:
 *     summary: Get file storage statistics
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = supabaseAdmin
      .from('media_files')
      .select('file_type, file_size');

    if (userRole === 'client') {
      query = query.eq('client_id', userId);
    } else if (userRole !== 'admin') {
      query = query.eq('uploaded_by', userId);
    }

    const { data: files, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.file_size, 0),
      byType: {},
      averageSize: 0
    };

    // Group by file type
    files.forEach(file => {
      if (!stats.byType[file.file_type]) {
        stats.byType[file.file_type] = { count: 0, size: 0 };
      }
      stats.byType[file.file_type].count++;
      stats.byType[file.file_type].size += file.file_size;
    });

    // Calculate average size
    if (stats.totalFiles > 0) {
      stats.averageSize = Math.round(stats.totalSize / stats.totalFiles);
    }

    // Format sizes for readability
    stats.totalSizeFormatted = formatFileSize(stats.totalSize);
    stats.averageSizeFormatted = formatFileSize(stats.averageSize);

    Object.keys(stats.byType).forEach(type => {
      stats.byType[type].sizeFormatted = formatFileSize(stats.byType[type].size);
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to determine file type from MIME type
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;