import 'dotenv/config';

import { generateAndPersistSignal } from '@/lib/ai-signal-store';

const ASSETS: Array<'BTC' | 'ETH'> = ['BTC', 'ETH'];

async function ingest() {
  console.log('[ai-signal] starting generation cycle');

  for (const asset of ASSETS) {
    try {
      const snapshot = await generateAndPersistSignal(asset);
      console.log(
        `[ai-signal] ${asset} @ ${snapshot.timestamp}: signal=${snapshot.signal.toFixed(4)} ` +
          `final_balanceado=${snapshot.finalWBalanceado.toFixed(4)}`,
      );
    } catch (error) {
      console.error(`[ai-signal] failed to generate snapshot for ${asset}`, error);
    }
  }

  console.log('[ai-signal] cycle completed');
}

ingest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[ai-signal] ingestion failed', error);
    process.exit(1);
  });
