export default {
  common: {
    active: 'Actif',
    add: 'Ajouter',
    advancedFunctions: 'Fonctions avancées',
    and: 'et',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Appliquer',
    aggregateFunction: "Fonction d'agrégation",
    aggregateFunction_other: "Fonctions d'agrégation",
    attribute: 'Attribut',
    attribute_other: 'Attributs',
    avg: 'Moyenne',
    ascending: 'Croissant',
    areaBased: 'basé sur la surface',
    back: 'Retour',
    baseUnit: 'Unité de base',
    cancel: 'Annuler',
    cancelConfirm: `**Il y a des modifications non sauvegardées**.

Voulez-vous les ignorer ?`,
    cantUndoWarning: 'Cette opération ne peut pas être annulée',
    cantBeDeletedUsedItem: 'Cet {{item}} est utilisé par des définitions de nœud et ne peut pas être supprimé',
    chain: 'Chaîne',
    chain_plural: 'Chaînes',
    childrenEmpty: 'Définissez au moins un élément enfant',
    clone: 'Cloner',
    close: 'Fermer',
    cloneFrom: 'Cloner depuis',
    cnt: 'Compter',
    code: 'Code',
    collapse: 'Réduire',
    confirm: 'Confirmer',
    convert: 'Convertir',
    copy: 'Copier',
    createdWith: 'Créé avec',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Cycle',
    cycle_plural: 'Cycles',
    dateCreated: 'Date de création',
    dateLastModified: 'Date de dernière modification',
    delete: 'Supprimer',
    deleted: 'Supprimé !',
    descending: 'Décroissant',
    description: 'Description',
    description_plural: 'Descriptions',
    designerNotes: 'Notes du concepteur',
    designerNotesInfo: `Les notes du concepteur ne seront visibles que dans le concepteur de formulaire et ne seront pas visibles dans le formulaire de saisie de données.`,
    details: 'Détails',
    dimension: 'Dimension',
    dimension_other: 'Dimensions',
    done: 'Terminé',
    download: 'Télécharger',
    draft: 'Brouillon',
    edit: 'Modifier',
    email: 'E-mail',
    email_other: 'E-mails',
    emailSentConfirmation: `Un e-mail a été envoyé à {{email}}.

    Veuillez informer la personne de vérifier également le dossier Spam/Courrier indésirable.`,
    emailSentToSelfConfirmation: `Vous devriez avoir reçu un e-mail à {{email}}.

Veuillez également vérifier le dossier Spam/Courrier indésirable.`,
    empty: 'Vide',
    entity: 'Entité',
    error: 'Erreur',
    error_plural: 'Erreurs',
    errorFound: '1 erreur trouvée',
    errorFound_other: '{{count}} erreurs trouvées',
    errorMessage: "Message d'erreur",
    errorMessage_plural: "Messages d'erreur",
    expand: 'Développer',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Exporter',
    exportAll: 'Tout exporter',
    exportToCSV: 'Exporter en CSV',
    exportToExcel: 'Exporter en Excel',
    exportToExcelTooManyItems: "Trop d'éléments à exporter en Excel ; veuillez utiliser l'exportation CSV.",
    expression: 'Expression',
    false: 'Faux',
    file: 'Fichier',
    file_plural: 'Fichiers',
    formContainsErrors: 'Le formulaire contient des erreurs',
    formContainsErrorsCannotContinue: 'Le formulaire contient des erreurs. Veuillez les corriger avant de continuer.',
    formContainsErrorsCannotSave: 'Le formulaire contient des erreurs. Veuillez les corriger avant de sauvegarder.',
    from: 'De',
    function: 'Fonction',
    goToHomePage: "Aller à la page d'accueil",
    group: 'Groupe',
    help: 'Aide',
    hide: 'Masquer',
    id: 'id',
    import: 'Importer',
    importFromExcelOrCSVFile: 'Importer depuis un fichier Excel (.xlsx) ou CSV',
    info: 'Info',
    invalid: 'INVALIDE',
    item: 'Élément',
    item_plural: 'Éléments',
    itemAlreadyAdded: 'Élément déjà ajouté',
    label: 'Étiquette',
    label_plural: 'Étiquettes',
    language: 'Langue',
    language_plural: 'Langues',
    leavePageConfirmMessage: `Il y a des modifications non sauvegardées dans le formulaire. 

En confirmant, toutes les modifications seront perdues.
Voulez-vous continuer ?`,
    local: 'Local',
    loading: 'Chargement...',
    max: 'Maximum',
    med: 'Médiane',
    manage: 'Gérer',
    message_plural: 'Messages',
    measure: 'Mesure',
    measure_other: 'Mesures',
    measurePrevSteps: 'Mesurer les étapes précédentes',
    measurePrevSteps_plural: 'Mesures des étapes précédentes',
    min: 'Minimum',
    moveUp: 'Monter',
    moveDown: 'Descendre',
    name: 'Nom',
    new: 'Nouveau',
    next: 'Suivant',
    no: 'Non',
    noItems: `$t(common.no) $t(common.item_plural)`,
    notification: 'Notification',
    notification_other: 'Notifications',
    notSpecified: '---Non spécifié---',
    orderBy: 'Trier par',
    of: 'de',
    ok: 'Ok',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Ouvrir dans une nouvelle fenêtre',
    options: 'Options',
    owner: 'Propriétaire',
    path: 'Chemin',
    pause: 'Pause',
    preview: 'Mode aperçu',
    previous: 'Précédent',
    publish: 'Publier',
    publishConfirm: `#### Vous êtes sur le point de publier le formulaire {{survey}} ####

###### Le processus de publication va *supprimer définitivement* les informations suivantes ###### 
- Étiquettes associées aux langues supprimées.
- Enregistrements associés aux cycles supprimés.
- Données associées aux champs de formulaire supprimés.

###### Après la publication : ###### 
- Les champs de formulaire ne peuvent pas être modifiés de simple à multiple et vice versa.
- Les codes des éléments de catégorie ne peuvent pas être modifiés.
- Les éléments de catégorie ne peuvent pas être supprimés.
- Les codes de taxonomie ne peuvent pas être modifiés.
- Les taxons ne peuvent pas être supprimés.

**Êtes-vous sûr(e) de vouloir continuer ?**`,
    raiseTicketInSupportForum: `En cas de problèmes, veuillez ouvrir un ticket avec le tag 'arena' dans notre <b>Forum de support</b> : $t(links.supportForum)`,
    record: 'Enregistrement',
    record_other: 'Enregistrements',
    remote: 'Distant',
    required: 'Requis',
    requiredField: 'champ requis',
    reset: 'Réinitialiser',
    resume: 'Reprendre',
    retry: 'Réessayer',
    role: 'Rôle',
    save: 'Sauvegarder',
    saveAndBack: 'Sauvegarder et retour',
    saved: 'Sauvegardé !',
    samplingPolygon: "Polygone d'échantillonnage",
    show: 'Afficher',
    select: 'Sélectionner',
    selectOne: 'Sélectionnez un...',
    selectAll: 'Tout sélectionner',
    selected: 'Sélectionné',
    showLabels: 'Afficher les étiquettes',
    showLabelsAndNames: 'Afficher les étiquettes et les noms',
    showNames: 'Afficher les noms',
    srs: 'SRS',
    status: 'Statut',
    sum: 'Somme',
    test: 'Test',
    to: 'À',
    totalItems: 'Total des éléments',
    true: 'Vrai',
    type: 'Type',
    undefinedName: 'Nom non défini',
    unique: 'Unique',
    upload: 'Téléverser',
    uploadErrorConfirm: {
      message: `Erreur lors du téléversement du fichier : {{error}}.\n
Réessayer ?`,
    },
    uploadingFile: 'Téléversement du fichier ({{progressPercent}}%)',
    value: 'Valeur',
    view: 'Voir',
    warning: 'Avertissement',
    warning_plural: 'Avertissements',
    yes: 'Oui',
    date: {
      aMomentAgo: 'Il y a un moment',
      hour: 'heure',
      hour_other: 'heures',
      day: 'jour',
      day_other: 'jours',
      minute: 'minute',
      minute_other: 'minutes',
      week: 'semaine',
      week_other: 'semaines',
      timeDiff: `Il y a {{count}} $t(common.date.{{unit}}, { 'count': {{count}} })`,
    },
    paginator: {
      firstPage: 'Première page',
      itemsPerPage: 'Éléments par page',
      lastPage: 'Dernière page',
      nextPage: 'Page suivante',
      previousPage: 'Page précédente',
    },
    table: {
      visibleColumns: 'Colonnes visibles',
    },
  },

  confirm: {
    strongConfirmInputLabel: 'Pour confirmer, saisissez le texte suivant : **{{strongConfirmRequiredText}}**',
  },

  dropzone: {
    acceptedFilesMessage:
      "(Seuls les fichiers {{acceptedExtensions}} d'une taille maximale de {{maxSize}} seront acceptés)",
    error: {
      fileNotValid: "Le fichier sélectionné n'est pas valide",
      fileTooBig: 'Le fichier sélectionné est trop volumineux',
      invalidFileExtension: 'Extension de fichier invalide : {{extension}}',
    },
    message: 'Faites glisser et déposez un fichier ici, ou cliquez pour le sélectionner',
    selectedFile: 'Fichier sélectionné',
    selectedFile_other: 'Fichiers sélectionnés',
  },

  error: {
    pageNotFound: 'Page introuvable',
  },

  geo: {
    area: 'Surface',
    vertices: 'Sommets',
    perimeter: 'Périmètre',
  },

  files: {
    header: 'Fichiers',
    missing: ' Fichiers manquants : {{count}}',
    totalSize: 'Taille totale : {{size}}',
  },

  sidebar: {
    logout: 'Déconnexion',
  },

  header: {
    myProfile: 'Mon profil',
    qrCodeLoginDialog: {
      title: 'Connexion à Arena Mobile via QR code',
      instructions: `1. Démarrez l'application **Arena Mobile** sur votre appareil mobile
2. Accédez au menu **Paramètres**
3. Sélectionnez **Connexion au serveur**
4. Appuyez sur **Connexion via QR code**
5. Scannez le QR code affiché sur cet écran`,
      success: 'Connexion réussie !',
      error: 'Erreur lors de la génération du QR code : {{error}}',
    },
  },

  nodeDefsTypes: {
    integer: 'Entier',
    decimal: 'Décimal',
    text: 'Texte',
    date: 'Date',
    time: 'Heure',
    boolean: 'Booléen',
    code: 'Code',
    coordinate: 'Coordonnée',
    geo: 'Géospatial',
    taxon: 'Taxon',
    file: 'Fichier',
    entity: 'Entité',
  },

  // ====== Modules et vues de l'application

  appModules: {
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    surveyNew: 'Nouveau formulaire',
    surveys: 'Formulaires',
    templateNew: 'Nouveau modèle',
    templates: 'Modèles',
    usersAccessRequest: "Demandes d'accès des utilisateurs",
    collectImportReport: "Rapport d'importation Collect",

    surveyInfo: 'Infos du formulaire',
    designer: 'Formulaire',
    formDesigner: 'Concepteur de formulaire',
    surveyHierarchy: 'Hiérarchie',
    surveyDependencyTree: 'Arbre de dépendances',
    category: 'Catégorie',
    categories: 'Catégories',
    nodeDef: 'Définition de nœud',
    taxonomy: 'Taxonomie',
    taxonomies: 'Taxonomies',

    data: 'Données',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Rapport de validation des enregistrements',
    explorer: 'Explorateur',
    map: 'Carte',
    charts: 'Graphiques',
    export: 'Exportation de données',
    import: 'Importation de données',
    validationReport: 'Rapport de validation',

    users: 'Utilisateurs',
    user: 'Profil utilisateur',
    userPasswordChange: 'Changer le mot de passe',
    userInvite: 'Inviter un utilisateur',
    userNew: 'Nouvel utilisateur',
    usersSurvey: 'Liste des utilisateurs',
    usersList: 'Liste des utilisateurs (tous)',
    user2FADevice: 'Appareil 2FA',
    user2FADevice_plural: 'Appareils 2FA',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_plural)',

    analysis: 'Analyse',
    chain: 'Chaîne',
    chain_plural: 'Chaînes',
    virtualEntity: 'Entité virtuelle',
    entities: 'Entités virtuelles',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'Instances',

    message: 'Message',
    message_plural: '$t(common.message_plural)',

    help: 'Aide',
    about: 'À propos',
    disclaimer: 'Avertissement',
    userManual: 'Manuel utilisateur',
  },

  surveyDefsLoader: {
    requireSurveyPublish: "Cette section n'est disponible que lorsque le formulaire est publié",
  },

  loginView: {
    yourName: 'Votre nom',
    yourEmail: 'Votre e-mail',
    yourPassword: 'Votre mot de passe',
    yourNewPassword: 'Votre nouveau mot de passe',
    repeatYourPassword: 'Répétez votre mot de passe',
    repeatYourNewPassword: 'Répétez votre nouveau mot de passe',
    requestAccess: "Nouveau sur $t(common.appNameFull) ? Demander l'accès",
    resetPassword: 'Réinitialiser le mot de passe',
    login: 'Connexion',
    loginUsingBackupCode: 'Connexion avec un code de sauvegarde 2FA',
    forgotPassword: 'Mot de passe oublié',
    sendPasswordResetEmail: "Envoyer l'e-mail de réinitialisation du mot de passe",
    twoFactorBackupCode: 'Code de sauvegarde 2FA',
    twoFactorToken: 'Code de vérification',
    twoFactorTokenDescription: `Pour assurer la sécurité de votre compte, nous vérifions votre identité.

Entrez le code généré par votre application d'authentification.`,
  },

  accessRequestView: {
    error: "Erreur lors de la demande d'accès : {{error}}",
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Prénom',
        lastName: 'Nom de famille',
        institution: 'Institution',
        country: 'Pays',
        purpose: 'Pour quoi en avez-vous besoin ?',
        surveyName: 'Proposez un nom de formulaire',
        templateUuid: "Commencer à partir d'un modèle ?",
      },
    },
    introduction: `Nos ressources sont limitées, vous devez donc demander l'accès à la plateforme.
Nous sommes également intéressés par ce que vous souhaitez faire avec, alors faites-le nous savoir !
Vous avez la possibilité de commencer à partir d'un **nouveau formulaire vierge** ou de cloner un **modèle** existant et vous devrez suggérer un nom pour le formulaire nouvellement créé.
Vous serez assigné le rôle d'***Administrateur de formulaire*** pour ce formulaire : vous pourrez le modifier et inviter de nouveaux utilisateurs à rejoindre votre formulaire et y contribuer.
Vous serez également un ***Gestionnaire de formulaire*** et vous pourrez **créer de nouveaux formulaires** (jusqu'à 5) si nécessaire.
Pour plus d'informations, veuillez visiter notre site web : $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Une fois votre demande envoyée, veuillez attendre un e-mail d'invitation pour accéder à Arena.**`,
    reCaptchaNotAnswered: 'ReCaptcha non répondu',
    requestSent: "Demande d'accès envoyée correctement",
    requestSentMessage: `Veuillez nous accorder quelques jours pour traiter votre demande.
Nous enverrons bientôt un e-mail à **{{email}}** avec les instructions pour accéder à $t(common.appName).
Merci et profitez de **$t(common.appNameFull)** !`,
    sendRequest: 'Envoyer la demande',
    sendRequestConfirm: "Demander l'accès à $t(common.appNameFull) ?",
    templateNotSelected: 'Non sélectionné (commencer de zéro)',
    title: "Demande d'accès à $t(common.appNameFull)",
  },

  resetPasswordView: {
    title: {
      completeRegistration: 'Complétez votre inscription à Arena',
      setYourNewPassword: 'Définissez votre nouveau mot de passe',
    },
    setNewPassword: 'Définir un nouveau mot de passe',
    forgotPasswordLinkInvalid: "La page à laquelle vous avez essayé d'accéder n'existe pas ou n'est plus valide",
    passwordSuccessfullyReset: 'Votre mot de passe a été réinitialisé avec succès',
    passwordStrengthChecksTitle: 'Vérifications de la solidité du mot de passe',
    passwordStrengthChecks: {
      noWhiteSpaces: "Pas d'espaces",
      atLeast8CharactersLong: 'Au moins 8 caractères',
      containsLowerCaseLetters: 'Contient des lettres minuscules',
      containsUpperCaseLetters: 'Contient des lettres majuscules',
      containsNumbers: 'Contient des chiffres',
    },
    completeRegistration: "Compléter l'inscription",
  },

  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Types de dépendance',
    dependencyTypes: {
      applicable: 'Applicabilité',
      defaultValues: 'Valeur par défaut',
      itemsFilter: "Filtre d'éléments",
      minCount: 'Nombre minimum',
      maxCount: 'Nombre maximum',
      validations: 'Validations',
    },
    selectAtLeastOneDependencyType: 'Sélectionnez au moins un type de dépendance',
    noDependenciesToDisplay: 'Aucune dépendance à afficher',
  },

  designerView: {
    formPreview: 'Aperçu du formulaire',
  },

  recordView: {
    justDeleted: "Cet enregistrement vient d'être supprimé",
    sessionExpired: "La session d'enregistrement a expiré",
    errorLoadingRecord: "Erreur lors du chargement de l'enregistrement : {{details}}",
    recordEditModalTitle: 'Enregistrement : {{keyValues}}',
    recordNotFound: 'Enregistrement introuvable',
    keyAttributeEditing: {
      lock: "Verrouiller la modification de l'attribut clé",
      unlock: "Autoriser la modification de l'attribut clé",
    },
    lock: 'Verrouiller',
    unlock: 'Déverrouiller',
  },

  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: "Supprimer cette fonction d'agrégation personnalisée ?",
      sqlExpression: 'Expression SQL',
    },
    editRecord: "Modifier l'enregistrement",
  },

  mapView: {
    createRecord: 'Créer un nouvel enregistrement',
    editRecord: "Modifier l'enregistrement",
    elevation: 'Altitude (m)',
    location: 'Emplacement',
    locationEditInfo: "Double-cliquez sur la carte ou faites glisser le marqueur pour mettre à jour l'emplacement",
    locationNotValidOrOutOfRange: 'Emplacement invalide ou hors de la plage de zone UTM',
    locationUpdated: 'Emplacement mis à jour',
    options: {
      showLocationMarkers: "Afficher les marqueurs d'emplacement",
      showMarkersLabels: `Afficher les étiquettes des marqueurs`,
      showSamplingPolygon: `Polygone d'échantillonnage`,
      showControlPoints: `Points de contrôle`,
      showPlotReferencePoint: `Point de référence de la parcelle`,
    },
    rulerTooltip: `Appuyez sur le bouton pour commencer à mesurer des distances.
- cliquez plusieurs fois pour mesurer des chemins
- double-cliquez ou appuyez sur la touche ÉCHAP pour terminer la mesure
- appuyez à nouveau sur le bouton pour masquer les mesures`,
    samplingPointDataLayerName: "Données de points d'échantillonnage - niveau {{level}}",
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (chargement...)',
    samplingPointItemPopup: {
      title: "Élément de point d'échantillonnage",
      levelCode: 'Code du niveau {{level}}',
    },
    selectedPeriod: 'Période sélectionnée',
  },

  samplingPolygonOptions: {
    circle: 'Cercle',
    controlPointOffsetEast: 'Décalage Est du point de référence (m)',
    controlPointOffsetNorth: 'Décalage Nord du point de référence (m)',
    lengthLatitude: 'Longueur Latitude (m)',
    lengthLongitude: 'Longueur Longitude (m)',
    numberOfControlPoints: 'Nombre de points de contrôle',
    numberOfPointsEast: 'Nombre de points de contrôle Est',
    numberOfPointsNorth: 'Nombre de points de contrôle Nord',
    offsetEast: 'Décalage Est (m)',
    offsetNorth: 'Décalage Nord (m)',
    radius: 'Rayon (m)',
    rectangle: 'Rectangle',
    samplingPolygon: "Polygone d'échantillonnage",
    shape: 'Forme',
  },

  kmlUploader: {
    opacity: 'opacité',
    selectFile: 'Sélectionner un fichier',
    title: 'Options KML/KMZ/Shapefile',
  },

  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Choisissez une période à comparer',
    falseColor: 'Fausses couleurs',
  },

  surveysView: {
    chains: 'Chaînes',
    confirmUpdateSurveyOwner: `Changer le propriétaire du formulaire "{{surveyName}}" en "{{ownerName}}" ?`,
    cycles: 'Cycles',
    datePublished: 'Date de publication',
    editUserExtraProps: "Modifier les propriétés supplémentaires de l'utilisateur",
    editUserExtraPropsForSurvey:
      'Modifier les propriétés supplémentaires de l\'utilisateur pour le formulaire "{{surveyName}}"',
    filter: 'Filtrer',
    filterPlaceholder: 'Filtrer par nom, étiquette ou propriétaire',
    languages: 'Langues',
    nodes: 'Nœuds',
    noSurveysMatchingFilter: 'Aucun formulaire ne correspond au filtre spécifié',
    onlyOwn: 'Uniquement mes formulaires',
    records: 'Enregistrements',
    recordsCreatedWithMoreApps: 'Enregistrements créés avec plusieurs applications :',
    status: {
      published: 'Publié',
      draft: 'Brouillon',
      'published-draft': 'Publié/Brouillon',
    },
  },

  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Accepté',
      CREATED: 'En attente',
    },
    acceptRequest: {
      accept: 'Accepter',
      acceptRequestAndCreateSurvey: 'Accepter la demande et créer le formulaire',
      confirmAcceptRequestAndCreateSurvey:
        "Accepter la demande d'accès pour **{{email}}** en tant que **{{role}}** et créer un nouveau formulaire **{{surveyName}}** ?",
      error: "Erreur lors de l'acceptation de la demande d'accès : {{error}}",
      requestAcceptedSuccessfully: "Demande d'accès acceptée avec succès. $t(common.emailSentConfirmation)",
      surveyLabel: 'Étiquette du formulaire',
      surveyLabelInitial: "(Modifiez le nom et l'étiquette du formulaire si nécessaire)",
      surveyName: 'Nom du formulaire',
      template: 'Modèle',
    },
  },

  userView: {
    scale: 'Échelle',
    rotate: 'Faire pivoter',
    dragAndDrop: 'Déposez une image ci-dessus ou',
    upload: 'Téléverser',
    remove: 'Supprimer la photo de profil ?',
    sendNewInvitation: 'Envoyer une nouvelle invitation',
    removeFromSurvey: 'Retirer du formulaire',
    confirmRemove: "Êtes-vous sûr(e) de vouloir révoquer l'accès de {{user}} au formulaire {{survey}} ?",
    removeUserConfirmation: "L'utilisateur {{user}} a été retiré du formulaire {{survey}}",
    maxSurveysUserCanCreate: "Nombre maximum de formulaires que l'utilisateur peut créer",
    preferredUILanguage: {
      label: "Langue d'interface préférée",
      auto: 'Détectée automatiquement ({{detectedLanguage}})',
    },
    newPassword: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    manageTwoFactorDevices: {
      label: 'Gérer 2FA',
      title: "Gérer les appareils d'authentification à deux facteurs",
    },
  },

  userPasswordChangeView: {
    changingPasswordForUser: "Changement de mot de passe pour l'utilisateur : {{user}}",
    oldPassword: 'Ancien mot de passe',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    passwordChangedSuccessfully: 'Mot de passe changé avec succès !',
    notAuthorizedToChangePasswordOfAnotherUser:
      "Vous n'êtes pas autorisé(e) à changer le mot de passe d'un autre utilisateur",
  },

  userInviteView: {
    confirmInviteSystemAdmin: "Inviter l'utilisateur {{email}} en tant qu'Administrateur système ?",
    confirmInviteSystemAdmin_other: "Inviter les utilisateurs {{email}} en tant qu'Administrateurs système ?",
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)
    
    {{skppedEmailsCount}} adresses ont été ignorées (elles ont déjà été invitées à ce formulaire précédemment) : {{skippedEmails}}`,
    groupPermissions: {
      label: 'Permissions',
      systemAdmin: `
        <li>Droits d'accès complets au système</li>`,
      surveyManager: `
        <li>Formulaires : 
          <ul>
            <li>créer</li>
            <li>cloner</li>
            <li>modifier ses propres formulaires</li>
            <li>supprimer ses propres formulaires</li>
          </ul>
        </li>
        <li>Utilisateurs :
          <ul>
            <li>inviter des utilisateurs dans ses propres formulaires</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Formulaires : 
          <ul>
            <li>cloner</li>
            <li>modifier ses propres formulaires</li>
            <li>supprimer ses propres formulaires</li>
          </ul>
        </li>
        <li>Utilisateurs :
          <ul>
            <li>inviter des utilisateurs dans ses propres formulaires</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Formulaires : 
          <ul>
            <li>modifier ses propres formulaires</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Données : 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>accès à l'outil Carte</li>
          </ul>
        </li>
        <li>Analyse :
          <ul>
            <li>accès complet à tous les outils</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Données : 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>accès aux outils de validation des données</li>
        <li>soumettre des enregistrements à la phase "Analyse"</li>`,
      dataEditor: `
        <li>Données : 
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>ajouter de nouveaux enregistrements (ses propres formulaires)</li>
        <li>modifier les enregistrements existants (ses propres formulaires)</li>
        <li>soumettre des enregistrements à la phase "Nettoyage"</li>`,
    },
    messageOptional: 'Message (optionnel)',
    messageInfo: `Le message apparaîtra dans l'e-mail envoyé à l'utilisateur. 
Il peut être du texte simple ou du langage Markdown (https://www.markdownguide.org).`,
    sendInvitation: "Envoyer l'invitation",
    surveyNotPublishedWarning: `**Attention** : le formulaire n\'est pas publié.
      Les utilisateurs ne peuvent être invités qu\'avec les rôles d'***$t(auth:authGroups.systemAdmin.label)*** et ***$t(auth:authGroups.surveyAdmin.label)***.
      Si vous souhaitez inviter des utilisateurs avec d'autres rôles, vous devez d'abord publier le formulaire.`,
    typeEmail: 'Saisissez une adresse e-mail, puis appuyez sur le bouton Ajouter',
  },

  user: {
    mapApiKeys: {
      title: 'Clés API de carte',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Cette clé API est valide',
      keyIsNotCorrect: "Cette clé API n'est PAS valide",
    },
    title: 'Titre',
    titleValues: {
      mr: 'M.',
      ms: 'Mme',
      preferNotToSay: 'Préfère ne pas préciser',
    },
  },

  chainView: {
    baseUnit: {
      confirmDelete:
        'En supprimant l\'unité de base, vous décocherez toutes les sélections "variable basée sur la surface". Continuer ?',
    },
    downloadSummaryJSON: 'Télécharger le résumé (JSON)',
    firstPhaseCategory: 'Catégorie de 1ère phase',
    firstPhaseCommonAttribute: {
      label: 'Attribut commun',
      info: `Attribut en commun entre l'unité de base et la table de 1ère phase 
(il doit s'agir d'un attribut code avec le même nom qu'une propriété supplémentaire définie pour la catégorie de 1ère phase)`,
    },
    formLabel: 'Étiquette de la chaîne de traitement',
    basic: 'Basique',
    records: 'Enregistrements',
    recordsInStepCount: '{{step}} : {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: "Soumettre uniquement les données de l'étape d'analyse à RStudio",
    submitOnlySelectedRecordsIntoR: 'Soumettre uniquement les enregistrements sélectionnés à RStudio',
    includeEntitiesWithoutData: 'Inclure les entités sans données',
    cannotStartRStudio: {
      common: 'Impossible de démarrer RStudio',
      noRecords: "$t(chainView.cannotStartRStudio.common) : il n'y a aucun enregistrement à soumettre",
      surveyNotPublished: "$t(chainView.cannotStartRStudio.common) : publiez d'abord le formulaire",
    },
    nonResponseBiasCorrection: 'Correction du biais de non-réponse',
    nonResponseBiasCorrectionInfo: `Pour implémenter la méthode d'ajustement par classes de pondération, ajoutez 'design_psu' et 'design_ssu' dans la table de catégories de strate comme propriétés numériques supplémentaires.`,
    pValue: 'Valeur P',
    resultsBackFromRStudio: 'Résultats relus depuis RStudio',
    samplingDesign: "Plan d'échantillonnage",
    samplingDesignDetails: "Détails du plan d'échantillonnage",
    samplingStrategyLabel: "Stratégie d'échantillonnage",
    samplingStrategy: {
      simpleRandom: 'Échantillonnage aléatoire simple',
      systematic: 'Échantillonnage systématique',
      stratifiedRandom: 'Échantillonnage aléatoire stratifié',
      stratifiedSystematic: 'Échantillonnage systématique stratifié',
      twoPhase: 'Échantillonnage en deux phases',
    },
    statisticalAnalysis: {
      header: 'Analyse statistique',
      entityToReport: 'Entité à rapporter',
      entityWithoutData: "L'entité {{name}} n'a pas de données",
      filter: 'Filtre (script R)',
      reportingMethod: 'Méthode de rapport',
      reportingMethods: {
        dimensionsCombined: 'Combinaison des dimensions',
        dimensionsSeparate: 'Dimensions séparément',
      },
      reportingArea: 'Surface totale de rapport (ha) (Optionnel)',
      reportingAreaInfo: `Avec un échantillonnage stratifié, indiquez les superficies des strates dans la table de catégories de l'attribut de strate (nom de la colonne 'area')`,
    },
    stratumAttribute: 'Attribut de strate',
    postStratificationAttribute: 'Attribut de post-stratification',
    areaWeightingMethod: 'Méthode de pondération par surface',
    clusteringEntity: 'Entité de regroupement',
    clusteringOnlyVariances: 'Regroupement uniquement pour les variances',
    errorNoLabel: 'La chaîne doit avoir une étiquette valide',
    dateExecuted: "Date d'exécution",
    deleteChain: 'Supprimer la chaîne',
    deleteConfirm: `Supprimer cette chaîne de traitement ?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Chaîne de traitement supprimée',
    cannotSelectNodeDefNotBelongingToCycles: `La définition de nœud "{{label}}" ne peut pas être sélectionnée car elle n'appartient pas à tous les cycles de la chaîne de traitement`,
    cannotSelectCycle:
      "Ce cycle ne peut pas être sélectionné car certaines définitions de nœud n'appartiennent pas à ce cycle",
    copyRStudioCode: `#### Vous êtes sur le point d'ouvrir un serveur RStudio ####  

##### Cliquez sur le bouton OK et ces commandes seront copiées dans votre presse-papiers. #####  

###### RStudio Server sera ouvert ; une fois la console RStudio active, collez et exécutez les lignes suivantes pour importer le code de la chaîne : ######  

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Chaîne de traitement vers RStudio ####  

###### Cliquez sur le bouton OK et ces commandes seront copiées dans votre presse-papiers. ######  

###### Démarrez RStudio sur votre machine (vous devez avoir le package 'rstudioapi' installé). ######  

###### Une fois la console RStudio active, collez et exécutez les lignes suivantes pour importer le code de la chaîne : ######  


{{rStudioCode}}

`,
    entities: {
      new: 'Entité virtuelle',
    },
    reportingDataCategory: 'Nom de la table de catégorie',
    reportingDataAttribute: 'Attribut pour {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Table de données de rapport et jointures avec les attributs',
    showSamplingAttributes: "Afficher les attributs d'échantillonnage",
  },

  instancesView: {
    title: 'Instances',
    terminate: 'Terminer',
  },
  chain: {
    quantitative: 'Quantitatif',
    categorical: 'Catégoriel',
    addQuantitative: 'Ajouter un attribut quantitatif',
    addCategorical: 'Ajouter un attribut catégoriel',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      "l'entité et toutes les variables de résultats associées seront exclues des scripts RStudio",
    entityWithoutData: "L'entité {{name}} n'a pas de données ; $t(chain.entityExcludedInRStudioScripts)",
    entityNotInCurrentCycle:
      "L'entité {{name}} n'est pas disponible dans le cycle sélectionné ; $t(chain.entityExcludedInRStudioScripts)",
    error: {
      invalidToken: 'Jeton invalide ou expiré',
    },
  },

  itemsTable: {
    unused: 'Inutilisé',
    noItemsAdded: 'Aucun élément ajouté',
  },

  expression: {
    functionHasTooFewArguments: 'La fonction {{fnName}} nécessite au moins {{minArity}} arguments (reçu {{numArgs}})',
    functionHasTooManyArguments: 'La fonction {{fnName}} accepte au maximum {{maxArity}} arguments (reçu {{numArgs}})',
    identifierNotFound: 'Attribut ou entité "{{name}}" introuvable',
    invalid: 'Expression invalide : {{details}}',
    invalidAttributeValuePropertyName:
      "Nom de propriété de valeur d'attribut invalide : {{attributeName}}.{{propName}}",
    invalidCategoryExtraProp: 'Nom de propriété supplémentaire invalide : {{propName}}',
    invalidCategotyName: 'Nom de catégorie invalide : {{name}}',
    invalidTaxonomyName: 'Nom de taxonomie invalide : {{name}}',
    invalidTaxonVernacularNameLanguageCode:
      'Code de langue de nom vernaculaire de taxon invalide : {{vernacularLangCode}}',
    missingFunctionParameters: 'Paramètres de fonction manquants',
    undefinedFunction: 'Fonction non définie : {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
À propos
========

$t(common.appNameFull)
--------
 
 * Développé par $t(links.openforis)
 * Version: {{version}}
 * Site web: $t(links.openforisArenaWebsite)
 * Tutoriels vidéo Arena dans l'Académie FAO elearning: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Tutoriels vidéo Arena sur YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Forum de support: $t(links.supportForum)
 * Arena sur GitHub: $t(links.arenaInGitHub)
 * Scripts R Arena sur GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
  },

  // ====== Vues du formulaire

  nodeDefEdit: {
    additionalFields: 'Champs supplémentaires',
    basic: 'Basique',
    advanced: 'Avancé',
    mobileApp: 'Application mobile',
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
      geoDistance: '$t(nodeDefEdit.functionDescriptions.distance)',
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
      displayAs: 'Afficher comme',
      displayIn: 'Afficher dans',
      entitySource: "Source de l'entité",
      enumerate: {
        label: 'Énumérer',
        info: `Les lignes seront générées automatiquement à partir des éléments de catégorie associés à un attribut code marqué comme Clé définie dans l'entité ; les lignes ne peuvent pas être ajoutées ou supprimées et l'attribut code clé ne sera pas modifiable`,
      },
      enumerator: {
        label: 'Énumérateur',
        info: "Les éléments de la catégorie seront utilisés pour générer les lignes de l'entité parente",
      },
      form: 'Formulaire',
      formula: 'Formule',
      includedInClonedData: 'Inclus dans les données clonées',
      includedInRecordsList: {
        label: 'Inclure dans la liste des enregistrements',
        info: `Si coché, l'attribut sera visible dans la liste des enregistrements`,
      },
      key: 'Clé',
      multiple: 'Multiple',
      ownPage: 'Sa propre page',
      parentPage: 'Page parente ({{parentPage}})',
      table: 'Tableau',
    },
    advancedProps: {
      areaBasedEstimate: 'Estimation basée sur la surface',
      defaultValues: 'Valeurs par défaut',
      defaultValueEvaluatedOneTime: 'Valeur par défaut évaluée une seule fois',
      defaultValuesNotEditableForAutoIncrementalKey:
        'Valeurs par défaut non modifiables car la clé auto-incrémentielle est définie',
      hidden: 'Masquer dans le formulaire de saisie',
      hiddenWhenNotRelevant: 'Masqué quand non pertinent',
      itemsFilter: "Filtre d'éléments",
      itemsFilterInfo: `Expression utilisée pour filtrer les éléments sélectionnables.
Dans l'expression, le mot "this" fera référence à l'élément lui-même. 
Ex. this.region = nom_attribut_region 
(où "region" est le nom d'une propriété supplémentaire définie pour l'élément et nom_attribut_region est le nom d'un attribut dans le formulaire)`,
      readOnly: 'Lecture seule',
      relevantIf: 'Pertinent si',
      script: 'Script',
    },
    mobileAppProps: {
      hiddenInMobile: {
        label: 'Masqué dans Arena Mobile',
        info: `Si coché, l'attribut ne sera pas visible dans AM`,
      },
      includedInMultipleEntitySummary: {
        label: "Inclure dans le résumé de l'entité multiple",
        info: `Si coché, l'attribut sera visible dans la vue récapitulative de l'entité (dans Arena Mobile)`,
      },
      includedInPreviousCycleLink: {
        label: 'Inclure dans le lien du cycle précédent',
        info: `Si coché, la valeur du cycle précédent sera affichée dans le formulaire de saisie de données (lorsque le lien vers le cycle précédent est activé dans l'application mobile)`,
      },
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
      expressions: 'Expressions',
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
  },

  languagesEditor: {
    languages: 'Langue(s)',
  },

  taxonomy: {
    header: 'Taxonomie',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomie'})`,
    confirmDelete: 'Supprimer la taxonomie {{taxonomyName}} ?\n$t(common.cantUndoWarning)',
    edit: {
      taxonomyListName: 'Nom de la liste de taxonomie',
      taxaNotImported: 'Taxons non importés',
      family: 'Famille',
      genus: 'Genre',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Synonyme / Latin',
      extraPropsNotDefined: 'Propriétés supplémentaires non définies pour cette taxonomie',
    },
    taxaCount: 'Nombre de taxons',
    vernacularNameLabel: 'Étiquette du nom vernaculaire',
  },

  categoryList: {
    batchImport: 'Importer des catégories en lot (depuis un ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} catégories importées avec succès !
{{insertedCategories}} nouvelles
{{updatedCategories}} mises à jour`,
    itemsCount: "Nombre d'éléments",
    types: {
      flat: 'Plat',
      hierarchical: 'Hiérarchique',
      reportingData: 'Données de rapport',
    },
  },

  categoryEdit: {
    header: 'Catégorie',
    addLevel: 'Ajouter un niveau',
    categoryName: 'Nom de la catégorie',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'catégorie'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'niveau de catégorie'})`,
    confirmDelete: 'Supprimer la catégorie {{categoryName}} ?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'La catégorie est **vide** et sera supprimée. Continuer ?',
    confirmDeleteLevel: `Supprimer le niveau de catégorie '{{levelName}}' avec tous ses éléments ?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Supprimer l'élément ?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Supprimer l'élément avec tous ses enfants ?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Convertir en données de rapport',
      confirmMessage: `Convertir cette catégorie en catégorie de données de rapport ?

Les niveaux seront renommés en niveau_1, niveau_2... niveau_N et une propriété supplémentaire 'area' sera ajoutée aux éléments.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Convertir cette catégorie de données de rapport en catégorie simple ?`,
    },
    deleteItem: "Supprimer l'élément",
    level: {
      title: 'Niveau {{levelPosition}}',
      noItemsDefined: 'Aucun élément défini',
      selectItemFromPreviousLevel: 'Sélectionnez un élément du niveau précédent',
    },

    importSummary: {
      columns: 'Colonne',
      columnTypeSummary: 'Niveau {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Description ({{language}})',
      columnTypeLabel: 'Étiquette ({{language}})',
      columnType: {
        code: 'code',
        description: 'description',
        label: 'étiquette',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Type de données',
      title: "Résumé de l'importation de catégorie",
    },
    reportingData: 'Données de rapport',
    templateFor_samplingPointDataImport_csv: "Modèle pour l'importation de données de points d'échantillonnage (CSV)",
    templateFor_samplingPointDataImport_xlsx:
      "Modèle pour l'importation de données de points d'échantillonnage (Excel)",
  },

  extraProp: {
    label: 'Propriété supplémentaire',
    label_plural: 'Propriétés supplémentaires',
    addExtraProp: 'Ajouter une propriété supplémentaire',
    dataTypes: {
      geometryPoint: 'Point géométrique',
      number: 'Nombre',
      text: 'Texte',
    },
    editor: {
      title: 'Modifier les $t(extraProp.label_plural)',
      confirmDelete: 'Supprimer la propriété supplémentaire "{{name}}" ?',
      confirmSave: `Sauvegarder les modifications des définitions des propriétés supplémentaires ?

  **Avertissements** :

  {{warnings}}`,
      warnings: {
        nameChanged: 'Nom modifié de {{nameOld}} à {{nameNew}}',
        dataTypeChanged: 'Type de données modifié de {{dataTypeOld}} à {{dataTypeNew}}',
      },
    },
    name: 'Nom de la propriété {{position}}',
    value: 'Valeur',
  },

  record: {
    ancestorNotFound: "Nœud ancêtre introuvable dans l'enregistrement",
    keyDuplicate: "Clé d'enregistrement dupliquée",
    oneOrMoreInvalidValues: 'Une ou plusieurs valeurs sont invalides',
    uniqueAttributeDuplicate: 'Valeur dupliquée',

    attribute: {
      customValidation: 'Valeur invalide',
      uniqueDuplicate: 'Valeur dupliquée',
      valueInvalid: 'Valeur invalide',
      valueRequired: 'Valeur requise',
    },
    entity: {
      keyDuplicate: "Clé d'entité dupliquée",
    },
    nodes: {
      count: {
        invalid: 'Les nœuds {{nodeDefName}} doivent être exactement {{count}}',
        maxExceeded: 'Les nœuds {{nodeDefName}} doivent être inférieurs ou égaux à {{maxCount}}',
        minNotReached: 'Les nœuds {{nodeDefName}} doivent être supérieurs ou égaux à {{minCount}}',
      },
    },
  },

  // ====== Composants communs

  expressionEditor: {
    and: 'ET',
    or: 'OU',
    group: 'Groupe ()',
    var: 'Variable',
    const: 'Valeur constante',
    call: 'Fonction',
    operator: 'Opérateur',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: "Attribut de coordonnée d'origine",
      distanceAttribute: 'Attribut de distance',
      bearingAttribute: 'Attribut de cap',
    },
    coordinateAttributeWithPosition: 'Attribut de coordonnée {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Premier attribut de date',
      firstTimeAttribute: "Premier attribut d'heure",
      secondDateAttribute: 'Deuxième attribut de date',
      secondTimeAttribute: "Deuxième attribut d'heure",
    },
    error: {
      selectOneVariable: 'Veuillez sélectionner une variable',
    },

    header: {
      editingExpressionForNodeDefinition: 'Modification de l\'expression {{qualifier}} pour "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Modification de la fonction "{{functionName}}" pour "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'valeur par défaut',
      'default-values-apply-if': 'valeur par défaut appliquer si',
      'max-count': 'nombre maximum',
      'min-count': 'nombre minimum',
      'relevant-if': 'pertinent si',
      validations: 'règle de validation',
      'validations-apply-if': 'règle de validation appliquer si',
    },

    selectAFunction: 'Sélectionnez une fonction',

    valueType: {
      constant: 'Constante',
      expression: 'Expression',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/tools/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank">$t(urls.supportForum)</a>`,
  },
}
