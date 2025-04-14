import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyController } from '../privacy.controller';
import { PrivacyService } from '../privacy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DataExportRequestDto } from '../dto/data-export-request.dto';
import { AccountDeletionOptionsDto } from '../dto/account-deletion-options.dto';

describe('PrivacyController', () => {
  let controller: PrivacyController;
  let privacyService: PrivacyService;
  
  const mockPrivacyService = {
    getDataCategories: jest.fn(),
    requestDataExport: jest.fn(),
    getExportHistory: jest.fn(),
    getConsentPreferences: jest.fn(),
    updateConsentPreference: jest.fn(),
    getConsentHistory: jest.fn(),
    getAccountInfo: jest.fn(),
    getAccountActivity: jest.fn(),
    deleteAccount: jest.fn(),
    anonymizeAccount: jest.fn(),
    getPrivacyPolicy: jest.fn(),
    getPrivacyFAQs: jest.fn(),
    getUserRights: jest.fn(),
    getContactInfo: jest.fn(),
  };
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivacyController],
      providers: [
        { provide: PrivacyService, useValue: mockPrivacyService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    
    controller = module.get<PrivacyController>(PrivacyController);
    privacyService = module.get<PrivacyService>(PrivacyService);
  });
  
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
  describe('getDataCategories', () => {
    it('should return data categories for the current user', async () => {
      const userId = 'user-123';
      const mockCategories = [
        { id: 'profile', name: 'Profile Information', description: 'Your basic profile information', selected: true },
        { id: 'messages', name: 'Messages', description: 'Your message history', selected: false },
      ];
      
      mockPrivacyService.getDataCategories.mockResolvedValue(mockCategories);
      
      const result = await controller.getDataCategories({ user: { id: userId } });
      
      expect(result).toEqual(mockCategories);
      expect(mockPrivacyService.getDataCategories).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('requestDataExport', () => {
    it('should create a data export request for the current user', async () => {
      const userId = 'user-123';
      const exportRequest: DataExportRequestDto = {
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
      
      mockPrivacyService.requestDataExport.mockResolvedValue(mockExportResponse);
      
      const result = await controller.requestDataExport({ user: { id: userId } }, exportRequest);
      
      expect(result).toEqual(mockExportResponse);
      expect(mockPrivacyService.requestDataExport).toHaveBeenCalledWith(userId, exportRequest);
    });
  });
  
  describe('getExportHistory', () => {
    it('should return export history for the current user', async () => {
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
      
      mockPrivacyService.getExportHistory.mockResolvedValue(mockExportHistory);
      
      const result = await controller.getExportHistory({ user: { id: userId } });
      
      expect(result).toEqual(mockExportHistory);
      expect(mockPrivacyService.getExportHistory).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('getConsentPreferences', () => {
    it('should return consent preferences for the current user', async () => {
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
      
      mockPrivacyService.getConsentPreferences.mockResolvedValue(mockConsents);
      
      const result = await controller.getConsentPreferences({ user: { id: userId } });
      
      expect(result).toEqual(mockConsents);
      expect(mockPrivacyService.getConsentPreferences).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('updateConsentPreference', () => {
    it('should update a consent preference for the current user', async () => {
      const userId = 'user-123';
      const consentId = 'consent-1';
      const status = true;
      
      const mockUpdatedConsent = {
        id: consentId,
        type: 'MARKETING',
        title: 'Marketing Communications',
        description: 'Allow us to send you marketing communications',
        status,
        updatedAt: expect.any(String),
      };
      
      mockPrivacyService.updateConsentPreference.mockResolvedValue(mockUpdatedConsent);
      
      const result = await controller.updateConsentPreference(
        { user: { id: userId } },
        consentId,
        { status }
      );
      
      expect(result).toEqual(mockUpdatedConsent);
      expect(mockPrivacyService.updateConsentPreference).toHaveBeenCalledWith(userId, consentId, status);
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
      
      mockPrivacyService.getConsentHistory.mockResolvedValue(mockHistory);
      
      const result = await controller.getConsentHistory({ user: { id: userId } }, consentType);
      
      expect(result).toEqual(mockHistory);
      expect(mockPrivacyService.getConsentHistory).toHaveBeenCalledWith(userId, consentType);
    });
  });
  
  describe('getAccountInfo', () => {
    it('should return account information for the current user', async () => {
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
      
      mockPrivacyService.getAccountInfo.mockResolvedValue(mockAccountInfo);
      
      const result = await controller.getAccountInfo({ user: { id: userId } });
      
      expect(result).toEqual(mockAccountInfo);
      expect(mockPrivacyService.getAccountInfo).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('getAccountActivity', () => {
    it('should return account activity for the current user', async () => {
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
      
      mockPrivacyService.getAccountActivity.mockResolvedValue(mockActivity);
      
      const result = await controller.getAccountActivity({ user: { id: userId } });
      
      expect(result).toEqual(mockActivity);
      expect(mockPrivacyService.getAccountActivity).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('deleteAccount', () => {
    it('should delete the current user account with specified options', async () => {
      const userId = 'user-123';
      const options: AccountDeletionOptionsDto = {
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      };
      
      mockPrivacyService.deleteAccount.mockResolvedValue({ success: true });
      
      const result = await controller.deleteAccount({ user: { id: userId } }, options);
      
      expect(result).toEqual({ success: true });
      expect(mockPrivacyService.deleteAccount).toHaveBeenCalledWith(userId, options);
    });
  });
  
  describe('anonymizeAccount', () => {
    it('should anonymize the current user account', async () => {
      const userId = 'user-123';
      
      mockPrivacyService.anonymizeAccount.mockResolvedValue({ success: true });
      
      const result = await controller.anonymizeAccount({ user: { id: userId } });
      
      expect(result).toEqual({ success: true });
      expect(mockPrivacyService.anonymizeAccount).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('getPrivacyPolicy', () => {
    it('should return the privacy policy', async () => {
      const mockPolicy = {
        title: 'Privacy Policy',
        lastUpdated: '2025-04-01T00:00:00Z',
        sections: [
          {
            id: 'section-1',
            title: '1. Information We Collect',
            content: 'We collect various types of information from and about users of our Services...',
          },
          {
            id: 'section-2',
            title: '2. How We Use Your Information',
            content: 'We use the information we collect to provide, maintain, and improve our Services...',
          },
        ],
      };
      
      mockPrivacyService.getPrivacyPolicy.mockResolvedValue(mockPolicy);
      
      const result = await controller.getPrivacyPolicy();
      
      expect(result).toEqual(mockPolicy);
      expect(mockPrivacyService.getPrivacyPolicy).toHaveBeenCalled();
    });
  });
  
  describe('getPrivacyFAQs', () => {
    it('should return privacy FAQs', async () => {
      const mockFAQs = [
        {
          id: 'faq-1',
          question: 'What personal data does 10-Date collect?',
          answer: '10-Date collects various types of personal data, including profile information...',
          tags: ['data', 'collection', 'personal'],
        },
        {
          id: 'faq-2',
          question: 'How does 10-Date use my data?',
          answer: '10-Date uses your data to provide and improve our services, personalize your experience...',
          tags: ['data', 'usage', 'purpose'],
        },
      ];
      
      mockPrivacyService.getPrivacyFAQs.mockResolvedValue(mockFAQs);
      
      const result = await controller.getPrivacyFAQs();
      
      expect(result).toEqual(mockFAQs);
      expect(mockPrivacyService.getPrivacyFAQs).toHaveBeenCalled();
    });
  });
  
  describe('getUserRights', () => {
    it('should return user privacy rights', async () => {
      const mockRights = [
        {
          id: 'right-1',
          title: 'Right to Access',
          description: 'You have the right to access and view the personal data we hold about you...',
        },
        {
          id: 'right-2',
          title: 'Right to Rectification',
          description: 'You have the right to correct inaccurate or incomplete personal data...',
        },
      ];
      
      mockPrivacyService.getUserRights.mockResolvedValue(mockRights);
      
      const result = await controller.getUserRights();
      
      expect(result).toEqual(mockRights);
      expect(mockPrivacyService.getUserRights).toHaveBeenCalled();
    });
  });
  
  describe('getContactInfo', () => {
    it('should return privacy contact information', async () => {
      const mockContactInfo = {
        email: 'privacy@10date.com',
        phone: '+1 (555) 123-4567',
        address: '123 Privacy Street, San Francisco, CA 94105, United States',
        dpo: 'Jane Smith',
      };
      
      mockPrivacyService.getContactInfo.mockResolvedValue(mockContactInfo);
      
      const result = await controller.getContactInfo();
      
      expect(result).toEqual(mockContactInfo);
      expect(mockPrivacyService.getContactInfo).toHaveBeenCalled();
    });
  });
});
