export default {
  section: 'Fonctionnalités IA',
  enableFeatures: 'Activer les fonctionnalités IA',
  featuresDisabled: 'Les fonctionnalités IA sont désactivées sur ce déploiement.',
  encryptionMissing:
    "Le déploiement ne dispose pas de AI_USER_KEY_ENCRYPTION_SECRET ; les clés API personnelles ne peuvent pas être enregistrées tant qu'un administrateur ne l'a pas configuré.",

  provider: 'Fournisseur',
  providers: {
    default: "Valeur par défaut d'Arena",
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'openai-compatible': 'Compatible OpenAI (Azure, OpenRouter, Ollama, ...)',
    'vercel-ai-sdk': 'Vercel AI SDK (endpoint de chat)',
  },
  model: 'Modèle',
  modelOther: 'Autre (saisir un identifiant de modèle)...',
  baseUrl: 'URL de base',
  apiKey: 'Clé API',
  apiKeyPlaceholder: 'Collez la clé API de votre fournisseur',
  apiKeyKept: 'Laissez vide pour conserver la clé existante.',
  apiKeyUnreadable:
    "La clé API enregistrée ne peut plus être lue (le secret de chiffrement du serveur a changé). Les fonctions IA utilisent le fournisseur par défaut jusqu'à ce que vous saisissiez à nouveau la clé.",
  vercelAiSdkHint:
    "Un endpoint chat Vercel AI SDK est traité comme un agent fixe - la sélection du modèle et la clé API ne s'appliquent pas. La génération de texte libre fonctionne ; les fonctionnalités de sortie structurée peuvent ne pas fonctionner.",
  modelsFetchFailed: 'Impossible de récupérer les modèles : {{message}}',

  savedSuccessfully: 'Paramètres IA enregistrés.',
  saveFailed: "Échec de l'enregistrement des paramètres IA : {{message}}",

  status: {
    now: 'Actuellement :',
    ready: 'Prêt',
    notTested: 'Non testé',
    notAvailable: 'Indisponible',
    none: 'Activez le serveur local ou choisissez un fournisseur.',
  },
  where: {
    section: "Où s'exécute l'IA",
    order: {
      title: 'Ordre',
      localFirst: "Utiliser d'abord le serveur local, le fournisseur cloud en secours",
      cloudFirst: "Utiliser d'abord le fournisseur cloud",
      hint: "La politique d'IA de chaque formulaire peut toujours bloquer un moteur. Par défaut, les données des enregistrements restent sur cet appareil.",
    },
  },
  localServer: {
    name: "Serveur d'IA local",
    where: 'LM Studio sur cet ordinateur · enregistré dans ce navigateur',
    use: 'Utiliser',
    baseUrl: 'URL du serveur',
    test: 'Tester',
    answered: 'A répondu',
    noModels: 'Le serveur ne liste aucun modèle. Chargez un modèle dans LM Studio.',
    contextTokens: 'Contexte : {{count}} tokens',
    contextUnknown: 'Contexte : inconnu (8 192 tokens supposés)',
    model: 'Modèle',
    modelPlaceholder: 'Testez la connexion pour lister les modèles',
    help: "LM Studio : démarrez le serveur et activez Enable CORS. Votre navigateur peut demander l'autorisation d'accéder aux appareils du réseau local.",
    docsLink: 'Documentation de LM Studio',
    httpsHint:
      'Arena est servi en HTTPS : un serveur sur une autre machine de votre réseau doit être en HTTPS, ou il faut un navigateur avec Local Network Access (Chrome) et votre autorisation.',
    cloudWarning:
      "Cette adresse n'est ni sur cet appareil ni dans la liste des serveurs de l'organisation : la politique d'IA du formulaire la traite comme un service cloud.",
    notSaved:
      "Les paramètres du serveur d'IA local n'ont pas pu être enregistrés dans ce navigateur (stockage bloqué ou plein).",
  },
  cloud: {
    name: 'Fournisseur cloud',
    where: 'enregistré avec votre compte',
    defaultHint: 'Utilise le fournisseur configuré par votre administrateur Arena.',
    defaultNone: "Aucun n'est configuré sur ce serveur.",
    localUrlHint:
      "Cette adresse se trouve sur votre ordinateur ou votre réseau. Pour LM Studio, utilisez le Serveur d'IA local ci-dessus. Le serveur Arena ne peut pas l'atteindre.",
    localUrlLink: "Utiliser le Serveur d'IA local",
    test: 'Tester',
    testOk: 'A répondu en {{latencyMs}} ms',
    remove: 'Supprimer mon fournisseur',
    removed: "Votre fournisseur a été supprimé. Les fonctionnalités IA utilisent la valeur par défaut d'Arena.",
    removedNoDefault: 'Votre fournisseur a été supprimé.',
  },
  dataClasses: {
    none: 'Aucun contenu du formulaire',
    schema: 'Conception du formulaire',
    data: 'Données des enregistrements',
  },
  features: {
    section: "Ce que l'IA peut faire et ce qu'elle voit",
    keyHint:
      "Conception du formulaire et Données des enregistrements correspondent aux deux réglages de la politique d'IA de chaque formulaire.",
    sendsLabel: 'Envoie :',
    groupHints: {
      none: "N'importe quel moteur.",
      cloud: 'Politique par défaut du formulaire : tout moteur, cloud compris.',
      onDevice:
        "Politique par défaut du formulaire : cet appareil uniquement. Un moteur cloud doit être autorisé par l'administrateur du formulaire.",
    },
    chat: {
      label: "Assistant d'aide",
      sends:
        "Votre question, des passages du manuel d'utilisation d'Arena et l'endroit où vous vous trouvez dans Arena (le nom du module).",
    },
    expressions: {
      label: 'Expressions',
      sends:
        "L'attribut et ses attributs voisins (noms et types), l'expression et votre description. Si l'assistant réessaie ou explique une erreur, aussi l'expression en échec et son message d'erreur.",
    },
    translation: {
      label: 'Traduction des libellés',
      sends: 'Le libellé ou la description que vous traduisez, avec les codes de langue.',
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
        'Le nom du formulaire et, pour chaque attribut sans description, son nom, son type et ses entités parentes.',
      runs: "S'exécute sur le serveur Arena, avec votre fournisseur cloud ou celui par défaut d'Arena ; jamais sur votre serveur local.",
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
  footerNote: 'Tous les paramètres IA sont enregistrés avec le bouton Enregistrer du profil.',
}
