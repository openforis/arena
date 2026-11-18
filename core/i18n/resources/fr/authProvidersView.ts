export default {
  title: 'Fournisseurs de connexion',
  subtitle:
    'Options de connexion externes affichées sur la page de connexion, dans cet ordre. Les utilisateurs peuvent aussi se connecter avec leur e-mail et leur mot de passe.',
  addProvider: 'Ajouter un fournisseur',
  continue: 'Continuer',
  encryptionKeyMissing:
    "La clé de chiffrement des secrets client n'est pas configurée : définissez AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 caractères hexadécimaux) sur le serveur et redémarrez Arena pour ajouter des fournisseurs.",
  empty: {
    title: 'Aucun fournisseur de connexion',
    description:
      "Permettez aux utilisateurs de se connecter avec Google, Microsoft ou l'authentification unique de votre organisation, en plus de l'e-mail et du mot de passe.",
  },
  columns: {
    provider: 'Fournisseur',
    type: 'Type',
    status: 'Statut',
    loginPage: 'Page de connexion',
    linkedUsers: 'Utilisateurs liés',
    actions: 'Actions',
  },
  passwordAlwaysAvailable:
    'La connexion par e-mail et mot de passe est toujours disponible. Les modifications atteignent toutes les instances du serveur en une minute.',
  status: {
    enabled: 'Activé',
    disabled: 'Désactivé',
  },
  source: {
    env: 'configuration du serveur',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Affiché',
    directLinkOnly: 'Lien direct uniquement',
  },
  moveUp: 'Monter',
  moveDown: 'Descendre',
  enable: 'Activer',
  disable: 'Désactiver',
  deleteConfirm:
    'Supprimer le fournisseur de connexion « {{provider}} » ? Les liens de ses {{linkedUsersCount}} utilisateurs seront supprimés (pour bloquer les connexions tout en gardant les liens, désactivez-le plutôt).\n\nUtilisateurs qui resteront sans aucune méthode de connexion (ils recevront un e-mail expliquant comment définir un mot de passe) : {{usersWithoutOtherMethod}}',
  addDialog: {
    description: "Choisissez le type de fournisseur. Vous pourrez modifier le libellé et l'icône ensuite.",
    typeDescription: {
      google: 'Comptes Google, y compris Gmail et Google Workspace.',
      microsoft: 'Comptes Microsoft professionnels, scolaires ou personnels (Entra ID).',
      oidc: 'Tout autre fournisseur : Keycloak, Okta, Auth0, le SSO de votre organisation...',
    },
    notSupportedYet: 'Facebook, GitHub et Apple ne sont pas encore pris en charge.',
  },
  form: {
    errors: "Impossible d'enregistrer le fournisseur : {{errors}}",
    newTitle: 'Nouveau fournisseur {{type}}',
    general: 'Général',
    label: 'Libellé du bouton',
    id: 'Identifiant',
    idInfo:
      'Utilisé dans les URL et pour lier les comptes des utilisateurs : lettres minuscules, chiffres et tirets. Il ne peut plus être modifié après la création.',
    icon: 'Icône',
    useUploadedIcon: "Utiliser l'icône importée",
    iconInvalid: 'Icône non valide : utilisez un fichier PNG ou SVG de 100 Ko au maximum.',
    enabled: 'Activé',
    enabledInfo:
      'Désactivé, le bouton est masqué et les connexions avec ce fournisseur sont refusées. Les comptes liés sont conservés.',
    showOnLoginPage: 'Afficher sur la page de connexion',
    showOnLoginPageInfo:
      "Désactivé, le fournisseur n'a pas de bouton sur la page de connexion : les utilisateurs l'utilisent avec le lien direct {{path}}",
    connection: 'Connexion',
    issuer: "URL de l'émetteur",
    issuerInfo: 'Arena lit les autres points de terminaison depuis <émetteur>/.well-known/openid-configuration.',
    tenant: 'Locataire',
    tenantInfo:
      'ID de locataire de votre organisation, ou « organizations » (tout compte professionnel ou scolaire), « consumers » (comptes personnels) ou « common » (tout compte Microsoft).',
    clientId: 'ID client',
    clientSecret: 'Secret client',
    clientSecretInfo: "Stocké chiffré et jamais réaffiché : laissez vide pour conserver l'actuel.",
    clientSecretSet: '(défini)',
    scopes: 'Portées',
    scopesInfo: 'Séparées par des espaces ; « openid » est obligatoire.',
    access: 'Accès',
    accessDescription: 'Seuls les utilisateurs qui ont déjà un compte ou une invitation Arena peuvent se connecter.',
    allowedEmailDomains: 'Domaines e-mail autorisés',
    allowedEmailDomainsInfo:
      "Les utilisateurs ne peuvent se connecter qu'avec un e-mail de ces domaines (par ex. celui de votre organisation).",
    emailDomainsMode: { all: 'Autoriser tous les domaines', specific: 'Autoriser uniquement certains domaines' },
    emailDomainsPlaceholder: 'Saisissez un domaine, par ex. example.org',
    emailDomainsRequired: 'Ajoutez au moins un domaine e-mail, ou autorisez tous les domaines',
    requireArena2FA: "Exiger l'authentification à deux facteurs d'Arena",
    requireArena2FAInfo:
      "Les utilisateurs qui ont activé l'authentification à deux facteurs d'Arena doivent toujours saisir leur code. Désactivez-la seulement si ce fournisseur impose sa propre authentification multifacteur.",
    trustEmail: 'Faire confiance aux e-mails de ce fournisseur',
    trustEmailInfo:
      "Lier les comptes par e-mail même si le fournisseur ne confirme pas que l'e-mail est vérifié. À activer uniquement pour les fournisseurs qui vérifient eux-mêmes les e-mails.",
    redirectUri: 'URI de redirection',
    redirectUriCopied: 'URI de redirection copiée',
    setupStepsTitle: 'Comment configurer le fournisseur',
    setupGuide: {
      google: 'Guide détaillé : Google',
      microsoft: 'Guide détaillé : Microsoft',
      oidc: 'Guide détaillé : Keycloak et autres fournisseurs',
    },
    setupSteps: {
      google: [
        'Dans Google Cloud console, ouvrez Google Auth Platform (ou API et services) > Clients et créez un client OAuth de type « Application Web ».',
        "Ajoutez l'URI de redirection ci-dessus aux « URI de redirection autorisés » du client.",
        "Copiez l'ID client et le secret client créés par Google dans les champs ID client et Secret client de la section Connexion (à gauche), puis cliquez sur Sauvegarder.",
      ],
      microsoft: [
        "Dans le centre d'administration Microsoft Entra, ouvrez Inscriptions d'applications > Nouvelle inscription.",
        "Ajoutez l'URI de redirection ci-dessus comme URI de redirection « Web » de l'application.",
        'Dans Certificats et secrets, créez un nouveau secret client.',
        "Copiez l'ID d'application (client) et la valeur du secret dans les champs ID client et Secret client de la section Connexion (à gauche), puis cliquez sur Sauvegarder.",
      ],
      oidc: [
        "Chez le fournisseur (par exemple Keycloak, Okta), enregistrez Arena comme application web confidentielle (OpenID Connect, flux avec code d'autorisation).",
        "Ajoutez l'URI de redirection ci-dessus aux URI de redirection autorisées de l'application et autorisez les portées openid, email et profile.",
        "Copiez l'URL de l'émetteur, l'ID client et le secret client de l'application dans les champs URL de l'émetteur, ID client et Secret client de la section Connexion (à gauche), puis cliquez sur Sauvegarder.",
      ],
    },
    loginPagePreview: 'Aperçu de la page de connexion',
    readOnlyEnv:
      'Ce fournisseur est défini dans la configuration du serveur (AUTH_PROVIDERS_CONFIG) : modifiez-le là et redémarrez Arena.',
    testConnection: 'Tester la connexion',
    testSignIn: 'Tester la connexion utilisateur',
    testConnectionOk: 'Connexion réussie : {{keysCount}} clés de signature chargées en {{durationMs}} ms.',
    testConnectionFailed: 'La connexion a échoué : {{error}}',
  },
  testResult: {
    title: 'Résultat du test de connexion',
    success: "Connexion réussie : le jeton d'identité a été validé. Personne n'a été connecté et rien n'a été modifié.",
    issuer: 'Émetteur',
    subject: 'Sujet (sub)',
    email: 'E-mail',
    verified: '(vérifié)',
    notVerified: '(non vérifié)',
    name: 'Nom',
    matchingUser: 'Utilisateur Arena correspondant',
    outcome: 'À la connexion',
    alreadyLinked: "Déjà lié : l'utilisateur serait connecté.",
    wouldLink: "Le compte serait lié à l'utilisateur par e-mail.",
  },
}
