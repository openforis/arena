export default {
  section: 'Fonctionnalités IA',
  featuresDisabled: 'Les fonctionnalités IA sont désactivées sur ce déploiement.',
  encryptionMissing:
    "Le déploiement ne dispose pas de AI_USER_KEY_ENCRYPTION_SECRET ; les clés API personnelles ne peuvent pas être enregistrées tant qu'un administrateur ne l'a pas configuré.",

  model: 'Modèle',
  modelOther: 'Autre (saisir un identifiant de modèle)...',
  baseUrl: 'URL de base',
  apiKey: 'Clé API',
  apiKeyPlaceholder: 'Collez la clé API de votre fournisseur',
  apiKeySaved: 'Clé enregistrée',
  unknownError: 'Erreur inconnue',
  apiKeyKept: 'Laissez vide pour conserver la clé existante.',
  apiKeyUnreadable:
    'La clé API enregistrée ne peut plus être lue (le secret de chiffrement du serveur a changé). Saisissez à nouveau la clé.',
  vercelAiSdkHint:
    "Un endpoint chat Vercel AI SDK est traité comme un agent fixe - la sélection du modèle et la clé API ne s'appliquent pas. La génération de texte libre fonctionne ; les fonctionnalités de sortie structurée peuvent ne pas fonctionner.",
  modelsFetchFailed: 'Impossible de récupérer les modèles : {{message}}',

  savedSuccessfully: 'Paramètres IA enregistrés.',
  saveFailed: "Échec de l'enregistrement des paramètres IA : {{message}}",

  status: {
    ready: 'Prêt',
    notTested: 'Non testé',
    notAvailable: 'Indisponible',
    notSetUp: 'Non configuré',
  },
  where: {
    onDevice: 'Cet ordinateur',
    orgHosted: "Serveur de l'organisation",
    cloudOwnKey: 'Cloud · votre clé',
    cloud: 'Cloud',
  },
  localServer: {
    where: 'Sur cet ordinateur ou votre réseau',
    baseUrl: 'URL du serveur',
    answered: 'A répondu',
    noModels: 'Le serveur ne liste aucun modèle. Chargez un modèle dans votre serveur local.',
    contextTokens_one: 'Contexte : {{count}} token',
    contextTokens_many: 'Contexte : {{count}} tokens',
    contextTokens_other: 'Contexte : {{count}} tokens',
    contextUnknown: 'Contexte : inconnu (8 192 tokens supposés)',
    model: 'Modèle',
    modelPlaceholder: 'Testez la connexion pour lister les modèles',
    help: "Démarrez votre serveur local (par exemple LM Studio ou Ollama) et autorisez les requêtes de ce site (CORS). Votre navigateur peut demander l'autorisation d'accéder aux appareils du réseau local.",
    httpsHint:
      'Arena est servi en HTTPS : un serveur sur une autre machine de votre réseau doit être en HTTPS, ou il faut un navigateur avec Local Network Access (Chrome) et votre autorisation.',
    cloudWarning:
      "Cette adresse n'est ni sur cet appareil ni dans la liste des serveurs de l'organisation : la politique d'IA du formulaire la traite comme un service cloud.",
    notSaved:
      "Les paramètres du serveur d'IA local n'ont pas pu être enregistrés dans ce navigateur (stockage bloqué ou plein).",
  },
  list: {
    section: 'Fournisseurs',
    add: 'Ajouter un fournisseur',
    arenaDefault: "Fournisseur par défaut d'Arena",
    default: 'Par défaut',
    defaultMissing:
      "Votre fournisseur par défaut est un serveur local enregistré dans un autre navigateur. Choisissez un autre fournisseur par défaut pour utiliser l'IA ici.",
    footerHint:
      "Les fournisseurs sont enregistrés dès que vous les ajoutez. Ce que l'IA peut voir est enregistré avec Enregistrer.",
    menu: 'Actions pour {{name}}',
    makeDefault: 'Définir par défaut',
    test: 'Tester la connexion',
    edit: 'Modifier…',
    remove: 'Supprimer',
    removeConfirm: "Supprimer {{name}} ? Les conversations qui l'utilisent utiliseront votre fournisseur par défaut.",
    removed: '{{name}} a été supprimé.',
    defaultChanged: '{{name}} est maintenant votre fournisseur par défaut.',
    testOk: '{{name}} a répondu.',
    testFailed: "{{name}} n'a pas répondu. Modifiez-le pour vérifier ses paramètres.",
    actionFailed: "La modification n'a pas pu être enregistrée : {{message}}",
  },
  types: {
    local: 'Serveur local',
    orgServer: "Serveur de l'organisation",
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatible OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Simulé (serveur de test)',
  },
  defaultName: {
    local: 'Serveur local',
    orgServer: "Serveur de l'organisation",
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    'openai-compatible': 'Compatible OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Simulé',
  },
  typeHints: {
    orgServer: 'Un serveur compatible OpenAI de la liste de votre organisation.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'vercel-ai-sdk': 'Un point de terminaison de chat créé avec Vercel AI SDK.',
  },
  dialog: {
    addTitle: "Ajouter un fournisseur d'IA",
    editTitle: 'Modifier {{name}}',
    groupLocal: 'Sur votre ordinateur ou votre réseau',
    groupCloud: 'Dans le cloud, avec votre clé API',
    back: 'Retour',
    name: 'Nom (facultatif)',
    test: 'Tester',
    testOk: 'A répondu en {{latencyMs}} ms',
    add: 'Ajouter le fournisseur',
    save: 'Enregistrer',
    testFirst: 'Testez la connexion avant d’enregistrer.',
    orgServerHint: 'Serveurs de la liste de votre organisation : {{urls}}',
    orgServerNotAllowed: "Cette adresse n'est pas dans la liste des serveurs de votre organisation.",
    apiKeyCleared: "L'adresse a changé : saisissez à nouveau la clé API.",
    removeKey: 'Supprimer la clé',
    keepKey: 'Conserver la clé',
    apiKeyRemoved: 'La clé enregistrée sera supprimée. Testez la connexion, puis enregistrez.',
    localUrlHint:
      "Cette adresse est sur votre ordinateur ou votre réseau : le serveur Arena ne peut pas l'atteindre. Ajoutez-la plutôt comme serveur local.",
    useLocalServer: 'Ajouter un serveur local',
  },
  dataClasses: {
    none: 'Aucun contenu du formulaire',
    schema: 'Conception du formulaire',
    data: 'Données des enregistrements',
  },
  access: {
    section: "Ce que l'IA peut voir",
    levels: {
      off: 'Désactivée',
      help: 'Aide seulement',
      design: '+ Conception du formulaire',
      data: '+ Données des enregistrements',
    },
    classes: {
      help: { title: "Aide d'Arena", text: "Votre question et des extraits du manuel d'utilisation d'Arena." },
      design: {
        title: 'Conception du formulaire',
        text: "Entités, attributs, libellés, catégories et expressions. Aucune valeur d'enregistrement.",
      },
      data: {
        title: 'Données des enregistrements',
        text: 'Valeurs des enregistrements et résultats des requêtes. Par défaut, seul un serveur sur cet appareil peut les recevoir.',
      },
    },
    count: '{{on}} fonctionnalités actives sur {{total}}',
    off: 'Les fonctionnalités IA sont désactivées',
    customize: 'Personnaliser',
    customizeHint: 'La politique IA de chaque formulaire peut toujours bloquer un fournisseur.',
    sendsInfo: 'Ce qui est envoyé',
  },
  features: {
    chat: {
      label: "Assistant d'aide",
      sends:
        "Votre question, des passages du manuel d'utilisation d'Arena et l'endroit où vous vous trouvez dans Arena (le nom du module).",
    },
    assistantSuggestions: {
      label: 'Suggestions proactives',
      sends:
        'Rien tant que vous ne cliquez pas sur Faire dans une suggestion. Les vérifications se font dans votre navigateur.',
    },
    expressions: {
      label: 'Expressions',
      sends:
        "L'attribut et ses attributs voisins (noms et types), l'expression et votre description. Si l'assistant réessaie ou explique une erreur, aussi l'expression en échec et son message d'erreur.",
    },
    translation: {
      label: 'Traduction des libellés',
      sends:
        'Le libellé ou la description que vous traduisez, avec les codes de langue. « IA : Traduire les étiquettes » dans le concepteur de formulaire envoie les libellés et descriptions de toutes les entités et de tous les attributs.',
    },
    assistantDesign: {
      label: 'Assistant de conception',
      sends: "La structure du formulaire qu'il demande : entités, attributs, libellés, catégories et expressions.",
    },
    dataQuery: {
      label: 'Requêtes de données',
      sends:
        'Les noms, types et libellés des attributs des entités du formulaire, les noms des catégories, votre description et, pour un résumé, la requête avec son filtre. Aucune valeur des enregistrements.',
    },
    dataDictionary: {
      label: 'Dictionnaire de données',
      sends:
        'Le nom du formulaire et, pour chaque entité ou attribut sans description, son nom, son type et ses entités parentes.',
    },
    assistantAnalysis: {
      label: "Assistant d'analyse",
      sends:
        "La structure du formulaire, puis des comptages d'enregistrements et des résultats de requêtes (jusqu'à 200 groupes ou 50 lignes) à chaque requête qu'il exécute.",
    },
    assistantCleaning: {
      label: 'Assistant de nettoyage',
      sends:
        "La structure du formulaire, les erreurs de validation avec les clés et les valeurs de leurs enregistrements, les valeurs des enregistrements qu'il consulte et, quand il exécute une requête, ses résultats (comptages d'enregistrements et jusqu'à 200 groupes ou 50 lignes). Il propose des modifications que vous vérifiez.",
    },
    userActivity: {
      label: "Résumés d'activité",
      sends:
        "Le nom du formulaire, les noms des utilisateurs, les types d'activité, les comptages et les dates du journal d'activité.",
    },
  },
}
