export default {
  body: {
    label: 'Corps',
    info: `Vous pouvez utiliser la syntaxe **Markdown** pour formater le corps du message (visitez https://www.markdownguide.org pour plus d'informations).  
Certaines variables de substitution sont également disponibles :
- \`{{userTitleAndName}}\` : remplacé par le titre et le nom de l'utilisateur (ex. "M. Jean")
- \`{{userName}}\` : remplacé par le nom de l'utilisateur (ex. "Jean")`,
  },
  dateSent: "Date d'envoi",
  dateValidUntil: 'Date de validité',
  deleteMessage: {
    confirmTitle: 'Êtes-vous sûr(e) de vouloir supprimer ce message ?',
  },
  messageDeleted: 'Message supprimé avec succès.',
  notificationType: {
    label: 'Type de notification',
    email: 'E-mail',
    push_notification: "Notification dans l'application",
  },
  preview: 'Aperçu',
  sendMessage: {
    label: 'Envoyer le message',
    confirmTitle: 'Êtes-vous sûr(e) de vouloir envoyer ce message ?',
  },
  status: {
    label: 'Statut',
    draft: 'Brouillon',
    sent: 'Envoyé',
  },
  subject: 'Objet',
  target: {
    emailsExcluded: {
      label: 'E-mails exclus',
      placeholder: 'Saisissez une adresse e-mail à exclure, puis appuyez sur le bouton Ajouter',
    },
    emailsIncluded: {
      label: 'E-mails inclus',
      placeholder: 'Saisissez une adresse e-mail à inclure, puis appuyez sur le bouton Ajouter',
    },
    userType: {
      label: "Type d'utilisateur cible",
      all: 'Tous les utilisateurs',
      system_admins: 'Administrateurs système',
      survey_managers: 'Gestionnaires de formulaire',
      data_analysts: 'Analystes de données',
      data_cleaners: 'Nettoyeurs de données',
      data_editors: 'Éditeurs de données',
      individual: 'Utilisateurs individuels',
    },
  },
}
