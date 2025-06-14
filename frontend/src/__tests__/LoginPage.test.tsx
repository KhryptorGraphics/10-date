import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';

const theme = createTheme();

const MockedLoginPage = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock fetch
global.fetch = vi.fn();

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<MockedLoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockResponse = {
      access_token: 'mock-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', isVerified: true }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<MockedLoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
    });
  });

  it('displays error on failed login', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(<MockedLoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    (fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<MockedLoginPage />);
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});