const default_index = process.env.DEFAULT_INDEX || 'restaurants';
const default_size = 24;
// list of allowed query indices, read from env ALLOWED_INDICES (comma-separated)
const allowed_indices = (process.env.ALLOWED_INDICES || default_index)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:helper');

const key_aggregations = require('./aggregations.config');

const get_filter_aggregations = function () {
  const z = {};
  key_aggregations.forEach(item => {
    item.aggs.forEach(x => {
      z[x.key] = x.query;
    });
  });
  return z;
};

const convert_sort = function (sorts) {
  if (!sorts || Object.keys(sorts).length === 0)
    return;

  return Object.keys(sorts).map(key => {
    if (sorts[key] === '0')
      return null;
    else
      return `${key}:${sorts[key]}`;
  }).filter(s => s);
};

const add_search_text = function (queries, searchTextOptions) {
  const { value, method, field } = searchTextOptions || {};
  // guard against missing value or field to prevent TypeError on .toLowerCase()
  if (!value || !field)
    return;

  const arrTexts = [];

  switch (field.toLowerCase()) {
    case 'name':
      switch (method) {
        case '1':
          arrTexts.push({
            'term': {
              'name.lowercase_starts_with_text': value.toLowerCase()
            }
          });
          break;
        case '2':
          arrTexts.push({
            'term': {
              'name.lowercase_ends_with_text': value.toLowerCase()
            }
          });
          break;
        case '3':
          arrTexts.push({
            'term': {
              'name': value.toLowerCase()
            }
          });
          break;
        case '4':
          arrTexts.push({
            'term': {
              'name.keyword': value
            }
          });
          break;
        default:
          arrTexts.push({
            'match': {
              'name': value
            }
          });
          break;
      }
      break;
    case 'description':
      switch (method) {
        case '1':
          arrTexts.push({
            'match_phrase_prefix': {
              'description': {
                query: value
              }
            }
          });
          break;
        case '3':
          arrTexts.push({
            'match': {
              'description': {
                query: value,
                operator: 'and'
              }
            }
          });
          break;
        case '4':
          arrTexts.push({
            'match_phrase': {
              'description': {
                query: value
              }
            }
          });
          break;
        default:
          arrTexts.push({
            'match': {
              'description': {
                query: value
              }
            }
          });
          break;
      }
      break;
    case 'contact_phone':
      switch (method) {
        case '1':
          arrTexts.push({
            'wildcard': {
              'contactInformation': `${value}*`
            }
          });
          break;
        case '2':
          arrTexts.push({
            'wildcard': {
              'contactInformation': `*${value}`
            }
          });
          break;
        case '3':
          arrTexts.push({
            'wildcard': {
              'contactInformation': `*${value}*`
            }
          });
          break;
        case '4':
          arrTexts.push({
            'term': {
              'contactInformation': value
            }
          });
          break;
        default:
          arrTexts.push({
            'match_phrase': {
              'contactInformation': value
            }
          });
          break;
      }
      break;
    case 'address_line1':
      switch (method) {
        case '1':
          arrTexts.push({
            'prefix': {
              'address.line1.keyword': value.toLowerCase()
            }
          });
          break;
        case '3':
          arrTexts.push({
            'match_phrase_prefix': {
              'address.line1': value
            }
          });
          break;
        case '4':
          arrTexts.push({
            'match_phrase': {
              'address.line1.keyword': value
            }
          });
          break;
        default:
          arrTexts.push({
            'match_phrase': {
              'address.line1': value
            }
          });
          break;
      }
      break;
  }

  if (arrTexts.length > 0) {
    if (!queries['must'])
      queries['must'] = arrTexts;
    else
      queries['must'] = queries['must'].concat(arrTexts);
  }
};

