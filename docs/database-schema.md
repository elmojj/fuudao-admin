# 数据表结构

> **说明：** 本仓库为纯前端项目，以下表结构根据 `src/app/request/` 中的 TypeScript 接口 **逆向推断**，推断的后端表名以 API 路径和业务语义命名，实际数据库实现可能有所不同。

## 实体关系总览

```
bag_category (福袋分类)
    │
    └──< bag (福袋)
            │
            ├──< bag_item (福袋内赏品) ──> item_level (赏品等级)
            │         │
            │         └──> stockpile (赏品库存)
            │
            ├──> bag_item (everyPrizeItemId)  保底赏
            └──> bag_item (lastPrizeItemId)   终极赏

user (用户)
    │
    ├──< order (订单) ──> bag (福袋)
    │       │
    │       └── lottery_result (抽奖结果，内嵌)
    │
    ├──< user_address (用户地址)
    └──< logistics (物流单) ──> grab_bag_index (中奖记录)
```

---

## 1. stockpile — 赏品库存

**API：** `v1/stockpile/list`、`v1/stockpile/createOrUpdate`  
**类型定义：** `src/app/request/lottery-list.ts` → `GetLotteryListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| productName | string | 赏品名称 |
| productCode | string | 赏品编码 |
| productPhoto | string | 赏品图片 URL |
| price | string | 价格 |
| stockpileCount | string | 库存数量 |
| stockpileSaleTotal | string | 已售总量 |
| status | number | 状态（1=启用, 2=禁用） |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |

---

## 2. bag_category — 福袋分类

**API：** `features/v1/bag_category/list`、`features/v1/bag_category/createOrUpdate`  
**类型定义：** `src/app/request/bag-category-list.ts` → `GetBagCategoryListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| categoryName | string | 分类名称 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

---

## 3. bag — 福袋（抽赏包）

**API：** `features/v1/bag/list`、`features/v1/bag/createOrUpdate`  
**类型定义：** `src/app/request/bag-list.ts` → `GetBagListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| categoryId | string | 外键 → bag_category.id |
| categoryName | string | 分类名称（关联查询） |
| packageName | string | 福袋名称 |
| cover | string | 封面图 URL |
| sharePhoto | string | 分享图 URL |
| price | string | 单价 |
| startTime | string | 开售时间 |
| endTime | string | 结束时间 |
| totalPackage | string | 总包数 |
| hasEveryPrize | boolean | 是否有保底赏 |
| everyPrizeItemId | string | 外键 → bag_item.id（保底赏） |
| everyPrizeCount | string | 保底触发次数 |
| everyPrizeItem | object | 保底赏品信息（关联查询） |
| hasLastPrize | boolean | 是否有终极赏 |
| lastPrizeItemId | string | 外键 → bag_item.id（终极赏） |
| lastPrizeItem | object | 终极赏品信息（关联查询） |
| limitBuy | string | 限购数量 |
| status | boolean | 状态 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

---

## 4. item_level — 赏品等级

**API：** `features/v1/item_level/list`、`createOrUpdate`、`delete`  
**类型定义：** `src/app/request/lottery-list.ts` → `GetLotteryLevelListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| levelName | string | 等级名称（如 A赏、B赏） |
| levelType | number | 等级类型：1=普通赏, 2=保底赏, 3=终极赏 |
| status | number | 状态（1=启用, 0=禁用） |
| sort | number | 排序 |

---

## 5. bag_item — 福袋内赏品

**API：** `features/v1/item/list`、`createOrUpdate`、`batchCreateOrUpdate`、`delete`  
**类型定义：** `src/app/request/bag-lottery-list.ts`、`bag-item.ts`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| grabBagId | string | 外键 → bag.id |
| itemName | string | 赏品名称 |
| levelId | string | 外键 → item_level.id |
| levelName | string | 等级名称（关联查询） |
| itemCover | string | 赏品封面 URL |
| stockId | string | 外键 → stockpile.id |
| totalCount | string | 总数量 |
| sendCount | string | 已发出数量 |
| surplusCount | string | 剩余数量 |
| referPrice | string | 参考价格 |
| stockPrice | string | 库存价格 |
| probRate | string | 概率权重 |
| sort | string | 排序 |
| extJson | string | 扩展 JSON |
| status | number | 状态（1=启用, 2=禁用） |
| bagInfo | object | 所属福袋信息（关联查询） |

---

## 6. user — 用户

