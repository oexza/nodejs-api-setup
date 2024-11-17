import pg from 'pg';
import { config } from '../config/env.js';

export const pool = new pg.Pool(config.database);

let client: pg.PoolClient | null = null;
try {
    client = await pool.connect();
} catch (error) {
    console.error('Error connecting to the database:', error);
    pool.end();
    process.exit(1);
} finally {
    client?.release();
}