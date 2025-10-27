'use client';

import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  connect as stacksConnect,
  disconnect as stacksDisconnect,
  getLocalStorage,
  isConnected,
  type StorageData,
} from '@stacks/connect';
import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  type StacksNetwork,
  createNetwork,
} from '@stacks/network';

type StacksAccount = {
  address: string;
};

type StacksContextValue = {
  isReady: boolean;
  isSignedIn: boolean;
  account?: StacksAccount;
  network: StacksNetwork;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const StacksContext = createContext<StacksContextValue | undefined>(undefined);

const getStxAccountFromStorage = (storage: StorageData | null): StacksAccount | undefined => {
  const entry = storage?.addresses?.stx?.[0];
  if (!entry?.address) {
    return undefined;
  }
  return { address: entry.address };
};

const getStxAccountFromAddresses = (
  addresses: Array<{ address: string; symbol?: string | null }>,
): StacksAccount | undefined => {
  const entry = addresses.find((item) => {
    if (!item?.address) return false;
    const symbol = item.symbol?.toUpperCase();
    if (symbol === 'STX') return true;
    return item.address.startsWith('S') || item.address.startsWith('T');
  });

  if (!entry?.address) {
    return undefined;
  }

  return { address: entry.address };
};

export function StacksProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [account, setAccount] = useState<StacksAccount | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromStorage = () => {
      const storage = getLocalStorage();
      const storedAccount = getStxAccountFromStorage(storage);
      if (storedAccount) {
        setAccount(storedAccount);
      } else if (!isConnected()) {
        setAccount(undefined);
      }
      setIsReady(true);
    };

    syncFromStorage();
  }, []);

  const signIn = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const result = await stacksConnect({ forceWalletSelect: true });
    const newAccount = getStxAccountFromAddresses(result.addresses);
    if (!newAccount) {
      throw new Error('No STX address returned by wallet');
    }
    setAccount(newAccount);
  }, []);

  const signOut = useCallback(() => {
    stacksDisconnect();
    setAccount(undefined);
    setIsReady(true);
  }, []);

  const network = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_STACKS_NETWORK ?? 'mainnet';
    if (env === 'testnet') {
      return createNetwork({ network: STACKS_TESTNET });
    }
    return createNetwork({ network: STACKS_MAINNET });
  }, []);

  const value = useMemo<StacksContextValue>(
    () => ({
      isReady,
      isSignedIn: Boolean(account),
      account,
      network,
      signIn,
      signOut,
    }),
    [account, isReady, network, signIn, signOut],
  );

  return (
    <StacksContext.Provider value={value}>{children}</StacksContext.Provider>
  );
}

export function useStacks() {
  const context = useContext(StacksContext);
  if (!context) {
    throw new Error('useStacks must be used within a StacksProvider');
  }
  return context;
}
