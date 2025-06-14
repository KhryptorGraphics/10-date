import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
} from '@mui/material';
import {
  Favorite,
  Chat,
  Person,
  Security,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Favorite color="primary" sx={{ fontSize: 40 }} />,
      title: 'Discover Matches',
      description: 'Find compatible people with our AI-powered matching algorithm',
      action: () => navigate('/match'),
      buttonText: 'Start Matching',
    },
    {
      icon: <Chat color="primary" sx={{ fontSize: 40 }} />,
      title: 'Chat & Connect',
      description: 'Start conversations with your matches in a secure environment',
      action: () => navigate('/chat'),
      buttonText: 'View Chats',
    },
    {
      icon: <Person color="primary" sx={{ fontSize: 40 }} />,
      title: 'Your Profile',
      description: 'Customize your profile to attract the right matches',
      action: () => navigate('/profile'),
      buttonText: 'Edit Profile',
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40 }} />,
      title: 'Privacy Center',
      description: 'Control your data and privacy settings with full transparency',
      action: () => navigate('/privacy'),
      buttonText: 'Privacy Settings',
    },
    {
      icon: <Star color="primary" sx={{ fontSize: 40 }} />,
      title: 'Premium Features',
      description: 'Unlock advanced features and boost your dating experience',
      action: () => navigate('/subscribe'),
      buttonText: 'Go Premium',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Ready to find your perfect match? Let's get started.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          🎉 Your Dating Journey Starts Here
        </Typography>
        <Typography variant="body1">
          10-Date uses advanced AI to help you find meaningful connections. 
          Our privacy-first approach ensures your data is always protected while 
          you focus on what matters most - finding love.
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={feature.action}
                  size="large"
                >
                  {feature.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Need Help Getting Started?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Check out our privacy center to understand how we protect your data, 
          or jump right into matching to start meeting people!
        </Typography>
      </Box>
    </Container>
  );
}
