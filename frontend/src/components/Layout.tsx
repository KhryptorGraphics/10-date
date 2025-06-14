import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            10-Date
          </Typography>
          {isAuthenticated && !isAuthPage && (
            <>
              <Button color="inherit" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button color="inherit" onClick={() => navigate('/match')}>
                Discover
              </Button>
              <Button color="inherit" onClick={() => navigate('/chat')}>
                Chat
              </Button>
              <Button color="inherit" onClick={() => navigate('/profile')}>
                Profile
              </Button>
              <Button color="inherit" onClick={() => navigate('/privacy')}>
                Privacy
              </Button>
              <Button color="inherit" onClick={() => navigate('/subscribe')}>
                Premium
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout ({user?.name})
              </Button>
            </>
          )}
          {!isAuthenticated && !isAuthPage && (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
}