import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import {
  DataManagementService,
  DeletionOptions,
  ExportOptions,
  DataCategory,
  ExportFormat
} from '../services/data-management.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request } from 'express';

/**
 * Controller for GDPR-related data management operations
 */
@Controller('user/data')
@UseGuards(JwtAuthGuard)
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  /**
   * Export all data for the authenticated user (GDPR right to data portability)
   */
  @Get('export')
  async exportUserData(
    @Req() request: Request,
    @Query('format') format?: ExportFormat,
    @Query('categories') categoriesStr?: string
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    // Parse categories if provided
    let categories: Record<DataCategory, boolean> | undefined;
    if (categoriesStr) {
      try {
        categories = JSON.parse(categoriesStr);
      } catch (error) {
        throw new Error('Invalid categories format. Must be a valid JSON object.');
      }
    }
    
    const options: ExportOptions = {
      format,
      categories
    };
    
    return this.dataManagementService.exportUserData(userId, options);
  }
  
  /**
   * Create a data export request
   * The export will be processed asynchronously
   */
  @Post('export/request')
  async createExportRequest(
    @Body() options: ExportOptions,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.dataManagementService.createExportRequest(userId, options, request);
  }
  
  /**
   * Get all export requests for the authenticated user
   */
  @Get('export/requests')
  async getExportRequests(@Req() request: Request) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.dataManagementService.getExportRequests(userId);
  }
  
  /**
   * Get a specific export request
   */
  @Get('export/requests/:id')
  async getExportRequest(
    @Param('id') exportId: string,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const exportRequest = await this.dataManagementService.getExportRequest(exportId);
    
    if (!exportRequest) {
      throw new Error(`Export request with ID ${exportId} not found`);
    }
    
    // Ensure the user can only access their own export requests
    if (exportRequest.userId !== userId) {
      throw new Error('Unauthorized access to export request');
    }
    
    return exportRequest;
  }

  /**
   * Delete or anonymize user data (GDPR right to be forgotten)
   */
  @Post('delete')
  async deleteUserData(
    @Req() request: Request,
    @Body() options: DeletionOptions
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    await this.dataManagementService.deleteUserData(userId, options);
    
    return { success: true, message: 'User data deleted or anonymized successfully' };
  }

  /**
   * Admin endpoint to export user data by ID
   * This should be restricted to admin users only
   */
  @Get('admin/export/:userId')
  async adminExportUserData(@Param('userId') userId: string) {
    return this.dataManagementService.exportUserData(userId);
  }

  /**
   * Admin endpoint to delete user data by ID
   * This should be restricted to admin users only
   */
  @Post('admin/delete/:userId')
  async adminDeleteUserData(
    @Param('userId') userId: string,
    @Body() options: DeletionOptions
  ) {
    await this.dataManagementService.deleteUserData(userId, options);
    
    return { success: true, message: 'User data deleted or anonymized successfully' };
  }
}