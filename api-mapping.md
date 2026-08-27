# 礼品商城 · 接口对照映射表

> 用途：前后端对齐统一规范  
> 基准：**以 `api.txt` 文档为后端标准**，「前端现状」来自当前代码实际调用  
> 状态说明：`✅ 可对接` | `⚠️ 需映射/改路径` | `❌ 文档缺失` | `⬜ 前端未实现` | `🚫 建议废弃`

---

## 1. 总览对照表

| # | 功能模块 | 前端现状路径 | 方法 | 文档标准路径 | 方法 | 对接状态 | 备注 |
|---|---------|-------------|------|-------------|------|---------|------|
| **首页** |
| 1.1 | 轮播图 | `GET /api/banners` | GET | — | — | ❌ | 文档需补充 |
| 1.2 | 首页分类 | `GET /api/categories` | GET | `GET api/v1/bag/category` | GET | ⚠️ | 路径+响应结构不同 |
| 1.3 | 首页分类（另一套） | `GET /api/goods/categories` | GET | `GET api/v1/bag/category` | GET | ⚠️ | 与 1.2 重复，应合并 |
| 1.4 | 热门商品 | `GET /api/products/hot` | GET | — | — | ❌ | 可用 `bag/list` + sort 替代，或文档补充 |
| 1.5 | 推荐商品 | `GET /api/products/recommend` | GET | — | — | ❌ | 同上 |
| **商品** |
| 2.1 | 商品列表 | `GET /api/goods/list` | GET | `GET api/v1/bag/list` | GET | ⚠️ | 入参/出参字段需映射 |
| 2.2 | 商品列表（另一套） | `GET /api/products` | GET | `GET api/v1/bag/list` | GET | ⚠️ | 与 2.1 重复，应废弃 🚫 |
| 2.3 | 商品详情（标准电商） | `GET /api/goods/detail/:id` | GET | `GET api/v1/bag/detail?id=` | GET | ⚠️ | REST vs Query 风格 |
| 2.4 | 商品详情（盲盒页） | `GET /api/products/:id` | GET | — | — | 🚫 | 业务模型不同，非文档范围 |
| 2.5 | 购买记录（盲盒） | `GET /api/products/:id/records` | GET | — | — | 🚫 | 文档无，盲盒专用 |
| 2.6 | 商品搜索 | — | — | `GET api/v1/bag/search` | GET | ⬜ | 搜索页为空，文档已有 |
| 2.7 | 评论列表 | — | — | `GET api/v1/bag/comments` | GET | ⬜ | 文档已有 |
| 2.8 | 评论详情 | — | — | `GET api/v1/bag/comment/detail` | GET | ⬜ | 文档已有 |
| **购物车** |
| 3.1 | 购物车列表 | 本地 `wx.storage` | — | `GET api/v1/getMyItems` | GET | ⬜ | 前端未接服务端 |
| 3.2 | 我的商品数量 | `fetchMyGoods()`（文件缺失） | GET | `GET api/v1/getMyItems` | GET | ⚠️ | 应对接 3.1 |
| 3.3 | 加入购物车 | 本地 `wx.storage` | — | `POST api/v1/cart/add` | POST | ⬜ | 需传 `goodId/skuId/quantity` |
| 3.4 | 更新购物车 | 本地 `wx.storage` | — | `POST api/v1/cart/update` | POST | ⬜ | |
| 3.5 | 删除购物车 | 本地 `wx.storage` | — | `POST api/v1/cart/delete` | POST | ⬜ | |
| **订单** |
| 4.1 | 订单列表 | `GET /api/order/list` | GET | `GET api/v1/orders` | GET | ⚠️ | 状态枚举/分页参数不同 |
| 4.2 | 订单列表（另一套） | `getOrderList(['2','5','7'])`（文件缺失） | GET | `GET api/v1/orders?status=` | GET | ⚠️ | 数字状态 vs 字符串枚举 |
| 4.3 | 订单详情 | `GET /api/order/detail/:id` | GET | `GET api/v1/orders/:id` | GET | ⚠️ | |
| 4.4 | 创建订单 | `POST /api/order/create` | POST | `POST api/v1/orders` | POST | ⚠️ | 入参字段需映射 |
| 4.5 | 取消订单 | `PUT /api/order/cancel/:id` | PUT | `PUT api/v1/orders/:id` `{status:'CANCELLED'}` | PUT | ⚠️ | 语义相同，路径不同 |
| 4.6 | 支付订单 | `POST /api/order/pay/:id` | POST | — | — | ❌ | 文档需补充（微信支付） |
| 4.7 | 订单评价 | — | — | `POST api/v1/orders/:id/comment` | POST | ⬜ | 文档已有 |
| 4.8 | 发货列表 | `getShipmentList()`（文件缺失） | GET | — | — | ❌ | 文档需补充 |
| **用户** |
| 5.1 | 微信登录 | `POST /api/user/login` `{code}` | POST | `POST api/v1/user/auth_wechat` | POST | ⚠️ | 入参差异大 |
| 5.2 | 用户信息 | `GET /api/user/info` | GET | `GET api/v1/user/profile` | GET | ⚠️ | 字段命名不同 |
| 5.3 | 更新用户信息 | `PUT /api/user/info` | PUT | — | — | ❌ | 文档需补充 PATCH profile |
| 5.4 | 用户中心 | `fetchUserCenter()`（文件缺失） | — | `GET api/v1/user/profile` | GET | ⚠️ | 应对接 5.2 |
| **地址** |
| 6.1 | 地址列表 | `GET /api/address/list` | GET | `GET api/v1/addresses` | GET | ⚠️ | 字段命名不同 |
| 6.2 | 地址详情 | — | — | `GET api/v1/addresses/:id` | GET | ⬜ | 文档已有 |
| 6.3 | 创建地址 | `POST /api/address/add` | POST | `POST api/v1/addresses` | POST | ⚠️ | |
| 6.4 | 更新地址 | `PUT /api/address/update/:id` | PUT | `PUT api/v1/addresses/:id` | PUT | ⚠️ | |
| 6.5 | 删除地址 | `DELETE /api/address/delete/:id` | DELETE | `DELETE api/v1/addresses/:id` | DELETE | ⚠️ | |
| 6.6 | 设为默认 | `PUT /api/address/set-default/:id` | PUT | `PUT api/v1/addresses/:id` `{isDefault:true}` | PUT | ⚠️ | 可合并到更新接口 |
| **其他** |
| 7.1 | 文件上传 | — | — | `POST /wechat/upload` | POST | ⬜ | 评价/头像等场景需要 |

