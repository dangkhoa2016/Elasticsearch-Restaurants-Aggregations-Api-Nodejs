
# Elasticsearch Restaurants Aggregations API (Node.js)

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](README.vi.md)

## About

A REST API built with **Fastify** and **Node.js** that demonstrates using Elasticsearch/OpenSearch to search and filter restaurant data through aggregations. It serves as the backend for the [Elasticsearch-Restaurants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-UI) frontend.

## Technologies Used

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Fastify v5 |
| Search engine | OpenSearch / Elasticsearch |
| ES Client | `@opensearch-project/opensearch` |
| Body parser | `qs` + `@fastify/formbody` |
| CORS | `@fastify/cors` |
| Rate limiting | `@fastify/rate-limit` |
| Logging | Fastify logger (Pino) + `debug` |
| Dev server | nodemon |

## Project Structure

```
app/
├── index.js                  # Fastify server setup, plugin registration
├── routes/
│   ├── home.js               # GET /, GET /health, favicon routes
│   ├── elasticsearch.js      # POST /search, GET /filters, GET /doc/:id
│   └── errors.js             # 404 / 500 error handlers
└── services/
    ├── aggregations.config.js   # Static aggregation/filter definitions
    ├── elasticsearch_client.js  # OpenSearch client initialisation
    ├── helper.js                # Query builders + UI filter mapping helpers
    └── logger.js                # Request/response lifecycle hooks
bin/
└── www                       # Entry point – loads .env.local and starts server
test/
└── helper.test.js            # Unit tests for helper/service behavior
```

## API Endpoints

### `GET /`
Welcome message.

```json
{ "message": "Welcome to Elasticsearch Restaurants Aggregations Api Nodejs." }
```

---

### `GET /health`
Lightweight health endpoint for load balancers and uptime checks.

```json
{ "status": "ok", "timestamp": "2026-04-18T12:34:56.789Z" }
```

---

### `GET /filters?index=<index>`
Returns all available aggregation filters for the UI (states, cities, cuisines, dining styles, boolean toggles, etc.). Results are cached in memory for 5 minutes by default.

**Query params**

| Param | Default | Description |
|---|---|---|
| `index` | `restaurants` | Elasticsearch index to aggregate from. Must be included in `ALLOWED_INDICES`. |

---

### `POST /search`
Search restaurants with optional filters, sorting and pagination. The `index` value is validated against `ALLOWED_INDICES` before the OpenSearch query is executed.

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

**Top-level request fields**

| Field | Type | Description |
|---|---|---|
| `index` | `string` | Target index. Defaults to `DEFAULT_INDEX` and must be allowed by `ALLOWED_INDICES`. |
| `size` | `string \| number` | Page size. Invalid, zero, negative, or values greater than `50` fall back to `24`. |
| `from` | `string \| number` | Offset for pagination. Invalid or negative values fall back to `0`. |
| `sorts` | `object` | Sort map in the form `{ fieldName: "asc" \| "desc" \| "0" }`. Entries with value `"0"` are ignored. |
| `queries` | `object` | Filter payload shown below. |
| `sleep` | `boolean \| string \| null` | Debug/testing aid. Any truthy value adds an artificial 5-second delay before querying OpenSearch. |

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
Retrieve a single restaurant document by its Elasticsearch `_id`. This endpoint is intended for debugging and does not currently apply the `ALLOWED_INDICES` whitelist, so it should not be exposed publicly without additional protection.

---

### `GET /404` / `GET /500`
Return sample error responses for testing the error handlers.

```json
{ "error": "Not Found", "message": "The requested route does not exist." }
```

```json
{ "error": "Internal Server Error", "message": "An unexpected error occurred." }
```

---

## Environment Variables

Copy `.env.sample` to `.env.local` and fill in your values:

```env
ELASTICSEARCH_URL=https://user_name:password@your-cluster.bonsaisearch.net
DEFAULT_INDEX=restaurants
ALLOWED_INDICES=restaurants
PORT=8080
HOST=0.0.0.0
```

| Variable | Default | Description |
|---|---|---|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Full URL (with credentials) of the ES/OpenSearch node |
| `DEFAULT_INDEX` | `restaurants` | Index name used when none is supplied in the request |
| `ALLOWED_INDICES` | `DEFAULT_INDEX` | Comma-separated whitelist of indices accepted by `/search` and `/filters` |
| `PORT` | `8080` | HTTP port the server listens on |
| `HOST` | `0.0.0.0` | Network interface to bind to |
| `CORS_ORIGINS` | unset | Comma-separated list of allowed origins. If unset, requests from any origin are accepted |
| `LOG_LEVEL` | `info` in dev, `warn` in production | Fastify logger level |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per IP within the rate-limit window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window in milliseconds |
| `FILTERS_CACHE_TTL_MS` | `300000` | Cache TTL for the `/filters` response in milliseconds |

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
npm dev
# or
yarn dev
```

The development server starts with `nodemon`. The `start` script also enables the `DEBUG=elasticsearch-restaurants-aggregations-api-nodejs*` namespace, while Fastify logs via its built-in logger. You should see:

```
Server listening at http://0.0.0.0:8080
```

### Start without nodemon

```bash
npm run start
# or
yarn start
```

### Run tests

```bash
npm test
# or
yarn test
```

---

## Testing Locally with curl

```bash
# Welcome
curl http://localhost:8080/

# Health check
curl http://localhost:8080/health

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

- Allowed CORS origins are controlled by `CORS_ORIGINS`. If the variable is unset, requests from any origin are accepted.
- `/filters` uses an in-memory cache with a 5-minute default TTL. Adjust it with `FILTERS_CACHE_TTL_MS`.
- Rate limiting is enabled by default at `100` requests per minute per IP. Adjust it with `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`.
- The `sleep` field in the `/search` body adds a 5-second artificial delay when its value is truthy. It is useful for UI loading-state tests, but it should stay disabled in public-facing environments.
- `size` is capped at **50** records per request. Invalid, zero, negative, or too-large values fall back to the default (`24`). Negative or invalid `from` values fall back to `0`.
- `GET /doc/:id` is a debug-only route and currently bypasses the index whitelist used by `/search` and `/filters`.
- If you use a **Bonsai.io v7.10** cluster with the legacy `@elastic/elasticsearch` client you may encounter `ProductNotSupportedError`. Switching to `@opensearch-project/opensearch` (already used in this project) resolves the issue.


## Related projects

| Project | Description |
| --- | --- |
| [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker) | Cloudflare Worker port of the restaurants geo-search API, keeping behaviour parity with the Node.js backend for edge deployment. |
| [Elasticsearch-Restaurants-Api-NodeJs](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-NodeJs) | Fastify-based geo-search backend for restaurant data on OpenSearch/Elasticsearch, used by the map UI. |
| [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) | Static single-page map interface for finding nearby restaurants with Google Maps and a compatible geo-search backend. |
