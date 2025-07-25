# 短链生成器 – Next.js 版本

## 产品需求文档（PRD v1.1）

## 1. 项目目标

为团队内部或公开场景提供极简短链服务：用户粘贴长链接 → 一键生成短链 → 短链 301 跳转到原地址。

## 2. 项目范围

• **最小可用版本（MVP）**仅支持「创建短链」与「跳转」两项功能
• 不做用户体系、不做统计、不做二维码
• **部署平台**：Vercel（利用 Serverless 函数 + Edge Runtime）
• **存储方案**：

- 开发环境：本地 JSON 文件存储
- 生产环境：Vercel KV（Redis）

## 3. 功能需求

### 3.1 创建短链

**页面路径**：`/`

**UI组件**：

- 输入框：单行文本，placeholder="粘贴长链接"，maxLength=2048，自动 trim
- 按钮：文字「生成短链」，点击后禁用 2s 防止重复提交
- 结果展示：短链生成后显示在输入框下方，可一键复制
- 重置按钮：「再建一个」按钮清空输入框和结果

**校验规则**：

- 前端校验：非空、长度 ≥ 10、必须 http/https 开头（正则：`/^https?:\/\/.+/i`）
- 后端二次校验：URL 格式验证，返回 400 错误

**短码生成**：

- 6 位字符：大小写字母 + 数字（62^6 ≈ 568 亿种组合）
- 使用 `nanoid(6)` 生成
- 冲突处理：重试最多 5 次，仍冲突返回 500 错误

**数据存储**：

- Key 格式：`shorturl:<code>`
- Value 格式：`{url: string, createdAt: string, expiresAt?: string}`
- TTL：默认永不过期（可为后续功能预留 expiresAt 字段）

**响应格式**：

```json
// 成功
{
  "success": true,
  "data": {
    "shortUrl": "https://your-domain.vercel.app/AbCd12",
    "code": "AbCd12"
  }
}

// 失败
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "请输入有效的URL地址"
  }
}
```

### 3.2 短链跳转

**路由**：`/[code]` （如 `/AbCd12`）

**跳转逻辑**：

1. 从存储中查询短码对应的原始URL
2. 找到：返回 301 重定向到原始URL
3. 未找到：返回自定义 404 页面

**404 页面**：

- 友好提示：「抱歉，该短链不存在或已失效」
- 提供返回首页链接
- SEO 优化：添加 `<meta name="robots" content="noindex, nofollow">`

**性能优化**：

- 使用 Edge Runtime 在边缘节点处理跳转
- 缓存策略：短码查询结果缓存 5 分钟

## 4. 非功能需求

### 4.1 性能指标

- **响应时间**：99% 请求 < 200ms
- **可用性**：99.9%（依赖 Vercel SLA）
- **并发处理**：支持 1000+ 并发请求

### 4.2 安全要求

- **输入安全**：XSS 防护（Next.js 自动转义）
- **访问限制**：单个 IP 每分钟最多创建 20 个短链
- **恶意URL检测**：基础的危险域名过滤
- **HTTPS 强制**：生产环境强制 HTTPS

### 4.3 监控告警

- 使用 Vercel Analytics 监控访问数据
- 404 错误率 > 10% 时触发告警
- API 错误率 > 5% 时触发告警

## 5. 技术方案

### 5.1 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS + shadcn/ui
- **存储**：Vercel KV (Redis)
- **部署**：Vercel

### 5.2 架构设计

```
用户请求 → Vercel Edge → 
├─ 短链跳转: Edge Runtime 直接处理 → 301 重定向
└─ 创建短链: Serverless 函数 → KV 存储 → 返回结果
```

### 5.3 核心模块

- **存储抽象层** (`lib/store.ts`)：统一的存储接口
- **短码生成器** (`lib/nanoid.ts`)：生成唯一短码
- **URL 验证器** (`lib/validator.ts`)：URL 格式验证
- **限流中间件** (`lib/ratelimit.ts`)：API 访问限制

## 6. API 接口设计

