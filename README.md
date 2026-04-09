
# Elasticsearch Restaurants Aggregations API (Node.js)

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](README.vi.md)

## About

A REST API built with **Fastify** and **Node.js** that demonstrates using Elasticsearch/OpenSearch to search and filter restaurant data through aggregations. It serves as the backend for the [Elasticsearch-Restautants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restautants-Aggregations-UI) frontend.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Fastify v5 |
| Search engine | OpenSearch / Elasticsearch |
| ES Client | `@opensearch-project/opensearch` |
| Body parser | `qs` + `@fastify/formbody` |
| CORS | `@fastify/cors` |
| Dev server | nodemon |

## Project Structure

```
app/
├── index.js                  # Fastify server setup, plugin registration
├── routes/
│   ├── home.js               # GET / and favicon routes
│   ├── elasticsearch.js      # POST /search, GET /filters, GET /doc/:id
│   └── errors.js             # 404 / 500 error handlers
└── services/
    ├── elasticsearch_client.js  # OpenSearch client initialisation
    ├── helper.js                # Aggregation definitions & query builders
    └── logger.js               # Request/response lifecycle hooks
bin/
└── www                       # Entry point – loads .env.local and starts server
```

## API Endpoints

### `GET /`
Health-check / welcome message.

```json
{ "message": "Welcome to Elasticsearch Restaurants Aggregations Api Nodejs." }
```

---

### `GET /filters?index=<index>`
Returns all available aggregation filters for the UI (states, cities, cuisines, dining styles, boolean toggles, etc.).

**Query params**

| Param | Default | Description |
|---|---|---|
| `index` | `restaurants` | Elasticsearch index to aggregate from |

---

### `POST /search`
Search restaurants with optional filters, sorting and pagination.

**Request body (JSON)**

```json
{
  "index": "restaurants",
  "size": 24,
  "from": 0,
  "sorts": {},
  "queries": {
    "all_states": ["AU-NSW"],
    "most_density_cities": ["Sydney"],
    "primary_cuisines": [],
    "most_serve_dining_styles": [],
    "yes_no_features_bar": "0",
    "yes_no_takeout": "1",
    "has_order_online_links": "1",
    "missing_legacy_photos": "2",
    "searchText": {
      "value": "pizza",
      "method": "0",
      "field": "name"
    },
    "published_on": { "start": "2024-01-01", "end": "2024-12-31" }
  }
}
```

**Filter keys in `queries`**

| Key | Type | Description |
|---|---|---|
| `all_states` | `string[]` | Filter by address state (e.g. `AU-NSW`) |
| `most_density_cities` | `string[]` | Filter by city |
| `primary_cuisines` | `string[]` | Filter by primary cuisine |
| `most_serve_dining_styles` | `string[]` | Filter by most-served dining style |
| `least_serve_dining_styles` | `string[]` | Filter by least-served dining style |
| `yes_no_features_bar` | `"0"` \| `"1"` | `0` = no bar, `1` = has bar |
| `yes_no_takeout` | `"0"` \| `"1"` | `0` = no takeout, `1` = has takeout |
| `missing_legacy_photos` | `"1"` \| `"2"` | `1` = has legacy photos, `2` = missing |
| `has_order_online_links` | `"1"` \| `"2"` | `1` = has link, `2` = missing |
| `published_on` | `{ start, end }` | Date range filter |
| `searchText` | object | Full-text search (see below) |

**`searchText` fields and methods**

| `field` | `method` | Behaviour |
|---|---|---|
| `name` | `0` (default) | `match` |
| `name` | `1` | Starts-with (`lowercase_starts_with_text`) |
| `name` | `2` | Ends-with (`lowercase_ends_with_text`) |
| `name` | `3` | Exact match (lowercase) |
| `name` | `4` | Exact keyword |
| `description` | `0` (default) | `match` |
| `description` | `1` | `match_phrase_prefix` |
| `description` | `3` | `match` with `operator: and` |
| `description` | `4` | `match_phrase` |
| `contact_phone` | `0` (default) | `match_phrase` |
| `contact_phone` | `1` | Wildcard starts-with |
| `contact_phone` | `2` | Wildcard ends-with |
| `contact_phone` | `3` | Wildcard contains |
| `contact_phone` | `4` | Exact term |
| `address_line1` | `0` (default) | `match_phrase` |
| `address_line1` | `1` | `prefix` |
| `address_line1` | `3` | `match_phrase_prefix` |
| `address_line1` | `4` | Exact `match_phrase` on keyword |

