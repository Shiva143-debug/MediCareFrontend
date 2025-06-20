import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { AuthContext } from '@/contexts/AuthContext';

// Mock the auth context
const mockAuthContext = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
};

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('LoginForm', () => {
  const onToggleForm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm onToggleForm={onToggleForm} />
      </AuthContext.Provider>
    );

    // Check if form elements are rendered
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('calls login function with correct values on form submission', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm onToggleForm={onToggleForm} />
      </AuthContext.Provider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check if login function was called with correct values
    await waitFor(() => {
      expect(mockAuthContext.login).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('shows loading state when logging in', () => {
    const loadingContext = {
      ...mockAuthContext,
      loading: true,
    };

    render(
      <AuthContext.Provider value={loadingContext}>
        <LoginForm onToggleForm={onToggleForm} />
      </AuthContext.Provider>
    );

    // Check if loading state is shown
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });

  it('calls onToggleForm when register link is clicked', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm onToggleForm={onToggleForm} />
      </AuthContext.Provider>
    );

    // Click the register link
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check if onToggleForm was called
    expect(onToggleForm).toHaveBeenCalledTimes(1);
  });
});