export type NonBlogCardMeta = {
	category?: string;
	imageFromPostId?: string;
	imageAlt?: string;
};

export const nonBlogCardMap: Record<string, NonBlogCardMeta> = {
	'/templates/': {
		category: '模板资源',
		imageFromPostId: 'massage-clinic-review-request-sms-templates',
		imageAlt: '模板资源封面图'
	},
	'/templates/review-request-sms-templates/': {
		category: '模板资源',
		imageFromPostId: 'massage-clinic-review-request-sms-templates',
		imageAlt: '评价请求短信模板封面图'
	},
	'/templates/review-reply-templates/': {
		category: '模板资源',
		imageFromPostId: 'review-reply-templates-for-massage-businesses',
		imageAlt: 'Google 评价回复模板封面图'
	},
	'/templates/massage-service-page-template/': {
		category: '模板资源',
		imageFromPostId: 'massage-service-page-examples',
		imageAlt: '服务页面结构模板封面图'
	},
	'/templates/massage-seo-checklist/': {
		category: '模板资源',
		imageFromPostId: 'massage-seo-checklist',
		imageAlt: '按摩 SEO 检查清单封面图'
	},
	'/templates/google-business-profile-checklist/': {
		category: '模板资源',
		imageFromPostId: 'google-business-profile-for-massage-therapists',
		imageAlt: 'Google Business Profile 检查清单封面图'
	},
	'/templates/booking-conversion-checklist/': {
		category: '模板资源',
		imageFromPostId: 'massage-website-conversion-guide',
		imageAlt: '预约转化检查清单封面图'
	},
	'/case-breakdowns/': {
		category: '营销拆解',
		imageFromPostId: 'massage-website-conversion-guide',
		imageAlt: '营销拆解封面图'
	},
	'/case-breakdowns/google-maps-visibility-breakdown/': {
		category: '营销拆解',
		imageFromPostId: 'google-maps-ranking-checklist-for-massage-businesses',
		imageAlt: 'Google 地图曝光不足教学拆解封面图'
	},
	'/case-breakdowns/massage-website-conversion-breakdown/': {
		category: '营销拆解',
		imageFromPostId: 'massage-website-conversion-guide',
		imageAlt: '网站有访问却没有预约教学拆解封面图'
	},
	'/case-breakdowns/massage-service-page-breakdown/': {
		category: '营销拆解',
		imageFromPostId: 'massage-service-page-examples',
		imageAlt: '按摩服务页面教学拆解封面图'
	},
	'/reports/massage-local-search-visibility-report/': {
		category: '行业报告',
		imageFromPostId: 'massage-near-me-keyword-strategy',
		imageAlt: '按摩行业本地搜索可见度报告封面图'
	}
};
