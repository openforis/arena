export default {
  authGroups: {
    systemAdmin: {
      label: 'Sistemski administrator',
      label_other: 'Sistemski administratori',
      description: 'Sistemski administratori OF Arena',
    },
    surveyManager: {
      label: 'Menadžer istraživanja',
      label_other: 'Menadžeri istraživanja',
      description: 'Menadžeri istraživanja OF Arena',
    },
    surveyAdmin: {
      label: 'Administrator istraživanja',
      label_other: 'Administratori istraživanja',
      description: 'Puna prava',
    },
    surveyEditor: {
      label: 'Urednik istraživanja',
      label_other: 'Urednici istraživanja',
      description: 'Može da uređuje istraživanje i zapise i da poziva korisnike',
    },
    dataEditor: {
      label: 'Unosilac podataka',
      label_other: 'Unosioci podataka',
      description: 'Može da uređuje zapise u koraku unosa podataka',
    },
    dataCleanser: {
      label: 'Čistač podataka',
      label_other: 'Čistači podataka',
      description: 'Može da uređuje zapise u koraku čišćenja podataka',
    },
    dataAnalyst: {
      label: 'Analitičar podataka',
      label_other: 'Analitičari podataka',
      description: 'Može da uređuje zapise u koraku analize podataka',
    },
    surveyGuest: {
      label: 'Gost istraživanja',
      label_other: 'Gosti istraživanja',
      description: 'Može da pregleda zapise',
    },
  },
}
