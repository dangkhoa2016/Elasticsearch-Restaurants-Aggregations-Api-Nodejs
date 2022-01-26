const debug = require('debug')('elasticsearch-restaurants-filter-api-nodejs:routes->home');
const fs = require('fs');

async function routes(fastify, options) {

  fastify.get('/', async (request, reply) => {
    return { hello: 'world' }
  });

  fastify.get('/favicon.ico', async (request, reply) => {
    const buffer = fs.readFileSync('./imgs/klc_favicon.ico');
    reply.type('image/x-icon');
    reply.send(buffer);
  });

  fastify.get('/favicon.png', async (request, reply) => {
    const buffer = fs.readFileSync('./imgs/klc_favicon.png');
    reply.type('image/png');
    reply.send(buffer);
  });

};

module.exports = routes;
