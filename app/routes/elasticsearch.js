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

// schema must be wrapped in { schema: { body: ... } } for Fastify to pick it up
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
};

// simple in-memory cache for /filters with configurable TTL (default 5 min)
const FILTERS_CACHE_TTL_MS = parseInt(process.env.FILTERS_CACHE_TTL_MS) || 5 * 60 * 1000;
const filtersCache = new Map(); // key: index name → { data, expiresAt }

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function routes(fastify, options) {
  const elastic = fastify.opensearch; // change to fastify.elasticsearch if using @elastic/elasticsearch client instead of @opensearch-project/opensearch
  // debug('elastic', elastic, fastify, options);

  fastify.post('/search', { schema: { body: searchSchema } }, async (request, reply) => {
    const { index = default_index, queries = {}, sleep, size: rawSize = default_size, sorts, from: rawFrom = 0 } = request.body;

    // only allow indices from the whitelist
    if (!allowed_indices.includes(index)) {
      return reply.code(400).send({ error: 'Invalid index.' });
    }

    // validate and clamp size/from before passing to helper
    let size = parseInt(rawSize);
    if (!size || size < 0 || size > 50) size = default_size;
    let from = parseInt(rawFrom);
    if (!from || from < 0) from = 0;

    const { query, sort } = convert_to_es_search_params({ queries, sorts, size, from });

    // for test
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
    const { index = default_index } = request.query;

    // only allow indices from the whitelist
    if (!allowed_indices.includes(index)) {
      return reply.code(400).send({ error: 'Invalid index.' });
    }

    // serve from cache if still fresh
    const cached = filtersCache.get(index);
    if (cached && Date.now() < cached.expiresAt) {
      debug('/filters served from cache for index:', index);
      return cached.data;
    }

    try {
      const { body } = await elastic.search({
        index,
        body: { aggs: get_filter_aggregations() },
        size: 0
      });
      debug('/filters result aggs', body);
      const data = get_filters_for_ui(body.aggregations);
      filtersCache.set(index, { data, expiresAt: Date.now() + FILTERS_CACHE_TTL_MS });
      return data;
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
