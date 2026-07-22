import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API
jest.mock('./utils/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    me: jest.fn(),
  },
  tasksAPI: {
    getAll: jest.fn().mockResolvedValue({ data: { tasks: [], total: 0 } }),
    getStats: jest.fn().mockResolvedValue({ data: { stats: { total: '0', pending: '0', in_progress: '0', done: '0' } } }),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  deploymentsAPI: {
    getAll: jest.fn().mockResolvedValue({ data: { deployments: [] } }),
    create: jest.fn(),
  },
  healthAPI: {
    check: jest.fn().mockResolvedValue({ data: { status: 'ok', uptime: 1000, version: '1.0.0' } }),
  },
  default: {},
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows register link on login page', () => {
    render(<App />);
    expect(screen.getByText(/Create one/i)).toBeInTheDocument();
  });

  it('switches to register page', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Create one/i));
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('switches back to login from register', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Create one/i));
    fireEvent.click(screen.getByText(/Sign in/i));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders dashboard after login', async () => {
    const { authAPI } = require('./utils/api');
    authAPI.login.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
      },
    });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  it('shows error on failed login', async () => {
    const { authAPI } = require('./utils/api');
    authAPI.login.mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Your password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
