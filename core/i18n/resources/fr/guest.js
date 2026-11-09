export default {
  loginView: {
    title: 'Connexion',
    subtitle: 'Bienvenue ! Saisissez vos identifiants pour accéder à $t(common.appNameFull).',
    backToLogin: 'Retour à la connexion',
    newToArena: 'Nouveau sur $t(common.appNameFull) ?',
    or: 'ou',
    twoFactorTitle: 'Vérification en deux étapes',
    verify: 'Vérifier',
    lostYourDevice: "Vous ne pouvez pas utiliser votre application d'authentification ?",
    yourName: 'Votre nom',
    yourEmail: 'Votre e-mail',
    yourPassword: 'Votre mot de passe',
    yourNewPassword: 'Votre nouveau mot de passe',
    repeatYourPassword: 'Répétez votre mot de passe',
    repeatYourNewPassword: 'Répétez votre nouveau mot de passe',
    requestAccess: "Demander l'accès",
    resetPassword: 'Réinitialiser le mot de passe',
    login: 'Connexion',
    loginUsingBackupCode: 'Utiliser un code de sauvegarde',
    forgotPassword: 'Mot de passe oublié ?',
    sendPasswordResetEmail: "Envoyer l'e-mail de réinitialisation du mot de passe",
    twoFactorBackupCode: 'Code de sauvegarde 2FA',
    twoFactorToken: 'Code de vérification',
    twoFactorTokenDescription: `Pour assurer la sécurité de votre compte, nous vérifions votre identité.

Entrez le code généré par votre application d'authentification.`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'Vous avez déjà un compte ?',
    steps: {
      sendRequest: {
        title: 'Envoyez la demande',
        description: "Proposez un nom pour votre première enquête : partez d'une enquête vierge ou d'un modèle.",
      },
      review: {
        title: 'Nous l’examinons',
        description: 'Merci de nous laisser quelques jours pour traiter votre demande.',
      },
      invitation: {
        title: 'Recevez votre invitation',
        description:
          "Vous recevrez un e-mail pour accéder à $t(common.appName) : vous serez Administrateur de la nouvelle enquête et pourrez créer jusqu'à 5 enquêtes.",
      },
    },
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
    introduction:
      "Nos ressources sont limitées, l'accès est donc accordé sur demande. Dites-nous ce que vous souhaitez faire avec $t(common.appName) !",
    reCaptchaNotAnswered: 'ReCaptcha non répondu',
    requestSent: "Demande d'accès envoyée correctement",
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Veuillez nous accorder quelques jours pour traiter votre demande.
Une fois celle-ci acceptée, nous vous enverrons un autre e-mail à **{{email}}** avec les instructions pour accéder à $t(common.appName).
Merci et profitez de **$t(common.appNameFull)** !`,
    sendRequest: 'Envoyer la demande',
    sendRequestConfirm: "Demander l'accès à $t(common.appNameFull) ?",
    templateNotSelected: 'Non sélectionné (commencer de zéro)',
    title: "Demander l'accès",
    whitelistSenderSuggestion:
      "Si vous le trouvez dans le dossier Spam/Courrier indésirable, veuillez ajouter **{{senderEmail}}** à vos contacts (carnet d'adresses) ou le marquer comme sûr/non indésirable, afin que nos prochains e-mails arrivent directement dans votre boîte de réception.",
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Configurez votre compte pour commencer.',
      setYourNewPassword: 'Choisissez un nouveau mot de passe pour votre compte.',
    },
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
  forgotPasswordView: {
    title: 'Réinitialiser votre mot de passe',
    description:
      "Saisissez l'adresse e-mail de votre compte et nous vous enverrons un lien pour choisir un nouveau mot de passe.",
  },
  pitch: {
    default: {
      title: 'Les données de terrain, de la collecte à l’analyse.',
      description:
        'Concevez des formulaires multilingues, gérez des inventaires multi-cycles, validez la qualité des données et analysez les résultats avec RStudio intégré.',
    },
    accessRequest: {
      title: 'Créez votre première enquête dans $t(common.appName).',
      description:
        'Parlez-nous de votre projet. Une fois approuvé, vous pourrez concevoir des formulaires, inviter vos équipes de terrain et analyser les données au même endroit.',
    },
    tags: {
      forestInventories: 'Inventaires forestiers',
      questionnaires: 'Questionnaires',
      multiCycle: 'Multi-cycles',
      statisticalAnalysis: 'Analyse statistique',
    },
  },
  footer: {
    website: 'À propos de $t(common.appName)',
    userManual: "Manuel d'utilisation",
    supportForum: 'Forum de support',
    version: 'Version {{version}}',
  },
}
