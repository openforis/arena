import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'creó la encuesta',
    [ActivityLog.type.surveyPropUpdate]: 'actualizó {{key}} de la encuesta',
    [ActivityLog.type.surveyPublish]: 'publicó la encuesta',
    [ActivityLog.type.surveyCollectImport]: 'importó la encuesta desde Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: 'añadió la definición de nodo {{type}} en la entidad {{parentName}}',
    [ActivityLog.type.nodeDefUpdate]: 'actualizó {{keys}} de la definición de nodo {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'eliminó la definición de nodo {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'añadió una categoría',
    [ActivityLog.type.categoryPropUpdate]: 'actualizó {{key}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'eliminó la categoría {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: 'añadió un nivel en el índice {{index}} a la categoría {{categoryName}}',
    [ActivityLog.type.categoryLevelPropUpdate]:
      'actualizó {{key}} del nivel {{index}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'eliminó el nivel {{index}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]:
      'añadió un elemento al nivel {{levelIndex}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]:
      'actualizó {{key}} del elemento {{code}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryItemDelete]:
      'eliminó el elemento {{code}} del nivel {{levelIndex}} de la categoría {{categoryName}}',
    [ActivityLog.type.categoryImport]: 'importó un archivo CSV a la categoría {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'añadió una taxonomía',
    [ActivityLog.type.taxonomyPropUpdate]: 'actualizó {{key}} de la taxonomía {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'eliminó la taxonomía {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'importó un archivo CSV a la taxonomía {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'añadió un taxón a la taxonomía {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'añadió un registro',
    [ActivityLog.type.recordDelete]: 'eliminó el registro {{keys}}',
    [ActivityLog.type.recordImport]: 'registro importado',
    [ActivityLog.type.recordStepUpdate]: 'cambió el paso del registro {{keys}} de {{stepFrom}} a {{stepTo}}',
    [ActivityLog.type.recordMerge]: 'registro {{sourceRecordKeys}} fusionado en el registro {{targetRecordKeys}}',

    // Node
    [ActivityLog.type.nodeCreate]: 'añadió el nodo {{name}} en {{parentPath}} al registro {{recordKeys}}',
    [ActivityLog.type.nodeValueUpdate]: 'actualizó el nodo {{name}} en {{parentPath}} del registro {{recordKeys}}',
    [ActivityLog.type.nodeDelete]: 'eliminó el nodo {{name}} del registro {{recordKeys}}',

    // User
    [ActivityLog.type.userInvite]: 'invitó al usuario {{email}} con el rol {{groupName}}',
    [ActivityLog.type.userUpdate]: 'actualizó el usuario {{name}}',
    [ActivityLog.type.userRemove]: 'eliminó al usuario {{name}} de la encuesta',

    // Analysis
    [ActivityLog.type.chainCreate]: 'añadió una cadena de procesamiento',
    [ActivityLog.type.chainPropUpdate]: 'actualizó {{key}} de la cadena de procesamiento {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'actualizó {{key}} a {{value}} de la definición de nodo calculado {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'ejecutó correctamente la cadena de procesamiento {{label}}',
    [ActivityLog.type.chainDelete]: 'eliminó la cadena de procesamiento {{label}}',
  },
}
