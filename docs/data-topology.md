# 数据交互拓扑

## 1. 系统架构总览

```mermaid
graph TB
    subgraph Frontend["前端 SPA (fuudao-antd-admin)"]
        Pages["业务页面<br/>pages/"]
        Request["API 层<br/>request/"]
        Store["Redux Store<br/>store/"]
        Axios["Axios 封装<br/>request.ts"]
    end

    subgraph Backend["后端 API 服务"]
        API["adminapiv2.fuudao.cn"]
        SystemAPI["系统接口<br/>system/*"]
        FeatureAPI["业务接口<br/>features/v1/*"]
        StockAPI["库存接口<br/>v1/stockpile/*"]
        PortalAPI["门户接口<br/>portal/*"]
        FileAPI["文件上传<br/>file/upload"]
    end

    Pages --> Request
    Pages --> Store
    Request --> Axios
    Store --> Request
    Axios -->|HTTPS + Bearer Token| API
    API --> SystemAPI
    API --> FeatureAPI
    API --> StockAPI
    API --> PortalAPI
    API --> FileAPI
```

## 2. 请求链路

```mermaid
sequenceDiagram
    participant Page as 业务页面
    participant API as request/*.ts
    participant Host as host-app.ts
    participant Axios as request.ts
    participant Server as 后端 API

    Page->>API: 调用业务函数
    API->>Host: postRequest / getRequest
    Host->>Axios: 发起 HTTP 请求
    Note over Axios: 注入 Authorization: Bearer {token}
    Axios->>Server: POST/GET BASE_URL + endpoint
    Server-->>Axios: { code, data, message }
    Axios-->>Host: 响应数据
    alt code === 200
        Host-->>API: 成功
        API-->>Page: { status: 'Success', list/total }
    else code === 401
        Axios->>Page: 跳转登录页
    else 其他错误
        Host-->>API: 失败
        API-->>Page: { status: 'Fail', errorMessage }
    end
```

### 响应格式

**新业务接口：**
```json
{
  "code": 200,
  "data": { "total": 100, "lists": [...] },
  "message": "success"
}
```

**遗留 Portal 接口：**
```json
{
  "json_ok": true,
  "json_msg": "success",
  "values": {}
}
```

## 3. API 端点与页面对应关系

```mermaid
graph LR
    subgraph 认证
        Login["登录页"] -->|POST| L1["system/user/login"]
        Login -->|GET| L2["system/user/getCaptcha"]
    end

    subgraph 赏品管理
        LotteryList["赏品库存"] -->|GET| S1["v1/stockpile/list"]
        LotteryList -->|POST| S2["v1/stockpile/createOrUpdate"]
        BagList["福袋列表"] -->|POST| B1["features/v1/bag/list"]
        BagList -->|POST| B2["features/v1/bag/createOrUpdate"]
        BagCategory["福袋类别"] -->|POST| BC1["features/v1/bag_category/*"]
        BagLevel["赏品等级"] -->|POST| IL1["features/v1/item_level/*"]
        CreateBag["创建福袋"] -->|POST| I1["features/v1/item/*"]
    end

    subgraph 交易履约
        OrderList["订单列表"] -->|POST| O1["features/v1/order/list"]
        OrderList -->|POST| O2["features/v1/order/batch_create_logistics"]
        LogisticList["物流列表"] -->|POST| LG1["features/v1/logistics/*"]
    end

    subgraph 用户
        UserList["用户列表"] -->|POST| U1["features/v1/user/list"]
        UserDetail["用户详情"] -->|POST| U2["features/v1/user/get"]
    end
```

## 4. 完整 API 端点清单

### 4.1 系统/认证

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `system/user/login` | POST | 用户登录 | 登录页 |
| `system/user/getCaptcha` | GET | 获取验证码 | 登录页 |
| `/logout` | POST | 退出登录 | 布局头部 |
| `portal/pingLogin` | POST | 心跳保活 | 登录后（已禁用） |
| `portal/getUserConfigValues` | POST | 读取用户配置 | 遗留 |
| `portal/setUserConfigValue` | POST | 写入用户配置 | 遗留 |
| `file/upload` | POST | 文件上传 | 赏品/福袋图片上传 |

### 4.2 赏品库存

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `v1/stockpile/list` | GET | 库存列表 | 赏品库存页、Redux 预加载 |
| `v1/stockpile/createOrUpdate` | POST | 创建/编辑库存 | 赏品库存页 |

### 4.3 福袋管理

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `features/v1/bag/list` | POST | 福袋列表 | 福袋列表页、Redux 预加载 |
| `features/v1/bag/createOrUpdate` | POST | 创建/编辑福袋 | 福袋列表页、创建福袋页 |
| `features/v1/bag_category/list` | POST | 分类列表 | 福袋类别页 |
| `features/v1/bag_category/createOrUpdate` | POST | 创建/编辑分类 | 福袋类别页 |

