import 'dotenv/config';

import { closeDb, getDatabasePath, openDatabase } from '@/lib/sqlite';

const main = () => {
  const dbPath = getDatabasePath();
  openDatabase();
  closeDb();
  console.log(`[db] SQLite schema ensured at ${dbPath}`);
};

main();