---

## 2. 推荐统一路径（前后端对齐目标）

前端 `services/` 层建议**全部收敛**到以下路径：

| 模块 | 统一路径 | 方法 |
|------|---------|------|
| 分类 | `/api/v1/bag/category` | GET |
| 商品列表 | `/api/v1/bag/list` | GET |
| 商品详情 | `/api/v1/bag/detail` | GET |
| 商品搜索 | `/api/v1/bag/search` | GET |
| 评论列表 | `/api/v1/bag/comments` | GET |
| 评论详情 | `/api/v1/bag/comment/detail` | GET |
| 购物车列表 | `/api/v1/getMyItems` | GET |
| 加购 | `/api/v1/cart/add` | POST |
| 更新购物车 | `/api/v1/cart/update` | POST |
| 删除购物车 | `/api/v1/cart/delete` | POST |
| 订单列表 | `/api/v1/orders` | GET |
| 订单详情 | `/api/v1/orders/:id` | GET |
| 创建订单 | `/api/v1/orders` | POST |
| 取消订单 | `/api/v1/orders/:id` | PUT |
| 订单评价 | `/api/v1/orders/:id/comment` | POST |
| 微信登录 | `/api/v1/user/auth_wechat` | POST |
| 用户信息 | `/api/v1/user/profile` | GET |
| 地址列表 | `/api/v1/addresses` | GET |
| 地址详情 | `/api/v1/addresses/:id` | GET |
| 创建地址 | `/api/v1/addresses` | POST |
| 更新地址 | `/api/v1/addresses/:id` | PUT |
| 删除地址 | `/api/v1/addresses/:id` | DELETE |
| 文件上传 | `/wechat/upload` | POST |

### 待文档补充（前后端需协商）

| 接口 | 建议路径 | 说明 |
|------|---------|------|
| 轮播图 | `GET /api/v1/banners` | 首页必需 |
| 热门商品 | `GET /api/v1/bag/list?sort=sales_desc&size=10` 或独立接口 | 可复用列表 |
| 订单支付 | `POST /api/v1/orders/:id/pay` | 返回微信支付参数 |
| 发货/物流 | `GET /api/v1/shipments` | 用户中心「待发货/已发货」 |
| 更新用户信息 | `PUT /api/v1/user/profile` | 头像/昵称/手机号 |

---

## 3. 入参字段映射

### 3.1 商品列表

| 含义 | 前端现状 | 文档标准 | 对齐方案 |
|------|---------|---------|---------|
| 页码 | `page` | `page` | ✅ 一致 |
| 每页条数 | `pageSize` | `size` | 前端改传 `size` |
| 分类 ID | `category` | `categoryId` | 前端改传 `categoryId` |
| 关键词 | `keyword`（goodsApi） | —（搜索走独立接口） | 列表不传 keyword，搜索走 `/bag/search` |

