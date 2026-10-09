export default {
  aiDataQueryDescriptionMissing: 'Veuillez décrire en langage naturel les données que vous souhaitez voir.',
  aiDataQueryEmpty: "Sélectionnez d'abord une entité et des attributs (ou des dimensions et des mesures).",
  aiDataQueryInvalid: "L'IA n'a pas pu générer une requête valide pour cette demande : {{errors}}",
  aiDataQueryNoEntities: 'Ce formulaire ne contient aucune entité pouvant être interrogée.',
  aiDataQuerySummaryInvalid:
    "L'IA n'a pas pu suggérer un nom et une description pour cette requête. Veuillez réessayer.",
  userCannotDeleteHasMessages:
    "Cet utilisateur ne peut pas être supprimé : il est l'auteur de {{count}} message(s) ; supprimez-les ou réattribuez-les d'abord",
  userCannotDeleteLastSystemAdmin:
    'Cet utilisateur ne peut pas être supprimé : il est le dernier administrateur système',
  userCannotDeleteOwnsSurveys:
    "Cet utilisateur ne peut pas être supprimé : il est propriétaire de {{count}} formulaire(s) ; transférez-en d'abord la propriété",
  userCannotDeleteSelf: 'Vous ne pouvez pas supprimer votre propre compte utilisateur',
  userEmailInvalid:
    "L'e-mail d'invitation n'a pas pu être remis à {{email}} ; veuillez vérifier que l'adresse est correcte",
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
    invalidNodeInRecord:
      'Nœud invalide dans l\'enregistrement "{{recordUuid}}", nœud "{{nodeUuid}}" avec la définition de nœud "{{nodeDefName}}" (uuid "{{nodeDefUuid}}"): {{details}}',
    noRecordsFound: "Aucun enregistrement trouvé dans le fichier d'importation ou format de fichier incorrect",
    pendingImportFileNotFoundOrExpired:
      'Le fichier précédemment téléchargé est introuvable ; il a peut-être expiré. Veuillez le télécharger à nouveau.',
    recordMergeWithSameKeysNotAllowed:
      'Impossible d’importer l’enregistrement "{{recordKeyValues}}" : un autre enregistrement avec les mêmes clés existe déjà et la fusion des enregistrements avec les mêmes clés n’est pas autorisée dans cette enquête',
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
  geoWhispApiError: 'Le service Whisp est temporairement indisponible.',
  importingDataIntoWrongCollectSurvey:
    'Importation de données dans le mauvais formulaire. URI attendu : {{collectSurveyUri}}',
  invalidType: 'Type invalide {{type}}',
  jobCanceledOrErrorsFound: 'Tâche annulée ou erreurs trouvées ; annulation de la transaction',
  jobOrphanedOnRestart: 'La tâche a été interrompue par un redémarrage du serveur. Veuillez réessayer.',
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
  recordPrintableExport: {
    missingEntityParams: "L'export de la page actuelle nécessite entityDefUuid et entityNodeUuid",
    entityNotFound: "Entité introuvable pour l'export spécifié",
    missingServerUrl: "L'URL publique du serveur est requise lors de l'export avec un code QR",
    qrTokenMismatch: "Impossible de finaliser l'export avec code QR ; veuillez réessayer",
  },
  sessionExpiredRefreshPage: `La session a peut-être expiré.
Essayez de rafraîchir la page.`,
  survey: {
    nodeDefNameNotFound: 'Définition de nœud introuvable : {{name}}',
    dataMigrationInProgress: 'Ce formulaire est en cours de mise à niveau ; veuillez réessayer sous peu.',
    fileNotFound: 'Fichier introuvable',
  },
  unsupportedFunctionType: 'Type de fonction non pris en charge : {{exprType}}',
  aiNotConfigured:
    "L'IA n'est pas configurée. Définissez un fournisseur personnel dans les paramètres IA ou demandez à votre administrateur de configurer un fournisseur par défaut.",
  aiFeaturesDisabled: 'Les fonctionnalités IA sont désactivées sur ce déploiement.',
  aiFeatureDisabled: 'La fonctionnalité IA "{{feature}}" est désactivée.',
  aiPromptTooLarge: 'Le prompt IA est trop volumineux ({{size}} caractères ; limite {{limit}}).',
  aiInputTooLong: 'Le champ de saisie IA "{{field}}" dépasse la limite de {{limit}} caractères.',
  aiSchemaMissing: 'Le schéma de sortie structurée IA est manquant pour la fonctionnalité "{{feature}}".',
  aiProviderInvalid: 'Fournisseur IA non pris en charge : {{provider}}.',
  aiModelMissing: "L'identifiant du modèle IA est requis.",
  aiApiKeyMissing: 'Une clé API est requise pour le fournisseur {{provider}}.',
  aiBaseUrlMissing: 'Une URL de base est requise pour le fournisseur compatible OpenAI.',
  aiModelListFailed: 'Impossible de lister les modèles du fournisseur : {{message}}',
  aiExpressionDescriptionMissing: "Veuillez décrire en langage courant l'expression souhaitée.",
  aiExpressionTypeInvalid: "Type d'expression inconnu : {{expressionType}}.",
  aiExpressionNodeDefMissing: 'Impossible de générer une expression sans champ cible.',
  aiExpressionNodeDefNotFound: 'Champ cible introuvable (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: "Impossible d'expliquer une expression vide.",
  aiTranslationSocketMissing: 'WebSocket non connecté. Veuillez patienter un instant et réessayer.',
  aiTranslationSourceLangMissing: 'La langue source est requise pour la traduction.',
  aiTranslationTargetLangsMissing: 'Au moins une langue cible est requise pour la traduction.',
  aiTranslationItemsMissing: 'Rien à traduire.',
  aiTranslationTooManyItems: "Trop d'éléments dans un seul lot ({{count}}) ; la limite est de {{limit}}.",
  aiActivityLogSurveyMissing: "Un formulaire est requis pour résumer le journal d'activité.",
  aiChatbotDisabled: 'Le chatbot de documentation est désactivé sur ce déploiement.',
  aiChatbotUpstreamError:
    'Le chatbot de documentation est temporairement indisponible. Veuillez réessayer dans un instant.',
  aiChatbotPayloadTooLarge:
    'Votre conversation est trop volumineuse. Effacez la discussion et essayez une question plus courte.',
  userHasPendingInvitation: `Il existe déjà une invitation en attente pour l'utilisateur avec l'email '{{email}}' ; il/elle ne peut pas être invité(e) à ce formulaire jusqu'à ce qu'elle soit acceptée`,
  userHasRole: "L'utilisateur a déjà un rôle dans ce formulaire",
  userHasRole_other: 'Les utilisateurs ont déjà un rôle dans ce formulaire',
  userInvalid: 'Utilisateur invalide',
  userIsAdmin: "L'utilisateur est déjà administrateur système",
  userNotAllowedToChangePref: 'Utilisateur non autorisé à modifier les préférences',
  userNotAuthorized: 'Utilisateur {{userName}} non autorisé',
  userNotFound: 'Utilisateur introuvable : {{userUuid}}',
  usersBackupImport: {
    invalidFile: "Le fichier n'est pas une sauvegarde d'utilisateurs Arena valide",
  },
}
