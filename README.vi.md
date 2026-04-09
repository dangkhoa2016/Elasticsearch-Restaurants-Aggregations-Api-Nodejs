# Elasticsearch Restaurants Aggregations API (Node.js)

> 🌐 Language / Ngôn ngữ: [English](README.md) | **Tiếng Việt**

## Giới thiệu

Một REST API được xây dựng bằng **Fastify** và **Node.js**, minh hoạ cách sử dụng Elasticsearch/OpenSearch để tìm kiếm và lọc dữ liệu nhà hàng thông qua aggregation. Dự án này đóng vai trò backend cho giao diện [Elasticsearch-Restautants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restautants-Aggregations-UI).

## Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Fastify v5 |
| Search engine | OpenSearch / Elasticsearch |
| ES Client | `@opensearch-project/opensearch` |
| Body parser | `qs` + `@fastify/formbody` |
| CORS | `@fastify/cors` |
| Dev server | nodemon |

## Cấu trúc dự án

```
app/
├── index.js                  # Khởi tạo server Fastify, đăng ký plugin
├── routes/
│   ├── home.js               # Route GET / và favicon
│   ├── elasticsearch.js      # POST /search, GET /filters, GET /doc/:id
│   └── errors.js             # Xử lý lỗi 404 / 500
└── services/
    ├── elasticsearch_client.js  # Khởi tạo OpenSearch client
    ├── helper.js                # Định nghĩa aggregation & xây dựng query
    └── logger.js                # Hook lifecycle request/response
bin/
└── www                       # Entry point – nạp .env.local và khởi động server
```

## API Endpoints

### `GET /`
Kiểm tra trạng thái server / thông báo chào mừng.

```json
{ "message": "Welcome to Elasticsearch Restaurants Aggregations Api Nodejs." }
```

---

### `GET /filters?index=<index>`
Trả về toàn bộ bộ lọc aggregation cho giao diện người dùng (bang/tiểu bang, thành phố, món ăn, phong cách ẩm thực, toggle boolean, v.v.).

**Query params**

| Tham số | Mặc định | Mô tả |
|---|---|---|
| `index` | `restaurants` | Index Elasticsearch cần lấy aggregation |

---

### `POST /search`
Tìm kiếm nhà hàng với các bộ lọc, sắp xếp và phân trang tuỳ chọn.

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
Lấy một tài liệu nhà hàng theo `_id` của Elasticsearch. Dùng để debug.

---

### `GET /404` / `GET /500`
Trả về ví dụ phản hồi lỗi để kiểm tra các error handler.

---

## Biến môi trường

Sao chép `.env.sample` thành `.env.local` và điền thông tin của bạn:

```env
ELASTICSEARCH_URL=https://user_name:password@your-cluster.bonsaisearch.net
DEFAULT_INDEX=restaurants
PORT=8080
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | URL đầy đủ (kèm thông tin xác thực) của node ES/OpenSearch |
| `DEFAULT_INDEX` | `restaurants` | Tên index dùng khi request không truyền index |
| `PORT` | `8080` | Cổng HTTP server lắng nghe |
| `HOST` | `0.0.0.0` | Interface mạng cần bind |

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
npm start
# hoặc
yarn start
```

Server khởi động với `nodemon` và bật log `DEBUG`. Bạn sẽ thấy:

```
Server listening at http://0.0.0.0:8080
```

---

## Kiểm tra bằng curl

```bash
# Trang chủ
curl http://localhost:8080/

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

- Server cho phép **tất cả CORS origin** theo mặc định. Hãy giới hạn origin trong `app/index.js` khi triển khai production.
- Trường `sleep` trong body `/search` thêm độ trễ nhân tạo 5 giây (hữu ích để kiểm tra trạng thái loading của UI).
- `size` bị giới hạn tối đa **50** bản ghi mỗi request; các giá trị ngoài khoảng `[1, 50]` sẽ dùng giá trị mặc định (`24`).
- Nếu bạn dùng cluster **Bonsai.io v7.10** với client `@elastic/elasticsearch` cũ, bạn có thể gặp lỗi `ProductNotSupportedError`. Chuyển sang `@opensearch-project/opensearch` (đã được dùng trong dự án này) sẽ khắc phục vấn đề.
