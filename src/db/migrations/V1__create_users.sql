CREATE TABLE if NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX if NOT EXISTS users_idx_users_username ON users(username);
CREATE INDEX if NOT EXISTS users_idx_users_email ON users(email); 