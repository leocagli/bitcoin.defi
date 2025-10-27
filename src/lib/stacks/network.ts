import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  type StacksNetwork,
  createNetwork,
} from '@stacks/network';

export type NetworkEnvironment = 'mainnet' | 'testnet';

const DEFAULT_MAINNET_URL = 'https://api.mainnet.hiro.so';
const DEFAULT_TESTNET_URL = 'https://api.testnet.hiro.so';

const resolveEnvFlag = (): NetworkEnvironment => {
  const flag =
    process.env.STACKS_NETWORK ??
    process.env.NEXT_PUBLIC_STACKS_NETWORK ??
    'mainnet';
  return flag.toLowerCase() === 'testnet' ? 'testnet' : 'mainnet';
};

export const getStacksEnvironment = (): NetworkEnvironment => resolveEnvFlag();

export const getStacksNetwork = (
  preferred?: NetworkEnvironment,
): StacksNetwork => {
  const env = preferred ?? resolveEnvFlag();
  const url =
    process.env.STACKS_API_URL ??
    (env === 'testnet' ? DEFAULT_TESTNET_URL : DEFAULT_MAINNET_URL);

  const networkBase = env === 'testnet' ? STACKS_TESTNET : STACKS_MAINNET;
  const networkInstance = createNetwork(networkBase);
  networkInstance.client.baseUrl = url;
  return networkInstance;
};

