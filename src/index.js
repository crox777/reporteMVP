import 'dotenv/config';
import cron from 'node-cron';
import { initDB } from './database.js';
import { processReports } from './processor.js';
import { sendDigest } from './notifier.js';

async function main() {
  await initDB();
  
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Starting scheduled check...');
    try {
      const analyses = await processReports();
      if (analyses.length > 0) {
        await sendDigest(analyses);
      }
    } catch (error) {
      console.error('Error in scheduled job:', error);
    }
  });

  // Initial run
  console.log('Performing initial check...');
  const analyses = await processReports();
  if (analyses.length > 0) {
    await sendDigest(analyses);
  }
}

main().catch(console.error);