import app from './app.js';
import config from './config/index.js';
//import { connectDB, disconnectDB } from './config/database.js';

const start = async () => {

  app.listen(config.port, () => {
    console.log(`\n  Server: http://localhost:${config.port}`);
    console.log(`  Health: http://localhost:${config.port}/health`);
    console.log(`  API:    http://localhost:${config.port}/api\n`);
  });
};

// process.on('SIGINT', async () => { await disconnectDB(); process.exit(0); });
// process.on('SIGTERM', async () => { await disconnectDB(); process.exit(0); });

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
