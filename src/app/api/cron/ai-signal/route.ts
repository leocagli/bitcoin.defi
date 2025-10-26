import { NextResponse } from 'next/server';

import { generateAndPersistSignal } from '@/lib/ai-signal-store';

const SUPPORTED_ASSETS: Array<'BTC' | 'ETH'> = ['BTC', 'ETH'];

const isAuthorizedCronRequest = (request: Request): boolean => {
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader) {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  if (token && token === secret) {
    return true;
  }
  if (authHeader && authHeader === `Bearer ${secret}`) {
    return true;
  }
  return false;
};

export const runtime = 'nodejs';

export const GET = async (request: Request) => {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = [];
  for (const asset of SUPPORTED_ASSETS) {
    try {
      const snapshot = await generateAndPersistSignal(asset);
      results.push({
        asset,
        timestamp: snapshot.timestamp,
        signal: snapshot.signal,
        finalWBalanceado: snapshot.finalWBalanceado,
      });
    } catch (error) {
      results.push({ asset, error: (error as Error).message });
    }
  }

  return NextResponse.json({
    status: 'ok',
    generated: results,
  });
};
