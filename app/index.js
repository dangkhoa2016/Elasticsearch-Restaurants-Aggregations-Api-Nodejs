const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:index');
const qs = require('qs');
const client = require('./services/elasticsearch_client');

const server = require('fastify')({
  // disableRequestLogging: true,
  logger: false
});

server.register(require('fastify-formbody'), { parser: str => qs.parse(str) });

server.register(require('fastify-cors'), {
  origin: (origin, cb) => {
    // allow all
    cb(null, true);

    /* allow special host
    if (/localhost/.test(origin)) {
      //  Request from localhost will pass
      cb(null, true);
      return;
    }
    // Generate an error on other origins, disabling access
    cb(new Error("Not allowed"));
    */
  }
});

server.register(require('fastify-elasticsearch'), { client });

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
