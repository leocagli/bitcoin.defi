'use client';

import { useStacks } from '@/components/providers/StacksProvider';
import { truncateAddress } from '@/lib/format';
import { useState } from 'react';

export function ConnectWalletButton() {
  const { isReady, isSignedIn, account, signIn, signOut } = useStacks();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-slate-300 ring-1 ring-inset ring-slate-700"
        type="button"
        disabled
      >
        Inicializando wallet...
      </button>
    );
  }

  if (isSignedIn && account) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700/80">
          {truncateAddress(account.address)}
        </span>
        <button
          className="inline-flex items-center justify-center rounded-full border border-slate-700/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          type="button"
          onClick={signOut}
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60"
      type="button"
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? 'Conectando...' : 'Conectar wallet Stacks'}
    </button>
  );
}
