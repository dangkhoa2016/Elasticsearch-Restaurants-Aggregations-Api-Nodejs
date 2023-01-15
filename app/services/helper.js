const default_index = 'restaurants';
const default_size = 24;
const debug = require('debug')('elasticsearch-restaurants-aggregations-api-nodejs:helper');

const key_aggregations = [
  {
    "name": "published_on",
    "type": "date-range-filter",
    "aggs": [{
      "key": "published_on",
      "title": "Published On",
      "query": {
        "date_range": {
          "field": "published_on",
          "missing": "1900-01-01",
          "ranges": [
            {
              "key": "Last 7 days",
              "from": "now-1w/d",
              "to": "now/d"
            },
            {
              "key": "Last 14 days",
              "from": "now-2w/d",
              "to": "now/d"
            },
            {
              "key": "Last month",
              "from": "now-1M/d",
              "to": "now/d"
            },
            {
              "key": "Last 2 months",
              "from": "now-2M/d",
              "to": "now/d"
            }
          ]
        }
      }
    }],
    "queries": [{
      "type": "filter",
      "range": {
        "published_on": {
          "gte": "",
          "lte": ""
        }
      }
    }]
  },
  {
    "name": "address_states",
    "type": "multiple-checkbox-filter",
    "aggs": [{
      "key": "all_states",
      "title": "All States",
      "query": {
        "terms": {
          "field": "address.state.keyword",
          "missing": "N/A"
        }
      }
    }],
    "queries": [{
      "type": "filter",
      "terms": {
        "address.state.keyword": []
      }
    }]
  },
  {
    "name": "address_cities",
    "type": "multiple-checkbox-filter",
    "aggs": [{
      "key": "most_density_cities",
      "title": "Most Density Cities",
      "query": {
        "terms": {
          "field": "address.city.keyword",
          "size": 10,
          "missing": "N/A"
        }
      }
    }],
    "queries": [{
      "type": "filter",
      "terms": {
        "address.city.keyword": []
      }
    }]
  },
  {
    "name": "primary_cuisines",
    "type": "multiple-checkbox-filter",
    "aggs": [{
      "key": "primary_cuisines",
      "title": "Primary Cuisines",
      "query": {
        "terms": {
          "size": 10,
          "field": "primaryCuisine",
          "missing": "N/A"
        }
      }
    }],
    "queries": [{
      "type": "filter",
      "terms": {
        "primaryCuisine": []
      }
    }]
  },
  {
    "name": "dining_styles",
    "type": "multiple-checkbox-filter",
    "aggs": [{
      "key": "most_serve_dining_styles",
      "title": "Most Serve Dining Styles",
      "query": {
        "terms": {
          "size": 10,
          "field": "diningStyles.keyword",
          "missing": "N/A"
        }
      }
    }, {
      "key": "least_serve_dining_styles",
      "title": "Least Serve Dining Styles",
      "query": {
        "terms": {
          "size": 10,
          "field": "diningStyles.keyword",
          "missing": "N/A",
          "order": {
            "_count": "asc"
          }
        }
      }
    }],
    "queries": [{
      "type": "filter",
      "terms": {
        "diningStyles.keyword": []
      }
    }]
  },
  {
    "name": "features_bar",
    "type": "boolean-radio-filter",
    "aggs": [{
      "key": "yes_no_features_bar",
      "title": "Features: Bar",
      "query": {
        "terms": {
          "field": "features.bar"
        }
      }
    }, {
      "key": "missing_features_bar",
      "title": "Features: Bar",
      "query": {
        "missing": {
          "field": "features.bar"
        }
      }
    }],
    "queries": [{
      "key": ["0", "1"],
      "type": "filter",
      "terms": {
        "features.bar": []
      }
    }, {
      "key": ["2"],
      "type": "must_not",
      "exists": {
        "field": "features.bar"
      }
    }]
  },
  {
    "name": "has_takeout",
    "type": "boolean-radio-filter",
    "aggs": [{
      "key": "yes_no_takeout",
      "title": "Has Takeout",
      "query": {
        "terms": {
          "field": "hasTakeout"
        }
      }
    }],
    "queries": [{
      "key": ["0", "1"],
      "type": "filter",
      "terms": {
        "hasTakeout": []
      }
    }]
  },
  {
    "name": "legacy_photos",
    "type": "has-or-missing-filter",
    "aggs": [{
      "key": "missing_legacy_photos",
      "title": "Has Legacy Photos",
      "query": {
        "missing": {
          "field": "photos.legacy.url.keyword"
        }
      }
    }, {
      "key": "has_legacy_photos",
      "title": "Has Legacy Photos",
      "query": {
        "filter": {
          "exists": {
            "field": "photos.legacy.url.keyword"
          }
        }
      }
    }],
    "queries": [{
      "key": ["1"],
      "type": "must",
      "exists": {
        "field": "photos.legacy.url.keyword"
      }
    }, {
      "key": ["2"],
      "type": "must_not",
      "exists": {
        "field": "photos.legacy.url.keyword"
      }
    }]
  },
  {
    "name": "order_online_links",
    "type": "has-or-missing-filter",
    "aggs": [{
      "key": "has_order_online_links",
      "title": "Has Order Online Links",
      "query": {
        "filter": {
          "exists": {
            "field": "orderOnlineLink.keyword"
          }
        }
      }
    }, {
      "key": "missing_order_online_links",
      "title": "Has Order Online Links",
      "query": {
        "missing": {
          "field": "orderOnlineLink.keyword"
        }
      }
    }],
    "queries": [{
      "key": ["1"],
      "type": "must",
      "exists": {
        "field": "orderOnlineLink.keyword"
      }
    }, {
      "key": ["2"],
      "type": "must_not",
      "exists": {
        "field": "orderOnlineLink.keyword"
      }
    }]
  },
];

const get_filter_aggregations = function () {
  var z = {};
  key_aggregations.map(item => {
    item.aggs.map(x => {
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
  var { value, method, field } = searchTextOptions || {};
  if (value) {
    var arrTexts = [];

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
        };
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
  }
};

const convert_to_es_search_params = function (params) {
  var main = {};

  if (!params)
    return { query: { match_all: {} } };

  var { queries, sorts } = params;

  key_aggregations.map(item => {
    item.aggs.map(x => {
      var value = queries[x.key];
      if (!value)
        return null;

      // debug('item.queries', item.queries);
      var query = item.queries.find(q => {
        if (q.key) {
          if ((Array.isArray(value) === false && Array.isArray(q.key) && q.key.includes(value.toString())) || q.key === value)
            return q;
        }
      });

      if (query)
        query = Object.assign({}, query);
      else
        query = Object.assign({}, item.queries[0]);

      var type = query.type;

      if (type) {
        if (!main[type])
          main[type] = [];

        if (item.type === 'date-range-filter') {
          query.range.published_on.gte = value.start;
          query.range.published_on.lte = value.end;
        } else {
          // debug('value', value, query);
          if (query.terms) {
            var key = Object.keys(query.terms)[0];
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
  var result = [];
  if (!aggregations || Object.keys(aggregations).length === 0)
    return result;

  key_aggregations.map(item => {
    item.aggs.map(x => {
      var found = result.find(a => a.title == x.title);
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
    var keys_1 = Object.keys(filter)[0];
    var keys_2 = Object.keys(filter[keys_1])[0];
    var values = filter[keys_1][keys_2];
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
  get_filters_for_ui,
  convert_to_es_search_params,
  convert_sort,
  default_size
};
