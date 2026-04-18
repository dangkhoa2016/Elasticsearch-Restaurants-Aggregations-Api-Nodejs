# Elasticsearch Restaurants Aggregations API (Node.js)

> 🌐 Language / Ngôn ngữ: [English](README.md) | **Tiếng Việt**

## Giới thiệu

Một REST API được xây dựng bằng **Fastify** và **Node.js**, minh hoạ cách sử dụng Elasticsearch/OpenSearch để tìm kiếm và lọc dữ liệu nhà hàng thông qua aggregation. Dự án này đóng vai trò backend cho giao diện [Elasticsearch-Restaurants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-UI).

## Công nghệ sử dụng

| Tầng | Công nghệ |
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

## Cấu trúc dự án

```
app/
├── index.js                  # Khởi tạo server Fastify, đăng ký plugin
├── routes/
│   ├── home.js               # Route GET /, GET /health và favicon
│   ├── elasticsearch.js      # POST /search, GET /filters, GET /doc/:id
│   └── errors.js             # Xử lý lỗi 404 / 500
└── services/
    ├── aggregations.config.js   # Định nghĩa tĩnh cho aggregation/filter
    ├── elasticsearch_client.js  # Khởi tạo OpenSearch client
    ├── helper.js                # Hàm build query và map filter cho UI
    └── logger.js                # Hook lifecycle request/response
bin/
└── www                       # Entry point – nạp .env.local và khởi động server
test/
└── helper.test.js            # Unit test cho helper/service
```

## API Endpoints

### `GET /`
Thông báo chào mừng.

```json
{ "message": "Welcome to Elasticsearch Restaurants Aggregations Api Nodejs." }
```

---

### `GET /health`
Endpoint health-check gọn nhẹ cho load balancer hoặc monitoring.

```json
{ "status": "ok", "timestamp": "2026-04-18T12:34:56.789Z" }
```

---

### `GET /filters?index=<index>`
Trả về toàn bộ bộ lọc aggregation cho giao diện người dùng (bang/tiểu bang, thành phố, món ăn, phong cách ẩm thực, toggle boolean, v.v.). Kết quả được cache trong bộ nhớ với TTL mặc định 5 phút.

**Query params**

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `index` | `restaurants` | Index Elasticsearch cần lấy aggregation. Giá trị phải nằm trong `ALLOWED_INDICES`. |

---

### `POST /search`
Tìm kiếm nhà hàng với các bộ lọc, sắp xếp và phân trang tuỳ chọn. Giá trị `index` sẽ được kiểm tra với `ALLOWED_INDICES` trước khi gửi truy vấn tới OpenSearch.

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

**Các trường top-level của request**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `index` | `string` | Index cần truy vấn. Mặc định là `DEFAULT_INDEX` và phải được cho phép trong `ALLOWED_INDICES`. |
| `size` | `string \| number` | Kích thước trang. Giá trị không hợp lệ, bằng `0`, âm, hoặc lớn hơn `50` sẽ rơi về `24`. |
| `from` | `string \| number` | Offset phân trang. Giá trị không hợp lệ hoặc âm sẽ rơi về `0`. |
| `sorts` | `object` | Map sắp xếp theo dạng `{ tenTruong: "asc" \| "desc" \| "0" }`. Giá trị `"0"` sẽ bị bỏ qua. |
| `queries` | `object` | Payload bộ lọc như bảng bên dưới. |
| `sleep` | `boolean \| string \| null` | Tuỳ chọn debug/test. Nếu là giá trị truthy, API sẽ trì hoãn 5 giây trước khi gọi OpenSearch. |

**Các khoá filter trong `queries`**

