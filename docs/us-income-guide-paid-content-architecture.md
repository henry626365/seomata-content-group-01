# us-income-guide 付费阅读与付费资源架构规划

**范围**：仅规划 `apps/us-income-guide`。  
**部署假设**：静态站点托管在 **Cloudflare Pages**，增值能力通过 **Pages Functions** 提供；本文件**不修改代码**，仅供后续分期实现对照。

---

## 1. 为什么 Astro 静态站不能用「前端隐藏」实现真正付费阅读

| 误区 | 现实 |
|------|------|
| 「付费板块用 CSS `display:none` 或前台判断」 | 构建产物是**公开 HTML/CSS/JS**；爬虫、查看源码、`curl` 构建目录即可拿走全文。 |
| 「把密钥放环境变量里，前端解密」 | 任何进入浏览器的密钥与解密逻辑都可被逆向；属于**假安全**。 |
| 「用 Astro 服务端在 build 时按用户生成不同 HTML」 | 纯静态 CDN 对每个 URL 返回**同一份 HTML**；无 per-user SSR 则无真正门禁。 |

**结论**：真正付费可读的内容必须在**服务端**（或等价受控边缘函数）在满足**付费/授权校验**之后才生成响应体或签发**短期可下载令牌**。仅靠静态文件 + 前端逻辑 = **无法控制泄露**。

**与「软付费墙」的关系**：软墙可以全部是前端体验（摘要 + CTA）；**门禁后的全文/下载物**必须由受控接口提供（见下文 API）。

---

## 2. 推荐模式：免费文章 + 付费资源包 + 软付费墙

### 2.1 免费文章（public）

- 保持现有 `/guides/`、栏目页的**教育叙事与框架**，用于 SEO、信任与合规品牌建设。
- 每篇可带 **lead-in 预览**（见 §9）：首屏可见、可被索引的自然段；其余「深度步骤/可复制表格」归入付费资源包。

### 2.2 付费资源包（product）

- **可下载物**：CSV/Excel 模板 bundle、Markdown/PDF bundle、Notion-duplicatable「结构说明」（避免承诺「照搬即赚」）。
- **一物一 SKU** 或 **kit 捆绑**（如 Side Hustle Selection Kit）。

### 2.3 软付费墙（soft paywall）

- 页面结构上始终是**合法公开落地页**：清晰说明包里有什么、为谁设计、不是什么（免责声明链接）。
- CTA：**Login / Unlock / Checkout**；未登录或未 entitlement 的用户看到预览 + 比价区，不写「已解锁全文进 HTML」。

**不推荐**：在同一 URL 上对同一 HTML 正文做「整块隐藏」却仍打进静态包里——仍会泄露。**推荐**：`/premium/[slug]` 仅渲染**营销 + 预览**；门禁内容由 `/api/income/premium/[slug]` 或带签名的 R2/CDN URL 下发。

---

## 3. 适合免费展示的内容类型

| 类型 | 目的 | 与本站对齐 |
|------|------|------------|
| **基础指南** | 意图词、edu SEO、信任 | 已有的赚钱路径 / 副业 / 线上 / 栏目长文 |
| **防骗指南** | 高分享、低风险承诺 | `/scam-prevention/`、防骗清单公开摘要 |
| **赚钱路径「地图」类** | 框架、概念、不涉及交付物盗版 | 「W2/1099 概念」「时间审计」 |
| **行业 / 方法论介绍** | 「如何读报告」「如何自检」 | 方法论 v1 报告**公开导读版** |

**原则**：免费层**不出现**可复制「完整记分表/Dashboard」或可下载**终版模板**正文；可免费给**结构与截图打码预览**。

---

## 4. 适合付费的内容类型

