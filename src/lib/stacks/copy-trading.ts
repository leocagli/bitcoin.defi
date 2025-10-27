import { openContractCall } from '@stacks/connect';

import type { StacksNetwork } from '@stacks/network';

type TransactionsExports = typeof import('@stacks/transactions');

const loadTransactions = async (): Promise<TransactionsExports> => {
  return import('@stacks/transactions');
};

export type AllocateParams = {
  network: StacksNetwork;
  strategyId: number;
  amountUstx: bigint;
  riskMultiplierBps: number;
  stopLossBps: number;
  autoRebalance: boolean;
};

const resolveContractPrincipal = () => {
  const address =
    process.env.COPY_TRADING_CONTRACT_ADDRESS ??
    process.env.NEXT_PUBLIC_COPY_TRADING_CONTRACT_ADDRESS;
  const name =
    process.env.COPY_TRADING_CONTRACT_NAME ??
    process.env.NEXT_PUBLIC_COPY_TRADING_CONTRACT_NAME;

  if (!address || !name) {
    throw new Error(
      'Missing COPY_TRADING_CONTRACT_ADDRESS or COPY_TRADING_CONTRACT_NAME env vars',
    );
  }
  return { address, name };
};

export const allocateToStrategy = async ({
  network,
  strategyId,
  amountUstx,
  riskMultiplierBps,
  stopLossBps,
  autoRebalance,
}: AllocateParams) => {
  const { AnchorMode, boolCV, uintCV } = await loadTransactions();
  const { address, name } = resolveContractPrincipal();

  const functionArgs = [
    uintCV(BigInt(strategyId)),
    uintCV(amountUstx),
    uintCV(BigInt(riskMultiplierBps)),
    uintCV(BigInt(stopLossBps)),
    boolCV(autoRebalance),
  ];

  await openContractCall({
    contractAddress: address,
    contractName: name,
    functionName: 'allocate',
    functionArgs,
    network,
    appDetails: {
      name: 'bitcoin.defi',
      icon: `${typeof window !== 'undefined' ? window.location.origin : ''}/favicon.ico`,
    },
    onFinish: (data) => {
      console.info('[copy-trading] allocate tx submitted', data);
    },
    onCancel: () => {
      console.info('[copy-trading] allocate cancelled');
    },
    sponsored: false,
    anchorMode: AnchorMode.Any,
  });
};
