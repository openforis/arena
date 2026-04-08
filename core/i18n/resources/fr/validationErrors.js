export default {
  // Commun
  invalidEmail: 'E-mail invalide',
  invalidField: '"{{field}}" est invalide',
  invalidNumber: 'Nombre invalide',
  invalidDate: 'Date invalide',
  minLengthNotRespected: 'Longueur minimale de {{minLength}} caractères non respectée',
  nameDuplicate: 'Le nom est en double',
  nameCannotBeKeyword: `Le nom "{{value}}" ne peut pas être utilisé : c'est un mot réservé`,
  nameInvalid:
    'Le nom "{{name}}" est invalide : il doit comporter au maximum 40 caractères et contenir uniquement des lettres minuscules, des chiffres et les symboles "-" et "_", en commençant par une lettre',
  nameRequired: 'Le nom est requis',
  requiredField: '{{field}} est requis',
  rowsDuplicate: 'ligne : {{row}} ligne dupliquée : {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: "L'étiquette dans la langue par défaut du formulaire est requise",
    analysisNodeDefsRequired: 'Au moins un attribut calculé est requis',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Au moins un enfant invalide',
    codeCannotBeKeyword: `Le code "{{value}}" ne peut pas être utilisé : c'est un mot réservé`,
    codeDuplicate: 'Le code est en double',
    codeRequired: 'Le code est requis',
    itemExtraPropDataTypeRequired: 'Type de données requis pour la $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Nom invalide pour la $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Nombre invalide pour la $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Point géométrique invalide pour la $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'Au moins un élément invalide',
    itemsEmpty: 'Définissez au moins un élément',
    levelDuplicate: 'Le nom du niveau est en double',
    levelsInvalid: 'Au moins un niveau invalide',
    nameNotSpecified: 'Nom de catégorie non spécifié',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Impossible de supprimer les éléments de catégorie publiés. Éléments manquants dans le fichier importé : {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Impossible de supprimer les niveaux de la catégorie publiée. Niveaux manquants dans le fichier importé : {{deletedLevelNames}}',
    codeColumnMissing: 'Il doit y avoir au moins une colonne "code"',
    codeRequired: '{{columnName}} : un code est requis',
    codeDuplicate: '{{columnName}} : code en double "{{code}}"',
    columnMissing: 'Colonne manquante : {{columnNameMissing}}',
    emptyHeaderFound: 'Le fichier contient un en-tête vide',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'Le fichier ZIP doit contenir uniquement des fichiers .csv ou .xlsx (un pour chaque catégorie), sans aucun répertoire',
    invalidParentItemOrder: "L'élément avec les codes {{parentItemCodes}} doit précéder ses enfants",
    nameDuplicate: 'Une catégorie avec le même nom existe déjà : {{name}}',
    srsNotDefined: 'SRS avec le code {{srs}} non défini dans le formulaire',
  },

  dataImport: {
    emptyFile: "Le fichier que vous essayez d'importer est vide",
    invalidHeaders: 'Colonnes invalides : {{invalidHeaders}}',
    invalidBoolean: 'Valeur booléenne invalide dans la colonne {{headers}} : {{value}}',
    invalidCode: `Code invalide pour l'attribut '{{attributeName}}' : {{code}}`,
    invalidCoordinate: 'Coordonnée invalide dans la colonne {{headers}} : {{value}}',
    invalidDate:
      'Date invalide dans la colonne {{headers}} : {{value}}. Les dates doivent être au format AAAA-MM-JJ ou JJ/MM/AAAA. Ex. 2023-01-15 ou 15/01/2023',
    invalidNumber: 'Nombre invalide dans la colonne {{headers}} : {{value}}',
    invalidTaxonCode: 'Code invalide dans la colonne {{headers}} : {{value}}',
    invalidTime:
      "Heure invalide dans la colonne {{headers}} : {{value}}. L'heure doit être au format HH:mm. Ex. 09:45 ou 16:30",
    missingRequiredHeaders: 'Colonnes requises manquantes : {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Erreur lors de la mise à jour des valeurs : {{details}}',
    multipleRecordsMatchingKeys: 'Plusieurs enregistrements trouvés correspondant aux clés "{{keyValues}}"',
    recordAlreadyExisting: 'Enregistrement avec les clés "{{keyValues}}" déjà existant',
    recordInAnalysisStepCannotBeUpdated:
      "L'enregistrement avec les clés \"{{keyValues}}\" est à l'étape d'analyse et ne peut pas être mis à jour",
    recordKeyMissingOrInvalid: 'Valeur manquante ou invalide pour l\'attribut clé "{{keyName}}"',
    recordNotFound: 'Enregistrement avec les clés "{{keyValues}}" introuvable',
  },

  expressions: {
    cannotGetChildOfAttribute: "impossible d'obtenir le nœud enfant {{childName}} de l'attribut {{parentName}}",
    cannotUseCurrentNode: "impossible d'utiliser le nœud actuel {{name}} dans cette expression",
    circularDependencyError: 'impossible de référencer le nœud {{name}} car il référence le nœud actuel',
    expressionInvalid: 'Expression invalide : {{details}}',
    unableToFindNode: 'impossible de trouver le nœud : {{name}}',
    unableToFindNodeChild: 'impossible de trouver le nœud enfant : {{name}}',
    unableToFindNodeParent: 'impossible de trouver le nœud parent : {{name}}',
    unableToFindNodeSibling: 'impossible de trouver le nœud voisin : {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Nom invalide',
    nameRequired: 'Nom requis',
    dataTypeRequired: 'Type de données requis',
    valueRequired: 'Valeur requise',
  },

  message: {
    bodyRequired: 'Le corps est requis',
    subjectRequired: "L'objet est requis",
    notificationTypeRequired: 'Le type de notification est requis',
    targetsRequired: 'Au moins une cible est requise',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: "L'entité est requise",
    applyIfDuplicate: 'La condition "$t(nodeDefEdit.expressionsProp.applyIf)" est dupliquée',
    applyIfInvalid: 'Condition "$t(nodeDefEdit.advancedProps.relevantIf)" invalide',
    columnWidthCannotBeGreaterThan: 'La largeur de colonne ne peut pas être supérieure à {{max}}',
    columnWidthCannotBeLessThan: 'La largeur de colonne ne peut pas être inférieure à {{min}}',
    countMaxMustBePositiveNumber: 'Le nombre maximum doit être un entier positif',
    countMinMustBePositiveNumber: 'Le nombre minimum doit être un entier positif',
    categoryRequired: 'La catégorie est requise',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: '"Valeurs par défaut" invalides',
    defaultValuesNotSpecified: 'Valeur par défaut non spécifiée',
    entitySourceRequired: "Source de l'entité requise",
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Seule la dernière expression peut avoir une condition "$t(nodeDefEdit.expressionsProp.applyIf)" vide',
    expressionDuplicate: 'Expression dupliquée',
    expressionRequired: 'Expression requise',
    formulaInvalid: 'La formule est invalide',
    keysEmpty: 'Définissez au moins un attribut clé',

    keysExceedingMax: "Nombre maximum d'attributs clés dépassé",
    maxFileSizeInvalid: 'La taille maximale du fichier doit être supérieure à 0 et inférieure à {{max}}',
    nameInvalid:
      'Le nom est invalide (il doit contenir uniquement des lettres minuscules, des chiffres et des traits de soulignement, en commençant par une lettre)',
    taxonomyRequired: 'La taxonomie est requise',
    validationsInvalid: '"Validations" invalides',
    countMaxInvalid: '"Nombre maximum" invalide',
    countMinInvalid: '"Nombre minimum" invalide',
  },

  record: {
    keyDuplicate: "Clé d'enregistrement dupliquée",
    entityKeyDuplicate: 'Clé dupliquée',
    entityKeyValueNotSpecified: 'Valeur de clé pour "{{keyDefName}}" non spécifiée',
    missingAncestorForEntity: 'Impossible de trouver "{{ancestorName}}" avec ces clés : {{keyValues}}',
    oneOrMoreInvalidValues: 'Une ou plusieurs valeurs sont invalides',
    uniqueAttributeDuplicate: 'Valeur dupliquée',
    valueInvalid: 'Valeur invalide',
    valueRequired: 'Valeur requise',
  },

  recordClone: {
    differentKeyAttributes: 'Les attributs clés sont différents dans le Cycle {{cycleFrom}} et le Cycle {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'La langue est requise',
    srsRequired: 'Le système de référence spatiale est requis',
    cycleRequired: 'Le cycle est requis',
    cyclesRequired: 'Au moins un cycle doit être défini',
    cyclesExceedingMax: 'Un formulaire peut avoir au maximum 10 cycles',
    cycleDateStartBeforeDateEnd: 'La date de début du cycle doit être antérieure à sa date de fin',
    cycleDateStartAfterPrevDateEnd:
      'La date de début du cycle doit être postérieure à la date de fin du cycle précédent',
    cycleDateStartInvalid: 'La date de début du cycle est invalide',
    cycleDateStartMandatory: 'La date de début du cycle est obligatoire',
    cycleDateEndInvalid: 'La date de fin du cycle est invalide',
    cycleDateEndMandatoryExceptForLastCycle:
      'La date de fin du cycle est obligatoire pour tous les cycles sauf le dernier',
    fieldManualLinksInvalid: 'Le lien vers le manuel de terrain est invalide',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Colonnes invalides : {{invalidHeaders}}',
    cannotFindNodeDef: "Impossible de trouver la définition d'attribut ou d'entité avec le nom '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Le code publié a changé : '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Code en double {{value}} ; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Le code est requis',
    familyRequired: 'La famille est requise',
    genusRequired: 'Le genre est requis',
    scientificNameDuplicate: 'Nom scientifique en double {{value}} ; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Le nom scientifique est requis',
    taxaEmpty: 'Taxons vides',
    vernacularNamesDuplicate: `Nom vernaculaire en double '{{name}}' pour la langue '{{lang}}'`,
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: "Colonnes d'informations supplémentaires en double : {{duplicateColumns}}",
    invalidExtraPropColumn:
      'Nom de colonne d\'information supplémentaire invalide "{{columnName}}" : ce ne peut pas être un mot réservé',
    missingRequiredColumns: 'Colonne(s) requise(s) manquante(s) : {{columns}}',
  },

  user: {
    emailDuplicate: 'Un utilisateur avec le même e-mail existe déjà',
    emailRequired: "L'e-mail est requis",
    emailInvalid: "L'e-mail est invalide",
    emailNotFound: 'E-mail introuvable',
    groupRequired: 'Le groupe est requis',
    nameRequired: 'Le nom est requis',
    titleRequired: 'Le titre est requis',
    passwordRequired: 'Le mot de passe est requis',
    passwordInvalid: "Le mot de passe ne doit pas contenir d'espaces",
    passwordUnsafe:
      'Le mot de passe doit comporter au moins 8 caractères et contenir des lettres minuscules, des lettres majuscules et des chiffres',
    passwordsDoNotMatch: `Les mots de passe ne correspondent pas`,

    userNotFound: "Utilisateur introuvable. Vérifiez que l'e-mail et le mot de passe sont corrects",
    passwordChangeRequired: 'Changement de mot de passe requis',
    passwordResetNotAllowedWithPendingInvitation: `Réinitialisation du mot de passe non autorisée : l'utilisateur a été invité à un formulaire mais l'invitation n'a pas encore été acceptée`,
    twoFactorTokenRequired: 'Le code de vérification est requis',
  },

  userAccessRequest: {
    countryRequired: 'Le pays est requis',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'Le prénom est requis',
    institutionRequired: "L'institution est requise",
    lastNameRequired: 'Le nom de famille est requis',
    purposeRequired: 'Le but est requis',
    surveyNameRequired: 'Le nom du formulaire est requis',
    invalidRequest: "Demande d'accès utilisateur invalide",
    userAlreadyExisting: "Un utilisateur avec l'e-mail {{email}} existe déjà",
    requestAlreadySent: `La demande d'accès pour l'utilisateur avec l'e-mail {{email}} a déjà été envoyée`,
    invalidReCaptcha: 'ReCaptcha invalide',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: "La demande d'accès utilisateur a déjà été traitée",
    accessRequestNotFound: "Demande d'accès utilisateur introuvable",
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Le rôle est requis',
    surveyNameRequired: 'Le nom du formulaire est requis',
  },

  userPasswordChange: {
    oldPasswordRequired: "L'ancien mot de passe est requis",
    oldPasswordWrong: "L'ancien mot de passe est incorrect",
    newPasswordRequired: 'Le nouveau mot de passe est requis',
    confirmPasswordRequired: 'La confirmation du mot de passe est requise',
    confirmedPasswordNotMatching: 'Le nouveau mot de passe et la confirmation du mot de passe ne correspondent pas',
  },

  userInvite: {
    messageContainsLinks: "Le message d'invitation ne peut pas contenir de liens",
    messageTooLong: "Le message d'invitation est trop long (maximum {{maxLength}} caractères)",
  },

  user2FADevice: {
    nameDuplicate: 'Un appareil avec le même nom existe déjà',
    nameRequired: "Le nom de l'appareil est requis",
  },
}
