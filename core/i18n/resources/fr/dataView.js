export default {
  charts: {
    downloadToPng: 'Télécharger le graphique en PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Veuillez sélectionner une dimension et une mesure pour afficher le graphique',
      selectAtLeast2NumericAttributes: 'Veuillez sélectionner 2 attributs numériques pour afficher le graphique',
      tooManyItemsToShowChart: `Trop d'éléments pour afficher le graphique ;
maximum {{maxItems}} éléments attendus.
Veuillez affiner votre requête (par ex. en ajoutant un filtre) pour réduire le nombre d'éléments.
`,
    },
    type: {
      area: 'Graphique en aires',
      bar: 'Graphique en barres',
      line: 'Graphique en lignes',
      pie: 'Graphique en secteurs',
      scatter: 'Graphique en nuage de points',
    },
  },
  dataQuery: {
    deleteConfirmMessage: 'Supprimer la requête "{{name}}" ?',
    displayType: {
      chart: 'Graphique',
      table: 'Tableau',
    },
    manageQueries: 'Gérer les requêtes',
    mode: {
      label: 'Mode :',
      aggregate: 'Agrégat',
      raw: 'Brut',
      rawEdit: 'Édition brute',
    },
    replaceQueryConfirmMessage: 'Remplacer la requête actuelle par la requête sélectionnée ?',
    showCodes: 'Afficher les codes',
  },
  editSelectedRecord: "Modifier l'enregistrement sélectionné",
  filterAttributeTypes: "Filtrer les types d'attributs",
  filterRecords: {
    buttonTitle: 'Filtrer',
    expressionEditorHeader: 'Expression pour filtrer les enregistrements',
  },
  invalidRecord: 'Enregistrement invalide',
  nodeDefsSelector: {
    hide: 'Masquer le sélecteur de définitions de nœud',
    show: 'Afficher le sélecteur de définitions de nœud',
    nodeDefFrequency: `{{nodeDefLabel}} (fréquence)`,
  },
  records: {
    clone: 'Cloner',
    confirmDeleteRecord: `Supprimer l'enregistrement "{{keyValues}}" ?`,
    confirmDeleteSelectedRecord_one: `Supprimer l'enregistrement sélectionné ?`,
    confirmDeleteSelectedRecord_other: `Supprimer les {{count}} enregistrements sélectionnés ?`,
    confirmMergeSelectedRecords: `### Fusionner les enregistrements sélectionnés en un seul ?

- l'enregistrement "source" sera fusionné dans l'enregistrement "cible" :
  - source : [{{sourceRecordKeys}}], modifié {{sourceRecordModifiedDate}} ;
  - cible : [{{targetRecordKeys}}], modifié {{targetRecordModifiedDate}} ;

- un aperçu du résultat sera affiché avant la fusion ;

- lorsque la fusion sera confirmée, **l'enregistrement source SERA SUPPRIMÉ**`,
    confirmUpdateRecordsStep: `Déplacer les {{count}} enregistrement(s) sélectionné(s) de {{stepFrom}} vers {{stepTo}} ?`,
    confirmUpdateRecordOwner: `Changer le propriétaire de l'enregistrement sélectionné en {{ownerName}} ?`,
    confirmValidateAllRecords: `Re-valider tous les enregistrements ?\n\nCela peut prendre plusieurs minutes.`,
    deleteRecord: "Supprimer l'enregistrement",
    demoteAllRecordsFromAnalysis: 'Analyse -> Nettoyage',
    demoteAllRecordsFromCleansing: 'Nettoyage -> Saisie',
    editRecord: "Modifier l'enregistrement",
    exportList: 'Exporter la liste',
    exportData: 'Exporter les données',
    exportDataSummary: 'Exporter le résumé des données',
    filterPlaceholder: 'Filtrer par clés ou propriétaire',
    merge: {
      label: 'Fusionner',
      confirmLabel: 'Confirmer la fusion',
      confirmTooManyDifferencesMessage: `**Trop de différences**.  
Il semble que les enregistrements soient très différents l'un de l'autre.  
De nombreux attributs (~{{nodesUpdated}}) seront mis à jour lors de la fusion.  
Continuer avec l'aperçu de la fusion ?`,
      noChangesWillBeApplied: `Aucune modification ne serait appliquée à l'enregistrement cible.  
La fusion ne peut pas être effectuée.`,
      performedSuccessfullyMessage: 'La fusion des enregistrements a été effectuée avec succès !',
      previewTitle: 'Aperçu de la fusion (enregistrement {{keyValues}})',
    },
    noRecordsAdded: 'Aucun enregistrement ajouté',
    noRecordsAddedForThisSearch: 'Aucun enregistrement trouvé',
    noSelectedRecordsInStep: "Aucun enregistrement sélectionné à l'étape {{step}}",
    owner: 'Propriétaire',
    promoteAllRecordsToAnalysis: 'Nettoyage -> Analyse',
    promoteAllRecordsToCleansing: 'Saisie -> Nettoyage',
    step: 'Étape',
    updateRecordsStep: "Mettre à jour l'étape des enregistrements",
    validateAll: 'Tout valider',
    viewRecord: "Voir l'enregistrement",
  },
  recordsClone: {
    title: "Clone d'enregistrements",
    fromCycle: 'Du cycle',
    toCycle: 'Vers le cycle',
    confirmClone: `Cloner les enregistrements du cycle {{cycleFrom}} vers le cycle {{cycleTo}} ?\n
(Seuls les enregistrements qui ne sont pas déjà dans le cycle {{cycleTo}} seront clonés)`,
    startCloning: 'Démarrer le clonage',
    cloneComplete: 'Clonage terminé. {{recordsCloned}} enregistrements clonés de {{cycleFrom}} vers {{cycleTo}}',
    error: {
      cycleToMissing: 'Veuillez sélectionner "Vers le cycle"',
      cycleToMustBeDifferentFromCycleFrom: '"Vers le cycle" doit être différent de "Du cycle"',
    },
    source: {
      label: 'Source',
      allRecords: 'Tous les enregistrements du cycle {{cycleFrom}} qui ne sont pas déjà dans le cycle {{cycleTo}}',
      selectedRecords: 'Uniquement les {{selectedRecordsCount}} enregistrements sélectionnés',
    },
  },
  recordDeleted_one: `Enregistrement supprimé avec succès !`,
  recordDeleted_other: `{{count}} enregistrements supprimés avec succès !`,
  recordsSource: {
    label: 'Source',
  },
  recordsUpdated: '{{count}} enregistrements mis à jour avec succès !',
  rowNum: 'Ligne n°',
  selectedAttributes: 'Attributs sélectionnés :',
  selectedDimensions: 'Dimensions sélectionnées',
  selectedMeasures: 'Mesures sélectionnées',
  sortableItemsInfo: 'Faites glisser et déposez pour les trier',
  showValidationReport: 'Afficher le rapport de validation',
  sort: 'Trier',
  dataExport: {
    source: {
      label: 'Source',
      allRecords: 'Tous les enregistrements',
      filteredRecords: 'Uniquement les enregistrements filtrés',
      selectedRecord: "Uniquement l'enregistrement sélectionné",
      selectedRecord_other: 'Uniquement les {{count}} enregistrements sélectionnés',
    },
    title: 'Exporter les données',
  },
  dataVis: {
    errorLoadingData: 'Erreur lors du chargement des données',
    noData: "Cette requête n'a retourné aucune donnée",
    noSelection:
      'Veuillez faire votre sélection dans le panneau de gauche ou sélectionner une requête existante depuis "Gérer les requêtes"',
  },
  viewSelectedRecord: "Voir l'enregistrement sélectionné",
}
