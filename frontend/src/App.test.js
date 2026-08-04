import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

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
    check: jest.fn().mockResolvedValue({ data: { status: 'ok', database: 'ok', uptime: 1000, version: '1.0.0' } }),
  },
  default: {},
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('отображает страницу входа без авторизации', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });

  it('показывает ссылку на регистрацию', () => {
    render(<App />);
    expect(screen.getByText(/Создать/i)).toBeInTheDocument();
  });

  it('переключается на страницу регистрации', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Создать/i));
    expect(screen.getByRole('heading', { name: 'Регистрация' })).toBeInTheDocument();
  });

  it('возвращается на страницу входа с регистрации', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Создать/i));
    fireEvent.click(screen.getByText(/^Войти$/i));
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });

  it('отображает панель после входа', async () => {
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
    fireEvent.change(screen.getByPlaceholderText('Ваш пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

    await waitFor(() => {
      expect(screen.getByText(/С возвращением/i)).toBeInTheDocument();
    });
  });

  it('показывает ошибку при неудачном входе', async () => {
    const { authAPI } = require('./utils/api');
    authAPI.login.mockRejectedValueOnce({
      response: { data: { error: 'Неверный email или пароль' } },
    });

    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'bad@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ваш пароль'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Неверный email или пароль')).toBeInTheDocument();
    });
  });
});
