export default {
  loginView: {
    yourName: 'Vaše ime',
    yourEmail: 'Vaša e-adresa',
    yourPassword: 'Vaša lozinka',
    yourNewPassword: 'Vaša nova lozinka',
    repeatYourPassword: 'Ponovite lozinku',
    repeatYourNewPassword: 'Ponovite novu lozinku',
    requestAccess: 'Novi ste u $t(common.appNameFull)? Zatražite pristup',
    resetPassword: 'Resetuj lozinku',
    login: 'Prijavi se',
    loginUsingBackupCode: 'Prijavi se pomoću 2FA rezervnog koda',
    forgotPassword: 'Zaboravljena lozinka',
    sendPasswordResetEmail: 'Pošalji e-poruku za resetovanje lozinke',
    twoFactorBackupCode: '2FA rezervni kod',
    twoFactorToken: 'Verifikacioni kod',
    twoFactorTokenDescription: `Da bismo zaštitili vaš nalog, provjeravamo vaš identitet.

Unesite kod generisan u vašoj aplikaciji za autentifikaciju.`,
  },
  accessRequestView: {
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
    introduction: `Naši resursi su ograničeni, pa morate zatražiti pristup platformi.
Zanima nas i šta želite da radite s njom, pa vas molimo da nam to kažete!
Možete početi od **novog praznog istraživanja** ili klonirati postojeći **šablon**, a moraćete da predložite naziv za novokreirano istraživanje.
Biće vam dodijeljena uloga ***administratora istraživanja*** za to istraživanje: moći ćete da ga uređujete i da pozivate nove korisnike da se pridruže vašem istraživanju i doprinesu mu.
Bićete i ***menadžer istraživanja*** i moći ćete da **kreirate nova istraživanja** (do 5) ako bude potrebno.
Za više informacija posjetite naš veb-sajt: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Kada pošaljete zahtjev, sačekajte e-poruku sa pozivnicom za pristup Areni.**`,
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
    title: 'Zahtjev za pristup aplikaciji $t(common.appNameFull)',
    whitelistSenderSuggestion: `Ako je pronađete u fascikli Spam/Neželjena pošta, dodajte **{{senderEmail}}** u svoje kontakte (adresar) ili je označite kao bezbjednu/nije spam, kako bi naše buduće e-poruke stizale direktno u vaše prijemno sanduče.`,
  },
  resetPasswordView: {
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
}
