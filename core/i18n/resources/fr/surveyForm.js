export default {
  subPage: 'Sous-page',
  addChildTo: 'Ajouter à {{nodeDefLabel}}',
  addChildToTitle: 'Ajouter un nouveau nœud à {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Booléen',
    code: 'Code',
    coordinate: 'Coordonnée',
    date: 'Date',
    decimal: 'Décimal',
    geo: 'Géospatial',
    entity: 'Tableau ou formulaire',
    file: 'Fichier',
    integer: 'Entier',
    taxon: 'Taxon',
    text: 'Texte',
    time: 'Heure',
    // éléments de mise en page
    formHeader: 'En-tête de formulaire',
  },
  clone: `Cloner '{{nodeDefLabel}}'`,
  compressFormItems: `Compresser les éléments du formulaire pour '{{nodeDefLabel}}'`,
  confirmUpdateDependentEnumeratedEntities: `Si vous continuez, certaines entités énumérées ({{entityDefs}}) seront ré-énumérées,  
supprimant les valeurs existantes insérées dans celles-ci (le cas échéant).  
Continuer ?`,
  convert: `Convertir '{{nodeDefLabel}}'`,
  delete: `Supprimer '{{nodeDefLabel}}'`,
  edit: `Modifier '{{nodeDefLabel}}'`,
  schemaSummary_csv: 'Résumé du schéma (CSV)',
  schemaSummary_xlsx: 'Résumé du schéma (Excel)',
  hidePages: 'Masquer les pages',
  showPages: 'Afficher les pages',
  move: `Déplacer '{{nodeDefLabel}}'`,
  movePageUp: 'Monter la page',
  movePageDown: 'Descendre la page',
  formEditActions: {
    preview: 'Aperçu',
  },
  formEntryActions: {
    confirmDemote: 'Êtes-vous sûr(e) de vouloir rétrograder cet enregistrement vers {{name}} ?',
    confirmPromote: `Êtes-vous sûr(e) de vouloir **promouvoir cet enregistrement vers {{name}}** ?  
Vous ne pourrez plus le modifier`,
    confirmPromoteWithErrors: `**Cet enregistrement contient des erreurs**.  
$t(surveyForm:formEntryActions.confirmPromote)`,
    confirmDelete: 'Êtes-vous sûr(e) de vouloir supprimer cet enregistrement ?\n\n$t(common.cantUndoWarning)',
    closePreview: "Fermer l'aperçu",
    demoteTo: 'Rétrograder vers {{stepPrev}}',
    promoteTo: 'Promouvoir vers {{stepNext}}',
    step: 'Étape {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Colonnes',
    confirmConvert: 'Convertir l\'attribut "{{name}}" en "{{toType}}" ?',
    confirmDelete:
      'Êtes-vous sûr(e) de vouloir supprimer définitivement cette définition de nœud : {{ name }} ?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: "Saisissez le code ou l'étiquette",
    option: 'Option {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: '$t(common.true)',
        false: '$t(common.false)',
      },
      yesNo: {
        true: '$t(common.yes)',
        false: '$t(common.no)',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Coordonnée',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Afficher sur la carte',
    accuracy: 'Précision',
    altitude: 'Altitude',
    altitudeAccuracy: "Précision de l'altitude",
  },
  nodeDefGeo: {
    confirmDelete: 'Supprimer cette valeur Géospatiale ?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Fichier GeoJSON invalide téléversé',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Ajouter un nouveau {{name}}',
    confirmDelete: 'Êtes-vous sûr(e) de vouloir supprimer cette entité ?',
    select: 'Sélectionnez un(e) {{name}} :',
    selectedEntity: '{{name}} sélectionné(e) :',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Nom scientifique',
    vernacularName: 'Nom vernaculaire',
    vernacularNameAlwaysIncludedIfSingle: "Nom vernaculaire toujours inclus s'il est unique",
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Activé** : si cette option est activée et qu'un taxon n'a qu'un seul nom vernaculaire défini, ce nom vernaculaire sera automatiquement enregistré avec les données lorsque le taxon est sélectionné.  
- **Désactivé** : seul le code du taxon et le nom scientifique seront enregistrés, même si le taxon a un seul nom vernaculaire.`,
    vernacularNameSelectionKept: 'Sélection du nom vernaculaire conservée',
    vernacularNameSelectionKeptInfo: `- **Activé** : lorsqu'un taxon est sélectionné à l'aide d'un nom vernaculaire (commun), le nom vernaculaire spécifique utilisé pour la recherche sera également enregistré dans les données.  
- **Désactivé** : seul le code du taxon et le nom scientifique seront enregistrés, quel que soit le nom vernaculaire utilisé lors de la recherche.  
Dans Arena Mobile :  
- **Activé** : chaque nom vernaculaire apparaît comme un élément séparé dans la liste des résultats de recherche.
- **Désactivé** : tous les noms vernaculaires d'un taxon sont regroupés et affichés avec le taxon (combinés dans une seule entrée). En conséquence, la liste de saisie automatique contient moins d'éléments.`,
    visibleFields: 'Champs visibles',
  },
  nodeDefFile: {
    errorLoadingPreview: "Erreur lors du chargement de l'aperçu",
    fileUuid: 'UUID du fichier',
    fileName: 'Nom du fichier',
    locationInformationNotFound: 'Informations de localisation introuvables dans le fichier',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Tous les nœuds',
    onlyPages: 'Uniquement les pages',
  },
  step: {
    entry: 'Saisie',
    cleansing: 'Nettoyage',
    analysis: 'Analyse',
  },
  confirmNodeDelete: 'Êtes-vous sûr(e) de vouloir supprimer ce {{nodeDefType}} ({{nodeDefLabel}}) ?',
  exportDocx: "Exporter l'enquête (DOCX)",
  exportLabels_csv: 'Exporter les étiquettes (CSV)',
  exportLabels_xlsx: 'Exporter les étiquettes (Excel)',
  importLabels: 'Importer les étiquettes depuis Excel ou CSV',
}
