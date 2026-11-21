# FORME — Fashion storefront

A responsive fashion shop hosted on GitHub Pages, backed by Cloudflare Worker + D1.

Live: https://gitoldor.github.io/3D-maps/

## Stack
- `index.html`: storefront, product filters, product details, local cart and checkout form.
- `worker.js`: JSON API for catalogue and pending order requests.
- `schema.sql`: D1 schema and starter product catalogue.
- Cloudflare D1 database: `sho1re1`
- Worker: `sho1re1-map-api`
- D1 binding: `DB`

## API routes
- `GET /api/health`
- `GET /api/categories`
- `GET /api/products` (optional `category` and `q` query parameters)
- `POST /api/orders`

## Tables
`categories`, `products`, `customers`, `orders`, `order_items`.

Prices are stored in whole INR rupees. Product sizes and colours are JSON arrays. Images currently use externally hosted Unsplash URLs; replace them with real product photography before launch.

## Orders
Checkout creates a pending order request and reserves stock. It does not take online payments. The store must contact the customer to confirm delivery and payment.

## Reset warning
Re-running `schema.sql` drops and recreates the store tables, deleting existing products, customers and orders. The previous map project schema and demo records were replaced during this rebuild.
