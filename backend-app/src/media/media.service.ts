import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

// Simple in-memory file metadata storage (in production, use database)
interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  userId?: string;
  width?: number;
  height?: number;
  path: string;
  thumbnailPath?: string;
  createdAt: Date;
  purpose?: 'profile' | 'message' | 'verification' | 'other';
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private files: Map<string, FileMetadata> = new Map();
  private readonly uploadDir = process.env.UPLOAD_DIR || 'uploads';
  private readonly allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'video/mp4',
    'video/webm'
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  
  constructor() {
    this.ensureUploadDirExists();
  }
  
  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'thumbnails'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'processed'), { recursive: true });
      this.logger.log(`Upload directories created at ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directories: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File, 
    options: { 
      userId?: string;
      purpose?: 'profile' | 'message' | 'verification' | 'other';
      resize?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      generateThumbnail?: boolean;
    } = {}
  ) {
    // Validate file
    this.validateFile(file);
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    const fileExtension = mime.extension(file.mimetype) || 'bin';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);
    
    // Save the original file
    await fs.writeFile(filePath, file.buffer);
    
    // Initialize metadata
    const metadata: FileMetadata = {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      userId: options.userId,
      path: filePath,
      createdAt: new Date(),
      purpose: options.purpose || 'other'
    };
    
    // Process image files if necessary
    if (file.mimetype.startsWith('image/')) {
      try {
        // Get image dimensions
        const imageInfo = await sharp(file.buffer).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        
        // Resize if requested
        if (options.resize && (options.maxWidth || options.maxHeight)) {
          const processedFilePath = path.join(this.uploadDir, 'processed', fileName);
          
          await sharp(file.buffer)
            .resize({
              width: options.maxWidth,
              height: options.maxHeight,
              fit: 'inside',
              withoutEnlargement: true
            })
            .toFile(processedFilePath);
          
          metadata.path = processedFilePath;
          
          // Update dimensions after resizing
          const resizedInfo = await sharp(processedFilePath).metadata();
          metadata.width = resizedInfo.width;
          metadata.height = resizedInfo.height;
        }
        
        // Generate thumbnail if requested
        if (options.generateThumbnail) {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', fileName);
          
          await sharp(file.buffer)
            .resize(200, 200, {
              fit: 'cover',
              position: 'centre'
            })
            .toFile(thumbnailPath);
          
          metadata.thumbnailPath = thumbnailPath;
        }
      } catch (error) {
        this.logger.error(`Failed to process image: ${error.message}`);
        // Continue without image processing
      }
    }
    
    // Store metadata
    this.files.set(fileId, metadata);
    
    return {
      id: fileId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      hasThumbnail: !!metadata.thumbnailPath
    };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
    
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }
  }

  async getFile(fileId: string) {
    const metadata = this.files.get(fileId);
    
    if (!metadata) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
    
    try {
      const fileBuffer = await fs.readFile(metadata.path);
      
      return {
        buffer: fileBuffer,
        metadata: {
          id: metadata.id,
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
          createdAt: metadata.createdAt
        }
      };
    } catch (error) {
      this.logger.error(`Failed to read file ${fileId}: ${error.message}`);
      throw new NotFoundException(`File with ID ${fileId} could not be read`);
    }
  }
  
  async getThumbnail(fileId: string) {
    const metadata = this.files.get(fileId);
    
    if (!metadata) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
    
    if (!metadata.thumbnailPath) {
      throw new NotFoundException(`No thumbnail available for file ${fileId}`);
    }
    
    try {
      const fileBuffer = await fs.readFile(metadata.thumbnailPath);
      
      return {
        buffer: fileBuffer,
        metadata: {
          id: metadata.id,
          mimeType: metadata.mimeType,
        }
      };
    } catch (error) {
      this.logger.error(`Failed to read thumbnail ${fileId}: ${error.message}`);
      throw new NotFoundException(`Thumbnail for file ${fileId} could not be read`);
    }
  }
  
  async deleteFile(fileId: string) {
    const metadata = this.files.get(fileId);
    
    if (!metadata) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
    
    try {
      // Delete the main file
      await fs.unlink(metadata.path);
      
      // Delete the thumbnail if it exists
      if (metadata.thumbnailPath) {
        await fs.unlink(metadata.thumbnailPath);
      }
      
      // Remove metadata
      this.files.delete(fileId);
      
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}: ${error.message}`);
      throw new BadRequestException(`Failed to delete file ${fileId}`);
    }
  }
  
  async getUserFiles(userId: string) {
    const userFiles: FileMetadata[] = [];
    
    this.files.forEach(file => {
      if (file.userId === userId) {
        userFiles.push(file);
      }
    });
    
    return userFiles.map(file => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      width: file.width,
      height: file.height,
      createdAt: file.createdAt,
      purpose: file.purpose,
      hasThumbnail: !!file.thumbnailPath
    }));
  }
  
  // Helper method for profile image upload
  async uploadProfileImage(file: Express.Multer.File, userId: string) {
    return this.uploadFile(file, {
      userId,
      purpose: 'profile',
      resize: true,
      maxWidth: 800,
      maxHeight: 800,
      generateThumbnail: true
    });
  }
  
  // Helper method for message attachment upload
  async uploadMessageAttachment(file: Express.Multer.File, userId: string) {
    return this.uploadFile(file, {
      userId,
      purpose: 'message',
      resize: file.mimetype.startsWith('image/'),
      maxWidth: 1200,
      maxHeight: 1200,
      generateThumbnail: file.mimetype.startsWith('image/')
    });
  }
}
