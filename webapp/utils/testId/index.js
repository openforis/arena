const defaults = { lang: 'en' }

export const getSelector = (id, tag = '') => `${tag}[data-testid="${id}"]`

const _withLang =
  (key) =>
  (lang = defaults.lang) =>
    `${key}${lang && lang.length > 0 ? `-${lang}` : ''}`

export const TestId = {
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
    itemLabelPrefix: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-label`,
    itemLabel: (levelIdx, itemIdx) => _withLang(TestId.categoryDetails.itemLabelPrefix(levelIdx, itemIdx)),
    itemDescriptionPrefix: (levelIdx, itemIdx) => `item-${levelIdx}-${itemIdx}-description`,
    itemDescription: (levelIdx, itemIdx) => _withLang(TestId.categoryDetails.itemDescriptionPrefix(levelIdx, itemIdx)),
    exportBtn: 'category-export-btn',
    templateForDataImportBtn: 'category-template-data-import-btn',
    templateForDataImportGenericBtn: 'category-template-data-import-generic-btn',
    templateForSamplingPointDataImportBtn: 'category-template-sampling-point-data-import-btn',
  },
  categorySelector: {
    dropdown: 'category-selector-dropdown',
    addCategoryBtn: 'category-selector-add-btn',
  },
  dashboard: {
    advancedFunctionsBtn: 'survey-advanced-functions',
    collectReportBtn: 'collect-report-btn',
    surveyDeleteBtn: 'survey-delete-btn',
    surveyExportBtn: 'survey-export-btn',
    surveyExportOnlySurveyBtn: 'survey-export-only-survey-btn',
    surveyExportWithDataBtn: 'survey-export-with-data-btn',
    surveyExportWithDataNoActivityLogBtn: 'survey-export-with-data-no-activity-log-btn',
    surveyInfoBtnHeader: 'survey-info-btn-header',
    surveyInfoBtn: 'survey-info-btn',
    surveyLabel: 'survey-label',
    surveyName: 'survey-name',
    surveyStatus: 'survey-status',
  },
  dataExport: {
    exportCSV: 'exportCSV',
    prepareExport: 'prepareExport',
  },
  dataImport: {
    importFromCollectTab: 'importFromCollectTab',
    importFromCsvTab: 'importFromCsvTab',
  },
  dialogConfirm: {
    strongConfirmInput: 'dialog-confirm__strong-confirm-input',
  },
  dropdown: {
    dropDownItem: (key) => `dropdown-item-${key}`,
  },
  entities: {
    addBtn: 'entity-add-btn',
    entitySelector: 'entity-selector',
    form: {
      addNewNode: 'entity-form-add-new-node-btn',
      nodeSelect: 'entity-form-node-select',
      nodeSelectOption: (index) => `entity-form-node-select-option-${index}`,
    },
  },
  expressionEditor: {
    applyBtn: 'expression-apply-btn',
    editBtn: (id) => `${id}-edit-btn`,
    literalDropdown: 'expression-literal-dropdown',
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
    usersAccessRequstsBtn: 'users-access-requests-btn',
    usersListBtn: 'users-list-btn',
  },
  modal: {
    close: 'text="Close"',
    modal: 'modal',
    ok: 'text="Ok"',
  },
  jobMonitor: {
    errorsContainer: '.app-job-monitor__job-errors',
  },
  nodeDefDetails: {
    deleteBtn: 'node-def-delete-btn',
    advanced: 'advanced',
    applyIf: (id) => `${id}-apply-if`,
    backBtn: 'node-def-back',
    basic: 'basic',
    defaultValues: 'default-values',
    expressionDeleteBtn: (id) => `${id}-delete-btn`,
    formula: 'formula',
    nextBtn: 'node-def-next-btn',
    nodeDefDescriptions: _withLang('node-def-descriptions'),
    nodeDefLabels: _withLang('node-def-labels'),
    nodeDefCodeParent: 'node-def-code-parent',
    nodeDefEnumerate: 'node-def-enumerate',
    nodeDefName: 'node-def-name',
    nodeDefKey: 'node-def-key',
    nodeDefMultiple: 'node-def-multiple',
    nodeDefUnique: 'node-def-unique',
    previousBtn: 'node-def-previous-btn',
    relevantIf: 'relevant-if',
    saveBtn: 'node-def-save-btn',
    saveAndBackBtn: 'node-def-save-and-back-btn',
    taxonomySelector: 'taxonomy-selector',
    taxonomySelectorAddBtn: 'taxonomy-selector-add-btn',
    validations: 'validations',
  },
  panelRight: {
    closeBtn: 'panel-right-close-btn',
  },
  record: {
    editLockToggleBtn: 'record-edit-lock-toggle-btn',
    invalidBtn: 'record-invalid-btn',
    deleteBtn: 'record-delete-btn',
  },
  records: {
    addBtn: 'record-add-btn',
    cellNodeDef: (name) => `${name}-cell`,
    exportBtn: 'records-export-btn',
    tableModule: 'records/summary',
    tableRowDeleteButton: (index) => `records/summary/${index}/delete-btn`,
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
    optionIncludeDataCheckbox: 'survey-create-option-include-data',
    startImportBtn: 'survey-create-start-import-btn',
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
    advancedFunctionBtn: 'advanced-functions-btn',
    codeInputDropdown: (name) => `${name}-code`,
    coordinateX: (name) => `${name}-x`,
    coordinateY: (name) => `${name}-y`,
    coordinateSRS: (name) => `${name}-srs`,
    entityAddBtn: (name) => `${name}-add-btn`,
    entityRowHeader: (name) => `${name}-row-header`,
    entityRowData: (name, idx) => `${name}-row-${idx}`,
    nodeDefAddChildToBtn: (name) => `${name}-add-child-btn`,
    nodeDefAddChildOfTypeBtn: (type) => `add-child-of-type-${type}`,
    nodeDefEditBtn: (name) => `${name}-edit-btn`,
    nodeDefEntityTableCellWrapper: (name) => `node-def-entity-table-cell-wrapper-${name}`,
    nodeDefErrorBadge: (name) => `${name}-error-badge`,
    nodeDefWrapper: (name) => `node-def-wrapper-${name}`,
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
    surveyFieldManualLink: _withLang('survey-field-manual-link'),
    surveyName: 'survey-name',
    surveyLabel: _withLang('survey-label'),
    surveyLanguage: 'survey-language',
    surveySamplingPolygon: 'survey-sampling-polygon',
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
    message: 'invite-user-message',
    submitBtn: 'Send invitation',
  },
  validationReport: {
    validationReport: `validationReport`,
    cellMessages: `messages-cell`,
  },
}
