export default {
  cannotGetChild: `Impossible d'obtenir l'enfant '{{childName}}' depuis l'attribut {{name}}`,
  cannotImportFilesExceedingQuota:
    "Impossible d'importer les fichiers d'enregistrement : le quota de stockage serait dépassé",
  cannotInsertFileExceedingQuota: "Impossible d'insérer le fichier : le quota de stockage serait dépassé",
  cannotOverridePublishedTaxa: "Impossible d'écraser les taxons publiés",
  cantUpdateStep: `Impossible de mettre à jour l'étape`,
  chainCannotBeSaved: 'La chaîne est invalide et ne peut pas être sauvegardée',
  csv: {
    emptyHeaderFound: 'En-tête vide trouvé à la colonne {{columnPosition}}',
    emptyHeaders: 'En-têtes vides trouvés',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      "Erreur lors de l'export des données (trop d'éléments). Essayez d'exporter en format CSV.",
    noRecordsMatchingSearchCriteria: 'Aucun enregistrement ne correspond aux critères de recherche',
  },
  dataImport: {
    importFromMobileNotAllawed: "L'importation de données depuis Arena Mobile n'est pas autorisée",
    noRecordsFound: "Aucun enregistrement trouvé dans le fichier d'importation ou format de fichier incorrect",
    recordOwnedByAnotherUser:
      'Impossible de mettre à jour l’enregistrement "{{recordKeyValues}}" car il appartient à un autre utilisateur',
  },
  entryDataNotFound: "Données d'entrée non trouvées : {{entryName}}",
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  functionHasTooFewArguments: 'La fonction {{fnName}} nécessite au moins {{minArity}} arguments (reçu {{numArgs}})',
  functionHasTooManyArguments: 'La fonction {{fnName}} accepte au maximum {{maxArity}} arguments (reçu {{numArgs}})',
  generic: 'Erreur inattendue : {{text}}',
  importingDataIntoWrongCollectSurvey:
    'Importation de données dans le mauvais formulaire. URI attendu : {{collectSurveyUri}}',
  invalidType: 'Type invalide {{type}}',
  jobCanceledOrErrorsFound: 'Tâche annulée ou erreurs trouvées ; annulation de la transaction',
  paramIsRequired: 'Le paramètre {{param}} est requis',
  unableToFindParent: 'Impossible de trouver le parent de {{name}}',
  unableToFindNode: 'Impossible de trouver le nœud avec le nom {{name}}',
  unableToFindSibling: 'Impossible de trouver le sibling avec le nom {{name}}',
  undefinedFunction: `Fonction '{{fnName}}' non définie ou types de paramètres incorrects`,
  invalidSyntax: "La syntaxe de l'expression est invalide",
  networkError: 'Erreur de communication avec le serveur',
  record: {
    errorUpdating: "Erreur lors de la mise à jour de l'enregistrement",
    entityNotFound: 'Entité "{{entityName}}" avec les clés "{{keyValues}}" introuvable',
    updateSelfAndDependentsDefaultValues:
      "$t(appErrors:record.errorUpdating) ; erreur lors de l'évaluation de l'expression dans le nœud {{nodeDefName}} : {{details}}",
  },
  sessionExpiredRefreshPage: `La session a peut-être expiré.
Essayez de rafraîchir la page.`,
  survey: {
    nodeDefNameNotFound: 'Définition de nœud introuvable : {{name}}',
  },
  unsupportedFunctionType: 'Type de fonction non pris en charge : {{exprType}}',
  userHasPendingInvitation: `Il existe déjà une invitation en attente pour l'utilisateur avec l'email '{{email}}' ; il/elle ne peut pas être invité(e) à ce formulaire jusqu'à ce qu'elle soit acceptée`,
  userHasRole: "L'utilisateur a déjà un rôle dans ce formulaire",
  userHasRole_other: 'Les utilisateurs ont déjà un rôle dans ce formulaire',
  userInvalid: 'Utilisateur invalide',
  userIsAdmin: "L'utilisateur est déjà administrateur système",
  userNotAllowedToChangePref: 'Utilisateur non autorisé à modifier les préférences',
  userNotAuthorized: 'Utilisateur {{userName}} non autorisé',
}
