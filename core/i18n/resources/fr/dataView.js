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
      sampleRandomOnly:
        "Affichage d'un échantillon aléatoire de {{sampleSize}} éléments sur {{totalCount}} (aucune valeur aberrante trouvée).",
      sampleWithOutliers:
        'Affichage de {{sampleSize}} éléments sur {{totalCount}} : {{outliersCount}} valeurs aberrantes et un échantillon aléatoire de {{randomCount}} des autres éléments.',
      sampleOutliersOnly:
        'Affichage des {{sampleSize}} valeurs aberrantes les plus extrêmes sur {{totalCount}} éléments.',
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
    ai: {
      button: "Demander à l'IA",
      buttonTitle: "Générer une requête à partir d'une description avec l'IA",
      title: "Générer une requête avec l'IA",
      hint: "Décrivez les données que vous souhaitez voir ; l'IA sélectionnera l'entité, les attributs (ou les dimensions et les mesures), le filtre et le tri. Vous pourrez ensuite vérifier la requête générée et l'enregistrer depuis le gestionnaire de requêtes.",
      placeholder: "ex. nombre d'arbres regroupés par espèce",
      generate: 'Générer',
      generating: 'Génération…',
      replaceQueryConfirmMessage: 'Remplacer la requête actuelle par la requête générée ?',
      suggestSummary: 'Suggérer un nom et une description',
      suggestSummaryFailed: 'Impossible de suggérer le nom et la description de la requête : {{message}}',
      suggestSummaryTitle:
        "Utiliser l'IA pour suggérer le nom, le libellé et la description de la requête d'après les sélections actuelles",
      generatedSuccessfully:
        'Requête générée : {{explanation}} Vérifiez le résultat et enregistrez la requête si vous souhaitez la conserver.',
    },
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
    showTotalAndPercentage: 'Afficher le total et le pourcentage',
    total: 'Total',
  },
  editSelectedRecord: "Modifier l'enregistrement sélectionné",
  filterAttributeTypes: "Filtrer les types d'attributs",
  filterAttributes: 'Filtrer les attributs',
  filterMessages: 'Filtrer les messages',
  messageTypeFilter: {
    valueRequired: 'Valeur requise',
    valueInvalid: 'Valeur invalide',
    uniqueDuplicate: 'Valeur en double',
    customValidation: 'Validation personnalisée',
    entityKeyDuplicate: "Clé d'entité en double",
    recordKeyDuplicate: "Clé d'enregistrement dupliquée",
    nodesCount: 'Nombre de nœuds',
  },
  filterRecords: {
    buttonTitle: 'Filtrer les enregistrements',
    expressionEditorHeader: 'Expression pour filtrer les enregistrements',
  },
  invalidRecord: 'Enregistrement invalide',
  nodeDefsSelector: {
    hide: 'Masquer le sélecteur de définitions de nœud',
    show: 'Afficher le sélecteur de définitions de nœud',
    nodeDefFrequency: `{{nodeDefLabel}} (fréquence)`,
    searchPlaceholder: 'Rechercher une variable par nom',
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
    exportSelectedRecordsArenaFormat: 'Exporter les enregistrements sélectionnés (format Arena)',
    exportRecordDocx: "Exporter l'enregistrement (Word)",
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
  dataMatrixExport: {
    intro: `Exportez les données de **{{entity}}** sous forme de tableau avec :

- une **ligne** pour chaque valeur différente des attributs de ligne (p. ex. chaque espèce et strate) ;
- une **colonne** pour chaque enregistrement, nommée d'après sa clé ({{keys}}) ;
- dans les cellules, la valeur de l'attribut de valeur (p. ex. le recouvrement).

C'est le format utilisé par les outils d'analyse de la végétation comme Turboveg, Juice et Synbiosys.`,
    layout: {
      dataMatrix: 'Matrice de données',
      info: "Tableau : lignes et colonnes telles qu'affichées dans l'Explorateur de données. Matrice de données : une ligne par espèce (ou autre attribut) et une colonne par enregistrement, comme requis par les outils d'analyse de la végétation tels que Turboveg.",
      label: 'Exporter en tant que',
      table: 'Tableau',
    },
    preview: 'Aperçu',
    previewRecord: "{{keys}} de l'enregistrement {{number}}",
    recordKeys: 'Attributs clés utilisés pour nommer les colonnes des enregistrements',
    recordKeysInfo:
      "Chaque enregistrement devient une colonne, nommée d'après les valeurs des attributs clés sélectionnés (p. ex. uniquement le numéro de placette). Par défaut, les attributs clés sélectionnés dans l'Explorateur de données sont utilisés, ou tous si aucun n'est sélectionné. Au moins un est requis.",
    recordsAll:
      "Les données de tous les enregistrements sont exportées : définissez un filtre dans l'Explorateur de données pour n'en exporter que certains.",
    recordsFiltered: "Seules les données correspondant au filtre actuel de l'Explorateur de données sont exportées.",
    rowAttribute: "Lignes (nom de l'attribut taxon, p. ex. espèce)",
    rowAttributeInfo:
      'Chaque valeur différente de cet attribut devient une ligne du tableau. Les attributs taxon sont exportés avec leur nom scientifique, car tous les taxons non répertoriés ont le même code.',
    secondRowAttribute: 'Second attribut de ligne, facultatif (p. ex. strate)',
    secondRowAttributeInfo:
      'À utiliser lorsque la même espèce peut apparaître plusieurs fois dans un enregistrement (p. ex. dans différentes strates) : chaque combinaison devient une ligne distincte.',
    valueAttribute: 'Valeurs (p. ex. recouvrement)',
    valueAttributeInfo:
      'La valeur affichée dans les cellules. Les attributs code sont exportés avec leur code, pas avec le libellé. Si une ligne apparaît plusieurs fois dans un enregistrement avec des valeurs différentes, la cellule les contient toutes.',
  },
  dataVis: {
    errorLoadingData: 'Erreur lors du chargement des données',
    noData: "Cette requête n'a retourné aucune donnée",
    noSelection:
      'Veuillez faire votre sélection dans le panneau de gauche ou sélectionner une requête existante depuis "Gérer les requêtes"',
  },
  viewSelectedRecord: "Voir l'enregistrement sélectionné",
  mapView: {
    layersControl: {
      areasOfInterest: "Zones d'intérêt",
      baseLayers: 'Couches de base',
      inputData: "Données d'entrée",
      preloadedLayers: 'Couches préchargées',
      samplingPointData: "Données de points d'échantillonnage",
    },
    layersPanel: {
      markers: '{{count}} marqueurs',
      markers_one: '{{count}} marqueur',
      markers_other: '{{count}} marqueurs',
    },
  },
}
