const fp = require('fastify-plugin');
const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:logger');

module.exports = fp((server, opts, next) => {

  const now = () => Date.now();

  server.addHook('preHandler', function(req, reply, done) {
    reply.startTime = now();
    if (req.body)
      debug({ info: 'parse body', body: req.body })

    done();
  });

  server.addHook('onRequest', (req, reply, done) => {
    reply.startTime = now();
    debug({ info: 'received request', url: req.raw.url, id: req.id })

    done();
  });

  server.addHook('onResponse', (req, reply, done) => {
    debug(
      {
        info: 'response completed',
        url: req.raw.url, // add url to response as well for simple correlating
        statusCode: reply.raw.statusCode,
        durationMs: now() - reply.startTime, // recreate duration in ms - use process.hrtime() - https://nodejs.org/api/process.html#process_process_hrtime_bigint for most accuracy
      }
    );

    done();
  });

  next();
});