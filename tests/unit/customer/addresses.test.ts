import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/utils/db';
import { GET, POST } from '@/app/api/customer/addresses/route';
import { PUT, DELETE } from '@/app/api/customer/addresses/[id]/route';
import * as nextAuth from 'next-auth/next';

vi.mock('@/utils/db', () => ({
  default: {
    address: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Customer Addresses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns addresses for the authenticated customer', async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue({
      user: { id: 'cust_123', email: 'cust@example.com' },
    } as any);

    const mockAddresses = [
      { id: 'addr_1', userId: 'cust_123', line1: '123 Luxury Lane', isDefault: true },
    ];
    vi.mocked(prisma.address.findMany).mockResolvedValue(mockAddresses as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.addresses).toHaveLength(1);
    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: { userId: 'cust_123' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('validates required fields on address creation', async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue({
      user: { id: 'cust_123', email: 'cust@example.com' },
    } as any);

    const req = new Request('http://localhost:3000/api/customer/addresses', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Aarav' }), // Missing lastName, phone, line1, etc
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('Required address fields are missing');
  });

  it('prevents modifying an address belonging to another customer', async () => {
    vi.mocked(nextAuth.getServerSession).mockResolvedValue({
      user: { id: 'attacker_user', email: 'attacker@example.com' },
    } as any);

    // Existing address belongs to victim_user
    vi.mocked(prisma.address.findUnique).mockResolvedValue({
      id: 'addr_victim',
      userId: 'victim_user',
    } as any);

    const req = new Request('http://localhost:3000/api/customer/addresses/addr_victim', {
      method: 'PUT',
      body: JSON.stringify({ line1: 'Hacked Address' }),
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'addr_victim' }) });
    expect(res.status).toBe(404);
  });
});
