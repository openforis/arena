export default {
  body: {
    label: 'Nachrichtentext',
    info: `Sie können den Nachrichtentext mit **Markdown** formatieren (weitere Informationen unter https://www.markdownguide.org).  
Folgende Platzhaltervariablen sind verfügbar:
- \`{{userTitleAndName}}\`: wird durch Anrede und Namen des Benutzers ersetzt (z. B. "Herr John")
- \`{{userName}}\`: wird durch den Namen des Benutzers ersetzt (z. B. "John")`,
  },
  dateSent: 'Versanddatum',
  dateValidUntil: 'Gültig bis',
  deleteMessage: {
    confirmTitle: 'Möchten Sie diese Nachricht wirklich löschen?',
  },
  messageDeleted: 'Nachricht erfolgreich gelöscht.',
  notificationType: {
    label: 'Benachrichtigungsart',
    email: 'E-Mail',
    push_notification: 'In-App-Benachrichtigung',
  },
  preview: 'Vorschau',
  sendMessage: {
    label: 'Nachricht senden',
    confirmTitle: 'Möchten Sie diese Nachricht wirklich senden?',
  },
  status: {
    label: 'Status',
    draft: 'Entwurf',
    sent: 'Gesendet',
  },
  subject: 'Betreff',
  target: {
    emailsExcluded: {
      label: 'Ausgeschlossene E-Mail-Adressen',
      placeholder: 'Auszuschließende E-Mail-Adresse eingeben und anschließend auf Hinzufügen klicken',
    },
    emailsIncluded: {
      label: 'Einbezogene E-Mail-Adressen',
      placeholder: 'Einzubeziehende E-Mail-Adresse eingeben und anschließend auf Hinzufügen klicken',
    },
    userType: {
      label: 'Zielbenutzergruppe',
      all: 'Alle Benutzer',
      system_admins: 'Systemadministratoren',
      survey_admins: 'Erhebungsadministratoren',
      survey_managers: 'Erhebungsmanager',
      data_analysts: 'Datenanalysten',
      data_cleaners: 'Datenbereiniger',
      data_editors: 'Datenerfasser',
      individual: 'Einzelne Benutzer',
    },
  },
}
