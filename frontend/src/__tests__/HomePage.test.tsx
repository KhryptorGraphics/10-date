import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HomePage from '../pages/HomePage';
import { AuthProvider } from '../contexts/AuthContext';

const theme = createTheme();

const MockedHomePage = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock the useAuth hook to return a logged-in user
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: '1', name: 'Test User', email: 'test@example.com', isVerified: true },
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

describe('HomePage', () => {
  it('renders welcome message with user name', () => {
    render(<MockedHomePage />);
    
    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
  });

  it('renders all feature cards', () => {
    render(<MockedHomePage />);
    
    expect(screen.getByText('Discover Matches')).toBeInTheDocument();
    expect(screen.getByText('Chat & Connect')).toBeInTheDocument();
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Privacy Center')).toBeInTheDocument();
    expect(screen.getByText('Premium Features')).toBeInTheDocument();
  });

  it('renders action buttons for each feature', () => {
    render(<MockedHomePage />);
    
    expect(screen.getByText('Start Matching')).toBeInTheDocument();
    expect(screen.getByText('View Chats')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Go Premium')).toBeInTheDocument();
  });
});