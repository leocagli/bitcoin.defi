import { execSync } from 'node:child_process';

const resolveShell = () => {
  if (process.platform === 'win32') {
    return process.env.ComSpec ?? 'C:\\Windows\\System32\\cmd.exe';
  }
  return '/bin/sh';
};

const runStep = (label: string, command: string) => {
  console.log(`\n[auto] ${label}`);
  execSync(command, {
    stdio: 'inherit',
    shell: resolveShell(),
  });
};

const main = () => {
  runStep('Prepare environment files', 'npm run env:init');
  runStep('Ensure SQLite schema', 'npm run db:init-sqlite');
  runStep('Seed backtest stats', 'npm run db:seed');
  runStep('Generate AI signals', 'npm run signal:ingest');
  runStep('Lint project', 'npm run lint');
  console.log('\n[auto] Pipeline completed successfully.');
};

try {
  main();
} catch (error) {
  console.error('\n[auto] Pipeline failed:', error);
  process.exit(1);
}

