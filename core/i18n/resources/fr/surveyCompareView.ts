export default {
  introSteps: {
    exportFile: "Exportez le formulaire sans données depuis l'autre serveur Arena (par ex. Dev ou QA)",
    selectFile:
      'Sélectionnez le fichier exporté (.zip) : il est comparé avec ce formulaire et les différences sont affichées',
    applyChanges: 'Vérifiez les différences et appliquez les modifications sélectionnées à ce formulaire',
    publish:
      'Les modifications sont enregistrées en brouillon : testez le formulaire et publiez-le pour les rendre effectives',
  },
  selectFile: 'Sélectionner le fichier du formulaire (.zip)',
  fileTooLarge:
    'Le fichier sélectionné est trop volumineux (max {{maxSize}} Mo) : exportez le formulaire sans données, les enregistrements et leurs fichiers ne sont pas nécessaires pour comparer des formulaires',
  compareAgain: 'Comparer à nouveau',
  sourceSurvey: 'Formulaire chargé : {{name}}',
  identical: 'Les formulaires sont identiques',
  counts:
    '{{added}} uniquement dans le formulaire chargé, {{changed}} modifiés, {{removed}} uniquement dans ce formulaire',
  surveyInfoChanged:
    "Les informations du formulaire (langues, cycles, libellés) sont différentes : voir l'onglet « Informations du formulaire »",
  onlyDifferences: 'Afficher uniquement les différences',
  hideLayoutOnly: 'Masquer les différences de mise en page uniquement',
  apply: 'Appliquer les modifications sélectionnées ({{count}})',
  applyConfirm:
    "Appliquer {{count}} modifications sélectionnées à ce formulaire ?\nLes modifications sont enregistrées en brouillon : elles n'atteindront les enregistrements qu'à la publication du formulaire.",
  applyCompleted:
    'Modifications appliquées : {{applied}}, ignorées : {{skipped}}. Publiez le formulaire pour les rendre effectives.',
  tabs: {
    nodeDefs: 'Définitions de nœuds',
    categories: 'Catégories',
    taxonomies: 'Taxonomies',
    surveyInfo: 'Informations du formulaire',
  },
  status: {
    added: 'Uniquement dans le formulaire chargé',
    changed: 'Modifié',
    removed: 'Uniquement dans ce formulaire',
  },
  statusLabel: 'État',
  matchedBy: {
    uuid: 'Associé par identifiant interne',
    name: 'Associé par nom (les identifiants internes sont différents)',
  },
  props: {
    columnsNo: 'Colonnes',
    columnsOrder: 'Ordre des colonnes',
    cycles: 'Cycles',
    descriptions: 'Descriptions',
    formLayout: 'Mise en page du formulaire',
    gridPosition: 'ligne {{row}}, colonne {{column}}, largeur {{width}}, hauteur {{height}}',
    itemExtraDef: 'Propriétés supplémentaires',
    labels: 'Libellés',
    layout: 'Mise en page',
    levels: 'Niveaux',
    messages: 'Messages',
    pagesOrder: 'Ordre des pages',
    parent: 'Entité parente',
    validations: 'Validations',
  },
  cycle: 'cycle {{cycle}}',
  property: 'Propriété',
  sourceValue: 'Formulaire chargé',
  targetValue: 'Ce formulaire',
  emptyValue: '(vide)',
  layoutOnly: 'mise en page uniquement',
  selectItem: 'Sélectionnez un élément pour voir les détails',
  noDifferences: 'Aucune différence',
  identicalItem: 'Aucune différence',
  dependsOn: 'Appliqué avec :',
  itemsCount: 'éléments : {{added}} ajoutés, {{changed}} modifiés, {{removed}} uniquement dans ce formulaire',
  itemCode: 'Code',
  changes: 'Modifications',
  moreItems: '... et {{count}} éléments de plus',
  taxonomiesNote:
    "Les taxonomies sont comparées uniquement par leurs propriétés (les taxons ne sont pas comparés) ; elles ne peuvent pas encore être mises à jour d'ici.",
  reasons: {
    categoryLevelsChanged: 'Les niveaux de la catégorie sont différents : mettez-les à jour manuellement',
    categoryMissing: "La catégorie n'existe pas dans ce formulaire",
    categoryReportingDataChanged:
      "Le paramètre « données de rapport » de la catégorie ne peut pas être mis à jour d'ici",
    categoryRemovalNotSupported: 'Les catégories présentes uniquement dans ce formulaire ne sont pas supprimées',
    categoryItemsRemovalNotSupported: 'Les éléments présents uniquement dans ce formulaire sont conservés',
    cycleMissing: 'Un cycle est manquant dans ce formulaire',
    dependencyNotApplicable: 'Une modification dont elle dépend ne peut pas être appliquée',
    moveNotSupported: "Le déplacement d'une définition de nœud vers une autre entité n'est pas encore pris en charge",
    parentMissing: "La définition de nœud parente n'existe pas dans ce formulaire",
    publishedCategoryChanged: "La catégorie d'une définition de nœud publiée ne peut pas être modifiée",
    publishedKeyChanged: "La propriété « clé » d'une définition de nœud publiée ne peut pas être modifiée",
    publishedMultipleChanged: "La propriété « multiple » d'une définition de nœud publiée ne peut pas être modifiée",
    publishedTaxonomyChanged: "La taxonomie d'une définition de nœud publiée ne peut pas être modifiée",
    publishedTypeChanged: "Le type d'une définition de nœud publiée ne peut pas être modifié",
    removalNotSupported: 'Les définitions de nœuds présentes uniquement dans ce formulaire ne sont pas supprimées',
    taxonomyMissing: "La taxonomie n'existe pas dans ce formulaire",
    taxonomySyncNotSupported: "Les taxonomies ne peuvent pas encore être mises à jour d'ici",
    publishedNameChanged:
      "Renommage d'une définition de nœud publiée : les expressions utilisant l'ancien nom doivent être mises à jour",
    publishedCyclesRemoved:
      "Supprimer des cycles d'une définition de nœud publiée supprime ses données dans ces cycles",
  },
}