---

### `GET /doc/:id?index=<index>&_source=<bool>`
Retrieve a single restaurant document by its Elasticsearch `_id`. Intended for debugging.

---

### `GET /404` / `GET /500`
Return sample error responses for testing the error handlers.

---

## Environment Variables

Copy `.env.sample` to `.env.local` and fill in your values:

```env
ELASTICSEARCH_URL=https://user_name:password@your-cluster.bonsaisearch.net
DEFAULT_INDEX=restaurants
PORT=8080
```

| Variable | Default | Description |
|---|---|---|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Full URL (with credentials) of the ES/OpenSearch node |
| `DEFAULT_INDEX` | `restaurants` | Index name used when none is supplied in the request |
| `PORT` | `8080` | HTTP port the server listens on |
| `HOST` | `0.0.0.0` | Network interface to bind to |

> `.env.local` is loaded automatically when `NODE_ENV` is not `production`.

---

## Local Setup

### Prerequisites

- Node.js >= 18
- npm or yarn
- A running Elasticsearch or OpenSearch instance (local Docker or hosted, e.g. [Bonsai](https://bonsai.io))

### Install dependencies

```bash
npm install
# or
yarn install
```

### Configure environment

```bash
cp .env.sample .env.local
# Edit .env.local with your Elasticsearch URL and desired port
```

### Start the development server

```bash
npm start
# or
yarn start
```

The server starts with `nodemon` and `DEBUG` logging enabled. You should see:

```
Server listening at http://0.0.0.0:8080
```

---

## Testing Locally with curl

```bash
# Welcome
curl http://localhost:8080/

# Get all filters
curl http://localhost:8080/filters

# Basic search (no filters)
curl -X POST http://localhost:8080/search \
  -H 'Content-Type: application/json' \
  --data '{"queries":{},"sorts":{},"from":0,"size":24}'

# Search with state + city filters
curl -X POST http://localhost:8080/search \
  -H 'Content-Type: application/json' \
  --data '{"queries":{"all_states":["AU-NSW"],"most_density_cities":["Sydney"]},"sorts":{},"from":0,"size":24}'

# Full filter example
curl -X POST http://localhost:8080/search \
  -H 'Content-Type: application/json' \
  --data '{
    "queries": {
      "all_states": ["AU-NSW", "AU-QLD"],
      "most_density_cities": ["Sydney", "Richmond"],
      "primary_cuisines": ["Modern Australian", "Seafood"],
      "most_serve_dining_styles": ["Teppanyaki Grill"],
      "yes_no_features_bar": "0",
      "yes_no_takeout": "0",
      "has_order_online_links": "2",
      "searchText": { "value": "harbour", "method": "0", "field": "name" }
    },
    "sorts": {},
    "from": 0,
    "size": 24
  }'

# Get a single document by ID
curl http://localhost:8080/doc/53516

# Test error handlers
curl http://localhost:8080/404
curl http://localhost:8080/500
```

---

## Notes

- The server allows **all CORS origins** by default. Restrict origins in `app/index.js` for production use.
- The `sleep` field in the `/search` body adds a 5-second artificial delay (useful for UI loading state tests).
- `size` is clamped to a maximum of **50** records per request; values outside `[1, 50]` fall back to the default (`24`).
- If you use a **Bonsai.io v7.10** cluster with the legacy `@elastic/elasticsearch` client you may encounter `ProductNotSupportedError`. Switching to `@opensearch-project/opensearch` (already used in this project) resolves the issue.
