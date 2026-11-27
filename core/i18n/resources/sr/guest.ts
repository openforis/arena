export default {
  loginView: {
    title: 'Prijava',
    subtitle: 'Dobrodošli! Unesite svoje podatke za nastavak u aplikaciji $t(common.appNameFull).',
    backToLogin: 'Nazad na prijavu',
    noAccountYet: 'Još nemate nalog?',
    createAccount: 'Napravite nalog',
    invitedToSurvey:
      'Pozvani ste u istraživanje? Ne morate da pravite nalog: otvorite link iz imejla sa pozivnicom i pratite korake.',
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
  externalLogin: {
    signInWith: 'Prijavite se putem {{provider}}',
    continueWith: 'Nastavite putem {{provider}}',
    registeredUsersOnly: 'Samo za registrovane korisnike',
    errors: {
      providerNotAvailable: 'Ova opcija prijave nije dostupna. Pokušajte kasnije ili se prijavite e-poštom i lozinkom.',
      flowInvalid: 'Prijava je istekla ili je započeta u drugom pregledaču. Pokušajte ponovo.',
      providerError: 'Prijava putem spoljnog provajdera nije uspela. Pokušajte ponovo.',
      emailNotVerified:
        'Provajder nije potvrdio vašu adresu e-pošte, pa se ne može povezati sa nalogom. Prijavite se lozinkom i povežite provajdera iz svog profila.',
      emailDomainNotAllowed: 'Nalozi sa ovim domenom e-pošte ne mogu da koriste ovu opciju prijave.',
      userNotFound:
        'Ne postoji nalog sa ovom adresom e-pošte. Zatražite pozivnicu od administratora istraživanja ili zatražite pristup.',
      userNotFoundCreateAccount:
        'Ne postoji nalog sa ovom imejl adresom. Prvo napravite nalog ili zatražite pozivnicu od administratora istraživanja.',
      ambiguousEmail:
        'Ovoj adresi e-pošte odgovara više naloga. Prijavite se lozinkom i povežite provajdera iz svog profila.',
      identityAlreadyLinked: 'Ovaj nalog provajdera je već povezan sa drugim korisnikom.',
      providerAlreadyLinked:
        'Drugi nalog ovog provajdera je već povezan sa vašim korisnikom: prvo ga uklonite iz svog profila.',
      invitationInvalid: 'Pozivnica nije važeća ili je istekla. Zatražite novu od administratora istraživanja.',
      invalidTwoFactorCode: 'Neispravan verifikacioni kod.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'Šta se dešava dalje?',
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
          'Dobićete e-poruku od **{{senderEmail}}** sa linkom za pristup aplikaciji $t(common.appName). Nije u prijemnom sandučetu? Provjerite folder Spam/Neželjena pošta, a zatim dodajte pošiljaoca u kontakte ili označite poruku kao da nije neželjena.',
        descriptionWithoutSender:
          'Dobićete e-poruku sa linkom za pristup aplikaciji $t(common.appName). Nije u prijemnom sandučetu? Provjerite folder Spam/Neželjena pošta, a zatim dodajte pošiljaoca u kontakte ili označite poruku kao da nije neželjena.',
      },
      startWorking: {
        title: 'Počnite sa radom',
        description: 'Bićete administrator novog istraživanja i moći ćete da kreirate do 5 istraživanja.',
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
    surveyNameHint:
      'Ime identifikuje istraživanje na celoj platformi $t(common.appName) i mora biti **jedinstveno**: izaberite konkretno ime, npr. kombinacijom vaše organizacije ili zemlje, projekta i godine, a ne opšte kao što su „survey” ili „test”. Samo mala slova, brojevi i donje crte.',
    sendRequest: 'Pošalji zahtjev',
    sendRequestConfirm: 'Zatražiti pristup aplikaciji $t(common.appNameFull)?',
    templateNotSelected: 'Nije izabrano (počni od početka)',
    title: 'Zatražite pristup',
    whitelistSenderSuggestion: `Ako je pronađete u fascikli Spam/Neželjena pošta, dodajte **{{senderEmail}}** u svoje kontakte (adresar) ili je označite kao bezbjednu/nije spam, kako bi naše buduće e-poruke stizale direktno u vaše prijemno sanduče.`,
  },
  registrationView: {
    title: 'Napravite nalog',
    introduction:
      'Napravite svoj nalog i svoje prvo istraživanje: recite nam šta želite da radite sa $t(common.appName)!',
    createAccount: 'Napravi nalog',
    createAccountConfirm: 'Napraviti vaš nalog u $t(common.appNameFull)?',
    accountCreated: 'Nalog je napravljen',
    accountCreatedMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Otvorite link iz imejla da potvrdite svoju imejl adresu i završite registraciju: izaberite lozinku ili se prijavite jednom od dostupnih opcija za prijavu (npr. Google).

Hvala i uživajte u **$t(common.appNameFull)**!`,
    error: 'Greška pri pravljenju naloga: {{error}}',
    steps: {
      createAccount: {
        title: 'Napravite nalog',
        description: '$t(guest:accessRequestView.steps.sendRequest.description)',
      },
      confirmEmail: {
        title: 'Potvrdite imejl',
        description:
          'Dobićete imejl od **{{senderEmail}}** sa linkom za završetak registracije. Nije u prijemnom sandučetu? Proverite fasciklu Spam/Junk, a zatim dodajte pošiljaoca u kontakte ili označite imejl kao da nije spam.',
        descriptionWithoutSender:
          'Dobićete imejl sa linkom za završetak registracije. Nije u prijemnom sandučetu? Proverite fasciklu Spam/Junk, a zatim dodajte pošiljaoca u kontakte ili označite imejl kao da nije spam.',
      },
      startWorking: {
        title: '$t(guest:accessRequestView.steps.startWorking.title)',
        description: '$t(guest:accessRequestView.steps.startWorking.description)',
      },
    },
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
    },
    tags: {
      forestInventories: 'Inventure šuma',
      questionnaires: 'Upitnici',
      multiCycle: 'Više ciklusa',
      statisticalAnalysis: 'Statistička analiza',
    },
  },
  footer: {
    website: 'O aplikaciji $t(common.appName)',
    userManual: 'Korisničko uputstvo',
    supportForum: 'Forum podrške',
    version: 'Verzija {{version}}',
  },
}
