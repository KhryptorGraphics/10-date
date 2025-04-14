import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrivacyService } from '../privacy.service';
import { DataExportRequestDto } from '../dto/data-export-request.dto';
import { AccountDeletionOptionsDto } from '../dto/account-deletion-options.dto';

describe('Privacy Integration Tests', () => {
  let app: INestApplication;
  let privacyService: PrivacyService;
  
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  };
  
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
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideProvider(PrivacyService)
      .useValue(mockPrivacyService)
      .compile();
    
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    
    privacyService = moduleFixture.get<PrivacyService>(PrivacyService);
  });
  
  afterEach(async () => {
    await app.close();
  });
  
  describe('GET /privacy/data-categories', () => {
    it('should return data categories for the authenticated user', async () => {
      const mockCategories = [
        { id: 'profile', name: 'Profile Information', description: 'Your basic profile information', selected: true },
        { id: 'messages', name: 'Messages', description: 'Your message history', selected: false },
      ];
      
      mockPrivacyService.getDataCategories.mockResolvedValue(mockCategories);
      
      return request(app.getHttpServer())
        .get('/privacy/data-categories')
        .expect(200)
        .expect(mockCategories);
    });
  });
  
  describe('POST /privacy/data-export', () => {
    it('should create a data export request for the authenticated user', async () => {
      const exportRequest: DataExportRequestDto = {
        categories: ['profile', 'messages'],
        format: 'JSON',
      };
      
      const mockExportResponse = {
        id: 'export-123',
        userId: mockUser.id,
        status: 'pending',
        requestDate: new Date().toISOString(),
        categories: exportRequest.categories,
        format: exportRequest.format,
      };
      
      mockPrivacyService.requestDataExport.mockResolvedValue(mockExportResponse);
      
      return request(app.getHttpServer())
        .post('/privacy/data-export')
        .send(exportRequest)
        .expect(201)
        .expect(mockExportResponse);
    });
    
    it('should validate the data export request', async () => {
      const invalidExportRequest = {
        categories: ['invalid-category'],
        format: 'INVALID',
      };
      
      return request(app.getHttpServer())
        .post('/privacy/data-export')
        .send(invalidExportRequest)
        .expect(400);
    });
  });
  
  describe('GET /privacy/export-history', () => {
    it('should return export history for the authenticated user', async () => {
      const mockExportHistory = [
        {
          id: 'export-1',
          userId: mockUser.id,
          status: 'completed',
          requestDate: '2025-04-10T10:30:00Z',
          completedDate: '2025-04-10T10:35:00Z',
          format: 'JSON',
          categories: ['profile', 'messages'],
        },
        {
          id: 'export-2',
          userId: mockUser.id,
          status: 'pending',
          requestDate: '2025-04-15T14:20:00Z',
          format: 'CSV',
          categories: ['profile'],
        },
      ];
      
      mockPrivacyService.getExportHistory.mockResolvedValue(mockExportHistory);
      
      return request(app.getHttpServer())
        .get('/privacy/export-history')
        .expect(200)
        .expect(mockExportHistory);
    });
  });
  
  describe('GET /privacy/consent', () => {
    it('should return consent preferences for the authenticated user', async () => {
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
      
      return request(app.getHttpServer())
        .get('/privacy/consent')
        .expect(200)
        .expect(mockConsents);
    });
  });
  
  describe('PATCH /privacy/consent/:id', () => {
    it('should update a consent preference for the authenticated user', async () => {
      const consentId = 'consent-1';
      const status = true;
      
      const mockUpdatedConsent = {
        id: consentId,
        type: 'MARKETING',
        title: 'Marketing Communications',
        description: 'Allow us to send you marketing communications',
        status,
        updatedAt: new Date().toISOString(),
      };
      
      mockPrivacyService.updateConsentPreference.mockResolvedValue(mockUpdatedConsent);
      
      return request(app.getHttpServer())
        .patch(`/privacy/consent/${consentId}`)
        .send({ status })
        .expect(200)
        .expect(mockUpdatedConsent);
    });
    
    it('should validate the consent update request', async () => {
      const consentId = 'consent-1';
      
      return request(app.getHttpServer())
        .patch(`/privacy/consent/${consentId}`)
        .send({}) // Missing status
        .expect(400);
    });
  });
  
  describe('GET /privacy/consent-history/:type', () => {
    it('should return consent history for a specific consent type', async () => {
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
      
      return request(app.getHttpServer())
        .get(`/privacy/consent-history/${consentType}`)
        .expect(200)
        .expect(mockHistory);
    });
  });
  
  describe('GET /privacy/account-info', () => {
    it('should return account information for the authenticated user', async () => {
      const mockAccountInfo = {
        id: mockUser.id,
        email: mockUser.email,
        username: 'testuser',
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: '2025-04-10T14:20:00Z',
        accountStatus: 'active',
        subscriptionStatus: 'premium',
        subscriptionExpiry: '2025-12-31T23:59:59Z',
        dataRetentionPeriod: 90,
      };
      
      mockPrivacyService.getAccountInfo.mockResolvedValue(mockAccountInfo);
      
      return request(app.getHttpServer())
        .get('/privacy/account-info')
        .expect(200)
        .expect(mockAccountInfo);
    });
  });
  
  describe('GET /privacy/account-activity', () => {
    it('should return account activity for the authenticated user', async () => {
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
      
      return request(app.getHttpServer())
        .get('/privacy/account-activity')
        .expect(200)
        .expect(mockActivity);
    });
  });
  
  describe('DELETE /privacy/account', () => {
    it('should delete the authenticated user account with specified options', async () => {
      const options: AccountDeletionOptionsDto = {
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      };
      
      mockPrivacyService.deleteAccount.mockResolvedValue({ success: true });
      
      return request(app.getHttpServer())
        .delete('/privacy/account')
        .send(options)
        .expect(200)
        .expect({ success: true });
    });
  });
  
  describe('POST /privacy/account/anonymize', () => {
    it('should anonymize the authenticated user account', async () => {
      mockPrivacyService.anonymizeAccount.mockResolvedValue({ success: true });
      
      return request(app.getHttpServer())
        .post('/privacy/account/anonymize')
        .expect(200)
        .expect({ success: true });
    });
  });
  
  describe('GET /privacy/policy', () => {
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
      
      return request(app.getHttpServer())
        .get('/privacy/policy')
        .expect(200)
        .expect(mockPolicy);
    });
  });
  
  describe('GET /privacy/faqs', () => {
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
      
      return request(app.getHttpServer())
        .get('/privacy/faqs')
        .expect(200)
        .expect(mockFAQs);
    });
  });
  
  describe('GET /privacy/rights', () => {
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
      
      return request(app.getHttpServer())
        .get('/privacy/rights')
        .expect(200)
        .expect(mockRights);
    });
  });
  
  describe('GET /privacy/contact', () => {
    it('should return privacy contact information', async () => {
      const mockContactInfo = {
        email: 'privacy@10date.com',
        phone: '+1 (555) 123-4567',
        address: '123 Privacy Street, San Francisco, CA 94105, United States',
        dpo: 'Jane Smith',
      };
      
      mockPrivacyService.getContactInfo.mockResolvedValue(mockContactInfo);
      
      return request(app.getHttpServer())
        .get('/privacy/contact')
        .expect(200)
        .expect(mockContactInfo);
    });
  });
});
