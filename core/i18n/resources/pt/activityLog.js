import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'criou o inventário',
    [ActivityLog.type.surveyPropUpdate]: 'atualizou {{key}} do inventário',
    [ActivityLog.type.surveyPublish]: 'publicou o inventário',
    [ActivityLog.type.surveyCollectImport]: 'importou o inventário do Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'adicionou a definição de nó {{type}} na entidade {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'atualizou {{keys}} da definição de nó {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'excluiu a definição de nó {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'adicionou uma categoria',
    [ActivityLog.type.categoryPropUpdate]: 'atualizou {{key}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'excluiu a categoria {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'adicionou um nível no índice {{index}} à categoria {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]: 'atualizou {{key}} do nível {{index}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'excluiu o nível {{index}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]: 'adicionou um item ao nível {{levelIndex}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]: 'atualizou {{key}} do item {{code}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]:
      'excluiu o item {{code}} do nível {{levelIndex}} da categoria {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'importou um arquivo CSV para a categoria {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'adicionou uma taxonomia',
    [ActivityLog.type.taxonomyPropUpdate]: 'atualizou {{key}} da taxonomia {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'excluiu a taxonomia {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'importou um arquivo CSV para a taxonomia {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'adicionou um táxon à taxonomia {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'adicionou um registro',
    [ActivityLog.type.recordDelete]: 'excluiu o registro {{keys}}',
    [ActivityLog.type.recordImport]: 'registro importado',
    [ActivityLog.type.recordStepUpdate]: 'alterou a etapa do registro {{keys}} de {{stepFrom}} para {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'registro {{sourceRecordKeys}} mesclado no registro {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'adicionou o nó {{name}} em {{parentPath}} ao registro {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'atualizou o nó {{name}} em {{parentPath}} do registro {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'excluiu o nó {{name}} do registro {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'convidou o usuário {{email}} com a função {{groupName}}',
    [ActivityLog.type.userUpdate]: 'atualizou o usuário {{name}}',
    [ActivityLog.type.userRemove]: 'removeu o usuário {{name}} do inventário',

    // Analysis
    [ActivityLog.type.chainCreate]: 'adicionou uma cadeia de processamento',
    [ActivityLog.type.chainPropUpdate]: 'atualizou {{key}} da cadeia de processamento {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'atualizou {{key}} para {{value}} da definição de nó calculado {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'executou com sucesso a cadeia de processamento {{label}}',
    [ActivityLog.type.chainDelete]: 'excluiu a cadeia de processamento {{label}}',
  },
}
