import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthProvider';

describe('AuthScreen', () => {
  it('offers a working retry action after configuration fails', () => {
    const onLogin = vi.fn();
    const onRetry = vi.fn();

    render(
      <AuthScreen
        error="Network Error"
        loading={false}
        onLogin={onLogin}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));

    expect(onRetry).toHaveBeenCalledOnce();
    expect(onLogin).not.toHaveBeenCalled();
  });
});
