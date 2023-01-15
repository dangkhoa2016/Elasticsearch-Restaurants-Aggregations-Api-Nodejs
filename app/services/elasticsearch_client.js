const { Client } = require('@elastic/elasticsearch');
const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:client');

const { ELASTICSEARCH_URL = 'http://localhost:9200' } = process.env;

const client = new Client({
  node: ELASTICSEARCH_URL,
  healthcheck: false
});

client.on('request', (err, result) => {
  if (err)
    debug('[Error request]', err);
  else {
    const { body, meta, headers } = result;
    debug('[request]', body, meta, headers);
  }
});

client.on('response', (err, result) => {
  if (err)
    debug('[Error response]', err);
  else {
    const { body, meta, headers } = result;
    debug('[response]', body, meta, headers);
  }
});

module.exports = client;
