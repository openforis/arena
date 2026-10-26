export default {
  authGroups: {
    systemAdmin: {
      label: 'Administrateur système',
      label_other: 'Administrateurs système',
      description: 'Administrateurs système OF Arena',
    },
    surveyManager: {
      label: 'Gestionnaire de formulaire',
      label_other: 'Gestionnaires de formulaire',
      description: 'Gestionnaires de formulaire OF Arena',
    },
    surveyAdmin: {
      label: 'Administrateur de formulaire',
      label_other: 'Administrateurs de formulaire',
      description: 'Droits complets',
    },
    surveyEditor: {
      label: 'Éditeur de formulaire',
      label_other: 'Éditeurs de formulaire',
      description: 'Peut modifier le formulaire, les enregistrements, inviter des utilisateurs',
    },
    dataEditor: {
      label: 'Éditeur de données',
      label_other: 'Éditeurs de données',
      description: "Peut modifier les enregistrements à l'étape de saisie de données",
    },
    dataCleanser: {
      label: 'Nettoyeur de données',
      label_other: 'Nettoyeurs de données',
      description: "Peut modifier les enregistrements à l'étape de nettoyage des données",
    },
    dataAnalyst: {
      label: 'Analyste de données',
      label_other: 'Analystes de données',
      description: "Peut modifier les enregistrements à l'étape d'analyse des données",
    },
    surveyGuest: {
      label: 'Invité du formulaire',
      label_other: 'Invités du formulaire',
      description: 'Peut consulter les enregistrements',
    },
  },
}