**API：** `features/v1/user/list`、`features/v1/user/get`  
**类型定义：** `src/app/request/user-manager.ts` → `GetUserListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| phoneNumber | string | 手机号 |
| nickname | string | 昵称 |
| avatar | string | 头像 URL |
| appid | string | 微信 AppID |
| openid | string | 微信 OpenID |
| unionid | string | 微信 UnionID |
| sessionKey | string | 会话密钥 |
| accessToken | string | 访问令牌 |
| userGroupName | string | 用户分组名称 |
| createdAt | string | 注册时间 |
| updatedAt | string | 更新时间 |
| stats | object | 消费统计（见下表） |
| address | object | 默认收货地址（见下表） |
| tags | array | 用户标签（见下表） |

### user.stats — 消费统计（内嵌）

| 字段 | 类型 | 说明 |
|------|------|------|
| buyAmountTotal | number | 累计消费金额 |
| buyTotal | number | 累计购买次数 |
| rewardTotal | number | 累计中奖次数 |

### user.address — 默认收货地址（内嵌）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 地址 ID |
| userId | string | 外键 → user.id |
| consignee | string | 收件人 |
| phoneNumber | string | 联系电话 |
| province | string | 省 |
| city | string | 市 |
| area | string | 区 |
| address | string | 详细地址 |
| zipcode | string | 邮编 |
| isDefault | number | 是否默认 |
| status | number | 状态 |

### user.tags — 用户标签（内嵌数组）

| 字段 | 类型 | 说明 |
|------|------|------|
| cate | string | 标签分类 |
| cateVal | string | 分类值 |
| tagName | string | 标签名称 |

---

## 7. order — 订单

**API：** `features/v1/order/list`、`createOrUpdate`、`batch_create_logistics`  
**类型定义：** `src/app/request/order-list.ts` → `GetOrderListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键（订单号） |
| grabBagId | string | 外键 → bag.id |
| buyUserId | string | 外键 → user.id |
| logisticsId | string | 外键 → logistics.id |
| transactionId | string | 支付交易号 |
| totalCount | string | 购买数量 |
| totalPrice | string | 订单总价 |
| price | string | 单价 |
| status | number | 订单状态（见状态枚举） |
| grabBagIndex | string[] | 抽中的位置索引列表 |
| lotteryResult | array | 抽奖结果详情（见下表） |
| user | object | 买家信息（关联查询） |
| bagInfo | object | 福袋信息（关联查询） |
| createdAt | string | 下单时间 |
| updatedAt | string | 更新时间 |

### order.lotteryResult — 抽奖结果（内嵌数组）

| 字段 | 类型 | 说明 |
|------|------|------|
| grabBagItemId | string | 外键 → bag_item.id |
| grabBagIndexId | string | 中奖记录 ID |
| index | number | 抽中位置 |
| itemName | string | 赏品名称 |
| itemCover | string | 赏品封面 |

### 订单状态枚举

| 值 | 含义 |
|----|------|
| 1 | 待支付 |
| 2 | 已支付 |
| 3 | 超时待退款 |
| 4 | 超时取消 |
| 5 | 申请发货 |
| 6 | 申请发货待付款 |
| 7 | 已发货 |
| 8 | 已退款 |
| 9 | 已完成 |

---

## 8. logistics — 物流单

**API：** `features/v1/logistics/list`、`update`、`batch_delivery`、`batch_sign`、`export`  
**类型定义：** `src/app/request/logistic-list.ts` → `GetLogisticListType`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| userId | string | 外键 → user.id |
| orderIds | string | 关联订单 ID（逗号分隔） |
| indexIds | string | 关联中奖记录 ID |
| trackingNumber | string | 快递单号 |
| trackingToken | string | 物流追踪 Token |
| deliveryId | string | 快递公司 ID |
| deliveryName | string | 快递公司名称（关联查询） |
| consignee | string | 收件人 |
| phoneNumber | string | 联系电话 |
| province | string | 省 |
| city | string | 市 |
| area | string | 区 |
| address | string | 详细地址 |
| zipcode | string | 邮编 |
| price | string | 运费 |
| transactionId | string | 支付交易号 |
| status | number | 物流状态（见状态枚举） |
| indexInfo | array | 包含的中奖赏品（见下表） |
| userInfo | object | 用户信息（关联查询） |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### logistics.indexInfo — 中奖赏品（内嵌数组）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 中奖记录 ID |
| grabBagId | string | 福袋 ID |
| grabBagItemId | string | 赏品 ID |
| grabBagName | string | 福袋名称 |
| userId | string | 用户 ID |
| itemName | string | 赏品名称 |
| itemCover | string | 赏品封面 |
| levelId | string | 等级 ID |
| levelName | string | 等级名称 |
| index | number | 抽中位置 |
| status | number | 状态 |

### 物流状态枚举

| 值 | 含义 |
|----|------|
| 2 | 申请发货 |
| 3 | 已发货 |
| 4 | 已签收 |

---

## 9. delivery — 快递公司

**API：** `features/v1/logistics/delivery`  
**类型定义：** `src/app/request/logistic-list.ts` → `DeliveryType`

| 字段 | 类型 | 说明 |
|------|------|------|
| deliveryId | string | 快递公司 ID |
| deliveryName | string | 快递公司名称 |

---

## 10. system_user — 后台管理员（登录）

**API：** `system/user/login`、`system/user/getCaptcha`  
**类型定义：** `src/app/request/login/index.ts` → `UserInfoType`

| 字段 | 类型 | 说明 |
|------|------|------|
| userName | string | 用户名 |
| userEmail | string | 邮箱 |
| userPhone | string | 手机号 |
| userSex | string | 性别 |
| departmentId | string | 部门 ID |
| departmentName | string | 部门名称 |
