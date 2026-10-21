import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import * as nextAuthReact from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

describe('useSessionTimeout Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does NOT trigger signOut for standard customer sessions even after 15 minutes of inactivity', () => {
    // Standard customer session
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: {
        user: { id: 'user_123', email: 'customer@example.com', role: 'customer' },
        expires: '2026-11-20T00:00:00.000Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    renderHook(() => useSessionTimeout());

    // Fast forward 16 minutes (exceeds 15m threshold)
    vi.advanceTimersByTime(16 * 60 * 1000);

    // Assert that customer was NOT signed out
    expect(nextAuthReact.signOut).not.toHaveBeenCalled();
  });

  it('triggers signOut for admin sessions after 15 minutes of inactivity', () => {
    // Admin session
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: {
        user: { id: 'admin_123', email: 'admin@vamikajewels.com', role: 'admin' },
        expires: '2026-11-20T00:00:00.000Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    renderHook(() => useSessionTimeout());

    // Before 15 minutes, should not be signed out
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(nextAuthReact.signOut).not.toHaveBeenCalled();

    // After reaching 15 minutes, should trigger signOut
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(nextAuthReact.signOut).toHaveBeenCalledWith({
      callbackUrl: '/login?expired=true',
      redirect: true,
    });
  });

  it('resets admin timer when user activity occurs', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: {
        user: { id: 'admin_123', email: 'admin@vamikajewels.com', role: 'admin' },
        expires: '2026-11-20T00:00:00.000Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    renderHook(() => useSessionTimeout());

    // Advance 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000);

    // Simulate user activity event
    document.dispatchEvent(new MouseEvent('click'));

    // Advance another 10 minutes (total 20 mins elapsed, but only 10 mins since reset)
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(nextAuthReact.signOut).not.toHaveBeenCalled();

    // Advance final 5 minutes past new reset
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(nextAuthReact.signOut).toHaveBeenCalledTimes(1);
  });
});
