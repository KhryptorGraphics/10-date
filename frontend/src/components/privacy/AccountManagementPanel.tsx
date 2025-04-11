import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  Checkbox,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import {
  DeleteForever as DeleteIcon,
  PersonOff as AnonymizeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

// Deletion options
interface DeletionOptions {
  anonymize: boolean;
  deleteMessages: boolean;
  deleteMatches: boolean;
  deletePayments: boolean;
  deleteConsent: boolean;
  reason: string;
  feedback: string;
  confirmEmail: string;
}

// Deletion reasons
enum DeletionReason {
  NOT_USEFUL = 'not_useful',
  FOUND_PARTNER = 'found_partner',
  PRIVACY_CONCERNS = 'privacy_concerns',
  TOO_MANY_EMAILS = 'too_many_emails',
  TAKING_BREAK = 'taking_break',
  OTHER = 'other',
}

/**
 * Account Management Panel Component
 * Allows users to delete or anonymize their account
 */
const AccountManagementPanel: React.FC = () => {
  // State for deletion options
  const [deletionOptions, setDeletionOptions] = useState<DeletionOptions>({
    anonymize: true,
    deleteMessages: true,
    deleteMatches: true,
    deletePayments: true,
    deleteConsent: true,
    reason: DeletionReason.PRIVACY_CONCERNS,
    feedback: '',
    confirmEmail: '',
  });
  
  // State for deletion dialog
  const [deletionDialogOpen, setDeletionDialogOpen] = useState<boolean>(false);
  
  // State for deletion confirmation dialog
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState<boolean>(false);
  
  // State for deletion process
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(''); // This would be fetched from user context
  
  // Deletion steps
  const steps = ['Review Options', 'Confirm Decision', 'Provide Feedback'];

  // Handle option change
  const handleOptionChange = (option: keyof DeletionOptions) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDeletionOptions({
      ...deletionOptions,
      [option]: event.target.checked,
    });
  };

  // Handle reason change
  const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeletionOptions({
      ...deletionOptions,
      reason: event.target.value as DeletionReason,
    });
  };

  // Handle feedback change
  const handleFeedbackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeletionOptions({
      ...deletionOptions,
      feedback: event.target.value,
    });
  };

  // Handle email confirmation change
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDeletionOptions({
      ...deletionOptions,
      confirmEmail: event.target.value,
    });
  };

  // Open deletion dialog
  const openDeletionDialog = () => {
    // In a real app, we would fetch the user's email here
    setUserEmail('user@example.com');
    setDeletionDialogOpen(true);
  };

  // Close deletion dialog
  const closeDeletionDialog = () => {
    setDeletionDialogOpen(false);
    setActiveStep(0);
    setError(null);
  };

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Open confirmation dialog
  const openConfirmationDialog = () => {
    setConfirmationDialogOpen(true);
  };

  // Close confirmation dialog
  const closeConfirmationDialog = () => {
    setConfirmationDialogOpen(false);
  };

  // Submit deletion request
  const submitDeletionRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to delete or anonymize account
      await axios.post('/api/user/data/delete', {
        anonymize: deletionOptions.anonymize,
        deleteMessages: deletionOptions.deleteMessages,
        deleteMatches: deletionOptions.deleteMatches,
        deletePayments: deletionOptions.deletePayments,
        deleteConsent: deletionOptions.deleteConsent,
        reason: deletionOptions.reason,
        feedback: deletionOptions.feedback,
      });
      
      // Close dialogs
      setConfirmationDialogOpen(false);
      
      // Move to final step
      setActiveStep(steps.length);
    } catch (err) {
      setError('Failed to process your request. Please try again later or contact support.');
      console.error('Error processing deletion request:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get reason display text
  const getReasonDisplayText = (reason: DeletionReason) => {
    switch (reason) {
      case DeletionReason.NOT_USEFUL:
        return 'I don\'t find the service useful';
      case DeletionReason.FOUND_PARTNER:
        return 'I found a partner';
      case DeletionReason.PRIVACY_CONCERNS:
        return 'I have privacy concerns';
      case DeletionReason.TOO_MANY_EMAILS:
        return 'I receive too many emails';
      case DeletionReason.TAKING_BREAK:
        return 'I\'m taking a break from dating';
      case DeletionReason.OTHER:
        return 'Other reason';
      default:
        return reason;
    }
  };

  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Choose how you want to manage your account:
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={deletionOptions.anonymize ? 'anonymize' : 'delete'}
                onChange={(e) => setDeletionOptions({
                  ...deletionOptions,
                  anonymize: e.target.value === 'anonymize',
                })}
              >
                <FormControlLabel
                  value="anonymize"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">
                        Anonymize my account
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your personal information will be anonymized, but your activity data will be retained.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="delete"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">
                        Permanently delete my account
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your account and all associated data will be permanently deleted.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            
            <Typography variant="subtitle1" gutterBottom>
              Select what data to {deletionOptions.anonymize ? 'anonymize' : 'delete'}:
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deletionOptions.deleteMessages}
                    onChange={handleOptionChange('deleteMessages')}
                  />
                }
                label="Messages"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deletionOptions.deleteMatches}
                    onChange={handleOptionChange('deleteMatches')}
                  />
                }
                label="Matches"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deletionOptions.deletePayments}
                    onChange={handleOptionChange('deletePayments')}
                  />
                }
                label="Payment History"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deletionOptions.deleteConsent}
                    onChange={handleOptionChange('deleteConsent')}
                  />
                }
                label="Consent Preferences"
              />
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle1">
                This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                {deletionOptions.anonymize
                  ? 'Your personal information will be anonymized and you will no longer be able to access your account.'
                  : 'Your account and all selected data will be permanently deleted and cannot be recovered.'}
              </Typography>
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Please tell us why you're leaving:
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <RadioGroup
                value={deletionOptions.reason}
                onChange={handleReasonChange}
              >
                {Object.values(DeletionReason).map((reason) => (
                  <FormControlLabel
                    key={reason}
                    value={reason}
                    control={<Radio />}
                    label={getReasonDisplayText(reason)}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            
            <Typography variant="subtitle1" gutterBottom>
              To confirm, please enter your email address:
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              value={deletionOptions.confirmEmail}
              onChange={handleEmailChange}
              placeholder={userEmail}
              helperText={
                deletionOptions.confirmEmail && deletionOptions.confirmEmail !== userEmail
                  ? 'Email does not match your account email'
                  : ''
              }
              error={deletionOptions.confirmEmail !== '' && deletionOptions.confirmEmail !== userEmail}
              sx={{ mb: 3 }}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              We're sorry to see you go. Please share any feedback to help us improve:
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={deletionOptions.feedback}
              onChange={handleFeedbackChange}
              placeholder="Your feedback is valuable to us..."
              sx={{ mb: 3 }}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              {deletionOptions.anonymize
                ? 'Your account has been anonymized'
                : 'Your account has been scheduled for deletion'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {deletionOptions.anonymize
                ? 'Your personal information has been anonymized. You will no longer be able to access your account.'
                : 'Your account and all selected data will be permanently deleted within 30 days.'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Thank you for being a part of our community. We wish you all the best!
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Account Management
      </Typography>
      
      <Typography variant="body1" paragraph>
        Manage your account settings, including options to delete or anonymize your account.
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Delete or Anonymize Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            You can choose to anonymize your account, which will remove your personal information but keep your activity data, or permanently delete your account and all associated data.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AnonymizeIcon />}
              onClick={openDeletionDialog}
            >
              Manage Account Data
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Deletion Dialog */}
      <Dialog
        open={deletionDialogOpen}
        onClose={closeDeletionDialog}
        aria-labelledby="account-deletion-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="account-deletion-dialog-title">
          {deletionOptions.anonymize ? 'Anonymize Account' : 'Delete Account'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          {activeStep === steps.length ? (
            <Button onClick={closeDeletionDialog} color="primary">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={closeDeletionDialog} color="inherit">
                Cancel
              </Button>
              {activeStep > 0 && (
                <Button onClick={handleBack} color="inherit">
                  Back
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  color="primary"
                  variant="contained"
                  disabled={
                    activeStep === 1 &&
                    (deletionOptions.confirmEmail !== userEmail || !deletionOptions.reason)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={openConfirmationDialog}
                  color="error"
                  variant="contained"
                  startIcon={<DeleteIcon />}
                >
                  {deletionOptions.anonymize ? 'Anonymize Account' : 'Delete Account'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialogOpen}
        onClose={closeConfirmationDialog}
        aria-labelledby="account-confirmation-dialog-title"
      >
        <DialogTitle id="account-confirmation-dialog-title">
          {deletionOptions.anonymize ? 'Confirm Anonymization' : 'Confirm Deletion'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deletionOptions.anonymize
              ? 'Are you absolutely sure you want to anonymize your account? This action cannot be undone.'
              : 'Are you absolutely sure you want to delete your account? This action cannot be undone.'}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            {deletionOptions.anonymize
              ? 'Your personal information will be anonymized and you will no longer be able to access your account.'
              : 'Your account and all selected data will be permanently deleted.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmationDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={submitDeletionRequest}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletionOptions.anonymize ? 'Anonymize Now' : 'Delete Now'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Note: Account deletion is permanent and cannot be undone. All your personal data will be removed from our systems.
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          If you have an active subscription, it will be canceled automatically when your account is deleted.
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountManagementPanel;