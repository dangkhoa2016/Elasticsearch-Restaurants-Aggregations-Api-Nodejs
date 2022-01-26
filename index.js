const debug = require('debug')('elasticsearch-restaurants-filter-api-nodejs:index');
const qs = require('qs');
const client = require('./elasticsearch_client');

// CommonJs
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

const { PORT = 3000, HOST = '0.0.0.0' } = process.env;

server.register(require('fastify-elasticsearch'), {
  client
});

server.register(require('./routes/home'));
server.register(require('./routes/elasticsearch'));
server.register(require('./routes/errors'));
server.register(require('./logger'));


(async () => {
  try {
    await server.listen(PORT, HOST);

    process.on('SIGINT', () => server.close());
    process.on('SIGTERM', () => server.close());
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
