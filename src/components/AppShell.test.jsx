import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppShell from './AppShell';

const logout = vi.fn();

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({
    isAdmin: false,
    logout,
    user: { username: 'operator' },
  }),
}));

vi.mock('../Dashboard', () => ({ default: () => <div>Dashboard</div> }));
vi.mock('../Runes', () => ({ default: () => <div>Runes</div> }));
vi.mock('../scrolls', () => ({ default: () => <div>Scrolls</div> }));
vi.mock('../Tags', () => ({ default: () => <div>Tags</div> }));
vi.mock('../Users', () => ({ default: () => <div>Users</div> }));

describe('AppShell documentation links', () => {
  beforeEach(() => {
    logout.mockReset();
  });

  it('keeps project documentation separate from API documentation', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Project docs' })).toHaveAttribute(
      'href',
      '/readthedocs/',
    );
    expect(screen.getByRole('link', { name: 'API docs' })).toHaveAttribute(
      'href',
      '/api/docs',
    );
  });
});
