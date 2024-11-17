import { Umzug, SequelizeStorage } from 'umzug';
import { pool } from './database.js';
import fs from 'fs/promises';
import path from 'path';
import { Sequelize } from 'sequelize';
import { config } from '../config/env.js';

const sequelize = new Sequelize({
    dialect: 'postgres', database: config.database.database, username: config.database.user,
    password: config.database.password, host: config.database.host, port: config.database.port,
})

export const migrator = new Umzug({
    migrations: {
        glob: 'src/db/migrations/*.sql',
        resolve: ({ name, path, context }) => ({
            name,
            up: async () => {
                const sql = await fs.readFile(path!, 'utf8');
                const client = await pool.connect();
                try {
                    await client.query(sql);
                } finally {
                    client.release();
                }
            },
            down: async () => {
                // Implement if you need down migrations
            }
        })
    },
    context: sequelize,
    storage: new SequelizeStorage({sequelize, tableName: 'splice_migrations'}),
    logger: console,
}); 