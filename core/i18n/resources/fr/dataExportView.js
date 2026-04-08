export default {
  error: "Erreur lors de l'exportation des données : {{details}}",
  optionNotCompatibleWithDataImport: "Non compatible avec l'importation de données",
  options: {
    header: '$t(common.options)',
    fileFormatLabel: 'Format de fichier',
    fileFormat: {
      csv: 'CSV',
      xlsx: 'Excel',
    },
    includeCategoryItemsLabels: 'Inclure les étiquettes des éléments de catégorie',
    includeCategories: 'Inclure les catégories',
    expandCategoryItems: 'Développer les éléments de catégorie',
    exportSingleEntitiesIntoSeparateFiles: 'Exporter les entités simples dans des fichiers séparés',
    includeAncestorAttributes: 'Inclure les attributs ancêtres',
    includeAnalysis: 'Inclure les variables de résultats',
    includeDataFromAllCycles: 'Inclure les données de tous les cycles',
    includeDateCreated: 'Inclure la date de création',
    includeFiles: 'Inclure les fichiers',
    includeFileAttributeDefs: "Inclure les colonnes d'attributs de fichier",
    includeInternalUuids: 'Inclure les UUIDs internes',
    recordsModifiedAfter: 'Enregistrements modifiés après',
  },
  optionsInfo: {
    expandCategoryItems:
      "ajoute une colonne booléenne pour chaque élément de catégorie avec la valeur VRAI si l'élément a été sélectionné, FAUX sinon",
    exportSingleEntitiesIntoSeparateFiles: `exporte les entités simples dans des fichiers séparés ; lorsque cela n'est pas coché, les attributs appartenant à une entité simple seront inclus parmi ceux de son plus proche ancêtre entité multiple`,
    includeAnalysis: "inclut les attributs d'analyse",
    includeAncestorAttributes: "inclut les attributs appartenant aux entités ancêtres, jusqu'à l'entité racine",
    includeCategoryItemsLabels: 'ajoute une colonne avec une étiquette pour chaque élément de catégorie',
    includeCategories: `les catégories seront exportées dans un sous-dossier appelé "categories"`,
    includeDataFromAllCycles:
      'les données de tous les cycles seront incluses, sinon seul le cycle sélectionné sera pris en compte',
    includeDateCreated: 'inclut la date de création de chaque entité (ligne) dans une colonne appelée "date_created"',
    includeFiles: `exporte les fichiers associés aux enregistrements dans un sous-dossier appelé "files"`,
    includeFileAttributeDefs: `ajoute les colonnes des attributs de fichier : identifiant interne du fichier (file_uuid) et nom (file_name)`,
    includeInternalUuids:
      'inclut les identifiants internes (UUIDs) dans des colonnes se terminant par le suffixe "_uuid"',
    recordsModifiedAfter: 'exporte uniquement les données des enregistrements modifiés après la date spécifiée',
  },
  startExport: "Démarrer l'exportation",
}
