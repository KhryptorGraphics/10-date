import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RegisterPage from '../pages/RegisterPage';
import { AuthProvider } from '../contexts/AuthContext';

const theme = createTheme();

const MockedRegisterPage = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock fetch
global.fetch = vi.fn();

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    render(<MockedRegisterPage />);
    
    expect(screen.getByText('Join 10-Date')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    const mockResponse = {
      access_token: 'mock-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User', isVerified: false }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<MockedRegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
      });
    });
  });

  it('displays error on failed registration', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<MockedRegisterPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });
});