| Khoá | Kiểu | Mô tả |
|---|---|---|
| `all_states` | `string[]` | Lọc theo bang/tiểu bang (vd. `AU-NSW`) |
| `most_density_cities` | `string[]` | Lọc theo thành phố |
| `primary_cuisines` | `string[]` | Lọc theo món ăn chính |
| `most_serve_dining_styles` | `string[]` | Lọc theo phong cách ẩm thực phổ biến nhất |
| `least_serve_dining_styles` | `string[]` | Lọc theo phong cách ẩm thực ít phổ biến nhất |
| `yes_no_features_bar` | `"0"` \| `"1"` | `0` = không có bar, `1` = có bar |
| `yes_no_takeout` | `"0"` \| `"1"` | `0` = không có takeout, `1` = có takeout |
| `missing_legacy_photos` | `"1"` \| `"2"` | `1` = có ảnh cũ, `2` = không có ảnh cũ |
| `has_order_online_links` | `"1"` \| `"2"` | `1` = có link đặt online, `2` = không có |
| `published_on` | `{ start, end }` | Lọc theo khoảng thời gian |
| `searchText` | object | Tìm kiếm toàn văn bản (xem bên dưới) |

**Các trường và phương thức của `searchText`**

| `field` | `method` | Hành vi |
|---|---|---|
| `name` | `0` (mặc định) | `match` |
| `name` | `1` | Bắt đầu bằng (`lowercase_starts_with_text`) |
| `name` | `2` | Kết thúc bằng (`lowercase_ends_with_text`) |
| `name` | `3` | Khớp chính xác (chữ thường) |
| `name` | `4` | Khớp keyword chính xác |
| `description` | `0` (mặc định) | `match` |
| `description` | `1` | `match_phrase_prefix` |
| `description` | `3` | `match` với `operator: and` |
| `description` | `4` | `match_phrase` |
| `contact_phone` | `0` (mặc định) | `match_phrase` |
| `contact_phone` | `1` | Wildcard bắt đầu bằng |
| `contact_phone` | `2` | Wildcard kết thúc bằng |
| `contact_phone` | `3` | Wildcard chứa chuỗi |
| `contact_phone` | `4` | Khớp term chính xác |
| `address_line1` | `0` (mặc định) | `match_phrase` |
| `address_line1` | `1` | `prefix` |
| `address_line1` | `3` | `match_phrase_prefix` |
| `address_line1` | `4` | `match_phrase` trên keyword |

---

### `GET /doc/:id?index=<index>&_source=<bool>`
Lấy một tài liệu nhà hàng theo `_id` của Elasticsearch. Route này chỉ nên dùng để debug và hiện tại không áp dụng whitelist `ALLOWED_INDICES`, vì vậy không nên public nếu chưa có lớp bảo vệ bổ sung.

---

### `GET /404` / `GET /500`
Trả về ví dụ phản hồi lỗi để kiểm tra các error handler.

```json
{ "error": "Not Found", "message": "The requested route does not exist." }
```

```json
{ "error": "Internal Server Error", "message": "An unexpected error occurred." }
```

---

## Biến môi trường

Sao chép `.env.sample` thành `.env.local` và điền thông tin của bạn:

```env
ELASTICSEARCH_URL=https://user_name:password@your-cluster.bonsaisearch.net
DEFAULT_INDEX=restaurants
ALLOWED_INDICES=restaurants
PORT=8080
HOST=0.0.0.0
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | URL đầy đủ (kèm thông tin xác thực) của node ES/OpenSearch |
| `DEFAULT_INDEX` | `restaurants` | Tên index dùng khi request không truyền index |
| `ALLOWED_INDICES` | `DEFAULT_INDEX` | Danh sách index hợp lệ, phân tách bằng dấu phẩy, cho `/search` và `/filters` |
| `PORT` | `8080` | Cổng HTTP server lắng nghe |
| `HOST` | `0.0.0.0` | Interface mạng cần bind |
| `CORS_ORIGINS` | không đặt | Danh sách origin được phép, phân tách bằng dấu phẩy. Nếu không đặt thì mọi origin đều được chấp nhận |
| `LOG_LEVEL` | `info` ở dev, `warn` ở production | Mức log của Fastify logger |
| `RATE_LIMIT_MAX` | `100` | Số request tối đa mỗi IP trong một cửa sổ rate limit |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Độ dài cửa sổ rate limit tính bằng mili giây |
| `FILTERS_CACHE_TTL_MS` | `300000` | TTL cache cho endpoint `/filters`, tính bằng mili giây |

> `.env.local` được nạp tự động khi `NODE_ENV` khác `production`.

---

## Cài đặt local

### Yêu cầu

- Node.js >= 18
- npm hoặc yarn
- Một instance Elasticsearch hoặc OpenSearch đang chạy (local Docker hoặc hosted, vd. [Bonsai](https://bonsai.io))

### Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### Cấu hình môi trường

```bash
cp .env.sample .env.local
# Chỉnh sửa .env.local với URL Elasticsearch và cổng mong muốn
```

### Khởi động server phát triển

```bash
npm dev
# hoặc
yarn dev
```

Server phát triển chạy với `nodemon`. Script `start` cũng bật namespace `DEBUG=elasticsearch-restaurants-aggregations-api-nodejs*`, đồng thời Fastify vẫn ghi log qua logger tích hợp. Bạn sẽ thấy:

```
Server listening at http://0.0.0.0:8080
```

### Chạy không dùng nodemon

```bash
npm run start
# hoặc
yarn start
```

### Chạy test

```bash
npm test
# hoặc
yarn test
```

---

## Kiểm tra bằng curl

```bash
# Trang chủ
curl http://localhost:8080/

