/**
 * Full paid copy for API responses only — not imported by Astro.
 * Educational checklist content; no income guarantees.
 */
import { PRODUCT_SIDE_HUSTLE_SELECTION_KIT } from './constants';

export type PremiumSection = {
	id: string;
	title: string;
	bodyHtml: string;
};

const disclaimerHtml = `<p class="premium-disclaimer"><strong>声明：</strong>本材料仅供教育与信息参考；不保证任何收入或结果。报税、法律与身份就业限制请咨询持证专业人士。</p>`;

export const PREMIUM_SIDE_HUSTLE_SELECTION_KIT: Readonly<{
	slug: typeof PRODUCT_SIDE_HUSTLE_SELECTION_KIT;
	title: string;
	sections: PremiumSection[];
}> = {
	slug: PRODUCT_SIDE_HUSTLE_SELECTION_KIT,
	title: '美国副业选择工具包（完整版）',
	sections: [
		{
			id: 'gates',
			title: '开始前的四条硬边界',
			bodyHtml: `<p>在填表前先写下可验证答案；若任一条无法回答，就先停在你当前信息能支持的决定上。</p><ul>
<li><strong>时间上限：</strong>每周可投入副业的小时区间（含通勤/客服/学习），以及「低于此时间就不启动」的阈值。</li>
<li><strong>现金与设备上限：</strong>愿意一次性垫资的上限、可接受的工具订阅月费区间。</li>
<li><strong>合规边界：</strong>签证/学校政策/雇主竞业里，哪些活动必须先拿到书面确认再做。</li>
<li><strong>停机条件：</strong>例如连续三周净收入低于某额、或任一平台账号健康出现黄线，就先暂停扩量。</li>
</ul>`,
		},
		{
			id: 'options',
			title: '副业选项对照表（可复制到笔记本）',
			bodyHtml: `<p>为每个候选副业各写一行，不要追求「完美选项」，先追求「信息足够做下一步小实验」。</p>
<table class="premium-table"><thead><tr><th>副业方向</th><th>主要交付物</th><th>冷启动 7 天最小动作</th><th>主要风险点</th><th>先查的条款/资质</th></tr></thead>
<tbody>
<tr><td>平台零工（送餐/打车等）</td><td>按单服务</td><td>注册→完成首单→记录时薪与油费/里程</td><td>工时波动、账号处罚</td><td>保险、车辆/城市要求</td></tr>
<tr><td>自由职业（写作/设计/开发等）</td><td>项目成果</td><td>整理 3 个样例+报价区间+1 页流程说明</td><td>回款、范围蔓延</td><td>合同模板、收款方式</td></tr>
<tr><td>本地服务（清洁/维修/家教等）</td><td>上门服务/课时</td><td>确定服务半径+交通时间+订金规则</td><td>安全与信任、责任</td><td>当地许可/税务登记问题清单</td></tr>
<tr><td>小型电商/成品销售</td><td>实物或数字商品</td><td>算出「售价-平台费-物流-退款」试算表</td><td>库存、政策变更</td><td>平台禁售类目、退货规则</td></tr>
</tbody></table>
<p>把「最不确定」的一格标红，下一周只补齐那一格的信息来源（官方条款、政府页面、或持证顾问），不要用群聊截图代替。</p>`,
		},
		{
			id: 'seven-day',
			title: '7 天小实验剧本（可重复）',
			bodyHtml: `<ol>
<li><strong>第 1 天：</strong>只观察：记录你自然醒后的 2 个小时在做什么，标出可挪用但不可牺牲睡眠的块。</li>
<li><strong>第 2 天：</strong>选 1–2 个候选副业，各写「首单可能长什么样」的一段话（给谁、解决什么、你如何交付）。</li>
<li><strong>第 3 天：</strong>为每个候选写一个「失败也划算」的小目标（例如：摸清真实时薪区间、拿到一个有效咨询回复）。</li>
<li><strong>第 4–5 天：</strong>只做注册/资料/样例准备，不追加新方向。</li>
<li><strong>第 6 天：</strong>发出 5 次有效触达（投递/报价/上架/预约），记录渠道与时间戳。</li>
<li><strong>第 7 天：</strong>复盘：时间消耗、现金消耗、情绪消耗；决定「继续 / 换平台 / 暂停」。</li>
</ol>`,
		},
		{
			id: 'evaluation',
			title: '副业邀请/机会的 10 分钟评估卡',
			bodyHtml: `<ul>
<li>谁在赚钱：你卖的是时间、技能成果，还是拉的「下线」？后出现要高度警惕。</li>
<li>付款方向：客户/平台付给你，还是你先大额付给「导师/库存/激活费」？后者提高风险。</li>
<li>可得性：是否需要「内部名额/紧急截止」才能看到规则？正规市场通常能慢慢读条款。</li>
<li>证明链：能否在独立信源交叉验证（平台官方、政府商业登记、可信媒体）？只有群截图不够。</li>
<li>退出机制：能否在一周内无损或低损退出（合同、订阅、库存）？写下来具体步骤。</li>
</ul>`,
		},
		{
			id: 'next-links',
			title: '站内免费延伸（非付费部分）',
			bodyHtml: `<p>建议与本工具包一起使用的公开页面（避免重复购买信息）：</p><ul>
<li><a href="/templates/side-hustle-selection-checklist/">副业选择检查清单（模板）</a></li>
<li><a href="/guides/side-hustle-risk-spectrum/">副业风险谱</a></li>
<li><a href="/guides/how-to-evaluate-a-side-hustle-invite/">如何评估副业邀请</a></li>
<li><a href="/earnings-disclosure/">收入声明说明</a></li>
</ul>`,
		},
	],
};

export function getPremiumPayload(slug: string): {
	slug: string;
	title: string;
	sections: PremiumSection[];
	disclaimerHtml: string;
} | null {
	if (slug !== PREMIUM_SIDE_HUSTLE_SELECTION_KIT.slug) return null;
	return {
		slug: PREMIUM_SIDE_HUSTLE_SELECTION_KIT.slug,
		title: PREMIUM_SIDE_HUSTLE_SELECTION_KIT.title,
		sections: [...PREMIUM_SIDE_HUSTLE_SELECTION_KIT.sections],
		disclaimerHtml,
	};
}
