const defaults = { lang: 'en' }

export const getSelector = (id, tag = '') => `${tag}[data-testid="${id}"]`

const _withLang =
  (key) =>
  (lang = defaults.lang) =>
    `${key}${lang && lang.length > 0 ? `-${lang}` : ''}`

export const DataTestId = {
  categoryDetails: {
    addLevelBtn: 'add-level-btn',
    categoryName: 'category-name',
    level: (idx) => `level-${idx}`,
    levelAddItemBtn: (idx) => `level-${idx}-add-item-btn`,
    levelDeleteBtn: (idx) => `level-${idx}-delete-btn`,
    levelErrorBadge: (idx) => `level-${idx}-error-badge`,
    levelName: (idx) => `level-${idx}-name`,
    item: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}`,
    itemCloseBtn: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-close-btn`,
    itemDeleteBtn: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-delete-btn`,
    itemErrorBadge: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-error-badge`,
    itemCode: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-code`,
    itemLabel: (levelIdx, itemIdx) => _withLang(`item-${levelIdx}-${itemIdx}-label`),
    exportBtn: 'category-export-btn',
  },
  categorySelector: {
    category: 'category-selector-category',
    addCategoryBtn: 'category-selector-add-btn',
  },
  dashboard: {
    collectReportBtn: 'collect-report-btn',
    surveyDeleteBtn: 'survey-delete-btn',
    surveyExportBtn: 'survey-export-btn',
    surveyInfoBtn: 'survey-info-btn',
    surveyLabel: 'survey-label',
    surveyStatus: 'survey-status',
  },
  dataExport: {
    exportCSV: 'exportCSV',
    prepareExport: 'prepareExport',
  },
  dropdown: {
    dropDownItem: (key) => `dropdown-item-${key}`,
    toggleBtn: (id) => `${id}-toggle-btn`,
  },
  entities: {
    addBtn: 'entity-add-btn',
    entitySelector: 'entity-selector',
  },
  expressionEditor: {
    advancedQuery: 'expression-advanced-query',
    applyBtn: 'expression-apply-btn',
    editBtn: (id) => `${id}-edit-btn`,
    query: (id) => `${id}-query`,
    toggleModeBtn: 'expression-mode-btn',
  },
  header: {
    surveyTitle: 'header-survey-title',
    surveyCreateBtn: 'survey-create-btn',
    surveyListBtn: 'survey-list-btn',
    surveyTemplateListBtn: 'survey-list-template-btn',
    surveyPublishBtn: 'survey-publish-btn',
    templateCreateBtn: 'template-create-btn',
    templateListBtn: 'template-list-btn',
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
    deleteBtn: 'nodedef-delete-btn',
    advanced: 'advanced',
    applyIf: (id) => `${id}-apply-if`,
    backBtn: 'node-def-back',
    basic: 'basic',
    defaultValues: 'default-values',
    expressionDeleteBtn: (id) => `${id}-delete-btn`,
    formula: 'formula',
    nodeDefDescriptions: _withLang('node-def-descriptions'),
    nodeDefLabels: _withLang('node-def-labels'),
    nodeDefCodeParent: 'node-def-code-parent',
    nodeDefName: 'node-def-name',
    nodeDefKey: 'node-def-key',
    nodeDefUnique: 'node-def-unique',
    relevantIf: 'relevant-if',
    saveBtn: 'node-def-save-btn',
    taxonomySelector: 'taxonomy-selector',
    taxonomySelectorAddBtn: 'taxonomy-selector-add-btn',
    validations: 'validations',
  },
  panelRight: {
    closeBtn: 'panel-right-close-btn',
  },
  record: {
    errorBadge: 'record-error-badge',
    deleteBtn: 'record-delete-btn',
  },
  records: {
    addBtn: 'record-add-btn',
    cellNodeDef: (name) => `${name}-cell`,
    records: 'records',
  },
  recordsImport: {
    importDataBtn: 'records-import-data-btn',
  },
  sidebar: {
    module: (module) => `sidebar-module-${module}`,
    moduleBtn: (module) => `sidebar-modulebtn-${module}`,
  },
  surveyCreate: {
    createTypeBtn: ({ prefix, type }) => `${prefix}_${type}`,
    importFromArena: 'import-from-arena',
    importFromCollect: 'import-from-collect',
    submitBtn: 'survey-create-submit-btn',
    surveyCloneFrom: 'survey-clone-from',
    surveyName: 'survey-name',
    surveyLabel: 'survey-label',
  },
  surveyExport: {
    downloadBtn: 'text="Download"',
  },
  surveyForm: {
    addSubPageBtn: 'add-sub-page-btn',
    codeInputDropdown: (name) => `${name}-code`,
    coordinateX: (name) => `${name}-x`,
    coordinateY: (name) => `${name}-y`,
    coordinateSRS: (name) => `${name}-srs`,
    entityAddBtn: (name) => `${name}-add-btn`,
    entityRowHeader: (name) => `${name}-row-header`,
    entityRowData: (name, idx) => `${name}-row-${idx}`,
    nodeDefAddChildBtn: (name) => `${name}-add-child-btn`,
    nodeDefEditBtn: (name) => `${name}-edit-btn`,
    nodeDefErrorBadge: (name) => `${name}-error-badge`,
    pageLinkBtn: (name) => `${name}-page-link-btn`,
    previewCloseBtn: 'preview-close-btn',
    previewOpenBtn: 'preview-open-btn',
    schemaSummary: 'schema-summary-btn',
    surveyForm: 'survey-form',
    taxonField: (name, field) => `${name}-${field}`,
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
  table: {
    noItems: 'no-items',
    rows: (module) => `${module}-rows`,
    row: (module, idx) => `${module}_${idx}`,
  },
  tabBar: {
    tabBarBtn: (id) => `${id}-btn`,
  },
  taxonomyDetails: {
    doneEditBtn: 'taxonomy-done-edit-btn',
    taxonomyName: 'taxonomy-name',
    taxonomyDescription: _withLang('taxonomy-description'),
    uploadInput: 'taxonomy-upload-input',
  },
  templateList: {
    module: 'templates',
  },
  userList: {
    inviteBtn: 'invite-user-btn',
    invitedBy: 'invited_by',
    invitedDate: 'invited_date',
    profilePicture: 'user_profile_img',
    name: 'user_name',
    email: 'user_email',
    authGroup: 'user_authGroup',
    edit: 'user_edit_btn',
    users: 'users',
  },
  userInvite: {
    email: 'invite-user-name',
    group: 'invite-user-group',
    submitBtn: 'Send invitation',
  },
  validationReport: {
    validationReport: `validationReport`,
    cellMessages: `messages-cell`,
  },
}
