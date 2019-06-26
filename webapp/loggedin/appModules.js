const app = 'app'

export const appModuleUri = (module = appModules.home) => `/${[app, module].join('/')}/`

export const appModules = {
  home: 'home',
  designer: 'designer',
  data: 'data',
  // analysis: 'analysis',
  // users: 'users',
}

export const homeModules = {
  dashboard: `${appModules.home}/dashboard`,

  surveyInfo: `${appModules.home}/surveyInfo`,

  surveyList: `${appModules.home}/surveys`,

  surveyNew: `${appModules.home}/surveyNew`,

  collectImportReport: `${appModules.home}/collectImportReport`,
}

export const designerModules = {

  formDesigner: `${appModules.designer}/formDesigner`,

  surveyHierarchy: `${appModules.designer}/surveyHierarchy`,

  recordPreview: `${appModules.designer}/formDesigner/preview`,

  categories: `${appModules.designer}/categories`,

  taxonomies: `${appModules.designer}/taxonomies`,

}

export const dataModules = {
  // edit record form
  record: `${appModules.data}/record`,

  // records list
  records: `${appModules.data}/records`,

  dataVis: `${appModules.data}/dataVis`,

}

