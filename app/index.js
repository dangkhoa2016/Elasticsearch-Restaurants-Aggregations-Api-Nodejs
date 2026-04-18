const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:index');
const qs = require('qs');
const client = require('./services/elasticsearch_client');

const server = require('fastify')({
  // disableRequestLogging: true,
  logger: false
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

server.register(require('@fastify/opensearch'), { client });

server.register(require('./routes/home'));
server.register(require('./routes/elasticsearch'));
server.register(require('./routes/errors'));
server.register(require('./services/logger'));

server.decorate('exception', (request, reply) => {
  reply.code(500).send({ 'error': '500 Internal Server Error.', msg: 'Please go home' });
});

server.setErrorHandler((error, request, reply) => {
  debug('Server Error', error);
  return server.exception(request, reply);
});

module.exports = server;
