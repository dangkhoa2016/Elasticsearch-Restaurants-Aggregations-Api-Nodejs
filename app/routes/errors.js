const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:routes->errors');

async function routes(fastify, options) {

  // standardized error response format { error, message }
  fastify.decorate('notFound', (request, reply) => {
    debug('requested url', request.url);
    reply.code(404).send({ error: 'Not Found', message: 'The requested route does not exist.' });
  });

  fastify.get('/404', async (request, reply) => {
    return fastify.notFound(request, reply);
  });

  fastify.get('/500', async (request, reply) => {
    return fastify.exception(request, reply);
  });

  fastify.setNotFoundHandler(fastify.notFound);

};

module.exports = routes;
