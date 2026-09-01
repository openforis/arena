export default {
  authenticatorCodeOne: "Code d'authentification 1",
  authenticatorCodeTwo: "Code d'authentification 2",
  authenticatorCodeTwoInfo: 'Attendez 30 secondes et entrez un deuxième code',
  backupCodesRegenerated: {
    title: 'Codes de sauvegarde régénérés avec succès',
    message: `Veuillez sauvegarder les 8 codes de sauvegarde suivants dans un endroit sûr :  
{{backupCodes}}  

Utilisez-les pour accéder à votre compte si vous perdez l'accès à votre appareil d'authentification.  
**Chaque code de sauvegarde ne peut être utilisé qu'une seule fois**.  
Ils ne peuvent être consultés que maintenant, alors assurez-vous de **les sauvegarder maintenant**.`,
  },
  create: {
    label: 'Créer',
  },
  creationSuccessful: {
    title: 'Appareil 2FA créé avec succès',
    message: `L'appareil 2FA "{{deviceName}}" a été créé.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Êtes-vous sûr(e) de vouloir supprimer l\'appareil "{{deviceName}}" ?',
    error: "Erreur lors de la suppression de l'appareil : {{message}}",
    successful: 'Appareil supprimé avec succès',
  },
  deviceName: "Nom de l'appareil",
  deviceNameFinal: "Nom de l'appareil affiché dans l'appli Auth",
  enabled: 'Activé',
  error: {
    fetchDevice: "Erreur lors de la récupération des détails de l'appareil : {{message}}",
    createDevice: "Erreur lors de la création de l'appareil : {{message}}",
    updateDevice: "Erreur lors de la mise à jour de l'appareil : {{message}}",
    regenerateBackupCodes: 'Erreur lors de la régénération des codes de sauvegarde : {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Régénérer les codes de sauvegarde',
    confirm: `Êtes-vous sûr(e) de vouloir régénérer les codes de sauvegarde pour l'appareil "{{deviceName}}" ?  
Les codes de sauvegarde précédents ne fonctionneront plus.`,
  },
  showSecretKey: 'Afficher la clé secrète',
  validation: {
    label: 'Valider',
    successful: 'Appareil validé avec succès',
    error: "Codes d'authentification invalides",
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: "Installer l'application d'authentification",
      description:
        "Installez une application d'authentification sur votre appareil mobile (ex. Google Authenticator, Authy, etc.).",
    },
    scanCode: {
      title: 'Scanner le QR code',
      description: "Utilisez l'application d'authentification pour scanner le QR code affiché ci-dessous.",
      descriptionAlternative: "Vous pouvez également entrer la clé secrète dans l'application d'authentification.",
    },
    typeAuthenticatorCodes: {
      title: "Entrer les codes d'authentification",
      description:
        "Entrez deux codes consécutifs générés par l'application d'authentification pour valider l'appareil.",
    },
  },
}