### 4.4 赏品等级与福袋内赏品

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `features/v1/item_level/list` | POST | 等级列表 | 赏品等级页、Redux 预加载 |
| `features/v1/item_level/createOrUpdate` | POST | 创建/编辑等级 | 赏品等级页 |
| `features/v1/item_level/delete` | POST | 删除等级 | 赏品等级页 |
| `features/v1/item/list` | POST | 福袋内赏品列表 | 创建福袋页 |
| `features/v1/item/createOrUpdate` | POST | 创建/编辑赏品 | 创建福袋页 |
| `features/v1/item/batchCreateOrUpdate` | POST | 批量创建/编辑 | 创建福袋页 |
| `features/v1/item/delete` | POST | 删除赏品 | 创建福袋页 |

### 4.5 订单

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `features/v1/order/list` | POST | 订单列表 | 订单列表页 |
| `features/v1/order/createOrUpdate` | POST | 编辑订单 | 订单列表页 |
| `features/v1/order/batch_create_logistics` | POST | 批量创建物流单 | 订单列表页 |

### 4.6 物流

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `features/v1/logistics/list` | POST | 物流列表 | 物流列表页 |
| `features/v1/logistics/update` | POST | 更新物流单 | 物流列表页 |
| `features/v1/logistics/batch_delivery` | POST | 批量发货 | 物流列表页 |
| `features/v1/logistics/batch_sign` | POST | 批量签收 | 物流列表页 |
| `features/v1/logistics/export` | POST | 导出物流数据 | 物流列表页 |
| `features/v1/logistics/delivery` | POST | 快递公司列表 | Redux 预加载、物流页 |

### 4.7 用户

| 端点 | 方法 | 用途 | 调用方 |
|------|------|------|--------|
| `features/v1/user/list` | POST | 用户列表 | 用户列表页 |
| `features/v1/user/get` | POST | 用户详情 | 用户详情页 |

## 5. 实体数据流

### 5.1 福袋配置流程

```mermaid
flowchart TD
    A[创建福袋分类] -->|bag_category/createOrUpdate| B[bag_category]
    C[维护赏品库存] -->|stockpile/createOrUpdate| D[stockpile]
    E[配置赏品等级] -->|item_level/createOrUpdate| F[item_level]
    
    B --> G[创建福袋]
    G -->|bag/createOrUpdate| H[bag]
    H --> I[配置福袋内赏品]
    D --> I
    F --> I
    I -->|item/batchCreateOrUpdate| J[bag_item]
    
    H -->|设置保底赏/终极赏| K[everyPrizeItemId / lastPrizeItemId]
    J --> K
```

### 5.2 交易履约流程

```mermaid
flowchart LR
    subgraph 用户端
        U[用户] -->|购买福袋| O[创建订单]
    end

    subgraph 后台管理
        O -->|order/list| OL[订单列表]
        OL -->|batch_create_logistics| LG[创建物流单]
        LG -->|logistics/list| LL[物流列表]
        LL -->|batch_delivery| SHIP[发货]
        SHIP -->|batch_sign| SIGN[签收]
    end

    O -.->|status: 1→2→5→7→9| OL
    LG -.->|status: 2→3→4| LL
```

### 5.3 订单状态流转

```mermaid
stateDiagram-v2
    [*] --> 待支付: 创建订单
    待支付 --> 已支付: 支付成功
    待支付 --> 超时取消: 超时
    待支付 --> 超时待退款: 超时(已付款)
    超时待退款 --> 已退款: 退款完成
    已支付 --> 申请发货: 用户申请
    申请发货 --> 申请发货待付款: 需付运费
    申请发货 --> 已发货: 后台发货
    申请发货待付款 --> 已发货: 付款后发货
    已发货 --> 已完成: 签收
    已支付 --> 已退款: 退款
```

## 6. Redux 全局缓存拓扑

```mermaid
graph TB
    subgraph 布局初始化
        Saga["baseSaga.initializeLayoutMain"]
    end

    Saga -->|getBagList| BM["bagListMap<br/>{ id → Bag }"]
    Saga -->|getLotteryList| LM["lotteryListMap<br/>{ productName → Stockpile }"]
    Saga -->|getLotteryLevelList| LL["lotteryLevelList<br/>ItemLevel[]"]
    Saga -->|GetDeliveryList| DL["deliveryList<br/>Delivery[]"]

    subgraph 消费方
        CreateBag["创建福袋页"]
        OrderList["订单列表页"]
        LogisticList["物流列表页"]
    end

    BM --> CreateBag
    LM --> CreateBag
    LL --> CreateBag
    DL --> LogisticList
    BM --> OrderList
```

## 7. 认证与鉴权流

```mermaid
sequenceDiagram
    participant User as 管理员
    participant Login as 登录页
    participant API as 后端
    participant LS as localStorage
    participant App as 业务页面

    User->>Login: 输入账号密码验证码
    Login->>API: POST system/user/login
    API-->>Login: { token }
    Login->>LS: 存储 token
    Login->>App: 跳转主布局
    App->>API: 业务请求 (Bearer token)
    
    alt Token 有效
        API-->>App: 正常响应
    else Token 过期 (401)
        API-->>App: 401 Unauthorized
        App->>Login: 重定向登录页
    end
```

## 8. 文件上传流

```mermaid
flowchart LR
    A[赏品/福袋表单] -->|选择图片| B[uploadRequest]
    B -->|POST file/upload| C[后端文件服务]
    C -->|返回 URL| D[表单字段 productPhoto/cover]
    D -->|createOrUpdate| E[保存实体]
```
