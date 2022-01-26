const debug = require('debug')('elasticsearch-restaurants-filter-api-nodejs:routes->elasticsearch');
// const aggs = require('../aggs.json');

const {
  key_aggregations,
  get_filter_aggregations,
  default_index,
  default_size,
  get_filters_for_ui,
  convert_to_es_search_params,
  convert_sort
} = require('../helper');

const searchSchema = {
  type: 'object',
  properties: {
    index: { type: 'string' },
    size: { type: ['string', 'number'] },
    from: { type: ['string', 'number'] },
    index: { type: 'string' },
    queries: { type: ['object'] },
    sorts: { type: ['object'] },
    sleep: { type: ['boolean', 'string', 'null'] },
  },
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function routes(fastify, options) {
  const elastic = fastify.elastic;
  // console.log('elastic', elastic, fastify, options);

  fastify.post('/search', { searchSchema }, async (request, reply) => {
    var { index = default_index, queries, sleep, size = default_size, sorts, from = 0 } = request.body;
    var { query, sort } = convert_to_es_search_params({ queries, sorts, size, from });
    //for test
    if (sleep)
      await timeout(5000);

    if (size)
      size = parseInt(size);
    if (!size || size < 0 || size > 50)
      size = default_size;
    if (from)
      from = parseInt(from);
    if (!from || from < 0)
      from = 0;

    debug(JSON.stringify({query, sort, size, from}));

    const { body } = await elastic.search({
      index,
      body: { query },
      size,
      sort,
      from
    });

    return body;
  });

  fastify.get('/filters', async function(request, reply) {
    var { index = default_index } = request.query;
    try {
      const { body } = await elastic.search({
        index,
        body: { aggs: get_filter_aggregations() },
        size: 0
      });
      // debug('result aggs', body);
      return get_filters_for_ui(body.aggregations);
    } catch(ex) {
      debug('Error get aggs', ex);
      return { err: ex.message };
    }
  });

};

module.exports = routes;
