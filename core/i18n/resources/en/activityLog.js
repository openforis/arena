import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'created the survey',
    [ActivityLog.type.surveyPropUpdate]: 'updated survey {{key}}',
    [ActivityLog.type.surveyPublish]: 'published the survey',
    [ActivityLog.type.surveyCollectImport]: 'imported the survey from Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'added node definition {{type}} in entity {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'updated {{keys}} of node definition {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'deleted node definition {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'added category',
    [ActivityLog.type.categoryPropUpdate]: 'updated {{key}} of category {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'deleted category {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'added level at index {{index}} to category {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]: 'updated level {{index}} {{key}} of category {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'deleted level {{index}} of category {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]: 'added item to level {{levelIndex}} of category {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]: 'updated item {{code}} {{key}} of category {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]: 'deleted item {{code}} at level {{levelIndex}} of category {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'imported CSV file to category {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'added taxonomy',
    [ActivityLog.type.taxonomyPropUpdate]: 'updated {{key}} of taxonomy {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'deleted taxonomy {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'imported CSV file to taxonomy {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'added taxon to taxonomy {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'added record',
    [ActivityLog.type.recordDelete]: 'deleted record {{keys}}',
    [ActivityLog.type.recordImport]: 'record imported',
    [ActivityLog.type.recordStepUpdate]: 'updated record {{keys}} step from {{stepFrom}} to {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'record {{sourceRecordKeys}} merged into record {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'added node {{name}} in {{parentPath}} to record {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'updated node {{name}} in {{parentPath}} of record {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'deleted node {{name}} from record {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'invited user {{email}} with role {{groupName}}',
    [ActivityLog.type.userUpdate]: 'updated user {{name}}',
    [ActivityLog.type.userRemove]: 'removed user {{name}} from survey',

    // Analysis
    [ActivityLog.type.chainCreate]: 'added processing chain',
    [ActivityLog.type.chainPropUpdate]: 'updated {{key}} of processing chain {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]: 'updated {{key}} to {{value}} of calculated node definition {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'successfully executed processing chain {{label}}',
    [ActivityLog.type.chainDelete]: 'deleted processing chain {{label}}',
  },
}
