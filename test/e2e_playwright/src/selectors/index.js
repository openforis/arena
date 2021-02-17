const defaults = { lang: 'en' }

export const Selectors = {
  header: {
    createSurvey: 'text="Create Survey"',
    mySurveys: 'text="My Surveys"',
    userBtn: '#user-btn',
    publishBtn: '#publish-btn',
  },
  dashboard: {
    editInfo: 'text="Edit info"',
  },
  modal: {
    close: 'text="Close"',
    itemError: '.item-error',
    modal: '.modal',
    ok: 'text="Ok"',
  },
  nodeDefDetails: {
    back: 'text="Back"',
    nodeDefDescriptions: (lang = defaults.lang) => `#node-def-descriptions-${lang}`,
    nodeDefLabels: (lang = defaults.lang) => `#node-def-labels-${lang}`,
    nodeDefName: '#node-def-name',
    nodeDefKey: '#node-def-key',
    save: 'text="Save"',
  },
  sidebar: {
    analysis: '#sidebar_btn_analysis',
    home: '#sidebar_btn_home',
    data: '#sidebar_btn_data',
    designer: '#sidebar_btn_designer',
    users: '#sidebar_btn_users',
    // analysis sub modules
    chains: '#sidebar_btn_processingChain_plural',
    // data sub modules
    explorer: '#sidebar_btn_sidebar_btn_explorer',
    records: '#sidebar_btn_records',
    validationReport: '#sidebar_btn_validationReport',
    // designer sub modules
    categories: '#sidebar_btn_categories',
    formDesigner: '#sidebar_btn_formDesigner',
    surveyHierarchy: '#sidebar_btn_surveyHierarchy',
    taxonomies: '#sidebar_btn_taxonomies',
    // users sub modules
    userList: '#sidebar_btn_userList',
  },
  surveyForm: {
    nodeDefAddChildBtn: (name) => `#node-def-add-child-${name}-btn`,
    nodeDefEditBtn: (name) => `#node-def-edit-${name}-btn`,
    nodeDefErrorBadge: (name) => `#node-def-error-badge-${name}`,
    surveyForm: '.survey-form',
  },
  surveyList: {
    surveyRow: (rowIdx) => `#surveys_${rowIdx}`,
  },
}
