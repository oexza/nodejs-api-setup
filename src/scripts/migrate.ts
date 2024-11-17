import { migrator } from '../db/migrator.js';

async function runMigrations() {
    try {
        await migrator.up();
        console.log('Migrations completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations(); 