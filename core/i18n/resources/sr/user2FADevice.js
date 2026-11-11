export default {
  authenticatorCodeOne: 'Kod autentifikatora 1',
  authenticatorCodeTwo: 'Kod autentifikatora 2',
  authenticatorCodeTwoInfo: 'Sačekajte 30 sekundi i unesite drugi kod',
  backupCodesRegenerated: {
    title: 'Rezervni kodovi su uspješno ponovo generisani',
    message: `Molimo sačuvajte sljedećih 8 rezervnih kodova na sigurnom mjestu:
{{backupCodes}}

Koristite ih za pristup nalogu ako izgubite pristup uređaju sa autentifikatorom.
**Svaki rezervni kod može se iskoristiti samo jednom**.
Mogu se vidjeti samo sada, zato ih obavezno **sačuvajte sada**.`,
  },
  create: {
    label: 'Kreiraj',
  },
  creationSuccessful: {
    title: '2FA uređaj je uspješno kreiran',
    message: `2FA uređaj "{{deviceName}}" je kreiran.
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Da li ste sigurni da želite da obrišete uređaj "{{deviceName}}"?',
    error: 'Greška pri brisanju uređaja: {{message}}',
    successful: 'Uređaj je uspješno obrisan',
  },
  deviceName: 'Naziv uređaja',
  deviceNameFinal: 'Naziv uređaja prikazan u aplikaciji za autentifikaciju',
  enabled: 'Omogućeno',
  error: {
    fetchDevice: 'Greška pri preuzimanju detalja uređaja: {{message}}',
    createDevice: 'Greška pri kreiranju uređaja: {{message}}',
    updateDevice: 'Greška pri ažuriranju uređaja: {{message}}',
    regenerateBackupCodes: 'Greška pri ponovnom generisanju rezervnih kodova: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Ponovo generiši rezervne kodove',
    confirm: `Da li ste sigurni da želite ponovo da generišete rezervne kodove za uređaj "{{deviceName}}"?
Prethodni rezervni kodovi više neće raditi.`,
  },
  showSecretKey: 'Prikaži tajni ključ',
  validation: {
    label: 'Validiraj',
    successful: 'Uređaj je uspješno validiran',
    error: 'Neispravni kodovi autentifikatora',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Instalirajte aplikaciju za autentifikaciju',
      description:
        'Instalirajte aplikaciju za autentifikaciju na mobilni uređaj (npr. Google Authenticator, Authy itd.).',
    },
    scanCode: {
      title: 'Skenirajte QR kod',
      description: 'Pomoću aplikacije za autentifikaciju skenirajte QR kod prikazan ispod.',
      descriptionAlternative: 'Alternativno, možete unijeti tajni ključ u aplikaciju za autentifikaciju.',
    },
    typeAuthenticatorCodes: {
      title: 'Unesite kodove autentifikatora',
      description:
        'Unesite dva uzastopna koda koja je generisala aplikacija za autentifikaciju da biste validirali uređaj.',
    },
  },
}