### 3.2 商品搜索

| 含义 | 前端现状 | 文档标准 | 对齐方案 |
|------|---------|---------|---------|
| 关键词 | `searchValue`（页面变量） | `keyword` | 映射 |
| 页码 | — | `page` | 实现分页 |
| 每页条数 | — | `size` | 实现分页 |
| 排序 | — | `sort`: `price_asc` / `price_desc` / `sales_desc` | 新增 UI |

### 3.3 创建订单

| 含义 | 前端现状 | 文档标准 | 对齐方案 |
|------|---------|---------|---------|
| 商品项 | `items[].goodsId` | `items[].productId` | 统一用 `productId` |
| 数量 | `items[].quantity` | `items[].quantity` | ✅ |
| 地址 | `addressId` | `addressId` | ✅ |
| 备注 | — | `remark?` | 可选补充 |
| SKU | 前端有 `specId`/`skuId` | 文档未含 skuId | **需协商**：创建订单是否要 skuId |

### 3.4 购物车

| 含义 | 前端现状（localStorage） | 文档标准 | 对齐方案 |
|------|------------------------|---------|---------|
| 商品 ID | `id` | `goodId` | 映射 |
| SKU | `specId` | `skuId` | 映射 |
| 数量 | `quantity` | `quantity` | ✅ |
| 选中 | `selected` | `checked` | 映射 |
| 规格文案 | `specName` | `specifications[]` | 映射 |

### 3.5 微信登录

| 含义 | 前端现状 | 文档标准 | 对齐方案 |
|------|---------|---------|---------|
| 登录凭证 | `code` | `code` | ✅ |
| 加密数据 | — | `encryptedData` | 前端补充 |
| 初始向量 | — | `iv` | 前端补充 |
| 昵称 | — | `nickname` | 前端补充 |
| 头像 | — | `avatar` | 前端补充 |

### 3.6 订单列表

| 含义 | 前端现状 | 文档标准 | 对齐方案 |
|------|---------|---------|---------|
| 状态 | `status: number`（2/5/7） | `status: 'PENDING'\|'PAID'\|...` | **需协商枚举对照表** |
| 分页 | `pageSize` | `limit` | 前端改传 `limit` |

#### 建议订单状态映射（待后端确认）

| 前端数字状态 | 推测含义 | 文档枚举 |
|------------|---------|---------|
| `2` | 待发货 | `PAID` 或 `SHIPPED`? |
| `5` | 待收货? | `SHIPPED`? |
| `7` | 已完成? | `COMPLETED`? |

---

## 4. 出参字段映射

### 4.1 分类

| 含义 | 前端现状 | 文档标准 | 转换 |
|------|---------|---------|------|
| 列表容器 | 直接数组 `ICategory[]` | `{ categories: [...] }` | 取 `.categories` |
| 图标 | `iconUrl` | `icon` | `iconUrl = icon` |
| 状态 | — | `status` | 前端按需过滤 |

### 4.2 商品列表项

| 含义 | 前端现状 | 文档标准 | 转换 |
|------|---------|---------|------|
| 列表容器 | `{ list, total }` | `{ items, total, page, size, totalPages }` | `list = items` |
| 封面图 | `image` / `imageUrl` | `coverImage` | 统一前端字段 `coverImage` |
| 原价 | `originalPrice` | `originalPrice` | ✅ |
| 销量 | `sales` / `soldCount` | `soldCount` | 统一 `soldCount` |
| 库存 | `stock` | `totalCount` | 语义需确认 |
| 标签 | — | `tags?` | 可直接使用 |

### 4.3 商品详情

| 含义 | 前端现状（goods/detail mock） | 文档标准 | 转换 |
|------|------------------------------|---------|------|
| 图片列表 | `images[]` | 仅 `coverImage` | **需协商**是否补充 `images[]` |
| 规格 | `specs[{id,name,price,stock}]` | `specification[]` + `skus[]` | 前端按 SKU 组合渲染 |
| 副标题 | `subtitle` | — | 可用 `tags` 或文档补充 |
| 详情 HTML | `detail` | — | **需协商**富文本字段 |
| 评论摘要 | — | `comments{total,goodRate,items}` | 详情页可直接用 |

### 4.4 用户信息

| 含义 | 前端现状 | 文档标准 | 转换 |
|------|---------|---------|------|
| 昵称 | `nickName` | `nickname` | 大小写映射 |
| 头像 | `avatarUrl` | `avatar` | 映射 |
| 手机 | `phoneNumber` | `phone?` | 映射 |
| 用户 ID | `userId`（storage） | `id` | 映射 |

### 4.5 地址

