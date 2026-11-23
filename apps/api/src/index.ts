import { config } from './config.js';
import { createApp } from './app.js';
import { pool } from './db.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`TLD API روی پورت ${config.port} اجرا شد`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
