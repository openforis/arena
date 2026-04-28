import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'a créé le formulaire',
    [ActivityLog.type.surveyPropUpdate]: 'a mis à jour le formulaire {{key}}',
    [ActivityLog.type.surveyPublish]: 'a publié le formulaire',
    [ActivityLog.type.surveyCollectImport]: 'a importé le formulaire depuis Collect',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: "a ajouté la définition de nœud {{type}} dans l'entité {{parentName}}",
    [ActivityLog.type.nodeDefUpdate]: 'a mis à jour {{keys}} de la définition de nœud {{name}}',
    [ActivityLog.type.nodeDefMarkDeleted]: 'a supprimé la définition de nœud {{name}}',

    // Category
    [ActivityLog.type.categoryInsert]: 'a ajouté une catégorie',
    [ActivityLog.type.categoryPropUpdate]: 'a mis à jour {{key}} de la catégorie {{categoryName}}',
    [ActivityLog.type.categoryDelete]: 'a supprimé la catégorie {{categoryName}}',
    [ActivityLog.type.categoryLevelInsert]: "a ajouté un niveau à l'index {{index}} de la catégorie {{categoryName}}",
    [ActivityLog.type.categoryLevelPropUpdate]:
      'a mis à jour le niveau {{index}} {{key}} de la catégorie {{categoryName}}',
    [ActivityLog.type.categoryLevelDelete]: 'a supprimé le niveau {{index}} de la catégorie {{categoryName}}',
    [ActivityLog.type.categoryItemInsert]:
      'a ajouté un élément au niveau {{levelIndex}} de la catégorie {{categoryName}}',
    [ActivityLog.type.categoryItemPropUpdate]:
      "a mis à jour l'élément {{code}} {{key}} de la catégorie {{categoryName}}",
    [ActivityLog.type.categoryItemDelete]:
      "a supprimé l'élément {{code}} au niveau {{levelIndex}} de la catégorie {{categoryName}}",
    [ActivityLog.type.categoryImport]: 'a importé le fichier CSV dans la catégorie {{categoryName}}',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'a ajouté une taxonomie',
    [ActivityLog.type.taxonomyPropUpdate]: 'a mis à jour {{key}} de la taxonomie {{taxonomyName}}',
    [ActivityLog.type.taxonomyDelete]: 'a supprimé la taxonomie {{taxonomyName}}',
    [ActivityLog.type.taxonomyTaxaImport]: 'a importé le fichier CSV dans la taxonomie {{taxonomyName}}',
    [ActivityLog.type.taxonInsert]: 'a ajouté un taxon à la taxonomie {{taxonomyName}}',

    // Record
    [ActivityLog.type.recordCreate]: 'a ajouté un enregistrement',
    [ActivityLog.type.recordDelete]: "a supprimé l'enregistrement {{keys}}",
    [ActivityLog.type.recordImport]: 'enregistrement importé',
    [ActivityLog.type.recordStepUpdate]:
      "a mis à jour l'étape de l'enregistrement {{keys}} de {{stepFrom}} à {{stepTo}}",
    [ActivityLog.type.recordMerge]:
      "l'enregistrement {{sourceRecordKeys}} a été fusionné dans l'enregistrement {{targetRecordKeys}}",

    // Node
    [ActivityLog.type.nodeCreate]: "a ajouté le nœud {{name}} dans {{parentPath}} dans l'enregistrement {{recordKeys}}",
    [ActivityLog.type.nodeValueUpdate]:
      "a mis à jour le nœud {{name}} dans {{parentPath}} de l'enregistrement {{recordKeys}}",
    [ActivityLog.type.nodeDelete]: "a supprimé le nœud {{name}} de l'enregistrement {{recordKeys}}",

    // User
    [ActivityLog.type.userInvite]: "a invité l'utilisateur {{email}} avec le rôle {{groupName}}",
    [ActivityLog.type.userUpdate]: "a mis à jour l'utilisateur {{name}}",
    [ActivityLog.type.userRemove]: "a supprimé l'utilisateur {{name}} du formulaire",

    // Analysis
    [ActivityLog.type.chainCreate]: 'a ajouté une chaîne de traitement',
    [ActivityLog.type.chainPropUpdate]: 'a mis à jour {{key}} de la chaîne de traitement {{label}}',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      'a mis à jour {{key}} à {{value}} de la définition de nœud calculé {{name}}',
    [ActivityLog.type.chainStatusExecSuccess]: 'a exécuté avec succès la chaîne de traitement {{label}}',
    [ActivityLog.type.chainDelete]: 'a supprimé la chaîne de traitement {{label}}',
  },
}
