import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

// Consent types
enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY = 'third_party',
  PROFILING = 'profiling',
  COMMUNICATIONS = 'communications',
  LOCATION = 'location',
  BIOMETRIC = 'biometric',
}

// Consent preference interface
interface ConsentPreference {
  id: string;
  consentType: ConsentType;
  status: boolean;
  description?: string;
  policyVersion?: string;
  createdAt: string;
  updatedAt: string;
}

// Consent history interface
interface ConsentHistory {
  id: string;
  consentType: ConsentType;
  status: boolean;
  policyVersion?: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

/**
 * Consent Management Panel Component
 * Allows users to manage their consent preferences
 */
const ConsentManagementPanel: React.FC = () => {
  // State for consent preferences
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreference[]>([]);
  
  // State for consent history
  const [consentHistory, setConsentHistory] = useState<ConsentHistory[]>([]);
  
  // State for history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [selectedConsentType, setSelectedConsentType] = useState<ConsentType | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [pendingConsentChange, setPendingConsentChange] = useState<{
    consentType: ConsentType;
    newStatus: boolean;
  } | null>(null);

  // Fetch consent preferences on component mount
  useEffect(() => {
    fetchConsentPreferences();
  }, []);

  // Fetch consent preferences from API
  const fetchConsentPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/user/consent');
      setConsentPreferences(response.data);
    } catch (err) {
      setError('Failed to fetch consent preferences. Please try again later.');
      console.error('Error fetching consent preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle consent toggle
  const handleConsentToggle = (consentType: ConsentType, currentStatus: boolean) => {
    // Set pending consent change and open confirmation dialog
    setPendingConsentChange({
      consentType,
      newStatus: !currentStatus,
    });
    setConfirmDialogOpen(true);
  };

  // Confirm consent change
  const confirmConsentChange = async () => {
    if (!pendingConsentChange) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { consentType, newStatus } = pendingConsentChange;
      
      // Update consent preference
      const response = await axios.put(`/api/user/consent/${consentType}`, {
        status: newStatus,
        notes: `User ${newStatus ? 'granted' : 'revoked'} consent via Privacy Center`,
      });
      
      // Update local state
      setConsentPreferences(prevPreferences => 
        prevPreferences.map(pref => 
          pref.consentType === consentType ? response.data : pref
        )
      );
      
      // Close confirmation dialog
      setConfirmDialogOpen(false);
      setPendingConsentChange(null);
    } catch (err) {
      setError('Failed to update consent preference. Please try again later.');
      console.error('Error updating consent preference:', err);
      
      // Close confirmation dialog
      setConfirmDialogOpen(false);
      setPendingConsentChange(null);
    } finally {
      setLoading(false);
    }
  };

  // Cancel consent change
  const cancelConsentChange = () => {
    setConfirmDialogOpen(false);
    setPendingConsentChange(null);
  };

  // Open history dialog
  const openHistoryDialog = async (consentType: ConsentType) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch consent history for the selected type
      const response = await axios.get(`/api/user/consent/history/${consentType}`);
      setConsentHistory(response.data);
      
      // Set selected consent type and open dialog
      setSelectedConsentType(consentType);
      setHistoryDialogOpen(true);
    } catch (err) {
      setError('Failed to fetch consent history. Please try again later.');
      console.error('Error fetching consent history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close history dialog
  const closeHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedConsentType(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get consent type display name
  const getConsentTypeDisplayName = (consentType: ConsentType) => {
    switch (consentType) {
      case ConsentType.MARKETING:
        return 'Marketing Communications';
      case ConsentType.ANALYTICS:
        return 'Analytics & Usage Data';
      case ConsentType.THIRD_PARTY:
        return 'Third-Party Data Sharing';
      case ConsentType.PROFILING:
        return 'Profiling & Personalization';
      case ConsentType.COMMUNICATIONS:
        return 'Service Communications';
      case ConsentType.LOCATION:
        return 'Location Data';
      case ConsentType.BIOMETRIC:
        return 'Biometric Data';
      default:
        return consentType;
    }
  };

  // Get consent type description
  const getConsentTypeDescription = (consentType: ConsentType) => {
    switch (consentType) {
      case ConsentType.MARKETING:
        return 'Allow us to send you marketing communications, including promotions, special offers, and newsletters.';
      case ConsentType.ANALYTICS:
        return 'Allow us to collect and analyze data about how you use our service to improve user experience.';
      case ConsentType.THIRD_PARTY:
        return 'Allow us to share your data with trusted third-party partners for marketing and service improvement.';
      case ConsentType.PROFILING:
        return 'Allow us to create a profile of your preferences and interests to personalize your experience.';
      case ConsentType.COMMUNICATIONS:
        return 'Allow us to send you important service communications, such as security alerts and account updates.';
      case ConsentType.LOCATION:
        return 'Allow us to collect and process your location data to provide location-based features.';
      case ConsentType.BIOMETRIC:
        return 'Allow us to collect and process biometric data for identity verification and security purposes.';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Consent Management
      </Typography>
      
      <Typography variant="body1" paragraph>
        Manage your privacy preferences and consent settings. You can control how your data is used and processed.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading && !error && !historyDialogOpen && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && consentPreferences.length === 0 ? (
        <Alert severity="info">
          No consent preferences found. Please contact support if you believe this is an error.
        </Alert>
      ) : (
        <Box>
          {Object.values(ConsentType).map((consentType) => {
            const preference = consentPreferences.find(pref => pref.consentType === consentType);
            
            return (
              <Accordion key={consentType} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`consent-${consentType}-content`}
                  id={`consent-${consentType}-header`}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography>{getConsentTypeDisplayName(consentType)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preference?.status || false}
                            onChange={() => handleConsentToggle(consentType, preference?.status || false)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={loading}
                          />
                        }
                        label={preference?.status ? 'Enabled' : 'Disabled'}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Tooltip title="View History">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistoryDialog(consentType);
                          }}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {getConsentTypeDescription(consentType)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <InfoIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {preference ? formatDate(preference.updatedAt) : 'Never'}
                    </Typography>
                  </Box>
                  
                  {preference?.policyVersion && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Policy version: {preference.policyVersion}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={cancelConsentChange}
        aria-labelledby="consent-confirmation-dialog-title"
      >
        <DialogTitle id="consent-confirmation-dialog-title">
          Confirm Consent Change
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingConsentChange?.newStatus
              ? `Are you sure you want to enable consent for ${getConsentTypeDisplayName(pendingConsentChange?.consentType || ConsentType.MARKETING)}?`
              : `Are you sure you want to disable consent for ${getConsentTypeDisplayName(pendingConsentChange?.consentType || ConsentType.MARKETING)}?`}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            {pendingConsentChange?.newStatus
              ? 'By enabling this consent, you allow us to process your data as described.'
              : 'By disabling this consent, you withdraw your permission for us to process your data as described.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelConsentChange} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmConsentChange} color="primary" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={closeHistoryDialog}
        aria-labelledby="consent-history-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="consent-history-dialog-title">
          Consent History - {selectedConsentType && getConsentTypeDisplayName(selectedConsentType)}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : consentHistory.length === 0 ? (
            <Alert severity="info">
              No history found for this consent type.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Policy Version</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consentHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{formatDate(history.changedAt)}</TableCell>
                      <TableCell>
                        {history.status ? 'Enabled' : 'Disabled'}
                      </TableCell>
                      <TableCell>{history.policyVersion || 'N/A'}</TableCell>
                      <TableCell>{history.notes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHistoryDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Note: Some consents may be required for the service to function properly. These cannot be disabled.
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Changes to your consent preferences may take up to 24 hours to fully propagate through our systems.
        </Typography>
      </Box>
    </Box>
  );
};

export default ConsentManagementPanel;