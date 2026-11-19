export default {
  authGroups: {
    systemAdmin: {
      label: 'Systemadministrator',
      label_other: 'Systemadministratoren',
      description: 'Systemadministratoren von OF Arena',
    },
    surveyManager: {
      label: 'Erhebungsmanager',
      label_other: 'Erhebungsmanager',
      description: 'Erhebungsmanager von OF Arena',
    },
    surveyAdmin: {
      label: 'Erhebungsadministrator',
      label_other: 'Erhebungsadministratoren',
      description: 'Vollzugriff',
    },
    surveyEditor: {
      label: 'Erhebungsbearbeiter',
      label_other: 'Erhebungsbearbeiter',
      description: 'Kann Erhebungen und Datensätze bearbeiten sowie Benutzer einladen',
    },
    dataEditor: {
      label: 'Datenerfasser',
      label_other: 'Datenerfasser',
      description: 'Kann Datensätze im Datenerfassungsschritt bearbeiten',
    },
    dataCleanser: {
      label: 'Datenbereiniger',
      label_other: 'Datenbereiniger',
      description: 'Kann Datensätze im Datenbereinigungsschritt bearbeiten',
    },
    dataAnalyst: {
      label: 'Datenanalyst',
      label_other: 'Datenanalysten',
      description: 'Kann Datensätze im Datenanalyseschritt bearbeiten',
    },
    surveyGuest: {
      label: 'Gast',
      label_other: 'Gäste',
      description: 'Kann Datensätze anzeigen',
    },
  },
}
