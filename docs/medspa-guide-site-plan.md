# Medspa Guide — 网站规划（Phase 1）

> 适用范围：`apps/medspa-guide`  
> 受众：**美国市场**医美诊所、Med Spa、 aesthetic practices（injectables、aesthetic lasers、skin treatments 等）。  
> 本文档仅为**规划与编辑准则**，不涉及页面代码改动。

---

## 1. 网站定位

**Medspa Guide** 是一个面向医美诊所团队的**本地数字营销教育资源站**，聚焦于：

- **Google Business Profile / Google Maps**：诊所发现、类目、服务展示、营业时间、到店与咨询路径的一致性  
- **本地 SEO**：城市/服务意图落地页、silo 与服务页可读性  
- **患者信任与声誉**：评价体系、模板化回复、期望管理  
- **网站与预约转化**：咨询预约表单、电话咨询、移动端体验、Treatment 页面结构与信任要素  
- **内容合规导向的营销提示**：如何避免误导性疗效表述、如何做教育型内容与不涉及医疗建议的推广边界（**站点不提供医疗诊断或治疗建议**）

定位是**营销与运营教育**，不提供临床决策、不进行疗效承诺、不兜售“捷径排名”。

---

## 2. 目标用户

| 人群 | 需求 |
|------|------|
| 诊所所有者 / CEO | 获客渠道优先级、品牌在地图与线上的呈现 |
| Practice manager / Ops | GBP 实务、前台预约流程与跟进 |
| 市场与内容负责人 | 服务页、silo、本地化内容日历 |
| Office manager（前台统筹） | 邀评话术边界、差评响应流程模板 |
| 小型团队外包协作方 | 可交付的清单、核对项、信息架构范例 |

次要读者：准备在特定州开展营销的合作方（需强调各州法规差异，内容由编辑策略覆盖，不提供法律意见）。

---

## 3. 与 massage-growth 的差异

| 维度 | massage-growth | medspa-guide |
|------|----------------|--------------|
| 行业语境 | 按摩、养生馆、本地到店 | **Med Spa / aesthetic**：注射、激光、皮肤管理、咨询师转化 |
| 合规焦点 | 一般服务业诚信表述 | **广告真实性、疗效表述边界、教育型内容**；明确区分营销信息与医疗建议 |
| 信任要素 | 评价、到店体验 | **Provider 资质露出、Treatment 适应症教育 vs 处方决策**（仅谈信息呈现） |
| 典型转化 | Deep tissue / Swedish 预约 | **Consultation、injectables、fractional laser、treatment series** |
| 内容资产 | 按摩向示意图与清单 | **治疗类别 silo**、咨询师路径、表单与隐私触点（不涉及医疗指导意见） |

**原则**：不按“把按摩词换成医美词”批量改写；两套站各自独立选题纲与例证。

---

## 4. 视觉风格

- **市场**：英文 UI 副本为主（American English）；可保留极简中文备忘录式内部命名，对用户可见文案以英文为准。  
- **气质**：专业、医学美学行业常见的**克制clinical + 温暖 approachable**——避免廉价促销感与高对比“疗效前后对比图”作为主要视觉隐喻（规划层强调合规与教育）。  
- **色彩**：中性浅灰底色 + **单一强调色（teal/navy其一）**；避免大红促销色主导。  
- **字体**：可读性优先的无衬线与系统栈；与技术实现（现有 Astro stack）对齐即可，具体 token 在实施阶段定义。  
- **图像**：实拍/授权素材优先轮廓为**环境与设备、团队专业形象、抽象流程**；不推荐用未授权真人对比照作为占位。

---

## 5. 首页结构（规划）

建议模块（从上到下）：

1. **Hero**：价值主张（Local visibility + Patient trust + Website conversion），主 CTA 指向 Hub 文章或 SEO Checklist  
2. **Featured resource**：主打“Med Spa Local SEO Checklist”（或 GBP 优化长篇）  
3. **Maps & GBP**：3 卡片 → 类目、服务撰写、影像与复诊节奏（规划层）  
4. **Reputation & Reviews**：邀请评价、HIPAA-conscious phrasing hints、差评回复模板入口  
5. **Website conversion**：consultation landing、表单摩擦、电话咨询跟踪  
6. **Treatment/service pages（SEO Silo intro）**：链接到 injector / laser / facials 等系列文章入口  
7. **Templates & checklists**：进入 `/templates/`  
8. **Education breakdowns**：进入案例分析型教育页（虚构数据禁止）  
9. **Latest articles**：博客最新 6 篇  
10. **Footer**：Editorial standards、Disclaimer、Contact、RSS

