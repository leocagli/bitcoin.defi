import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAiSignalBacktest,
  fetchAiSignalHistory,
  fetchCurrentAiSignal,
} from '@/lib/ai-signal-api';
import type {
  BacktestResponse,
  CurrentAiSignalResponse,
  HistoryResponse,
} from '@/types/ai-api';

type AsyncState<T> = {
  data?: T;
  error?: string;
  loading: boolean;
};

const buildErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

export const useAiSignal = (asset = 'BTC') => {
  const [current, setCurrent] = useState<AsyncState<CurrentAiSignalResponse>>({
    loading: true,
  });
  const [history, setHistory] = useState<AsyncState<HistoryResponse>>({
    loading: true,
  });
  const [backtest, setBacktest] = useState<AsyncState<BacktestResponse>>({
    loading: true,
  });

  const refresh = useCallback(async () => {
    setCurrent({ loading: true });
    setHistory({ loading: true });
    setBacktest({ loading: true });

    try {
      const [currentResponse, historyResponse, backtestResponse] = await Promise.all([
        fetchCurrentAiSignal(asset),
        fetchAiSignalHistory(asset),
        fetchAiSignalBacktest(asset),
      ]);

      setCurrent({ data: currentResponse, loading: false });
      setHistory({ data: historyResponse, loading: false });
      setBacktest({ data: backtestResponse, loading: false });
    } catch (error) {
      const message = buildErrorMessage(error);
      setCurrent((state) => ({ ...state, loading: false, error: message }));
      setHistory((state) => ({ ...state, loading: false, error: message }));
      setBacktest((state) => ({ ...state, loading: false, error: message }));
    }
  }, [asset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize AI signal data on mount
    void refresh();
  }, [refresh]);

  const disclaimer = useMemo(() => {
    return (
      current.data?.disclaimer ??
      history.data?.snapshots[0]?.disclaimer ??
      backtest.data?.disclaimer ??
      'Backtest historico. Resultados pasados no garantizan rendimientos futuros. No es asesoramiento financiero.'
    );
  }, [backtest.data?.disclaimer, current.data?.disclaimer, history.data?.snapshots]);

  return {
    current,
    history,
    backtest,
    disclaimer,
    refresh,
    asset,
  };
};
