export default {
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
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Veuillez nous accorder quelques jours pour traiter votre demande.
Une fois celle-ci acceptée, nous vous enverrons un autre e-mail à **{{email}}** avec les instructions pour accéder à $t(common.appName).
Merci et profitez de **$t(common.appNameFull)** !`,
    sendRequest: 'Envoyer la demande',
    sendRequestConfirm: "Demander l'accès à $t(common.appNameFull) ?",
    templateNotSelected: 'Non sélectionné (commencer de zéro)',
    title: "Demande d'accès à $t(common.appNameFull)",
    whitelistSenderSuggestion:
      "Si vous le trouvez dans le dossier Spam/Courrier indésirable, veuillez ajouter **{{senderEmail}}** à vos contacts (carnet d'adresses) ou le marquer comme sûr/non indésirable, afin que nos prochains e-mails arrivent directement dans votre boîte de réception.",
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
}
