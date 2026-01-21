const DEFAULT_ORIGINS = ['http://localhost:5173'];

function parseOrigins(value) {
  if (!value) {
    return DEFAULT_ORIGINS;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const corsOrigins = parseOrigins(process.env.CORS_ORIGINS);

module.exports = {
  port: process.env.PORT || 8000,
  cors: {
    origin: corsOrigins,
    credentials: true
  }
};
