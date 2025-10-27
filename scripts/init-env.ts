import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type EnvRecord = Record<string, string>;

const ENV_LOCAL_PATH = join(process.cwd(), '.env.local');
const ENV_PATH = join(process.cwd(), '.env');
const REQUIRED_VARS: EnvRecord = {
  DATABASE_URL: 'file:./data/ai-signals.db',
  OPENBB_API_KEY: '',
  CHAINALYSIS_API_KEY: '',
  CHAINALYSIS_RISK_ENDPOINT: 'https://api.chainalysis.com/v0/exchange-flows/{asset}',
};

const SECRET_VAR = 'CRON_SECRET';

const parseEnvFile = (content: string): EnvRecord => {
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'))
    .reduce<EnvRecord>((acc, line) => {
      const [rawKey, ...rest] = line.split('=');
      if (!rawKey) {
        return acc;
      }
      const key = rawKey.trim();
      const value = rest.join('=').trim();
      acc[key] = value;
      return acc;
    }, {});
};

const serializeEnv = (records: EnvRecord): string =>
  Object.entries(records)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
    .concat('\n');

const ensureCronSecret = (existing: EnvRecord): string => {
  if (existing[SECRET_VAR] && existing[SECRET_VAR].trim().length > 0) {
    return existing[SECRET_VAR];
  }
  const generated = randomBytes(32).toString('hex');
  console.log(`Generated new ${SECRET_VAR}: ${generated}`);
  return generated;
};

const ensureEnvFile = (path: string, baseRecords: EnvRecord) => {
  if (!existsSync(path)) {
    if (path.endsWith('.env')) {
      console.log('Creating .env for Prisma CLI...');
    } else {
      console.log('Creating .env.local from template...');
    }
    const data = serializeEnv({
      ...baseRecords,
    });
    writeFileSync(path, data, { encoding: 'utf8' });
    if (path.endsWith('.env.local')) {
      console.log('.env.local created. Update API keys before running the app.');
    }
    return;
  }

  const content = readFileSync(path, { encoding: 'utf8' });
  const current = parseEnvFile(content);
  const updates: EnvRecord = {};

  Object.entries(baseRecords).forEach(([key, defaultValue]) => {
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      updates[key] = defaultValue;
    }
  });

  if (!Object.prototype.hasOwnProperty.call(current, SECRET_VAR) || !current[SECRET_VAR]) {
    updates[SECRET_VAR] = ensureCronSecret(current);
  }

  if (Object.keys(updates).length === 0) {
    console.log('.env.local already contains required variables.');
    return;
  }

  const appendContent = Object.entries(updates)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
    .concat('\n');
  appendFileSync(path, appendContent, { encoding: 'utf8' });
  if (path.endsWith('.env.local')) {
    console.log('Updated .env.local with missing variables.');
  } else {
    console.log('Synced .env with .env.local defaults.');
  }
};

ensureEnvFile(ENV_LOCAL_PATH, {
  ...REQUIRED_VARS,
  [SECRET_VAR]: ensureCronSecret({}),
});

const localContent = readFileSync(ENV_LOCAL_PATH, { encoding: 'utf8' });
const localEnv = parseEnvFile(localContent);
ensureEnvFile(
  ENV_PATH,
  {
    ...REQUIRED_VARS,
    ...localEnv,
    [SECRET_VAR]: ensureCronSecret(localEnv),
  },
);
