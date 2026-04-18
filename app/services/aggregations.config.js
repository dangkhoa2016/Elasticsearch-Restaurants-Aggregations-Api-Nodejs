// Static aggregation definitions used by helper.js to build ES agg queries
// and map the results back to UI-friendly filter objects.
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

module.exports = key_aggregations;
