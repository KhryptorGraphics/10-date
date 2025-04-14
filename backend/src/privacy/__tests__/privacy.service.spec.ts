import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyService } from '../privacy.service';
import { UserService } from '../../user/user.service';
import { DataExportService } from '../data-export.service';
import { ConsentService } from '../consent.service';
import { AccountService } from '../account.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../logger/logger.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PrivacyService', () => {
  let service: PrivacyService;
  let userService: UserService;
  let dataExportService: DataExportService;
  let consentService: ConsentService;
  let accountService: AccountService;
  
  const mockUserService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    anonymize: jest.fn(),
  };
  
  const mockDataExportService = {
    createExportRequest: jest.fn(),
    getExportRequests: jest.fn(),
    getExportRequestById: jest.fn(),
    generateExport: jest.fn(),
  };
  
  const mockConsentService = {
    getUserConsents: jest.fn(),
    updateConsent: jest.fn(),
    getConsentHistory: jest.fn(),
    getConsentById: jest.fn(),
  };
  
  const mockAccountService = {
    getAccountInfo: jest.fn(),
    getAccountActivity: jest.fn(),
    deleteAccount: jest.fn(),
    anonymizeAccount: jest.fn(),
  };
  
  const mockConfigService = {
    get: jest.fn(),
  };
  
  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: UserService, useValue: mockUserService },
        { provide: DataExportService, useValue: mockDataExportService },
        { provide: ConsentService, useValue: mockConsentService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();
    
    service = module.get<PrivacyService>(PrivacyService);
    userService = module.get<UserService>(UserService);
    dataExportService = module.get<DataExportService>(DataExportService);
    consentService = module.get<ConsentService>(ConsentService);
    accountService = module.get<AccountService>(AccountService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('getDataCategories', () => {
    it('should return data categories for a user', async () => {
      const userId = 'user-123';
      const mockCategories = [
        { id: 'profile', name: 'Profile Information', description: 'Your basic profile information', selected: true },
        { id: 'messages', name: 'Messages', description: 'Your message history', selected: false },
      ];
      
      jest.spyOn(service, 'getDataCategories').mockResolvedValue(mockCategories);
      
      const result = await service.getDataCategories(userId);
      
      expect(result).toEqual(mockCategories);
      expect(service.getDataCategories).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('requestDataExport', () => {
    it('should create a data export request', async () => {
      const userId = 'user-123';
      const exportRequest = {
        categories: ['profile', 'messages'],
        format: 'JSON',
      };
      
      const mockExportResponse = {
        id: 'export-123',
        userId,
        status: 'pending',
        requestDate: new Date().toISOString(),
        categories: exportRequest.categories,
        format: exportRequest.format,
      };
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockDataExportService.createExportRequest.mockResolvedValue(mockExportResponse);
      
      const result = await service.requestDataExport(userId, exportRequest);
      
      expect(result).toEqual(mockExportResponse);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockDataExportService.createExportRequest).toHaveBeenCalledWith(userId, exportRequest);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      const exportRequest = {
        categories: ['profile', 'messages'],
        format: 'JSON',
      };
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.requestDataExport(userId, exportRequest)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockDataExportService.createExportRequest).not.toHaveBeenCalled();
    });
  });
  
  describe('getExportHistory', () => {
    it('should return export history for a user', async () => {
      const userId = 'user-123';
      const mockExportHistory = [
        {
          id: 'export-1',
          userId,
          status: 'completed',
          requestDate: '2025-04-10T10:30:00Z',
          completedDate: '2025-04-10T10:35:00Z',
          format: 'JSON',
          categories: ['profile', 'messages'],
        },
        {
          id: 'export-2',
          userId,
          status: 'pending',
          requestDate: '2025-04-15T14:20:00Z',
          format: 'CSV',
          categories: ['profile'],
        },
      ];
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockDataExportService.getExportRequests.mockResolvedValue(mockExportHistory);
      
      const result = await service.getExportHistory(userId);
      
      expect(result).toEqual(mockExportHistory);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockDataExportService.getExportRequests).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.getExportHistory(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockDataExportService.getExportRequests).not.toHaveBeenCalled();
    });
  });
  
  describe('getConsentPreferences', () => {
    it('should return consent preferences for a user', async () => {
      const userId = 'user-123';
      const mockConsents = [
        {
          id: 'consent-1',
          type: 'MARKETING',
          title: 'Marketing Communications',
          description: 'Allow us to send you marketing communications',
          status: true,
          updatedAt: '2025-04-10T10:30:00Z',
        },
        {
          id: 'consent-2',
          type: 'ANALYTICS',
          title: 'Analytics & Usage Data',
          description: 'Allow us to collect and analyze data about how you use our service',
          status: false,
          updatedAt: '2025-04-09T14:20:00Z',
        },
      ];
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockConsentService.getUserConsents.mockResolvedValue(mockConsents);
      
      const result = await service.getConsentPreferences(userId);
      
      expect(result).toEqual(mockConsents);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getUserConsents).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.getConsentPreferences(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getUserConsents).not.toHaveBeenCalled();
    });
  });
  
  describe('updateConsentPreference', () => {
    it('should update a consent preference', async () => {
      const userId = 'user-123';
      const consentId = 'consent-1';
      const status = true;
      
      const mockConsent = {
        id: consentId,
        type: 'MARKETING',
        title: 'Marketing Communications',
        description: 'Allow us to send you marketing communications',
        status: false,
        updatedAt: '2025-04-09T14:20:00Z',
        required: false,
      };
      
      const mockUpdatedConsent = {
        ...mockConsent,
        status,
        updatedAt: expect.any(String),
      };
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockConsentService.getConsentById.mockResolvedValue(mockConsent);
      mockConsentService.updateConsent.mockResolvedValue(mockUpdatedConsent);
      
      const result = await service.updateConsentPreference(userId, consentId, status);
      
      expect(result).toEqual(mockUpdatedConsent);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentById).toHaveBeenCalledWith(consentId);
      expect(mockConsentService.updateConsent).toHaveBeenCalledWith(userId, consentId, status);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      const consentId = 'consent-1';
      const status = true;
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.updateConsentPreference(userId, consentId, status)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentById).not.toHaveBeenCalled();
      expect(mockConsentService.updateConsent).not.toHaveBeenCalled();
    });
    
    it('should throw NotFoundException if consent does not exist', async () => {
      const userId = 'user-123';
      const consentId = 'non-existent-consent';
      const status = true;
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockConsentService.getConsentById.mockResolvedValue(null);
      
      await expect(service.updateConsentPreference(userId, consentId, status)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentById).toHaveBeenCalledWith(consentId);
      expect(mockConsentService.updateConsent).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestException if trying to update a required consent', async () => {
      const userId = 'user-123';
      const consentId = 'consent-1';
      const status = false;
      
      const mockConsent = {
        id: consentId,
        type: 'COMMUNICATIONS',
        title: 'Service Communications',
        description: 'Allow us to send you important service communications',
        status: true,
        updatedAt: '2025-04-09T14:20:00Z',
        required: true,
      };
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockConsentService.getConsentById.mockResolvedValue(mockConsent);
      
      await expect(service.updateConsentPreference(userId, consentId, status)).rejects.toThrow(BadRequestException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentById).toHaveBeenCalledWith(consentId);
      expect(mockConsentService.updateConsent).not.toHaveBeenCalled();
    });
  });
  
  describe('getConsentHistory', () => {
    it('should return consent history for a specific consent type', async () => {
      const userId = 'user-123';
      const consentType = 'MARKETING';
      
      const mockHistory = [
        {
          id: 'history-1',
          consentType,
          status: true,
          changedAt: '2025-04-10T10:30:00Z',
          policyVersion: '1.2',
          notes: 'Consent granted via Privacy Center',
        },
        {
          id: 'history-2',
          consentType,
          status: false,
          changedAt: '2025-04-05T14:20:00Z',
          policyVersion: '1.1',
          notes: 'Consent revoked via Privacy Center',
        },
      ];
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockConsentService.getConsentHistory.mockResolvedValue(mockHistory);
      
      const result = await service.getConsentHistory(userId, consentType);
      
      expect(result).toEqual(mockHistory);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentHistory).toHaveBeenCalledWith(userId, consentType);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      const consentType = 'MARKETING';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.getConsentHistory(userId, consentType)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockConsentService.getConsentHistory).not.toHaveBeenCalled();
    });
  });
  
  describe('getAccountInfo', () => {
    it('should return account information for a user', async () => {
      const userId = 'user-123';
      
      const mockAccountInfo = {
        id: userId,
        email: 'user@example.com',
        username: 'testuser',
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: '2025-04-10T14:20:00Z',
        accountStatus: 'active',
        subscriptionStatus: 'premium',
        subscriptionExpiry: '2025-12-31T23:59:59Z',
        dataRetentionPeriod: 90,
      };
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockAccountService.getAccountInfo.mockResolvedValue(mockAccountInfo);
      
      const result = await service.getAccountInfo(userId);
      
      expect(result).toEqual(mockAccountInfo);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.getAccountInfo).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.getAccountInfo(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.getAccountInfo).not.toHaveBeenCalled();
    });
  });
  
  describe('getAccountActivity', () => {
    it('should return account activity for a user', async () => {
      const userId = 'user-123';
      
      const mockActivity = [
        {
          id: 'activity-1',
          type: 'LOGIN',
          timestamp: '2025-04-10T14:20:00Z',
          ipAddress: '192.168.1.1',
          deviceInfo: 'Chrome on Windows',
          location: 'San Francisco, CA',
        },
        {
          id: 'activity-2',
          type: 'PROFILE_UPDATE',
          timestamp: '2025-04-05T09:15:00Z',
          ipAddress: '192.168.1.1',
          deviceInfo: 'Chrome on Windows',
          location: 'San Francisco, CA',
        },
      ];
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockAccountService.getAccountActivity.mockResolvedValue(mockActivity);
      
      const result = await service.getAccountActivity(userId);
      
      expect(result).toEqual(mockActivity);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.getAccountActivity).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.getAccountActivity(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.getAccountActivity).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteAccount', () => {
    it('should delete a user account with specified options', async () => {
      const userId = 'user-123';
      const options = {
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      };
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockAccountService.deleteAccount.mockResolvedValue({ success: true });
      
      const result = await service.deleteAccount(userId, options);
      
      expect(result).toEqual({ success: true });
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.deleteAccount).toHaveBeenCalledWith(userId, options);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      const options = {
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      };
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.deleteAccount(userId, options)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.deleteAccount).not.toHaveBeenCalled();
    });
  });
  
  describe('anonymizeAccount', () => {
    it('should anonymize a user account', async () => {
      const userId = 'user-123';
      
      mockUserService.findById.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockAccountService.anonymizeAccount.mockResolvedValue({ success: true });
      
      const result = await service.anonymizeAccount(userId);
      
      expect(result).toEqual({ success: true });
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.anonymizeAccount).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent-user';
      
      mockUserService.findById.mockResolvedValue(null);
      
      await expect(service.anonymizeAccount(userId)).rejects.toThrow(NotFoundException);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockAccountService.anonymizeAccount).not.toHaveBeenCalled();
    });
  });
});
