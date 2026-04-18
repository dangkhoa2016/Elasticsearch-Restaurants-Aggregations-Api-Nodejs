// Unit tests for app/services/helper.js
// Run with: npm test  (uses Node.js built-in test runner, requires Node >= 18)
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Provide minimal env so helper.js loads without errors
process.env.DEFAULT_INDEX = 'restaurants';
process.env.ALLOWED_INDICES = 'restaurants';

const {
  default_index,
  default_size,
  allowed_indices,
  convert_to_es_search_params,
  get_filter_aggregations,
} = require('../app/services/helper');

// ---------------------------------------------------------------------------
// default_index / default_size / allowed_indices
// ---------------------------------------------------------------------------
describe('module constants', () => {
  test('default_index is "restaurants"', () => {
    assert.equal(default_index, 'restaurants');
  });

  test('default_size is a positive number', () => {
    assert.ok(Number.isInteger(default_size) && default_size > 0);
  });

  test('allowed_indices contains default_index', () => {
    assert.ok(allowed_indices.includes(default_index));
  });
});

// ---------------------------------------------------------------------------
// convert_to_es_search_params
// ---------------------------------------------------------------------------
describe('convert_to_es_search_params', () => {
  test('returns match_all when params is null', () => {
    const result = convert_to_es_search_params(null);
    assert.deepEqual(result, { query: { match_all: {} } });
  });

  test('returns match_all when params is undefined', () => {
    const result = convert_to_es_search_params(undefined);
    assert.deepEqual(result, { query: { match_all: {} } });
  });

  test('returns bool query with no clauses for empty queries', () => {
    const result = convert_to_es_search_params({ queries: {}, sorts: undefined });
    assert.ok(result.query.bool);
    assert.equal(typeof result.query.bool, 'object');
  });

  test('does not mutate key_aggregations on repeated calls (no shared-state bug)', () => {
    const params1 = {
      queries: {
        published_on: { start: '2024-01-01', end: '2024-06-01' },
      },
    };
    const params2 = {
      queries: {
        published_on: { start: '2025-01-01', end: '2025-12-31' },
      },
    };

    const result1 = convert_to_es_search_params(params1);
    const result2 = convert_to_es_search_params(params2);

    const range1 = result1.query.bool.filter[0].range.published_on;
    const range2 = result2.query.bool.filter[0].range.published_on;

    assert.equal(range1.gte, '2024-01-01');
    assert.equal(range1.lte, '2024-06-01');
    assert.equal(range2.gte, '2025-01-01');
    assert.equal(range2.lte, '2025-12-31');

    // Ensure the two calls did not bleed into each other
    assert.notEqual(range1.gte, range2.gte);
  });

  test('searchText with name field produces must clause', () => {
    const result = convert_to_es_search_params({
      queries: {
        searchText: { value: 'pizza', field: 'name', method: '0' },
      },
    });
    assert.ok(Array.isArray(result.query.bool.must));
    assert.ok(result.query.bool.must.length > 0);
  });

  test('searchText with undefined field does not crash', () => {
    assert.doesNotThrow(() => {
      convert_to_es_search_params({
        queries: { searchText: { value: 'pizza', field: undefined } },
      });
    });
  });

  test('searchText with undefined value does not crash', () => {
    assert.doesNotThrow(() => {
      convert_to_es_search_params({
        queries: { searchText: { value: undefined, field: 'name' } },
      });
    });
  });
});

// ---------------------------------------------------------------------------
// get_filter_aggregations
// ---------------------------------------------------------------------------
describe('get_filter_aggregations', () => {
  test('returns a non-empty object', () => {
    const aggs = get_filter_aggregations();
    assert.ok(typeof aggs === 'object' && aggs !== null);
    assert.ok(Object.keys(aggs).length > 0);
  });

  test('each aggregation value has a recognized query type', () => {
    const aggs = get_filter_aggregations();
    const knownTypes = ['terms', 'date_range', 'missing', 'filter'];
    for (const [key, value] of Object.entries(aggs)) {
      const type = Object.keys(value)[0];
      assert.ok(knownTypes.includes(type), `Unknown agg type "${type}" for key "${key}"`);
    }
  });
});
