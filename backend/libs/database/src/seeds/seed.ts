import AppDataSource from '../data-source';
import { seedAdminUser } from './admin-user.seed';
import { seedScenarios } from './scenarios.seed';
import { seedBots } from './bots.seed';
import { seedSystemSettings } from './system-settings.seed';

async function run() {
  console.log('Connecting to database...');
  const dataSource = await AppDataSource.initialize();
  console.log('Connected. Running seeds...\n');

  try {
    await seedAdminUser(dataSource);
    await seedScenarios(dataSource);
    await seedBots(dataSource);
    await seedSystemSettings(dataSource);

    console.log('\nAll seeds completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

run();
