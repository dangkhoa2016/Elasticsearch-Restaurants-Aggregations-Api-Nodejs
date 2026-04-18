const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:index');
const qs = require('qs');
const client = require('./services/elasticsearch_client');

// enable Fastify's built-in Pino logger; level read from env (default 'warn' in prod, 'info' otherwise)
const server = require('fastify')({
  // disableRequestLogging: true,
  logger: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  },
});

server.register(require('@fastify/formbody'), { parser: str => qs.parse(str) });

// read allowed origins from env CORS_ORIGINS (comma-separated)
// If not set → allow all origins (dev-friendly); set in production to restrict
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : null;

server.register(require('@fastify/cors'), {
  origin: (origin, cb) => {
    // Requests with no origin header (curl, server-to-server) are always allowed
    if (!origin || !corsOrigins || corsOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  }
});

// rate limiting — max 100 requests per minute per IP by default, configurable via env
server.register(require('@fastify/rate-limit'), {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
});

server.register(require('@fastify/opensearch'), { client });

server.register(require('./routes/home'));
server.register(require('./routes/elasticsearch'));
server.register(require('./routes/errors'));
server.register(require('./services/logger'));

// standardized error response format { error, message }
server.decorate('exception', (request, reply) => {
  reply.code(500).send({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});

server.setErrorHandler((error, request, reply) => {
  debug('Server Error', error);
  server.log.error(error);
  return server.exception(request, reply);
});

module.exports = server;
