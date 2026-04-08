export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Aucun formulaire actif sélectionné</title>
      <p><label>Veuillez en sélectionner un depuis la</label><linkToSurveys>Liste des formulaires</linkToSurveys> ou <linkToNewSurvey>en créer un nouveau</linkToNewSurvey></p>`,
    activeUsers: 'Utilisateurs actifs',
    activityLog: {
      title: "Journal d'activité",
      size: '$t(homeView:dashboard.activityLog.title) taille : {{size}}',
    },
    exportWithData: 'Exporter + données (Sauvegarde)',
    exportWithDataNoActivityLog: "Exporter + données (SANS Journal d'activité)",
    exportWithDataNoResultAttributes: 'Exporter + données (SANS attributs de résultats)',
    surveyPropUpdate: {
      main: `<title>Bienvenue dans Arena</title>
  
        <p>Vous devez d'abord définir le <strong>nom</strong> et <strong>l'étiquette</strong> du formulaire.</p>
        
        <p>Cliquez ci-dessous sur <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>ou sur le nom du formulaire :<basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Si le nom et l'étiquette sont corrects, créez le premier attribut
        <linkWithIcon>Formulaire \u003E Concepteur de formulaire</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>Créons le premier attribut de {{surveyName}} </title>
        
        <p>Allez dans <linkWithIcon>Formulaire \u003E Concepteur de formulaire</linkWithIcon></p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Utilisation du stockage',
      availableSpace: 'Disponible ({{size}})',
      usedSpace: 'Utilisé ({{size}})',
      usedSpaceOutOf: `Utilisé {{percent}}% ({{used}} sur {{total}})`,
    },
    storageSummaryDb: {
      title: 'Utilisation du stockage (Base de données)',
    },
    storageSummaryFiles: {
      title: 'Utilisation du stockage (fichiers)',
    },
    samplingPointDataCompletion: {
      title: "Complétude des données de points d'échantillonnage",
      totalItems: 'Total des éléments : {{totalItems}}',
      remainingItems: 'Éléments restants',
    },
    step: {
      entry: 'Saisie de données',
      cleansing: 'Nettoyage de données',
      analysis: 'Analyse de données',
    },
    // résumé des enregistrements
    recordsByUser: 'Enregistrements par utilisateur',
    recordsAddedPerUserWithCount: 'Enregistrements ajoutés par utilisateur (Total de {{totalCount}})',
    dailyRecordsByUser: 'Enregistrements quotidiens par utilisateur',
    totalRecords: 'Total des enregistrements',
    selectUsers: 'Sélectionner des utilisateurs...',
    noRecordsAddedInSelectedPeriod: 'Aucun enregistrement ajouté dans la période sélectionnée',
  },
  surveyDeleted: 'Le formulaire {{surveyName}} a été supprimé',
  surveyInfo: {
    basic: 'Informations de base',
    configuration: {
      title: 'Configuration',
      filesTotalSpace: 'Espace total des fichiers (Go)',
    },
    confirmDeleteCycleHeader: 'Supprimer ce cycle ?',
    confirmDeleteCycle: `Êtes-vous sûr(e) de vouloir supprimer le cycle {{cycle}} ?\n\n$t(common.cantUndoWarning)\n\n
Si des enregistrements sont associés à ce cycle, ils seront supprimés.`,
    cycleForArenaMobile: 'Cycle pour Arena Mobile',
    deleteActivityLog: "Effacer le journal d'activité",
    deleteActivityLogConfirm: {
      headerText: "Effacer TOUTES les données du journal d'activité pour ce formulaire ?",
      message: `
  - TOUTES les données du journal d'activité pour le formulaire **{{surveyName}}** seront supprimées ;\n\n
  - l'espace occupé dans la BD par le formulaire sera réduit ;\n\n
  - cela n'affectera pas les données de saisie du formulaire ;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Entrez le nom de ce formulaire pour confirmer :',
    },
    fieldManualLink: 'Lien vers le manuel de terrain',
    editInfo: 'Modifier les infos',
    viewInfo: 'Voir les infos',
    preferredLanguage: 'Langue préférée',
    sampleBasedImageInterpretation: "Interprétation d'images basée sur des échantillons",
    sampleBasedImageInterpretationEnabled: "Interprétation d'images basée sur des échantillons activée",
    security: {
      title: 'Sécurité',
      dataEditorViewNotOwnedRecordsAllowed:
        "L'éditeur de données peut voir les enregistrements qui ne lui appartiennent pas",
      visibleInMobile: 'Visible dans Arena Mobile',
      allowRecordsDownloadInMobile: 'Autoriser le téléchargement des enregistrements du serveur vers Arena Mobile',
      allowRecordsUploadFromMobile:
        'Autoriser le téléversement des enregistrements depuis Arena Mobile vers le serveur',
      allowRecordsWithErrorsUploadFromMobile:
        'Autoriser le téléversement des enregistrements avec des erreurs de validation depuis Arena Mobile vers le serveur',
    },
    srsPlaceholder: "Tapez le code ou l'étiquette",
    unpublish: 'Dépublier et supprimer les données',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Êtes-vous sûr(e) de vouloir dépublier ce formulaire ?',
      unpublishWarning: `La dépublication du formulaire **{{surveyName}}** supprimera toutes ses données.\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Entrez le nom de ce formulaire pour confirmer :',
    },
    userExtraProps: {
      title: 'Propriétés supplémentaires des utilisateurs',
      info: `Propriétés supplémentaires pouvant être assignées à chaque utilisateur associé au formulaire.  
Ces propriétés peuvent être utilisées dans les valeurs par défaut, les règles de validation et les expressions d'applicabilité.  
Ex. : *userProp('nom_propriété') == 'une_valeur'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Êtes-vous sûr(e) de vouloir supprimer ce formulaire ?',
    deleteWarning: `La suppression du formulaire **{{surveyName}}** supprimera toutes ses données.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Entrez le nom de ce formulaire pour confirmer :',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Activer',
  },
  collectImportReport: {
    excludeResolvedItems: 'Exclure les éléments résolus',
    expression: 'Expression',
    resolved: 'Résolu',
    exprType: {
      applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
      codeParent: 'Code parent',
      defaultValue: 'Valeur par défaut',
      validationRule: 'Règle de validation',
    },
    title: "Rapport d'importation Collect",
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Enregistrements ajoutés au cours des derniers :',
    fromToPeriod: 'de {{from}} à {{to}}',
    record: '{{count}} Enregistrement',
    record_other: '{{count}} Enregistrements',
    week: '{{count}} Semaine',
    week_other: '{{count}} Semaines',
    month: '{{count}} Mois',
    month_other: '{{count}} Mois',
    year: '{{count}} An',
    year_other: '{{count}} Ans',
  },
}