# Health check
curl http://localhost:8080/health

# Lấy tất cả bộ lọc
curl http://localhost:8080/filters

# Tìm kiếm cơ bản (không có filter)
curl -X POST http://localhost:8080/search \
  -H 'Content-Type: application/json' \
  --data '{"queries":{},"sorts":{},"from":0,"size":24}'

# Tìm kiếm với filter bang + thành phố
curl -X POST http://localhost:8080/search \
  -H 'Content-Type: application/json' \
  --data '{"queries":{"all_states":["AU-NSW"],"most_density_cities":["Sydney"]},"sorts":{},"from":0,"size":24}'

# Ví dụ filter đầy đủ
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

# Lấy một tài liệu theo ID
curl http://localhost:8080/doc/53516

# Kiểm tra error handler
curl http://localhost:8080/404
curl http://localhost:8080/500
```

---

## Ghi chú

- Origin CORS được điều khiển bằng `CORS_ORIGINS`. Nếu biến này không được đặt thì mọi origin đều được chấp nhận.
- `/filters` dùng cache trong bộ nhớ với TTL mặc định 5 phút. Có thể chỉnh bằng `FILTERS_CACHE_TTL_MS`.
- Rate limiting được bật sẵn với mặc định `100` request mỗi phút cho mỗi IP. Có thể chỉnh bằng `RATE_LIMIT_MAX` và `RATE_LIMIT_WINDOW_MS`.
- Trường `sleep` trong body `/search` sẽ thêm độ trễ nhân tạo 5 giây nếu mang giá trị truthy. Nó hữu ích cho test trạng thái loading của UI, nhưng không nên bật ở môi trường public.
- `size` bị giới hạn tối đa **50** bản ghi mỗi request. Giá trị không hợp lệ, bằng `0`, âm, hoặc quá lớn sẽ dùng giá trị mặc định (`24`). Giá trị `from` âm hoặc không hợp lệ sẽ rơi về `0`.
- `GET /doc/:id` là route debug và hiện đang bỏ qua whitelist index dùng ở `/search` và `/filters`.
- Nếu bạn dùng cluster **Bonsai.io v7.10** với client `@elastic/elasticsearch` cũ, bạn có thể gặp lỗi `ProductNotSupportedError`. Chuyển sang `@opensearch-project/opensearch` (đã được dùng trong dự án này) sẽ khắc phục vấn đề.

## Dự án liên quan

| Dự án | Mô tả |
| --- | --- |
| [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker) | Bản Cloudflare Worker của geo-search API cho nhà hàng, giữ parity hành vi với backend Node.js để triển khai ở edge. |
| [Elasticsearch-Restaurants-Api-NodeJs](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-NodeJs) | Backend geo-search viết bằng Fastify cho dữ liệu nhà hàng trên OpenSearch/Elasticsearch, dùng cho giao diện bản đồ. |
| [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) | Giao diện single-page tĩnh trên Google Maps để tìm nhà hàng gần đó với backend geo-search tương thích. |