| 含义 | 前端现状 / 页面 WXML | 文档标准 | 转换 |
|------|---------------------|---------|------|
| 收货人 | `name` | `consignee` | 双向映射 |
| 手机 | `phone` | `phoneNumber` | 双向映射 |
| 省市区 | `province/city/district` | `province/city/area` | `district ↔ area` |
| 详细地址 | `detail` | `address` | 映射 |
| 默认 | `isDefault` | `isDefault` | ✅ |
| 列表容器 | 直接数组 | `{ items: [...] }` | 取 `.items` |

### 4.6 订单

| 含义 | 前端现状 | 文档标准 | 转换 |
|------|---------|---------|------|
| 列表容器 | `{ list, total }` | `{ items, total, page, limit, totalPages }` | `list = items` |
| 订单号 | `orderNo` | `id` | 映射 |
| 状态 | `status: number` | `status: string enum` | 枚举对照 |
| 商品名 | `goodsName` | `product.name` | 嵌套取值 |
| 商品图 | `goodsImage` | `product.image` | 嵌套取值 |
| 商品 ID | `goodsId` / `productId` | `productId` | 统一 |
| 地址 | `name/phone/district` | `address.name/phone/district` | 字段已接近 |
| 物流 | — | `logistics?` | 详情页直接用 |

### 4.7 登录响应

| 含义 | 前端期望 | 文档标准 | 转换 |
|------|---------|---------|------|
| 响应结构 | `{ code, data: { token } }` | `{ code, data: { token, userId } }` | 同时存 token + userId |
| Token 头 | `Authorization: Bearer ${token}` | 文档未说明 | **需协商**认证方式 |

---

## 5. 响应包装格式

| 项目 | 前端 `utils/request.ts` 期望 | 文档示例 | 对齐建议 |
|------|---------------------------|---------|---------|
| 成功码 | `code === 0` | 登录接口 `code: number` | 统一 `0` 为成功 |
| 数据 | `data: T` | 部分接口直接返回对象 | 全部包在 `data` 内 |
| 错误信息 | `message` | 未明确 | 统一 `message` 字段 |
| HTTP 状态 | 200-299 视为成功 | — | 保持 |

---

## 6. 前端待废弃路径（避免双轨）

| 废弃路径 | 替换为 |
|---------|--------|
| `/api/banners` | 文档补充后统一，或临时 mock |
| `/api/categories` | `/api/v1/bag/category` |
| `/api/goods/*` | `/api/v1/bag/*` |
| `/api/products/*` | 盲盒业务单独模块；标准商品走 `/api/v1/bag/*` |
| `/api/user/login` | `/api/v1/user/auth_wechat` |
| `/api/user/info` | `/api/v1/user/profile` |
| `/api/order/*` | `/api/v1/orders` |
| `/api/address/*` | `/api/v1/addresses` |
| 购物车 localStorage | `/api/v1/cart/*` + `/api/v1/getMyItems` |

---

## 7. 前后端对齐 Checklist

### 后端（基于 api.txt 补充）

- [ ] 确认全局前缀是否为 `/api/v1`
- [ ] 补充：轮播图、订单支付、发货列表、更新用户信息
- [ ] 确认商品详情是否返回 `images[]`、富文本 `detail`
- [ ] 确认创建订单是否需要 `skuId`
- [ ] 提供订单数字状态 ↔ 字符串枚举对照表
- [ ] 确认 Token 传递方式（Header 名称、前缀）

### 前端

- [ ] 统一 `services/` 层，删除 `/api/goods`、`/api/products` 双轨
- [ ] 补全 `services/cart.ts`、`order.ts`、`user.ts`
- [ ] 修复 `http` → `request` 引用
- [ ] 购物车从 localStorage 迁移到服务端 API
- [ ] 实现搜索、登录、地址、评论页面 API 对接
- [ ] 在 service 层集中做字段映射，页面只消费统一类型

---

## 8. 相关文件索引

| 文件 | 说明 |
|------|------|
| `api.txt` | 后端 API 文档（标准） |
| `services/api.ts` | 前端 API 封装（待重构） |
| `services/banner.ts` | 轮播图 |
| `services/category.ts` | 分类 |
| `services/product.ts` | 商品（含盲盒路径） |
| `utils/request.ts` | 请求封装 |
| `pages/home/index.ts` | 首页 |
| `pages/category/index.ts` | 分类页 |
| `pages/cart/index.ts` | 购物车（本地存储） |
| `pages/user/index.ts` | 用户中心 |
| `pages/goods/detail/index.ts` | 标准商品详情（mock） |
| `pages/product/detail/index.ts` | 盲盒商品详情 |
| `pages/address/index.wxml` | 地址页 UI（逻辑未实现） |
| `pages/search/index.ts` | 搜索页（空） |
| `pages/login/index.ts` | 登录页（空） |
