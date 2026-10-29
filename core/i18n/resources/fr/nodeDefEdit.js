export default {
  additionalFields: 'Champs supplémentaires',
  basic: 'Basique',
  advanced: 'Avancé',
  mobileApp: 'Application mobile',
  print: 'Impression',
  printProps: {
    printOrientation: {
      label: 'Orientation de la page',
      info: "Orientation utilisée lorsque cette entité commence sa propre section imprimable. Par défaut, hérite de l'orientation du document choisie lors de l'export.",
    },
    orientations: {
      default: 'Par défaut (document)',
      portrait: 'Portrait',
      landscape: 'Paysage',
    },
  },
  validations: 'Validations',
  function: 'Fonction',
  editingFunction: 'Modification de la fonction {{functionName}}',
  editorHelp: {
    json: 'Les expressions valides sont un sous-ensemble de Javascript.',
    sql: 'Seules les expressions SQL valides sont autorisées.',
  },
  editorCompletionHelp: '- Afficher les variables et fonctions disponibles pouvant être utilisées',
  functionDescriptions: {
    categoryItemProp:
      "Renvoie la valeur de la $t(extraProp.label) spécifiée d'un élément de catégorie ayant le code spécifié",
    dateTimeDiff: 'Renvoie la différence (en minutes) entre 2 couples date-heure',
    distance: 'Renvoie la distance (en mètres) entre les coordonnées spécifiées',
    first: "Renvoie la première valeur ou le premier nœud de l'attribut ou de l'entité multiple spécifié(e)",
    geoCoordinateAtDistance:
      'Renvoie les coordonnées à une distance et un cap spécifiés depuis les coordonnées spécifiées',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoAOIContaining:
      "Renvoie le nom de la première zone d'intérêt de l'enquête (dans l'ordre défini dans Infos de l'enquête → Carte) contenant la coordonnée spécifiée, ou rien si aucune zone ne la contient",
    geoDistanceToAOIBoundary:
      "Renvoie la distance (en mètres) entre une coordonnée et la limite de la zone d'intérêt spécifiée de l'enquête : négative à l'intérieur de la zone, positive à l'extérieur",
    geoPolygon: "Génère un polygone en GeoJSON à partir d'une liste de coordonnées",
    includes: "Renvoie vrai si l'attribut multiple spécifié inclut la valeur spécifiée.",
    index: "Renvoie l'index du nœud spécifié parmi ses voisins",
    isEmpty: "Renvoie vrai si l'argument n'a pas de valeur spécifiée",
    isNotEmpty: "Renvoie vrai si l'argument a une valeur spécifiée",
    last: "Renvoie la dernière valeur ou le dernier nœud de l'attribut ou de l'entité multiple spécifié(e)",
    ln: 'Renvoie le logarithme naturel de X',
    log10: 'Renvoie le logarithme en base 10 de X',
    max: 'Renvoie le maximum des arguments',
    min: 'Renvoie le minimum des arguments',
    now: "Renvoie la date ou l'heure actuelle",
    parent: "Renvoie l'entité parente du nœud spécifié",
    pow: "Renvoie la valeur d'une base élevée à une puissance",
    prevCycleNote:
      'Fonctionne uniquement dans Arena Mobile lorsque plusieurs cycles sont définis et que le lien au cycle précédent est activé',
    prevCycleValue:
      "Retourne la valeur du même attribut dans l'enregistrement du cycle précédent. $t(nodeDefEdit:functionDescriptions.prevCycleNote)",
    prevCycleValues:
      "Retourne les valeurs des mêmes attributs dans l'enregistrement du cycle précédent. $t(nodeDefEdit:functionDescriptions.prevCycleNote)",
    recordCycle: "Renvoie le cycle de l'enregistrement actuel",
    recordDateCreated:
      "Renvoie la date et l'heure de création de l'enregistrement actuel sous forme de valeur datetime. Peut être utilisé dans un attribut texte, date ou heure",
    recordDateLastModified:
      "Renvoie la date et l'heure de dernière modification de l'enregistrement actuel sous forme de valeur datetime. Peut être utilisé dans un attribut texte, date ou heure",
    recordOwnerEmail: "Renvoie l'e-mail de l'utilisateur propriétaire de l'enregistrement",
    recordOwnerName: "Renvoie le nom de l'utilisateur propriétaire de l'enregistrement",
    recordOwnerRole: "Renvoie le rôle (dans le formulaire actuel) de l'utilisateur propriétaire de l'enregistrement",
    rowIndex: "Renvoie l'index de la ligne de tableau actuelle (ou du formulaire)",
    taxonProp: "Renvoie la valeur de la $t(extraProp.label) spécifiée d'un taxon ayant le code spécifié",
    taxonVernacularName:
      "Renvoie le (premier) nom vernaculaire (ou local) dans la langue spécifiée d'un taxon ayant le code spécifié",
    unique: "Renvoie les valeurs uniques d'un attribut ou d'une entité multiple",
    userEmail: "Renvoie l'e-mail de l'utilisateur connecté",
    userIsRecordOwner:
      'Renvoie la valeur booléenne "vrai" si l\'utilisateur modifiant l\'enregistrement en est également le propriétaire, "faux" sinon',
    userName: "Renvoie le nom de l'utilisateur connecté",
    userProp: "Renvoie la valeur de la $t(extraProp.label) spécifiée de l'utilisateur connecté",
    uuid: "Génère un UUID (identifiant universel unique) pouvant être utilisé comme identifiant (par ex. comme attribut clé d'une entité)",
    // Fonctions SQL
    avg: "Renvoie la valeur moyenne d'une variable numérique",
    count: 'Renvoie le nombre de lignes correspondant à un critère spécifié',
    sum: "Renvoie la somme totale d'une variable numérique",
  },
  functionName: {
    rowIndex: 'Index de ligne',
  },
  basicProps: {
    analysis: 'Analyse',
    autoIncrementalKey: {
      label: 'Auto-incrémentiel',
      info: 'La valeur sera générée automatiquement',
    },
    autoCreateMinCountItems: {
      label: "Créer automatiquement le minimum d'éléments",
      info: "Lorsque l'entité devient pertinente ou que son entité parente est créée, un nombre d'entités égal au minimum est généré automatiquement.",
    },
    displayAs: 'Afficher comme',
    displayIn: 'Afficher dans',
    entitySource: "Source de l'entité",
    enumerate: {
      label: 'Énumérer',
      info: `Les lignes seront générées automatiquement à partir des éléments de catégorie associés à un attribut code marqué comme Clé définie dans l'entité ; les lignes ne peuvent pas être ajoutées ou supprimées et l'attribut code clé ne sera pas modifiable`,
    },
    enumeratingItemsExpression: {
      label: "Expression des éléments d'énumération",
      info: 'Expression facultative qui filtre les éléments de catégorie à énumérer (par ex. unique(table_source.source_type)). Si elle est vide, tous les éléments de la catégorie sont utilisés.',
    },
    enumerator: {
      label: 'Énumérateur',
      info: "Les éléments de la catégorie seront utilisés pour générer les lignes de l'entité parente",
    },
    form: 'Formulaire',
    formula: 'Formule',
    includedInClonedData: 'Inclus dans les données clonées',
    includedInMultipleEntitySummary: {
      label: "Inclure dans le résumé de l'entité multiple",
      info: `Si coché, la valeur de l'attribut sera visible dans le sélecteur d'entités et dans la vue récapitulative de l'entité`,
    },
    includedInRecordsList: {
      label: 'Inclure dans la liste des enregistrements',
      info: `Si coché, l'attribut sera visible dans la liste des enregistrements`,
    },
    key: 'Clé',
    maxKeysCountReached: 'Nombre maximum de clés atteint ({{maxKeysCount}})',
    multiple: 'Multiple',
    ownPage: 'Sa propre page',
    parentPage: 'Page parente ({{parentPage}})',
    qualifier: {
      label: 'Qualificateur',
      info: `Lorsqu'un nouvel enregistrement est créé par un utilisateur appartenant à un groupe, cet attribut sera automatiquement rempli avec la valeur spécifiée pour celui-ci dans les qualificateurs du groupe de l'utilisateur. Les utilisateurs ne pourront voir et modifier que les enregistrements appartenant à leur propre groupe, s'ils appartiennent à un groupe.`,
    },
    table: 'Tableau',
  },
  advancedProps: {
    defaultValuesNotSpecified: 'Valeurs par défaut non spécifiées',
    defaultValuesSpecified: 'Valeurs par défaut spécifiées',
    editableAlways: 'Toujours modifiable',
    editableIfConditionIsMet: 'Modifiable lorsque la condition est remplie',
    relevantIfRadioNone: 'Toujours pertinent',
    relevantIfRadioDefined: 'Pertinent lorsque la condition est remplie',
    visibleAlways: 'Toujours visible',
    visibleIfConditionIsMet: 'Visible lorsque la condition est remplie',
    areaBasedEstimate: 'Estimation basée sur la surface',
    defaultValues: 'Valeurs par défaut',
    defaultValuesInfo: `Cela permet de renseigner automatiquement une réponse selon des règles précises.
    Si vous configurez plusieurs règles, le système les vérifie dans l'ordre, de haut en bas.
    Il applique la première règle qui correspond aux conditions et utilise ce résultat comme réponse.`,
    defaultValueEvaluatedOneTime: 'Valeur par défaut évaluée une seule fois',
    defaultValueEvaluatedOneTimeInfo: `La valeur par défaut sera évaluée une seule fois, lorsque l'attribut est créé.
    Si ce n'est pas coché, la valeur par défaut sera réévaluée à chaque mise à jour de l'enregistrement.
    Cela doit être coché lors de l'utilisation d'expressions comme now() ou uuid(), qui doivent être évaluées une seule fois, lors de la première génération de la valeur de l'attribut.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Valeurs par défaut non modifiables car la clé auto-incrémentielle est définie',
    editableIf: 'Modifiable si',
    editableIfInfo: `Par défaut, un utilisateur peut toujours accéder à un champ pertinent.
Ici, nous pouvons définir une règle indiquant si l'utilisateur peut saisir ou modifier ce champ.
Cela détermine si un utilisateur peut saisir ou modifier ce champ.
Si les conditions définies sont remplies, le champ est modifiable. Sinon, il devient « lecture seule » (verrouillé).`,
    hidden: 'Toujours masqué',
    hiddenInReport: 'Masquer dans le tableau de bord analytique',
    hiddenInReportInfo: `Si coché, l'attribut ne sera pas visible dans le tableau de bord analytique`,
    hiddenWhenNotRelevant: 'Masqué quand non pertinent',
    itemsFilter: "Filtre d'éléments",
    itemsFilterInfo: `Expression utilisée pour filtrer les éléments sélectionnables.
Dans l'expression, le mot "this" fera référence à l'élément lui-même. 
Ex. this.region = nom_attribut_region 
(où "region" est le nom d'une propriété supplémentaire définie pour l'élément et nom_attribut_region est le nom d'un attribut dans le formulaire)`,
    readOnly: 'Lecture seule',
    relevantIf: 'Pertinent si',
    relevantIfInfo: `Par défaut, tous les champs sont actifs.
    Si vous définissez une règle de pertinence et qu'elle n'est pas respectée, le champ devient grisé ou complètement masqué,
    et les réponses automatiques sont ignorées.
    Utilisez cela pour afficher ou masquer dynamiquement des parties du formulaire ; par exemple, afficher « Veuillez préciser » seulement si l'utilisateur choisit « Autre ».`,
    script: 'Script',
    visibleIf: 'Visible si',
    visibleIfInfo: `Par défaut, un champ est toujours visible.
    Si vous définissez une règle, il ne sera visible que lorsque cette règle est respectée ; sinon, il sera masqué.
    Remarque : contrairement à un champ masqué car « non pertinent », un champ masqué peut quand même enregistrer une réponse automatique.
    C'est pratique pour masquer des sections entières du formulaire selon la personne connectée (par exemple, selon le rôle).`,
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Masqué dans Arena Mobile',
      info: `Si coché, l'attribut ne sera pas visible dans AM`,
    },
    includedInPreviousCycleLink: {
      label: 'Inclure dans le lien du cycle précédent',
      info: `Si coché, la valeur du cycle précédent sera affichée dans le formulaire de saisie de données (lorsque le lien vers le cycle précédent est activé dans l'application mobile)`,
    },
  },
  numericProps: {
    unit: 'Unité',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Nombre maximum de décimales',
  },
  fileProps: {
    fileNameExpression: 'Expression du nom de fichier',
    fileType: 'Type de fichier',
    fileTypes: {
      image: 'Image',
      video: 'Vidéo',
      audio: 'Audio',
      other: 'Autre',
    },
    maxFileSize: 'Taille maximale du fichier (Mo)',
    numberOfFiles: 'Allez dans Validations pour modifier le nombre Min. et Max. de fichiers.',
    showGeotagInformation: 'Afficher les informations de géolocalisation',
  },
  mobileProps: {
    title: 'Application mobile',
  },
  timeProps: {
    includeSeconds: 'Inclure les secondes',
  },
  formHeaderProps: {
    headerColorLabel: "Couleur d'en-tête",
    headerColor: {
      blue: 'Bleu',
      green: 'Vert',
      orange: 'Orange',
      red: 'Rouge',
      yellow: 'Jaune',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hyperlien',
      markdown: 'Markdown',
      text: 'Texte',
    },
    textInputType: 'Type de saisie de texte',
    textInputTypes: {
      singleLine: 'Ligne unique',
      multiLine: 'Multiligne',
    },
    textTransform: 'Transformation du texte',
    textTransformTypes: {
      none: 'aucune',
      capitalize: 'majuscule initiale',
      uppercase: 'majuscules',
      lowercase: 'minuscules',
    },
  },
  booleanProps: {
    labelValue: "Valeur d'étiquette",
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Catégorie',
    codeShown: 'Afficher le code',
    displayAsTypes: {
      checkbox: 'Case à cocher',
      dropdown: 'Liste déroulante',
    },
    parentCode: 'Code parent',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: "Autoriser uniquement la coordonnée de l'appareil",
    allowOnlyDeviceCoordinateInfo: `S'applique uniquement à Arena Mobile : si coché, l'utilisateur ne pourra pas modifier les valeurs X/Y, seul le GPS de l'appareil peut être utilisé pour les obtenir`,
    mapMarkerColor: 'Couleur du marqueur de carte',
  },
  expressionsProp: {
    expression: 'Expression',
    applyIf: 'Appliquer si',
    confirmDelete: 'Supprimer cette expression ?',
    severity: 'Sévérité',
  },
  validationsProps: {
    minCount: 'Nombre minimum',
    maxCount: 'Nombre maximum',
    expressions: 'Expressions de validation',
    attributeAlwaysValid: 'Attribut toujours valide',
    attributeValidWhenConditionIsMet: 'Attribut valide lorsque la condition est remplie',
    notRequired: 'Non obligatoire',
    alwaysRequired: 'Toujours obligatoire',
    requiredWhenConditionIsMet: 'Obligatoire lorsque la condition est remplie',
  },
  cannotChangeIntoMultipleWithDefaultValues:
    'Ce nœud ne peut pas être converti en multiple car il a des valeurs par défaut.',
  cannotDeleteNodeDefReferenced: `Impossible de supprimer "{{nodeDef}}" : il est référencé par ces définitions de nœud : {{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: 'Cloner',
    title: 'Clonage de la définition de nœud "{{nodeDefName}}"',
    entitySelectLabel: 'Entité dans laquelle cloner :',
  },
  conversion: {
    dialogTitle: 'Convertir {{nodeDefName}} en un autre type',
    fromType: 'Du type',
    toType: 'Vers le type',
  },
  moveDialog: {
    confirmButtonLabel: 'Déplacer',
    title: 'Déplacement de la définition de nœud "{{nodeDefName}}" depuis "{{parentNodeDefName}}"',
    entitySelectLabel: 'Entité dans laquelle déplacer :',
  },
  movedNodeDefinitionHasErrors:
    'La définition de nœud "{{nodeDefName}}" que vous avez déplacée contient des erreurs ; veuillez les corriger.',
  nodeDefintionsHaveErrors:
    'Ces définitions de nœud contiennent des erreurs : {{nodeDefNames}}. Veuillez les corriger.',
  filterVariable: 'Variable pour filtrer les éléments',
  filterVariableForLevel: 'Variable pour {{levelName}}',
  unique: {
    label: 'Unique',
    info: `Lorsqu'un attribut est marqué comme **Unique**, sa valeur doit être unique dans l'entité multiple la plus proche (une erreur sera affichée sinon).  

---

Ex. dans une structure comme *cluster -> parcelle -> arbre*, si vous avez un attribut *espece_arbre* marqué comme **Unique**, vous ne pouvez avoir qu'un seul arbre par espèce dans la même *parcelle*.`,
  },
  nodeDefClonedSuccessfully:
    'Définition de nœud "{{nodeDefName}}" clonée avec succès dans "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: "Les catégories suivantes ont également été clonées depuis l'enquête source : {{names}}",
  taxonomiesClonedFromSurvey: "Les taxonomies suivantes ont également été clonées depuis l'enquête source : {{names}}",
}
