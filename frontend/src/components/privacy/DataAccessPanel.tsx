import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  CircularProgress, 
  Alert, 
  Divider, 
  Grid, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useEncryption } from '../../hooks/useEncryption';
import axios from 'axios';

// Data categories for export
enum DataCategory {
  PROFILE = 'profile',
  PREFERENCES = 'preferences',
  MATCHES = 'matches',
  MESSAGES = 'messages',
  PAYMENTS = 'payments',
  SUBSCRIPTIONS = 'subscriptions',
  ACTIVITY = 'activity',
  CONSENT = 'consent',
}

// Export formats
enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XML = 'xml',
}

// Export request status
enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Export request interface
interface ExportRequest {
  id: string;
  status: ExportStatus;
  format: ExportFormat;
  categories: Record<DataCategory, boolean>;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  progress: number;
}

/**
 * Data Access Panel Component
 * Allows users to view and export their personal data
 */
const DataAccessPanel: React.FC = () => {
  // State for selected data categories
  const [selectedCategories, setSelectedCategories] = useState<Record<DataCategory, boolean>>({
    [DataCategory.PROFILE]: true,
    [DataCategory.PREFERENCES]: true,
    [DataCategory.MATCHES]: true,
    [DataCategory.MESSAGES]: true,
    [DataCategory.PAYMENTS]: true,
    [DataCategory.SUBSCRIPTIONS]: true,
    [DataCategory.ACTIVITY]: true,
    [DataCategory.CONSENT]: true,
  });

  // State for export format
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.JSON);
  
  // State for export requests
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Encryption hook for secure data handling
  const { encryptData, decryptData } = useEncryption();

  // Fetch export requests on component mount
  useEffect(() => {
    fetchExportRequests();
  }, []);

  // Handle category selection change
  const handleCategoryChange = (category: DataCategory) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCategories({
      ...selectedCategories,
      [category]: event.target.checked,
    });
  };

  // Handle export format change
  const handleFormatChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setExportFormat(event.target.value as ExportFormat);
  };

  // Fetch export requests from API
  const fetchExportRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/user/data/export/requests');
      setExportRequests(response.data);
    } catch (err) {
      setError('Failed to fetch export requests. Please try again later.');
      console.error('Error fetching export requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new export request
  const createExportRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if at least one category is selected
      const hasSelectedCategory = Object.values(selectedCategories).some(selected => selected);
      if (!hasSelectedCategory) {
        setError('Please select at least one data category to export.');
        return;
      }
      
      const response = await axios.post('/api/user/data/export/request', {
        categories: selectedCategories,
        format: exportFormat,
      });
      
      // Add the new request to the list
      setExportRequests([response.data, ...exportRequests]);
      
      // Show success message
      alert('Export request created successfully. You will be notified when it is ready for download.');
    } catch (err) {
      setError('Failed to create export request. Please try again later.');
      console.error('Error creating export request:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get status chip color based on export status
  const getStatusColor = (status: ExportStatus) => {
    switch (status) {
      case ExportStatus.COMPLETED:
        return 'success';
      case ExportStatus.PROCESSING:
        return 'info';
      case ExportStatus.PENDING:
        return 'warning';
      case ExportStatus.FAILED:
        return 'error';
      case ExportStatus.EXPIRED:
        return 'default';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Data Access & Export
      </Typography>
      
      <Typography variant="body1" paragraph>
        You can export your personal data in various formats. Select the categories you want to include and the format you prefer.
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Select Data Categories
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.PROFILE]}
                      onChange={handleCategoryChange(DataCategory.PROFILE)}
                    />
                  }
                  label="Profile Information"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.PREFERENCES]}
                      onChange={handleCategoryChange(DataCategory.PREFERENCES)}
                    />
                  }
                  label="Preferences"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.MATCHES]}
                      onChange={handleCategoryChange(DataCategory.MATCHES)}
                    />
                  }
                  label="Matches"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.MESSAGES]}
                      onChange={handleCategoryChange(DataCategory.MESSAGES)}
                    />
                  }
                  label="Messages"
                />
              </FormGroup>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.PAYMENTS]}
                      onChange={handleCategoryChange(DataCategory.PAYMENTS)}
                    />
                  }
                  label="Payment History"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.SUBSCRIPTIONS]}
                      onChange={handleCategoryChange(DataCategory.SUBSCRIPTIONS)}
                    />
                  }
                  label="Subscriptions"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.ACTIVITY]}
                      onChange={handleCategoryChange(DataCategory.ACTIVITY)}
                    />
                  }
                  label="Activity History"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCategories[DataCategory.CONSENT]}
                      onChange={handleCategoryChange(DataCategory.CONSENT)}
                    />
                  }
                  label="Consent Preferences"
                />
              </FormGroup>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="export-format-label">Export Format</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportFormat}
                onChange={handleFormatChange}
                label="Export Format"
              >
                <MenuItem value={ExportFormat.JSON}>JSON</MenuItem>
                <MenuItem value={ExportFormat.CSV}>CSV</MenuItem>
                <MenuItem value={ExportFormat.PDF}>PDF</MenuItem>
                <MenuItem value={ExportFormat.XML}>XML</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={createExportRequest}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              Request Data Export
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">
          Export History
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchExportRequests}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {loading && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && exportRequests.length === 0 ? (
        <Alert severity="info">
          You haven't requested any data exports yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date Requested</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exportRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{request.format.toUpperCase()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} 
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(request.completedAt)}</TableCell>
                  <TableCell>
                    {request.status === ExportStatus.COMPLETED && request.downloadUrl ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        href={request.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                      >
                        {request.status === ExportStatus.FAILED ? 'Failed' : 'Pending'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Note: Data exports may take a few minutes to process. You will be able to download your data once the processing is complete.
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Export files are available for download for 7 days after creation.
        </Typography>
      </Box>
    </Box>
  );
};

export default DataAccessPanel;