首页文案与数据源均独立撰写，不从按摩站套用。

---

## 6. 栏目结构（URL 语义建议）

| 路径（建议） | 主题 |
|---------------|------|
| `/google-business-profile/` 或 `/local-maps/` | GBP、地图展示、类目、服务字段、营业时间、Photos、Posts 节奏（教育口径） |
| `/reviews/` | 患者评价、回复、期望管理、敏感场景话术边界 |
| `/website-conversion/` | Consultation booking、表单、电话咨询、移动端路径 |
| `/med-spa-seo/` | 本地化关键词、silo、treatment/service 页面可读性 |
| `/templates/` | 清单与模板聚合 |
| `/breakdowns/` 或 `/education-breakdowns/` | 教育教学型拆解（无真实个案数据） |
| `/blog/` | 全部文章索引 |
| `/reports/`（可选 Phase 1 末） | 行业可见度方法论报告（方法论透明，无捏造数据） |

各栏目页可采用与 massage-growth **同类型布局组件**也可，但**内容与示例必须重写**。

---

## 7. 第一阶段：50 页面规划（建议清单）

以下为 **50 条可交付路由**的规划目标（正式实施时可微调 slug）。统计：核心静态页 +  hubs + 深度内容组合。

### A. 核心与合规（8）

1. `/` Homepage  
2. `/blog/` Blog index  
3. `/about/`  
4. `/editorial-policy/`  
5. `/contact/`  
6. `/disclaimer/`（营销 vs 医疗信息边界、非医疗建议声明）  
7. `/privacy/`（简版站内隐私说明；具体合规以持牌顾问为准）  
8. `/trust-on-your-site/` — 规划页：provider credentials、设备与团队信息在网站上的**信息披露框架**（健康教育向，无法律结论）

### B. 栏目 Hub（6）

不与 Reports 章节重复计数；Med Spa / SEO / 转化的入口页。

9. `/google-business-profile/`（或 `/maps-gbp/`）  
10. `/reviews/`  
11. `/website-conversion/`  
12. `/med-spa-seo/`  
13. `/templates/`（聚合入口）  
14. `/breakdowns/`（聚合入口）

### C. Templates / Checklists（8）

15–22. `/templates/gbp-photo-checklist/`、`/templates/review-response-playbook/`、`/templates/consultation-landing-structure/`、`/templates/service-page-wireframe-med-spa/`、`/templates/injectables-page-topic-map/`、`/templates/local-landing-city-page/`、`/templates/front-desk-follow-up-scripts/`、`/templates/booking-form-audit/`  

（每项为独立一页；内容英文、参数化占位。）

### D. Breakdown / Education（6）

23–28. `/breakdowns/visibility-without-paywall-ads/`、`/breakdowns/consult-show-rate-leaks/`、`/breakdowns/when-homepage-too-generic/`、`/breakdowns/review-tone-mismatch/`、`/breakdowns/laser-vs-injectables-silo/`、`/breakdowns/form-abandon-mobile/`  

（全部为**教学框架**，不出现真实患者数据或排名截图。）

### E. Reports（2）

Reports 单列，避免与「栏目 Hub」重复。

29. `/reports/` — 索引页（方法论报告入口与其它 future 报告占位说明）  
30. `/reports/med-spa-local-search-visibility-methodology/` — Phase 1 主报告（方法论与自检框架，无可伪造行业基准）

### F. 博客长文（20）

31–50. **20 篇文章**，选题见第 8 节分组表（独立 slug）。

**合计**：8（A） + 6（B） + 8（C） + 6（D） + 2（E） + 20（F） = **50**。可按阶段将部分 breakdown 改成深度文章（或增减模板页），但总路由规模建议仍为 Phase 1 约 **50 URLs**。

---

## 8. 文章主题分组（博客 20+ 可向 30 扩）

每组可包含多篇，互不替代按摩站的选题：

**A. Google Maps / GBP**  
- 类目与Treatment展示字段  
- GBP photos：设备与治疗环境合规呈现  
- 多地点品牌一致性  
- Appointment vs consultation CTAs wording（教育）

