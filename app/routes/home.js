const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:routes->home');
const fs = require('fs');

async function routes(fastify, options) {

  fastify.get('/', async (request, reply) => {
    debug(`Get home at [${new Date()}]`);
    return { message: 'Welcome to Elasticsearch Restaurants Aggregations Api Nodejs.' };
  });

  fastify.get('/favicon.ico', async (request, reply) => {
    const buffer = fs.readFileSync('./app/imgs/favicon.ico');
    reply.type('image/x-icon');
    reply.send(buffer);
  });

  fastify.get('/favicon.png', async (request, reply) => {
    const buffer = fs.readFileSync('./app/imgs/favicon.png');
    reply.type('image/png');
    reply.send(buffer);
  });

};

module.exports = routes;
