const defaults = { lang: 'en' }

export const getSelector = (id, tag = '') => `${tag}[data-testid="${id}"]`

const _withLang = (key) => (lang = defaults.lang) => `${key}${lang && lang.length > 0 ? `-${lang}` : ''}`

export const DataTestId = {
  categoryDetails: {
    addLevelBtn: 'add-level-btn',
    categoryName: 'category-name',
    // TODO remove category prefix below after removing taiko
    level: (idx) => `level-${idx}`,
    levelItemAddBtn: (idx) => `level-${idx}-item-add-btn`,
    levelDeleteBtn: (idx) => `level-${idx}-delete-btn`,
    levelErrorBadge: (idx) => `level-${idx}-error-badge`,
    levelName: (idx) => `category-level-${idx}-name`,
    item: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}`,
    itemCloseBtn: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-close-btn`,
    itemDeleteBtn: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-delete-btn`,
    itemErrorBadge: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-error-badge`,
    itemCode: (levelIdx, itemIdx) => `category-level-${levelIdx}-item-${itemIdx}-code`,
    itemLabel: (levelIdx, itemIdx) => _withLang(`category-level-${levelIdx}-item-${itemIdx}-label`),
  },
  categorySelector: {
    category: 'category-selector-category',
    addCategoryBtn: 'category-selector-add-btn',
  },
  dashboard: {
    collectReportBtn: 'collect-report-btn',
    surveyDeleteBtn: 'survey-delete-btn',
    surveyInfoBtn: 'survey-info-btn',
    surveyLabel: 'survey-label',
    surveyStatus: 'survey-status',
  },
  dropdown: {
    dropDownItem: (key) => `dropdown-item-${key}`,
    toggleBtn: (id) => `${id}-toggle-btn`,
  },
  header: {
    surveyCreateBtn: 'survey-create-btn',
    surveyListBtn: 'survey-list-btn',
    surveyPublishBtn: 'survey-publish-btn',
    userBtn: 'user-btn',
    userProfileBtn: 'user-profile-btn',
    userLogoutBtn: 'user-logout-btn',
  },
  modal: {
    close: 'text="Close"',
    itemError: '.item-error',
    modal: 'modal',
    ok: 'text="Ok"',
  },
  nodeDefDetails: {
    backBtn: 'node-def-back-btn',
    nodeDefDescriptions: _withLang('node-def-descriptions'),
    nodeDefLabels: _withLang('node-def-labels'),
    nodeDefCodeParent: 'node-def-code-parent',
    nodeDefName: 'node-def-name',
    nodeDefKey: 'node-def-key',
    saveBtn: 'node-def-save-btn',
  },
  panelRight: {
    closeBtn: 'panel-right-close-btn',
  },
  sidebar: {
    module: (module) => `sidebar-module-${module}`,
    moduleBtn: (module) => `sidebar-modulebtn-${module}`,
  },
  surveyCreate: {
    importFromArena: 'import-from-arena',
    importFromCollect: 'import-from-collect',
    submitBtn: 'survey-create-submit-btn',
    surveyCloneFrom: 'survey-clone-from',
    surveyName: 'survey-name',
    surveyLabel: 'survey-label',
  },
  surveyForm: {
    addSubPageBtn: 'add-sub-page-btn',
    nodeDefAddChildBtn: (name) => `node-def-add-child-${name}-btn`,
    nodeDefEditBtn: (name) => `node-def-edit-${name}-btn`,
    nodeDefErrorBadge: (name) => `node-def-error-badge-${name}`,
    surveyForm: 'survey-form',
    surveyFormPage: (nodeDefName) => `survey-form-${nodeDefName}-page`,
  },
  surveyInfo: {
    saveBtn: 'survey-info-save-btn',
    surveyDescription: _withLang('survey-description'),
    surveyName: 'survey-name',
    surveyLabel: _withLang('survey-label'),
    surveyLanguage: 'survey-language',
  },
  surveyList: {
    surveyRow: (rowIdx) => `surveys_${rowIdx}`,
  },
}
