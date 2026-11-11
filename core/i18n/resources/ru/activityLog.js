import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'создал(а) опрос',
    [ActivityLog.type.surveyPropUpdate]: 'обновил(а) {{key}} опроса',
    [ActivityLog.type.surveyPublish]: 'опубликовал(а) опрос',
    [ActivityLog.type.surveyCollectImport]: 'импортировал(а) опрос из Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'добавил(а) определение узла {{type}} в сущность {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'обновил(а) {{keys}} определения узла {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'удалил(а) определение узла {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'добавил(а) категорию',
    [ActivityLog.type.categoryPropUpdate]: 'обновил(а) {{key}} категории {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'удалил(а) категорию {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'добавил(а) уровень с индексом {{index}} в категорию {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]: 'обновил(а) {{key}} уровня {{index}} категории {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'удалил(а) уровень {{index}} категории {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]: 'добавил(а) элемент на уровень {{levelIndex}} категории {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]: 'обновил(а) {{key}} элемента {{code}} категории {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]:
      'удалил(а) элемент {{code}} на уровне {{levelIndex}} категории {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'импортировал(а) CSV-файл в категорию {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'добавил(а) таксономию',
    [ActivityLog.type.taxonomyPropUpdate]: 'обновил(а) {{key}} таксономии {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'удалил(а) таксономию {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'импортировал(а) CSV-файл в таксономию {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'добавил(а) таксон в таксономию {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'добавил(а) запись',
    [ActivityLog.type.recordDelete]: 'удалил(а) запись {{keys}}',
    [ActivityLog.type.recordImport]: 'запись импортирована',
    [ActivityLog.type.recordStepUpdate]: 'изменил(а) этап записи {{keys}} с {{stepFrom}} на {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'запись {{sourceRecordKeys}} объединена с записью {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'добавил(а) узел {{name}} в {{parentPath}} записи {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'обновил(а) узел {{name}} в {{parentPath}} записи {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'удалил(а) узел {{name}} из записи {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'пригласил(а) пользователя {{email}} с ролью {{groupName}}',
    [ActivityLog.type.userUpdate]: 'обновил(а) пользователя {{name}}',
    [ActivityLog.type.userRemove]: 'удалил(а) пользователя {{name}} из опроса',

    // Analysis
    [ActivityLog.type.chainCreate]: 'добавил(а) цепочку обработки',
    [ActivityLog.type.chainPropUpdate]: 'обновил(а) {{key}} цепочки обработки {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'обновил(а) {{key}} на {{value}} вычисляемого определения узла {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'успешно выполнил(а) цепочку обработки {{label}}',
    [ActivityLog.type.chainDelete]: 'удалил(а) цепочку обработки {{label}}',
  },
}