| 类型 | 形态建议 | 说明 |
|------|----------|------|
| **模板 / 清单** | ZIP（多格式）+ README | Stripe 交货或登录后下载；版本号 semver |
| **案例拆解扩展包** | PDF + 「复盘工作表」 | 与公开合成案例区分开；扩展为**可加练**材料，仍禁止伪造数据 |
| **报告** | 付费 PDF / 数据源附录 | 「方法论 v2」可加可复核数据源清单（仍不伪造统计） |
| **工具包（Kit）** | 多模板 + 检查表 +视频脚本提纲 | Bundle SKU，一单全解锁 |

**禁止**：附带「内幕渠道」「刷单脚本」「避税步骤」「保证收入话术」的资产。

---

## 5. 推荐技术架构（可执行拓扑）

```
[用户浏览器]
    │  HTTPS
    ▼
[Cloudflare Pages]  ── Astro 静态资源（HTML/JS/CSS/图片）
    │
    └── [Pages Functions]  /api/income/*
              │
              ├── Stripe Checkout Session（服务端创建）
              ├── Stripe Webhook（验签 → 写 D1）
              ├── Session Cookie（HttpOnly / Secure / SameSite）
              └── 校验 entitlement → 302 签名下载 或 JSON 正文

[D1]  users, purchases, entitlements, premium_resources
[Stripe]  Checkout + Webhook
```

**Session Cookie**：  
- Checkout 成功后由 Function 设定 **短期 session**（如 JWT 嵌入 `sub` / `anon_id`），或 CF 自带的 session 加密 cookie；**不把 Stripe customer id 暴露给前端操作**。  
- `me` 与 `premium/[slug]` 仅信任服务端 session + D1 `entitlements`。

**静态与动态边界**：  
- Astro **build** 产物不含付费全文；`/premium/*/index.html` 仅为营销壳。  
- 可选：解锁后内容由 **同源 API** `GET /api/income/premium/[slug]` 返回 JSON/Markdown 片段，由**极小**客户端 hydrate 渲染（或服务端直接 `text/markdown` 下载）。

---

## 6. D1 数据表设计

> 以下为 **v1** 最小可用；`TEXT`/`INTEGER` 可随 SQLite 惯例调整。

### 6.1 `users`

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | UUID |
| `email` | TEXT UNIQUE NULL | Stripe Customer email 回填；允许匿名链路后期合并 |
| `stripe_customer_id` | TEXT UNIQUE NULL | `cus_...` |
| `created_at` | INTEGER | Unix ms |
| `updated_at` | INTEGER | Unix ms |

**索引**：`stripe_customer_id`，`email`。

### 6.2 `purchases`

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK → users.id NULL | webhook 时能关联则写 |
| `stripe_checkout_session_id` | TEXT UNIQUE | `cs_...` |
| `stripe_payment_intent_id` | TEXT NULL | |
| `amount_cents` | INTEGER | |
| `currency` | TEXT | 默认 `usd` |
| `status` | TEXT | `pending` / `complete` / `refunded` |
| `created_at` | INTEGER | |

**索引**：`user_id`，`status`，`stripe_checkout_session_id`。

### 6.3 `entitlements`

| 列名 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK → users.id | |
| `resource_slug` | TEXT FK → premium_resources.slug | |
| `source` | TEXT | `purchase` / `admin_grant` / `subscription`（阶段 4） |
| `source_id` | TEXT NULL | purchases.id 或 subscription id |
| `expires_at` | INTEGER NULL | 订阅用尽；买断 NULL |
| `created_at` | INTEGER | |

**唯一约束**：`UNIQUE(user_id, resource_slug)`（同一资源单行 entitlement；续约更新 `expires_at`）。

### 6.4 `premium_resources`

| 列名 | 类型 | 说明 |
|------|------|------|
| `slug` | TEXT PK | URL 友好，与 `/premium/[slug]` 对齐 |
| `stripe_price_id` | TEXT | `price_...` |
| `title_zh` | TEXT | |
| `description_zh` | TEXT | 短描述 |
| `r2_object_key` | TEXT NULL | 或 CDN 路径；v1 可仅指向 bundle |
| `version` | TEXT | semver |
| `active` | INTEGER | 0/1 |

