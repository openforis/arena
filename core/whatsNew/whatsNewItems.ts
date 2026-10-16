/**
 * Catalog of the features highlighted in the "What's new" dialog (a visual summary of CHANGELOG.md).
 * See ./README.md for how to add items and how to handle experimental features.
 */

export const whatsNewAudiences = {
  all: 'all',
  dataCleanser: 'dataCleanser',
  surveyAdmin: 'surveyAdmin',
  systemAdmin: 'systemAdmin',
} as const

export type WhatsNewAudience = (typeof whatsNewAudiences)[keyof typeof whatsNewAudiences]

export type WhatsNewItem = {
  /** Stable identifier: used as i18n key (whatsNew:items.<id>.title/description) and to track the items seen by the user. */
  id: string
  /** Release version (it must be listed in CHANGELOG.md). */
  version: string
  audience: WhatsNewAudience
  /** When true, the item is visible only if the EXPERIMENTAL_FEATURES env variable is set. */
  experimental?: boolean
  /** Optional image path (e.g. '/img/whats-new/<id>.png', stored in web-resources/img/whats-new). */
  image?: string
}

// newest first
export const whatsNewItems: WhatsNewItem[] = [
  {
    id: 'requiredIf',
    version: '2.11.0',
    audience: whatsNewAudiences.surveyAdmin,
    image: '/img/whats-new/requiredIf.png',
  },
  {
    id: 'themeSelector',
    version: '2.11.0',
    audience: whatsNewAudiences.all,
    image: '/img/whats-new/themeSelector.png',
  },
  {
    id: 'surveyCompare',
    version: '2.10.0',
    audience: whatsNewAudiences.surveyAdmin,
    image: '/img/whats-new/surveyCompare.png',
  },
  {
    id: 'usersBackup',
    version: '2.10.0',
    audience: whatsNewAudiences.systemAdmin,
    image: '/img/whats-new/usersBackup.png',
  },
  {
    id: 'samplingPointDataWhisp',
    version: '2.10.0',
    audience: whatsNewAudiences.surveyAdmin,
    image: '/img/whats-new/samplingPointDataWhisp.png',
  },
  {
    id: 'dashboardUpgrade',
    version: '2.9.7',
    audience: whatsNewAudiences.dataCleanser,
    image: '/img/whats-new/dashboardUpgrade.png',
  },
  {
    id: 'clearNonApplicableValues',
    version: '2.9.7',
    audience: whatsNewAudiences.all,
    image: '/img/whats-new/clearNonApplicableValues.png',
  },
  {
    id: 'systemLogs',
    version: '2.9.5',
    audience: whatsNewAudiences.systemAdmin,
    image: '/img/whats-new/systemLogs.png',
  },
  {
    id: 'dataQueryAiGenerate',
    version: '2.9.4',
    audience: whatsNewAudiences.all,
    experimental: true,
    image: '/img/whats-new/dataQueryAiGenerate.png',
  },
  { id: 'recordPrint', version: '2.9.0', audience: whatsNewAudiences.all, image: '/img/whats-new/recordPrint.png' },
  {
    id: 'attributeClone',
    version: '2.9.0',
    audience: whatsNewAudiences.surveyAdmin,
    image: '/img/whats-new/attributeClone.png',
  },
  {
    id: 'odkImport',
    version: '2.8.3',
    audience: whatsNewAudiences.surveyAdmin,
    experimental: true,
    image: '/img/whats-new/odkImport.png',
  },
  {
    id: 'dynamicEnumerator',
    version: '2.8.0',
    audience: whatsNewAudiences.surveyAdmin,
    image: '/img/whats-new/dynamicEnumerator.png',
  },
]