const convert_to_es_search_params = function (params) {
  const main = {};

  if (!params)
    return { query: { match_all: {} } };

  const { queries, sorts } = params;

  key_aggregations.forEach(item => {
    item.aggs.forEach(x => {
      let value = queries[x.key];
      if (!value)
        return;

      debug('item.queries', item.queries);
      let query = item.queries.find(q => {
        if (q.key) {
          if ((Array.isArray(value) === false && Array.isArray(q.key) && q.key.includes(value.toString())) || q.key === value)
            return q;
        }
      });

      // use structuredClone for a deep copy to avoid mutating the global key_aggregations
      if (query)
        query = structuredClone(query);
      else
        query = structuredClone(item.queries[0]);

      const type = query.type;

      if (type) {
        if (!main[type])
          main[type] = [];

        if (item.type === 'date-range-filter') {
          query.range.published_on.gte = value.start;
          query.range.published_on.lte = value.end;
        } else {
          // debug('value', value, query);
          if (query.terms) {
            const key = Object.keys(query.terms)[0];
            if (Array.isArray(value) === false)
              value = [value === '0' ? false : true];
            query.terms[key] = value;
          }
        }

        delete query.key;
        delete query.type;

        /*
        var existed = false;
        var key_query = Object.keys(query)[0];
        if (key_query !== 'exists') {
          for (const existing_query of main[type]) {
            var key_main_1 = Object.keys(existing_query)[0];
            if (key_main_1 == key_query) {
              var key_main_2 = Object.keys(existing_query[key_main_1])[0];
              var key_query_2 = Object.keys(query[key_main_1])[0];
              debug('checking', { key_main_2, key_query_2 });
              if (key_main_2 === key_query_2) {
                existed = true;
                debug('add to array', query[key_main_1][key_main_2]);
                existing_query[key_main_1][key_main_2] = [...new Set(existing_query[key_main_1][key_main_2].concat(query[key_main_1][key_main_2]))];
              }

              break;
            }
          }
        }

        if (!existed)
          main[type].push(query);
        */

        main[type].push(query);
      }
    });
  });

  // special case
  if (typeof queries.searchText === 'object')
    add_search_text(main, queries.searchText);

  if (Array.isArray(main['filter']) && main['filter'].length > 0)
    main['filter'] = remove_empty_filters(main['filter']);

  return {
    query: {
      bool: main
    },
    sort: convert_sort(sorts)
  };
};

const get_filters_for_ui = function (aggregations) {
  const result = [];
  if (!aggregations || Object.keys(aggregations).length === 0)
    return result;

  key_aggregations.forEach(item => {
    item.aggs.forEach(x => {
      let found = result.find(a => a.title == x.title);
      if (!found) {
        found = { name: x.key, title: x.title, options: [], type: item.type };
        result.push(found);
      }
      const { doc_count, buckets } = aggregations[x.key];
      if (Array.isArray(buckets)) {
        found.options = buckets.map(b => {
          let text = b.key;
          if (b.key_as_string)
            text = b.key === 0 ? 'No' : 'Yes';
          let value = b.key.toString();
          if (item.type === 'date-range-filter')
            value = [b.from_as_string, b.to_as_string];
          return {
            text: `${text} (${b.doc_count})`,
            value
          };
        });
      } else {
        let text = `Not set (${doc_count})`;
        let value = '2';

        if (item.type === 'has-or-missing-filter') {
          if (x.key.toLowerCase().startsWith('missing')) {
            text = `No (${doc_count})`;
          } else {
            text = `Yes (${doc_count})`;
            value = '1';
          }
        }

        found.options.push({ text, value });
      }
    });
  });

  return result;
};

const remove_empty_filters = function (arr) {
  return arr.filter(filter => {
    const keys_1 = Object.keys(filter)[0];
    const keys_2 = Object.keys(filter[keys_1])[0];
    let values = filter[keys_1][keys_2];
    if (Array.isArray(values) && values.length > 0) {
      values = values.filter(f => f !== null);
      filter[keys_1][keys_2] = values;
    }
    return (Array.isArray(values) && values.length > 0) || (Array.isArray(values) === false && values);
  });
};

module.exports = {
  key_aggregations,
  get_filter_aggregations,
  default_index,
  default_size,
  allowed_indices,
  get_filters_for_ui,
  convert_to_es_search_params,
  convert_sort,
};