**运维**：下架设 `active=0`；老客户 entitlement 仍可访问历史版本需在应用层分支（可选 `resource_version` 表，二期）。

---

## 7. API 路由设计（Pages Functions）

所有路由前缀：**`/api/income/`**（与站点其它项目隔离）。

| 方法 | 路由 | 作用 |
|------|------|------|
| POST | `/api/income/create-checkout` | Body: `{ slug }` → 校验 `premium_resources` → Stripe Checkout Session URL → `{ url }`。需可选登录态绑定 `user`。 |
| POST | `/api/income/stripe-webhook` | Raw body + Stripe-Signature → `checkout.session.completed` → upsert `users` / `purchases` → insert `entitlements`。 |
| GET | `/api/income/me` | Session cookie → `{ user?, entitlements: string[] }`（slug 列表或摘要）。 |
| GET | `/api/income/premium/[slug]` | Session + entitlement → **200** 返回内容（Markdown 片段 / 下载 redirect）或 **402/403**。 |

**安全要点**：

- Webhook：**仅**可信 Stripe 密钥验签；**幂等**：`stripe_checkout_session_id` 唯一。
- `create-checkout`：Rate limit（CF rate limiting rules）；校验 `slug` 存在且 `active=1`。
- Cookie：`HttpOnly`、`Secure`、`Path=/`、`SameSite=Lax`（同站）。
- **勿**把 `STRIPE_SECRET_KEY`、Webhook secret 暴露到 Astro 前端 bundle。

---

## 8. 页面结构（与规划 SKU 对齐）

静态营销页（可被索引的只有**预览与商品说明**，非完整付费 HTML）：

| 路径 | 用途 |
|------|------|
| `/premium/` | 资源市集：卡片列表 → 各 `/premium/[slug]` |
| `/premium/side-hustle-selection-kit/` | 副业选型 Kit 落地页 + CTA |
| `/premium/money-making-scam-checklist/` | 付费加强版清单（与免费 `/templates/income-scam-checklist/` 分层） |
| `/premium/local-service-starter-kit/` | 本地服务启动包 |
| `/premium/checkout-placeholder/` | Stripe 占位：阶段 2 可重定向 External Payment Link；阶段 3 改为调用 `create-checkout` |

**与现有站关系**：免费模板页保留「简版」；付费页写明**增量**（ pages 数量、可打印 PDF、工作坊大纲等）。

---

## 9. SEO 注意事项

1. **Lead-in 预览**：在 `/premium/[slug]` 及关联免费文章顶部，放置**可被索引的自然段**（问题定义、受众、TOC 文字版、不涉及完整可抄表格）。
2. **不把完整付费内容构建进 HTML**：`astro build` 的该路由仅输出预览；全文仅经 API/R2。
3. **避免重复内容惩罚**：付费页 canonical 自控；免费文与付费页用 `rel="related"` / 站内链接说明层次，避免大段完全相同正文。
4. **Structured Data**：仅在需要时对**商品落地页**添加 `Product` / `Offer` JSON-LD（价格、币种、可用的 `seller`）；**勿**把 paywalled 全文塞进 `Article` schema。
5. **robots**：一般允许索引 `/premium/*` **营销壳**；**禁止**爬虫访问 API 响应中的全文（`/api/income/premium/*` 可 `noindex` 响应头 + 需 Cookie）。

---

## 10. 合规要求（与付费强相关）

- **不承诺收入**：Kit/报告营销页必须用「自检」「教育」「不保证结果」措辞；价格上避免「学完即回本」话术。
- **不伪造收益案例**：付费包里若含「示例数字」，必须标注「**虚构示意**」「非真实客户回报」。
- **不提供税务、法律、移民、投资建议**：付费 assets 若为「CPA 拿去就能报」之类一律禁止；仅能是**个人整理习惯**模板。
- **披露义务**：新增 **`/earnings-disclosure/`**（收益披露页），说明：
  - 本站如何从付费产品中获益（买断/订阅）。
  - 是否存在联盟链接与未来披露方式。
  - **仍不构成投资顾问表述**。
