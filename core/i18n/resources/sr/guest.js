export default {
  loginView: {
    title: 'Prijava',
    subtitle: 'Dobrodošli! Unesite svoje podatke za nastavak u aplikaciji $t(common.appNameFull).',
    backToLogin: 'Nazad na prijavu',
    newToArena: 'Novi ste u $t(common.appNameFull)?',
    or: 'ili',
    twoFactorTitle: 'Verifikacija u dva koraka',
    verify: 'Potvrdi',
    lostYourDevice: 'Ne možete koristiti aplikaciju za autentifikaciju?',
    yourName: 'Vaše ime',
    yourEmail: 'Vaša e-adresa',
    yourPassword: 'Vaša lozinka',
    yourNewPassword: 'Vaša nova lozinka',
    repeatYourPassword: 'Ponovite lozinku',
    repeatYourNewPassword: 'Ponovite novu lozinku',
    requestAccess: 'Zatražite pristup',
    resetPassword: 'Resetuj lozinku',
    login: 'Prijavi se',
    loginUsingBackupCode: 'Koristi rezervni kod',
    forgotPassword: 'Zaboravljena lozinka?',
    sendPasswordResetEmail: 'Pošalji e-poruku za resetovanje lozinke',
    twoFactorBackupCode: '2FA rezervni kod',
    twoFactorToken: 'Verifikacioni kod',
    twoFactorTokenDescription: `Da bismo zaštitili vaš nalog, provjeravamo vaš identitet.

Unesite kod generisan u vašoj aplikaciji za autentifikaciju.`,
  },
  accessRequestView: {
    alreadyHaveAnAccount: 'Već imate nalog?',
    steps: {
      sendRequest: {
        title: 'Pošaljite zahtjev',
        description: 'Predložite naziv svog prvog istraživanja: počnite od praznog istraživanja ili od šablona.',
      },
      review: {
        title: 'Mi ga pregledamo',
        description: 'Molimo vas da nam date nekoliko dana da obradimo vaš zahtjev.',
      },
      invitation: {
        title: 'Primite pozivnicu',
        description:
          'Dobićete e-poruku za pristup aplikaciji $t(common.appName): bićete administrator novog istraživanja i moći ćete da kreirate do 5 istraživanja.',
      },
    },
    error: 'Greška pri zahtjevu za pristup: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Ime',
        lastName: 'Prezime',
        institution: 'Institucija',
        country: 'Država',
        purpose: 'Za šta vam je potrebno?',
        surveyName: 'Predložite naziv istraživanja',
        templateUuid: 'Početi od šablona?',
      },
    },
    introduction:
      'Naši resursi su ograničeni, pa se pristup odobrava na zahtjev. Recite nam šta želite da radite u aplikaciji $t(common.appName)!',
    reCaptchaNotAnswered: 'ReCaptcha nije riješena',
    requestSent: 'Zahtjev za pristup je uspješno poslat',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Molimo vas da nam date nekoliko dana da obradimo vaš zahtjev.
Kada bude prihvaćen, poslaćemo vam još jednu e-poruku na **{{email}}** sa uputstvima kako da pristupite aplikaciji $t(common.appName).
Hvala vam i uživajte u **$t(common.appNameFull)**!`,
    sendRequest: 'Pošalji zahtjev',
    sendRequestConfirm: 'Zatražiti pristup aplikaciji $t(common.appNameFull)?',
    templateNotSelected: 'Nije izabrano (počni od početka)',
    title: 'Zatražite pristup',
    whitelistSenderSuggestion: `Ako je pronađete u fascikli Spam/Neželjena pošta, dodajte **{{senderEmail}}** u svoje kontakte (adresar) ili je označite kao bezbjednu/nije spam, kako bi naše buduće e-poruke stizale direktno u vaše prijemno sanduče.`,
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Podesite svoj nalog da biste započeli.',
      setYourNewPassword: 'Izaberite novu lozinku za svoj nalog.',
    },
    title: {
      completeRegistration: 'Završite registraciju u Areni',
      setYourNewPassword: 'Postavite novu lozinku',
    },
    setNewPassword: 'Postavi novu lozinku',
    forgotPasswordLinkInvalid: 'Stranica kojoj ste pokušali da pristupite ne postoji ili više nije važeća',
    passwordSuccessfullyReset: 'Vaša lozinka je uspješno resetovana',
    passwordStrengthChecksTitle: 'Provjere jačine lozinke',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Bez razmaka',
      atLeast8CharactersLong: 'Najmanje 8 znakova',
      containsLowerCaseLetters: 'Sadrži mala slova',
      containsUpperCaseLetters: 'Sadrži velika slova',
      containsNumbers: 'Sadrži brojeve',
    },
    completeRegistration: 'Završi registraciju',
  },
  forgotPasswordView: {
    title: 'Resetujte lozinku',
    description: 'Unesite adresu e-pošte svog naloga i poslaćemo vam link za izbor nove lozinke.',
  },
  pitch: {
    default: {
      title: 'Terenski podaci, od prikupljanja do analize.',
      description:
        'Kreirajte višejezične obrasce, upravljajte višeciklusnim inventurama, provjerite kvalitet podataka i analizirajte rezultate pomoću integrisanog RStudija.',
    },
    accessRequest: {
      title: 'Započnite svoje prvo istraživanje u aplikaciji $t(common.appName).',
      description:
        'Recite nam nešto o svom projektu. Nakon odobrenja moći ćete da kreirate obrasce, pozovete terenske timove i analizirate podatke na jednom mjestu.',
    },
    tags: {
      forestInventories: 'Inventure šuma',
      questionnaires: 'Upitnici',
      multiCycle: 'Više ciklusa',
      statisticalAnalysis: 'Statistička analiza',
      freeAndOpenSource: 'Besplatan i otvorenog koda',
      openForis: 'FAO · Open Foris',
      upToFiveSurveys: 'Do 5 istraživanja',
    },
  },
  footer: {
    website: 'O aplikaciji $t(common.appName)',
    userManual: 'Korisničko uputstvo',
    supportForum: 'Forum podrške',
    version: 'Verzija {{version}}',
  },
}
