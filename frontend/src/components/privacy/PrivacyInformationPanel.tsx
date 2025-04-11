import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Description as DocumentIcon,
  Security as SecurityIcon,
  Gavel as LegalIcon,
  Help as HelpIcon,
  ContactSupport as SupportIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`privacy-info-tabpanel-${index}`}
      aria-labelledby={`privacy-info-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `privacy-info-tab-${index}`,
    'aria-controls': `privacy-info-tabpanel-${index}`,
  };
}

/**
 * Privacy Information Panel Component
 * Provides educational content about privacy policies and data handling
 */
const PrivacyInformationPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle FAQ accordion change
  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // FAQ data
  const faqItems = [
    {
      id: 'faq1',
      question: 'What personal data do you collect?',
      answer: 'We collect various types of personal data, including your profile information, photos, location data, device information, and usage data. For a complete list, please refer to our Privacy Policy.',
      category: 'data',
    },
    {
      id: 'faq2',
      question: 'How is my data used?',
      answer: 'Your data is used to provide and improve our services, match you with potential partners, personalize your experience, and communicate with you. We may also use your data for analytics, research, and marketing purposes, subject to your consent preferences.',
      category: 'data',
    },
    {
      id: 'faq3',
      question: 'How can I export my data?',
      answer: 'You can export your data from the Data Access & Export section of the Privacy Center. You can select which categories of data to export and choose from various formats, including JSON, CSV, and PDF.',
      category: 'rights',
    },
    {
      id: 'faq4',
      question: 'How do I delete my account?',
      answer: 'You can delete your account from the Account Management section of the Privacy Center. You can choose to either anonymize your account or permanently delete it, along with all associated data.',
      category: 'rights',
    },
    {
      id: 'faq5',
      question: 'What are my rights under GDPR?',
      answer: 'Under the GDPR, you have several rights, including the right to access your data, the right to rectification, the right to erasure, the right to restrict processing, the right to data portability, and the right to object to processing. You can exercise these rights through the Privacy Center.',
      category: 'rights',
    },
    {
      id: 'faq6',
      question: 'How is my data protected?',
      answer: 'We implement various security measures to protect your data, including encryption, access controls, regular security audits, and employee training. We also have a data breach response plan in place to address any security incidents.',
      category: 'security',
    },
    {
      id: 'faq7',
      question: 'Do you share my data with third parties?',
      answer: 'We may share your data with third-party service providers who help us operate our services, such as cloud hosting providers, payment processors, and analytics services. We may also share your data with other users as part of the core functionality of our service. We do not sell your personal data to advertisers or other third parties without your consent.',
      category: 'data',
    },
    {
      id: 'faq8',
      question: 'How long do you keep my data?',
      answer: 'We retain your data for as long as your account is active or as needed to provide you with our services. If you delete your account, we will delete or anonymize your data within 30 days, except where we are required to retain it for legal purposes.',
      category: 'data',
    },
    {
      id: 'faq9',
      question: 'What are cookies and how do you use them?',
      answer: 'Cookies are small text files that are stored on your device when you visit our website. We use cookies to remember your preferences, understand how you use our service, and personalize your experience. You can manage your cookie preferences through your browser settings.',
      category: 'technical',
    },
    {
      id: 'faq10',
      question: 'How can I contact your Data Protection Officer?',
      answer: 'You can contact our Data Protection Officer by email at dpo@10date.com or by mail at our company address. Please include "Data Protection Officer" in the subject line.',
      category: 'contact',
    },
  ];

  // Filter FAQ items based on search query
  const filteredFaqItems = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Privacy Information
      </Typography>
      
      <Typography variant="body1" paragraph>
        Learn about our privacy practices, your rights, and how we protect your data.
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="privacy information tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Privacy Policy" icon={<DocumentIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Your Rights" icon={<LegalIcon />} iconPosition="start" {...a11yProps(1)} />
            <Tab label="FAQ" icon={<HelpIcon />} iconPosition="start" {...a11yProps(2)} />
            <Tab label="Support" icon={<SupportIcon />} iconPosition="start" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Privacy Policy
          </Typography>
          
          <Typography variant="body2" paragraph>
            Last updated: April 1, 2025
          </Typography>
          
          <Typography variant="body1" paragraph>
            This Privacy Policy describes how 10-Date ("we", "us", or "our") collects, uses, and shares your personal information when you use our website and mobile application (collectively, the "Service").
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            1. Information We Collect
          </Typography>
          
          <Typography variant="body1" paragraph>
            We collect several types of information from and about users of our Service, including:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Personal Information"
                secondary="Such as your name, email address, phone number, date of birth, gender, sexual orientation, and photos."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Profile Information"
                secondary="Such as your interests, preferences, and other information you provide to enhance your profile."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Usage Data"
                secondary="Information about how you use our Service, including your browsing patterns, feature usage, and interactions with other users."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Device Information"
                secondary="Such as your IP address, device type, operating system, and browser type."
              />
            </ListItem>
          </List>
          
          <Typography variant="subtitle1" gutterBottom>
            2. How We Use Your Information
          </Typography>
          
          <Typography variant="body1" paragraph>
            We use the information we collect to:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Provide and improve our Service"
                secondary="Including matching you with potential partners and personalizing your experience."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Communicate with you"
                secondary="Including sending service-related notifications and marketing communications (subject to your consent)."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Ensure security and prevent fraud"
                secondary="Including verifying accounts and monitoring for suspicious activity."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Comply with legal obligations"
                secondary="Including responding to legal requests and enforcing our terms of service."
              />
            </ListItem>
          </List>
          
          <Typography variant="body1" paragraph>
            For a complete description of our privacy practices, please read our full{' '}
            <Link href="#" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Your Privacy Rights
          </Typography>
          
          <Typography variant="body1" paragraph>
            Depending on your location, you may have certain rights regarding your personal information. These may include:
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Access
              </Typography>
              <Typography variant="body2">
                You have the right to access the personal information we hold about you. You can export your data from the Data Access & Export section of the Privacy Center.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Rectification
              </Typography>
              <Typography variant="body2">
                You have the right to correct any inaccurate or incomplete personal information we hold about you. You can update your profile information from your account settings.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Erasure
              </Typography>
              <Typography variant="body2">
                You have the right to request the deletion of your personal information. You can delete your account from the Account Management section of the Privacy Center.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Restrict Processing
              </Typography>
              <Typography variant="body2">
                You have the right to request that we restrict the processing of your personal information under certain circumstances. You can manage your consent preferences from the Consent Management section of the Privacy Center.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Data Portability
              </Typography>
              <Typography variant="body2">
                You have the right to receive your personal information in a structured, commonly used, and machine-readable format. You can export your data in various formats from the Data Access & Export section of the Privacy Center.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Right to Object
              </Typography>
              <Typography variant="body2">
                You have the right to object to the processing of your personal information under certain circumstances. You can manage your consent preferences from the Consent Management section of the Privacy Center.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                  >
                    <HelpIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {filteredFaqItems.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ my: 4 }}>
              No results found for "{searchQuery}". Try a different search term.
            </Typography>
          ) : (
            filteredFaqItems.map((item) => (
              <Accordion
                key={item.id}
                expanded={expandedFaq === item.id}
                onChange={handleAccordionChange(item.id)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${item.id}-content`}
                  id={`${item.id}-header`}
                >
                  <Typography variant="subtitle1">{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1">{item.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Privacy Support
          </Typography>
          
          <Typography variant="body1" paragraph>
            If you have any questions or concerns about our privacy practices or your personal information, please contact us:
          </Typography>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Data Protection Officer
              </Typography>
              <Typography variant="body2" paragraph>
                Email: dpo@10date.com
              </Typography>
              <Typography variant="body2" paragraph>
                Mail: 10-Date Data Protection Officer<br />
                123 Privacy Street<br />
                San Francisco, CA 94105<br />
                United States
              </Typography>
              <Button variant="outlined" color="primary" href="mailto:dpo@10date.com">
                Contact DPO
              </Button>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Privacy Support Team
              </Typography>
              <Typography variant="body2" paragraph>
                For general privacy inquiries, you can contact our Privacy Support Team:
              </Typography>
              <Typography variant="body2" paragraph>
                Email: privacy@10date.com
              </Typography>
              <Button variant="outlined" color="primary" href="mailto:privacy@10date.com">
                Contact Privacy Support
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Supervisory Authority
              </Typography>
              <Typography variant="body2" paragraph>
                If you are located in the European Economic Area, you have the right to lodge a complaint with your local data protection authority if you believe that we have violated your privacy rights.
              </Typography>
              <Button variant="outlined" color="primary" href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer">
                Find Your DPA
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Note: This information is provided for educational purposes and does not constitute legal advice.
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Our Privacy Policy and practices may change over time. We will notify you of any material changes.
        </Typography>
      </Box>
    </Box>
  );
};

export default PrivacyInformationPanel;