- **退款与消费者**：在 `/premium/` 与各 SKU 页链到简短退款政策（与 Stripe Dashboard 一致），并指向 `/disclaimer/`、`/privacy/`。

---

## 11. 分阶段实现计划（便于 Cursor 分期开发）

### 阶段 1：前端付费资源展示页（无支付）

**目标**：产品形态与文案跑通；无密钥进仓库。

**交付物**：

- Astro：`/premium/`、`/premium/side-hustle-selection-kit/`、`money-making-scam-checklist`、`local-service-starter-kit`、`checkout-placeholder`、`/earnings-disclosure/`。
- 各页：预览 + FAQ + 「即将上线解锁」占位；`/premium/checkout-placeholder` → `mailto:` 或静态「加入等候名单」（可选 Formspree）。

**验收**：`pnpm build:income`；Lighthouse SEO 无障碍；付费全文**未**打进 HTML。

---

### 阶段 2：Stripe Payment Links + 人工交付

**目标**：最小现金流验证；不写 D1。

**交付物**：

- Stripe Dashboard：**Payment Links** 每 SKU 一个；支付成功邮件/manual 发 Gumroad 式附件或私密链接（短期）。
- 页面：`checkout-placeholder` 改为外链 Payment Link。
- **`/earnings-disclosure/`** 上线实质文案。

**风险**：伸缩差、易产生支持工单；仅限验证 PMF。

**验收**：真实测试卡走通一条链路；邮件/发货 SOP 写进内部 doc。

---

### 阶段 3：Stripe Checkout + D1 自动解锁

**目标**：与 §5～§7 一致的生产路径。

**交付物**：

- CF Pages Functions：`create-checkout`、`stripe-webhook`、`me`、`premium/[slug]`。
- D1 migrations：四张表。
- Astro：CTA → `fetch('/api/income/create-checkout')` → redirect；极小 `me` 轮询或小部件显示「已解锁」。
- **R2（推荐）**：`premium_resources.r2_object_key` 指向 zip；unlock 后发 **短时 signed URL**（Function 生成）。

**验收**：

- Webhook 幂等；重复投递不重复 entitlement。
- 未登录购买的 email → `customers` lookup 或 Stripe metadata `resource_slug` 关联。
- Session 劫持面：JWT 短命 + rotation 可选。

---

### 阶段 4：会员订阅

**目标**：`entitlements.expires_at` + Stripe Subscription。

**交付物**：

- 新 API：`create-portal`、`subscription-webhook` 扩展事件。
- 产品：**Library Pass** tier，按月/年解锁 `premium_resources` 子集（用 `premium_resource_tiers` 关联表，二期）。
- 前端：`/premium/`「会员」徽章与到期提醒。

**验收**：降级/退款事件正确撤销或缩短 `expires_at`。

---

## 附录 A：环境与密钥清单（实施阶段 3 时）

| 变量 | 用途 |
|------|------|
| `STRIPE_SECRET_KEY` | Checkout Session |
| `STRIPE_WEBHOOK_SECRET` | Webhook 验签 |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | 若用 Stripe.js（Checkout redirect 可不暴露） |
| `SESSION_SECRET` | 签 session cookie / JWT |
| `R2_BUCKET` + R2 API token | 签名下载（可选阶段 3） |

**勿**将这些写入 Astro `import.meta.env.PUBLIC_*`（除 publishable key 外）。

---

## 附录 B：与本站既有内容映射（SKU 占位）

| 规划 slug | 与现有免费页关系 |
|-----------|-------------------|
| `side-hustle-selection-kit` | 扩展 `/templates/side-hustle-selection-checklist/` |
| `money-making-scam-checklist` | 扩展 `/templates/income-scam-checklist/` |
| `local-service-starter-kit` | 捆绑本地服务多篇检查表 + 合同用语「须律师审」 disclaim |

---

*文档版本：v1 · 仅供架构与分期开发评审*
