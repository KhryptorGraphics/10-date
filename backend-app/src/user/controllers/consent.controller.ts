import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ConsentService, ConsentUpdateRequest } from '../services/consent.service';
import { ConsentType } from '../entities/consent-preference.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request } from 'express';

/**
 * Controller for managing user consent preferences
 * Required for GDPR compliance
 */
@Controller('user/consent')
@UseGuards(JwtAuthGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * Get all consent preferences for the authenticated user
   */
  @Get()
  async getAllConsentPreferences(@Req() request: Request) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.consentService.getAllConsentPreferences(userId);
  }

  /**
   * Get a specific consent preference for the authenticated user
   */
  @Get(':type')
  async getConsentPreference(
    @Param('type') consentType: ConsentType,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.consentService.getConsentPreference(userId, consentType);
  }

  /**
   * Update a consent preference for the authenticated user
   */
  @Put(':type')
  async updateConsentPreference(
    @Param('type') consentType: ConsentType,
    @Body() updateRequest: ConsentUpdateRequest,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.consentService.updateConsentPreference(
      userId,
      consentType,
      updateRequest,
      request
    );
  }

  /**
   * Get consent history for the authenticated user
   */
  @Get('history')
  async getConsentHistory(@Req() request: Request) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.consentService.getConsentHistory(userId);
  }

  /**
   * Get consent history for a specific consent type
   */
  @Get('history/:type')
  async getConsentHistoryByType(
    @Param('type') consentType: ConsentType,
    @Req() request: Request
  ) {
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.consentService.getConsentHistory(userId, consentType);
  }
}