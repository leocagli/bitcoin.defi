import type {
  BacktestResponse,
  CurrentAiSignalResponse,
  HistoryResponse,
} from '@/types/ai-api';

const API_TIMEOUT = 10_000;

const fetchWithTimeout = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchCurrentAiSignal = (asset: string): Promise<CurrentAiSignalResponse> =>
  fetchWithTimeout<CurrentAiSignalResponse>(
    `/api/ai-signal/current?asset=${encodeURIComponent(asset)}`,
  );

export const fetchAiSignalHistory = (
  asset: string,
  from?: string,
  to?: string,
): Promise<HistoryResponse> => {
  const params = new URLSearchParams({ asset });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return fetchWithTimeout<HistoryResponse>(`/api/ai-signal/history?${params.toString()}`);
};

export const fetchAiSignalBacktest = (asset: string): Promise<BacktestResponse> =>
  fetchWithTimeout<BacktestResponse>(
    `/api/ai-signal/backtest?asset=${encodeURIComponent(asset)}`,
  );
