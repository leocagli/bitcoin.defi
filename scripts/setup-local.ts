import { config as loadEnv } from 'dotenv';
import { spawn } from 'node:child_process';

loadEnv({ path: '.env.local', override: true });

const REQUIRED_ENV = ['DATABASE_URL', 'CHAINALYSIS_RISK_ENDPOINT', 'CRON_SECRET'];

const warnEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}. Update your .env.local before continuing.`);
  }
  if (!process.env.CHAINALYSIS_API_KEY) {
    console.warn('CHAINALYSIS_API_KEY is not set. Falling back to deterministic risk scores.');
  }
  if (!process.env.OPENBB_API_KEY) {
    console.warn('OPENBB_API_KEY is not configured. Skipping extended OpenBB features.');
  }
};

const run = (label: string, command: string, args: string[], after?: () => void | Promise<void>) =>
  new Promise<void>((resolve, reject) => {
    console.log(`\n[setup] ${label}`);
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', async (code) => {
      if (code === 0) {
        console.log(`[setup] ${label} completed`);
        if (after) await after();
        resolve();
      } else {
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
  });

const startDevServer = () => {
  console.log('\n[setup] Starting Next.js dev server...');
  const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' });
  dev.on('close', (code) => process.exit(code ?? 0));
};

async function bootstrap() {
  await run('Prepare environment files', 'npm', ['run', 'env:init'], () => {
    loadEnv({ path: '.env.local', override: true });
    warnEnv();
  });

  await run('Ensure SQLite schema', 'npm', ['run', 'db:init-sqlite']);
  await run('Seed backtest stats', 'npm', ['run', 'db:seed']);
  await run('Generate initial AI signals', 'npm', ['run', 'signal:ingest']);

  startDevServer();
}

bootstrap().catch((error) => {
  console.error('[setup] failed:', error);
  process.exit(1);
});