### 6.1 创建短链

```
POST /api/shorten
Content-Type: application/json

Request:
{
  "url": "https://example.com/very-long-url"
}

Response:
200 OK
{
  "success": true,
  "data": {
    "shortUrl": "https://your-domain.vercel.app/AbCd12",
    "code": "AbCd12"
  }
}

Error Response:
400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "请输入有效的URL地址"
  }
}
```

### 6.2 短链跳转

```
GET /:code
Response: 301 Redirect to original URL
或 404 Not Found (自定义页面)
```

## 7. 环境配置

### 7.1 环境变量

```bash
# Vercel KV (生产环境必需)
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your_token_here

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RATE_LIMIT_MAX=20  # 每分钟最大请求数

# 开发环境 (可选)
NODE_ENV=development
```

### 7.2 Vercel 配置 (vercel.json)

```json
{
  "functions": {
    "app/api/shorten/route.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/:code",
      "destination": "/api/redirect/:code"
    }
  ]
}
```

## 8. 项目结构

```
├── app/
│   ├── page.tsx                    # 首页 (短链创建)
│   ├── [code]/
│   │   └── page.tsx               # 短链跳转页面
│   ├── api/
│   │   ├── shorten/
│   │   │   └── route.ts           # 创建短链 API
│   │   └── redirect/
│   │       └── [code]/
│   │           └── route.ts       # 跳转处理 API
│   ├── not-found.tsx             # 404 页面
│   └── layout.tsx                # 根布局
├── lib/
│   ├── store.ts                  # 存储抽象层
│   ├── nanoid.ts                 # 短码生成
│   ├── validator.ts              # URL 验证
│   ├── ratelimit.ts              # 限流逻辑
│   └── utils.ts                  # 工具函数
├── components/
│   ├── url-shortener.tsx         # 短链生成组件
│   └── ui/                       # UI 组件库
├── data/
│   └── urls.json                 # 开发环境数据存储
├── middleware.ts                 # Edge 中间件 (限流)
├── next.config.js               # Next.js 配置
├── vercel.json                  # Vercel 部署配置
└── package.json
```

## 9. 部署流程

### 9.1 Vercel KV 设置

1. 在 Vercel 项目中启用 KV 存储
2. 获取 KV 连接信息并配置环境变量
3. 本地开发时使用 `.env.local` 文件

### 9.2 部署步骤

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署（推送到 main 分支触发）
4. 配置自定义域名（可选）

### 9.3 一键部署

提供 Deploy Button：

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/tiny-shorturl)
```

## 10. 测试验收

### 10.1 功能测试

- [ ] 输入有效 HTTPS URL → 成功生成 6 位短链
- [ ] 访问生成的短链 → 正确 301 跳转到原始 URL
- [ ] 输入无效 URL → 前端显示错误提示
- [ ] 输入重复 URL → 生成不同的短码
- [ ] 访问不存在的短链 → 显示 404 页面
- [ ] 复制功能 → 一键复制短链到剪贴板

### 10.2 性能测试

- [ ] 短链创建响应时间 < 500ms
- [ ] 短链跳转响应时间 < 200ms
- [ ] 并发 100 请求无错误

### 10.3 安全测试

- [ ] XSS 攻击防护
- [ ] 限流机制生效
- [ ] 恶意 URL 拦截

### 10.4 兼容性测试

- [ ] 主流浏览器兼容 (Chrome, Firefox, Safari, Edge)
- [ ] 移动端响应式设计
- [ ] 无障碍访问支持

## 11. 后续迭代规划

- **v1.2**：自定义短码、批量生成
- **v1.3**：访问统计、点击分析
- **v1.4**：二维码生成、过期时间设置
- **v1.5**：用户系统、短链管理面板

## 12. 风险评估

- **存储限制**：Vercel KV 有存储和请求限制，需监控使用量
- **域名依赖**：短链与域名绑定，域名变更影响已生成链接
- **恶意使用**：需要合理的限流和内容过滤机制
- **数据备份**：KV 数据需要定期备份策略
