const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:routes->elasticsearch');

const {
  // key_aggregations,
  get_filter_aggregations,
  default_index,
  default_size,
  allowed_indices,
  get_filters_for_ui,
  convert_to_es_search_params,
  // convert_sort
} = require('../services/helper');

const searchSchema = {
  type: 'object',
  properties: {
    index: { type: 'string' },
    size: { type: ['string', 'number'] },
    from: { type: ['string', 'number'] },
    queries: { type: 'object' },
    sorts: { type: 'object' },
    sleep: { type: ['boolean', 'string', 'null'] },
  },
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function routes(fastify, options) {
  const elastic = fastify.opensearch; // change to fastify.elasticsearch if using @elastic/elasticsearch client instead of @opensearch-project/opensearch
  // debug('elastic', elastic, fastify, options);

  fastify.post('/search', { schema: { body: searchSchema } }, async (request, reply) => {
    var { index = default_index, queries = {}, sleep, size = default_size, sorts, from = 0 } = request.body;

    // only allow indices from the whitelist
    if (!allowed_indices.includes(index)) {
      return reply.code(400).send({ error: 'Invalid index.' });
    }

    // validate and clamp size/from before passing to helper
    if (size) size = parseInt(size);
    if (!size || size < 0 || size > 50) size = default_size;
    if (from) from = parseInt(from);
    if (!from || from < 0) from = 0;

    var { query, sort } = convert_to_es_search_params({ queries, sorts, size, from });
    //for test
    if (sleep)
      await timeout(5000);

    debug('/search', JSON.stringify({ query, sort, size, from }, null, 2));

    const { body } = await elastic.search({
      index,
      body: { query },
      size,
      sort,
      from
    });

    return body;
  });

  fastify.get('/filters', async function (request, reply) {
    var { index = default_index } = request.query;

    // only allow indices from the whitelist
    if (!allowed_indices.includes(index)) {
      return reply.code(400).send({ error: 'Invalid index.' });
    }

    try {
      const { body } = await elastic.search({
        index,
        body: { aggs: get_filter_aggregations() },
        size: 0
      });
      debug('/filters result aggs', body);
      return get_filters_for_ui(body.aggregations);
    } catch (ex) {
      // return 500 instead of 200 with { err: ... } body
      debug('Error get aggs', ex);
      return reply.code(500).send({ error: 'Failed to load filters.' });
    }
  });

  // test only
  fastify.get('/doc/:id', async function (request, reply) {
    var { index = default_index, _source = true } = request.query;

    var { id } = request.params;
    const { body } = await elastic.get({
      index,
      id,
      _source
    });

    return body;
  });

};

module.exports = routes;