**B. Patient trust & Reviews**  
- 邀评话术与 HIPAA-conscious 提示（非律师意见）  
- 差评场景的回应结构  
- Yelp/Google 差异化的运营策略（不涉及操纵评价）

**C. Treatment / Service page SEO（行业特色）**  
- Botulinum toxin、treatment series、units 等**信息结构化**的写作提示（不涉及剂量与医学决策）  
- Laser / energy devices：education vs hype  
- Injectable pages：provider credibility、qualifications 展示区  
- Facials、aesthetic peels：设置合理期望的文案框架  

**D. Consultation booking & Conversion**  
- Consultation funnel：广告→落地页→电话  
- 表单字段最小化与高意图字段  
- 移动端点击拨号 vs 表单分流  

**E. Local keyword & Content**  
- “Med spa near [city]” 与城市页地图  
- before/after：**政策与风险提示**的写作指南（不出现具体医疗建议）  

**F. Credibility（非医疗背书）**  
- Board certifications、 injector credentials、different roles（MD/NP/RN scopes）的一般性科普信息呈现（不涉及执业法律结论）

---

## 9. 模板 / 清单页面（规划）

每页结构建议统一：

- Audience（who this checklist is for）  
- Prerequisites（CRM、GBP ownership、analytics access）  
- Step-by-step checklist（可复制粘贴到内部 Doc）  
- “What not to promise in marketing”（自律清单）  

模板英文命名需在实施时与用户可见导航一致。**不得**夹带疗效承诺或可复制进广告的虚假前后对比模板。

---

## 10. 案例拆解页面（Education breakdowns）

- **体裁**：Teaching scenarios / hypothetical workflow analysis（明确标注 hypothetical）  
- **禁止**：真实诊所名（除非未来有书面授权）、具体排名名次、搜索结果截图作为主要“证据”  
- **推荐**：漏斗阶段图、常见问题决策树（qualitative）  

与按摩站的“拆解”定位类似，但案例语境全部在 **consultation、funnel、Injectable/laser、treatment planner**。

---

## 11. 报告页面

**单 Phase 1 报告建议**：

标题方向举例：*Med Spa Local Visibility: A Methodological Self-Assessment*  

内容包含：

- 可见度≠承诺排名  
- 内部指标自检表（organic sessions、calls、form submits）  
- 季度复盘节律  

若数据展示，仅能使用**占位符或读者自有数据回填**，不得伪造行业基准数字。

---

## 12. 图片资产建议

- **品牌向**：诊室环境、无菌感、团队协作（授权图库）  
- **抽象向**：本地化漏斗、consultation timeline、表单步骤  
- **避免**：未授权的 real patient portraits、explicit treatment outcome advertising mockups  

博客 hero：与治疗类别弱关联的情境图（不写具体药效）。  

统一 **WebP/JPEG** pipeline，与 Astro 静态资源现状兼容即可。

---

## 13. 不应该出现的内容

站点任何页面与文章**严禁**以下内容（规划与执行均需遵守）：

1. **医疗建议**：适应症判断、治疗方案、用量、给药、术后医嘱等临床医学指导。  
2. **虚构疗效与案例**：未许可“before-after guarantee”、杜撰治愈率、捏造患者故事。  
3. **不实排名**：保证 Google 名次、具体时间线上 No.1。  
4. **违规评价操作**：花钱买评、有偿删差评、胁迫患者评价等任何形式的操纵指引。  
5. **跨区域法律断言**：不写“在美国一定合法/非法”的结论性法律陈述；如涉及法规，仅以“请咨询持牌法律顾问”带过。  
6. **HIPAA**：不作具体合规诊断；仅提供营销沟通中常识级提醒（仍以专业顾问为准）。  
7. **从 massage-growth 机械搬运**：不因省事把按摩条目整体替换用词；每条选题须按 Med Spa 语境重写或新写。  

---

## 附：Tone & Editorial guardrails（执行检查）

- Prefer **education + frameworks** over prescriptive outcomes.  
- Every treatment-related article carries a short disclaimer block：*Educational marketing content — not medical advice.*  
- CTA wording favors **consultation / learn more**，避免“保证效果”。  
- **Provider credibility**：鼓励事实性呈现资质与roles，不涉及跨州执业范围结论。  

---

*文档版本：Planning draft v1 · 与实际代码发布无绑定关系。*  
