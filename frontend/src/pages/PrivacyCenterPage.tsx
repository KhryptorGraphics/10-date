import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Tabs, Tab, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DataAccessPanel from '../components/privacy/DataAccessPanel';
import ConsentManagementPanel from '../components/privacy/ConsentManagementPanel';
import AccountManagementPanel from '../components/privacy/AccountManagementPanel';
import PrivacyInformationPanel from '../components/privacy/PrivacyInformationPanel';

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
      id={`privacy-tabpanel-${index}`}
      aria-labelledby={`privacy-tab-${index}`}
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
    id: `privacy-tab-${index}`,
    'aria-controls': `privacy-tabpanel-${index}`,
  };
}

/**
 * Privacy Center Page
 * Central hub for all privacy-related features
 */
const PrivacyCenterPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Center
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage your privacy settings, data access, and account preferences
        </Typography>

        <Paper sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="privacy center tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Data Access & Export" {...a11yProps(0)} />
              <Tab label="Consent Management" {...a11yProps(1)} />
              <Tab label="Account Management" {...a11yProps(2)} />
              <Tab label="Privacy Information" {...a11yProps(3)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <DataAccessPanel />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ConsentManagementPanel />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <AccountManagementPanel />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <PrivacyInformationPanel />
          </TabPanel>
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate(-1)}
          >
            Back to Profile
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PrivacyCenterPage;