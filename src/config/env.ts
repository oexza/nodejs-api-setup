import dotenv from 'dotenv';

// Capture system environment variables before dotenv loads
const systemEnvVars = { ...process.env };

// Now load dotenv
dotenv.config();

function parseEnvVar(value: string): string {
    const matches = value.match(/\${(\w+):(.+)}/);
    if (!matches) return value;

    const [_, envVar, defaultValue] = matches;
    const systemValue = systemEnvVars[envVar];
    
    return systemValue || defaultValue.trim();
}

function getEnvVar(key: string): string {
    const rawValue = process.env[key];
    if (!rawValue) throw new Error(`Environment variable ${key} not found`);
    return parseEnvVar(rawValue);
}

// First, process all environment variables
for (const key of Object.keys(process.env)) {
    if (process.env[key]) {
        const parsed = parseEnvVar(process.env[key]!);
        process.env[key] = parsed;
    }
}

export const config = {
    database: {
        user: getEnvVar('POSTGRES_USER'),
        host: getEnvVar('POSTGRES_HOST'),
        database: getEnvVar('POSTGRES_DB'),
        password: getEnvVar('POSTGRES_PASSWORD'),
        port: parseInt(getEnvVar('POSTGRES_PORT')),
    }
} as const; 