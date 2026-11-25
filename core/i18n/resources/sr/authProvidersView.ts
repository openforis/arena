export default {
  title: 'Provajderi za prijavu',
  subtitle:
    'Spoljne opcije prijave prikazane na stranici za prijavu, ovim redoslijedom. Korisnici se mogu prijaviti i e-mail adresom i lozinkom.',
  addProvider: 'Dodaj provajdera',
  continue: 'Nastavi',
  encryptionKeyMissing:
    'Ključ za šifrovanje tajni klijenata nije konfigurisan: postavite AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 heksadecimalna znaka) na serveru i ponovo pokrenite Arenu da biste dodali provajdere.',
  empty: {
    title: 'Još nema provajdera za prijavu',
    description:
      'Omogućite korisnicima da se prijave putem Google, Microsoft ili jedinstvene prijave (SSO) vaše organizacije, pored e-mail adrese i lozinke.',
  },
  columns: {
    provider: 'Provajder',
    type: 'Tip',
    status: 'Status',
    loginPage: 'Stranica za prijavu',
    linkedUsers: 'Povezani korisnici',
    actions: 'Radnje',
  },
  passwordAlwaysAvailable:
    'Prijava e-mail adresom i lozinkom je uvijek dostupna. Izmjene stižu do svake instance servera u roku od jednog minuta.',
  status: {
    enabled: 'Omogućen',
    disabled: 'Onemogućen',
  },
  source: {
    env: 'konfiguracija servera',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Prikazan',
    directLinkOnly: 'Samo direktan link',
  },
  moveUp: 'Pomjeri gore',
  moveDown: 'Pomjeri dolje',
  enable: 'Omogući',
  disable: 'Onemogući',
  deleteConfirm:
    'Obrisati provajdera za prijavu "{{provider}}"? Veze njegovih {{linkedUsersCount}} korisnika biće uklonjene (da biste zaustavili prijave, a zadržali veze, onemogućite ga).\n\nKorisnici koji ostaju bez ijednog načina prijave (dobiće e-poruku sa objašnjenjem kako da postave lozinku): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Izaberite vrstu provajdera. Oznaku i ikonu možete promijeniti kasnije.',
    typeDescription: {
      google: 'Google nalozi, uključujući Gmail i Google Workspace.',
      microsoft: 'Poslovni, školski ili lični Microsoft nalozi (Entra ID).',
      oidc: 'Bilo koji drugi provajder: Keycloak, Okta, Auth0, SSO vaše organizacije...',
    },
    notSupportedYet: 'Facebook, GitHub i Apple još nisu podržani.',
  },
  form: {
    errors: 'Nije moguće sačuvati provajdera: {{errors}}',
    newTitle: 'Novi {{type}} provajder',
    general: 'Opšte',
    label: 'Oznaka dugmeta',
    id: 'Identifikator',
    idInfo:
      'Koristi se u URL adresama i za povezivanje korisničkih naloga: mala slova, cifre i crtice. Ne može se promijeniti nakon kreiranja.',
    icon: 'Ikona',
    useUploadedIcon: 'Koristi otpremljenu ikonu',
    iconInvalid: 'Nevažeća ikona: koristite PNG ili SVG fajl do 100 KB.',
    enabled: 'Omogućen',
    enabledInfo:
      'Kada je onemogućen, dugme je skriveno i prijave putem ovog provajdera se odbijaju. Povezani nalozi se zadržavaju.',
    showOnLoginPage: 'Prikaži na stranici za prijavu',
    showOnLoginPageInfo:
      'Kada je isključeno, provajder nema dugme na stranici za prijavu: korisnici se njime prijavljuju putem direktnog linka {{path}}',
    connection: 'Veza',
    issuer: 'URL izdavaoca',
    issuerInfo: 'Arena čita ostale krajnje tačke sa <issuer>/.well-known/openid-configuration.',
    tenant: 'Zakupac (tenant)',
    tenantInfo:
      'ID zakupca vaše organizacije, ili "organizations" (bilo koji poslovni ili školski nalog), "consumers" (lični nalozi) ili "common" (bilo koji Microsoft nalog).',
    clientId: 'ID klijenta',
    clientSecret: 'Tajna klijenta',
    clientSecretInfo: 'Čuva se šifrovana i više se nikada ne prikazuje: ostavite prazno da zadržite trenutnu.',
    clientSecretSet: '(postavljena)',
    scopes: 'Opsezi',
    scopesInfo: 'Odvojeni razmacima; "openid" je obavezan.',
    access: 'Pristup',
    accessDescription: 'Mogu se prijaviti samo korisnici koji već imaju Arena nalog ili pozivnicu.',
    allowedEmailDomains: 'Dozvoljeni e-mail domeni',
    allowedEmailDomainsInfo:
      'Korisnici se mogu prijaviti samo e-mail adresom sa ovih domena (npr. domena vaše organizacije).',
    emailDomainsMode: { all: 'Dozvoli sve e-mail domene', specific: 'Dozvoli samo određene domene' },
    emailDomainsPlaceholder: 'Unesite domen, npr. example.org',
    emailDomainsRequired: 'Dodajte bar jedan e-mail domen ili dozvolite sve e-mail domene',
    requireArena2FA: 'Zahtijevaj Arena dvofaktorsku autentifikaciju',
    requireArena2FAInfo:
      'Korisnici koji su omogućili Arena 2FA i dalje moraju unijeti svoj kod. Isključite samo ako ovaj provajder primjenjuje sopstvenu višefaktorsku autentifikaciju.',
    trustEmail: 'Vjeruj e-mail adresama ovog provajdera',
    trustEmailInfo:
      'Poveži naloge po e-mail adresi čak i kada provajder ne potvrđuje da je e-mail adresa verifikovana. Uključite samo za provajdere koji sami verifikuju e-mail adrese.',
    redirectUri: 'URI za preusmjeravanje',
    redirectUriCopied: 'URI za preusmjeravanje je kopiran',
    setupStepsTitle: 'Kako podesiti provajdera',
    setupGuide: {
      google: 'Detaljno uputstvo: Google',
      microsoft: 'Detaljno uputstvo: Microsoft',
      oidc: 'Detaljno uputstvo: Keycloak i drugi provajderi',
    },
    setupSteps: {
      google: [
        'U Google Cloud konzoli otvorite Google Auth Platform (ili APIs & Services) > Clients i kreirajte OAuth klijenta tipa "Web application".',
        'Dodajte gornji URI za preusmjeravanje u "Authorized redirect URIs" klijenta.',
        'Kopirajte ID klijenta i tajnu klijenta koje je kreirao Google u polja ID klijenta i Tajna klijenta u odjeljku Veza (lijevo), zatim kliknite Sačuvaj.',
      ],
      microsoft: [
        'U Microsoft Entra centru za administraciju otvorite App registrations > New registration.',
        'Dodajte gornji URI za preusmjeravanje kao "Web" URI za preusmjeravanje aplikacije.',
        'U Certificates & secrets kreirajte novu tajnu klijenta.',
        'Kopirajte Application (client) ID i vrijednost tajne u polja ID klijenta i Tajna klijenta u odjeljku Veza (lijevo), zatim kliknite Sačuvaj.',
      ],
      oidc: [
        'Kod provajdera (npr. Keycloak, Okta) registrujte Arenu kao povjerljivu veb aplikaciju (OpenID Connect, tok sa autorizacionim kodom).',
        'Dodajte gornji URI za preusmjeravanje u dozvoljene URI adrese za preusmjeravanje aplikacije i dozvolite opsege openid, email i profile.',
        'Kopirajte URL izdavaoca, ID klijenta i tajnu klijenta aplikacije u polja URL izdavaoca, ID klijenta i Tajna klijenta u odjeljku Veza (lijevo), zatim kliknite Sačuvaj.',
      ],
    },
    loginPagePreview: 'Pregled stranice za prijavu',
    readOnlyEnv:
      'Ovaj provajder je definisan u konfiguraciji servera (AUTH_PROVIDERS_CONFIG): izmijenite ga tamo i ponovo pokrenite Arenu.',
    testConnection: 'Testiraj vezu',
    testSignIn: 'Testiraj prijavu',
    testConnectionOk: 'Veza je u redu: učitano {{keysCount}} ključeva za potpisivanje za {{durationMs}} ms.',
    testConnectionFailed: 'Veza nije uspjela: {{error}}',
  },
  testResult: {
    title: 'Rezultat testa prijave',
    success: 'Prijava je uspjela: ID token je validiran. Niko nije prijavljen i ništa nije izmijenjeno.',
    issuer: 'Izdavalac',
    subject: 'Subjekt (sub)',
    email: 'E-mail',
    verified: '(verifikovan)',
    notVerified: '(nije verifikovan)',
    name: 'Ime',
    matchingUser: 'Odgovarajući Arena korisnik',
    outcome: 'Pri prijavi',
    alreadyLinked: 'Već povezan: korisnik bi bio prijavljen.',
    wouldLink: 'Nalog bi bio povezan sa korisnikom po e-mail adresi.',
  },
}
