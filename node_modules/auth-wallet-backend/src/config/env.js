const dotenv = require('dotenv');

dotenv.config();

const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const required = ['DATABASE_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!accessSecret) {
  throw new Error('Missing required environment variable: JWT_ACCESS_SECRET or JWT_SECRET');
}

if (!refreshSecret) {
  throw new Error('Missing required environment variable: JWT_REFRESH_SECRET or JWT_SECRET');
}

function maskSecret(value) {
  if (!value) {
    return 'missing';
  }

  if (value.length <= 6) {
    return '***';
  }

  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

function getSafeEnvSummary() {
  let databaseUrl;

  try {
    const parsedUrl = new URL(process.env.DATABASE_URL);
    databaseUrl = {
      protocol: parsedUrl.protocol.replace(':', ''),
      host: parsedUrl.hostname,
      port: parsedUrl.port || '5432',
      database: parsedUrl.pathname.replace(/^\//, ''),
      username: parsedUrl.username || 'postgres'
    };
  } catch (error) {
    databaseUrl = 'invalid DATABASE_URL';
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 5000),
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    databaseUrl,
    jwtAccessSecret: maskSecret(accessSecret),
    jwtRefreshSecret: maskSecret(refreshSecret)
  };
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: accessSecret,
  jwtRefreshSecret: refreshSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  starterBalance: 1000,
  getSafeEnvSummary
};
