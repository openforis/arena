export default {
  title: `Šta je novo u aplikaciji Arena`,
  since: 'Od verzije {{version}}',
  experimental: 'Eksperimentalno',
  dontShowAgain: `Ne prikazuj ponovo`,
  showChangelog: `Sve izmene i ispravke (dnevnik izmena)`,
  slideCounter: '{{current}} od {{total}}',
  noItems: 'Nema novih funkcija za prikaz.',
  items: {
    appInfoAndNodeDateFunctions: {
      title: 'Nove funkcije izraza: podaci o aplikaciji i datumi čvorova',
      description: `Nove funkcije za podrazumevane vrednosti, pravila relevantnosti i validacije:

- **appId()**, **appIdLabel()**, **appPlatform()**, **appVersion()**: aplikacija u kojoj se zapis menja (\`arena\` / \`am\`, **Arena** / **Arena Mobile**), njena platforma (\`web\`, \`android\` ili \`ios\`) i verzija. Izračunavaju se pri kreiranju zapisa i ponovo kada se zapis menja u drugoj aplikaciji, na drugoj platformi ili u drugoj verziji aplikacije: npr. atribut **Samo za čitanje** sa podrazumevanom vrednošću \`appIdLabel()\` i opcijom **Podrazumijevana vrijednost se izračunava samo jednom** čuva aplikaciju u kojoj je zapis kreiran.
- **nodeDateCreated(node)**, **nodeDateModified(node)**: datum i vreme kreiranja i poslednje izmene atributa ili entiteta; za entitet, poslednji put kada se promenila neka od njegovih vrednosti, npr. \`nodeDateModified(parent(this))\`.

U osnovnom uređivaču izraza izaberite ih sa liste **Funkcija**: alat za funkcije datuma čvorova prikazuje atribute dostupne iz trenutnog čvora i nadređene entitete.`,
    },
    googleSignIn: {
      title: 'Prijava pomoću Google naloga',
      description: `Na stranici za prijavu kliknite na **Prijavite se putem Google** da biste se prijavili pomoću svog Google naloga (Gmail ili Google Workspace) umesto unosa lozinke.

Prvi put se Google nalog povezuje sa vašim Arena nalogom preko adrese e-pošte: koristite istu adresu e-pošte kao za Arena nalog. Pozvani korisnici takođe mogu da prihvate poziv pomoću Google naloga. Povežite ili prekinite vezu sa Google nalogom u **Moj profil > Načini prijave**; prijava e-poštom i lozinkom je i dalje dostupna.`,
    },
    twoFactorAuth: {
      title: 'Dvofaktorska autentifikacija',
      description: `Zaštitite svoj nalog **dvofaktorskom autentifikacijom (2FA)**: posle lozinke Arena traži verifikacioni kod koji generiše aplikacija za autentifikaciju na vašem telefonu (npr. Google Authenticator ili Authy).

U **Moj profil > Sign-in & security** kliknite na **Upravljaj 2FA**, dodajte uređaj i skenirajte QR kod aplikacijom. Sačuvajte rezervne kodove prikazane na kraju: svaki od njih vam omogućava da se jednom prijavite ako izgubite telefon.`,
    },
    aiFeatures: {
      title: 'AI funkcije',
      description: `U **Moj profil > AI funkcije**, u odeljku **Šta AI može da vidi**, izaberite:

- **Samo pomoć**: vaša pitanja i odlomci iz korisničkog priručnika za Arenu;
- **+ Dizajn istraživanja**: i entiteti, atributi, oznake, kategorije i izrazi (bez vrednosti zapisa);
- **+ Podaci zapisa**: i vrednosti zapisa i rezultati upita.

Pomoću **Prilagodi** uključujete ili isključujete pojedinačne funkcije. U **Provajderi** koristite **Podrazumijevani provajder Arene** ili dodajte svoj: **Lokalni server** na vašem računaru ili u vašoj mreži (npr. LM Studio ili Ollama) ili provajdera u oblaku sa vašim API ključem (OpenAI, Anthropic, Google Gemini i drugi).`,
    },
    aiAssistant: {
      title: 'AI asistent',
      description: `Kliknite na dugme **AI asistent** u zaglavlju da biste otvorili panel koji radi na ekranu koji koristite:

- **Dizajn**: pravi i menja istraživanje u dizajneru obrasca;
- **Analiza**: odgovara na pitanja o podacima pomoću upita;
- **Čišćenje**: traži greške u zapisima i predlaže ispravke;
- **Pomoć**: odgovara na pitanja o Areni.

Izmene koje predloži primenjuju se tek kada ih pregledate. **Prijedlozi** (npr. oznake koje nedostaju na nekom jeziku) pojavljuju se u panelu: kliknite na jedan da bi ga asistent izvršio.`,
    },
    surveyAiPolicy: {
      title: 'AI politika istraživanja',
      description: `U **Informacije o istraživanju > AI politika** administratori istraživanja biraju gde AI sme da obrađuje sadržaj istraživanja, posebno za **Dizajn istraživanja** i za **Podaci zapisa**: **Isključeno**, **Na ovom uređaju** (lokalni AI server), **Server organizacije** ili **Oblak**.

Na sve korisnike istraživanja primenjuje se strožije od ove politike i ograničenja Arena servera.`,
    },
    mobileUploadEmailNotification: {
      title: 'Obaveštenje e-poštom o zapisima otpremljenim iz Arena Mobile',
      description: `U **Informacije o istraživanju → Bezbjednost** označite **Obavesti administratore ankete e-poštom kada se zapisi otpreme iz Arena Mobile**: posle svakog otpremanja, svaki administrator ankete dobija e-poruku sa spiskom otpremljenih zapisa, njihovim ključnim vrednostima, informacijom da li su novi ili ažurirani, korisnikom koji ih je kreirao, datumima i brojem grešaka i upozorenja validacije.

Šalje se jedna poruka po otpremanju, čak i kada uređaj otpremi mnogo zapisa. Opcija je dostupna kada je označeno **Dozvoli otpremanje zapisa iz Arena Mobile na server** i primenjuje se kada se istraživanje objavi.`,
    },
    surveyGuestRole: {
      title: 'Nova uloga: Gost, za pregled zapisa bez izmena',
      description: `Pozovite korisnike sa novom ulogom **Gost** (**Korisnici > Pozovi korisnika**): mogu da pregledaju sve zapise istraživanja, i u **Arena Mobile**, ali ne mogu da ih menjaju ili brišu, niti da dodaju nove.

Dodajte gosta u **korisničku grupu** (**Korisnici > Korisničke grupe**) sa kvalifikatorima da biste prikazali samo deo podataka: zapise čiji se atributi kvalifikatori poklapaju sa vrednostima grupe (npr. parcele jednog regiona). Grupe sa podešavanjem **Može da pregleda zapise grupa** daju pristup i zapisima drugih grupa.

Postojeća istraživanja automatski dobijaju novu ulogu.`,
    },
    areaOfInterest: {
      title: 'Područja od interesa: provera da li je lokacija unutar područja',
      description: `U **Informacije o istraživanju → Mapa** dodajte jedno ili više **područja od interesa** (npr. opštine pilot područja), svako sa nazivom i poligonom u GeoJSON formatu. Proverite ih na mapi prilikom dodavanja, jedno po jedno ili sva zajedno (**Prikaži sve na mapi**), i prikažite ih kao slojeve u **Podaci > Mapa**.

Nova funkcija izraza \`geoDistanceToAOIBoundary(location, 'area_name')\` vraća udaljenost u metrima između lokacije i granice područja: negativnu unutar, pozitivnu van njega. Uporedite je sa GPS preciznošću (\`location.accuracy\`) da biste lokacije klasifikovali kao unutar, van ili neizvesne, npr. u podrazumevanim vrednostima atributa samo za čitanje i u pravilima validacije sa nivoom *upozorenje*. \`geoAOIContaining(location)\` vraća naziv područja koje sadrži lokaciju. Obe rade i oflajn u **Arena Mobile**.

Hvala **[ASSEDEV Alerte Environnement](https://assedev.fr)** na zahtevu.`,
    },
    dataQueryTotals: {
      title: 'Ukupne vrednosti i procenti u Istraživaču podataka',
      description: `U **Podaci > Istraživač podataka**, u režimu **Agregirano** sa jednom merom (npr. zbir zapremine stabala po vrsti), otvorite meni **Prikaz** i izaberite **Prikaži ukupno i procenat**: svaki red prikazuje svoj procenat od ukupne vrednosti, a na dnu tabele se dodaje red **Ukupno**.

Opcije **Prikaži nazive** i **Prikaži šifre** se takođe nalaze u meniju **Prikaz**.`,
    },
    mapWorkspace: {
      title: `Novi radni prostor mape`,
      description: `**Podaci > Mapa** ima novi raspored: na vrhu menije **Osnovna mapa**, **Dodaj podatke**, **Prikaz** i **Alati** i polje za pretragu koordinata i ključeva zapisa, sa strane kartice **Slojevi**, **Zapisi** i **Legenda**, a na dnu statusnu traku sa koordinatama pokazivača i razmerom.

Pregledajte zapise na mapi jedan za drugim, dodajte sopstvene datoteke (KML, Shapefile, GeoJSON) ili WMS / WMTS servise, merite rastojanja i površine i pravite snimke ekrana.`,
    },
    dataMatrixExport: {
      title: `Izvoz podataka u obliku matrice`,
      description: `U **Podaci > Istraživač podataka** izaberite višestruki entitet (npr. vrste svakog zapisa), kliknite na **Izvezi** i izaberite **Izvezi kao: Matrica podataka** da dobijete tabelu sa jednim redom po vrsti (ili drugom atributu) i jednom kolonom po zapisu, sa vrednošću koju izaberete u ćelijama (npr. pokrovnost).

Ovo je format koji zahtevaju alati za analizu vegetacije kao što su **Turboveg**, **Juice** i **Synbiosys**. Postavite filter u Istraživaču podataka da biste izvezli samo neke zapise.`,
    },
    mobilePreview: {
      title: 'Pregled istraživanja u aplikaciji Arena Mobile',
      description: `U dizajneru obrasca otvorite meni pored dugmeta **Pregled** i izaberite **Pregled (mobilni)** da isprobate nacrt istraživanja onako kako izgleda u aplikaciji **Arena Mobile**, na telefonu ili tabletu, u uspravnoj ili položenoj orijentaciji.

Pregled se izvršava u pregledaču: neke funkcije pravog uređaja (npr. mape i kamera) nisu dostupne.`,
    },
    requiredIf: {
      title: 'Uslovno obavezni atributi',
      description: `U dizajneru obrasca, na kartici **Validacije** atributa, izaberite **Obavezno kada je uslov ispunjen** i napišite uslov: atribut je obavezan samo kada je uslov tačan.

Tokom unosa podataka, greška "Obavezna vrijednost" prikazuje se samo kada je uslov ispunjen.`,
    },
    themeSelector: {
      title: 'Svijetla i tamna tema',
      description: `Koristite meni **Tema** u zaglavlju (i na stranici za prijavu) da prebacujete između **Svijetle** i **Tamne** teme, ili da pratite **Sistemsku podrazumijevanu**.`,
    },
    surveyCompare: {
      title: 'Poređenje i ažuriranje istraživanja',
      description: `Na **Kontrolnoj tabli** koristite **Napredne funkcije > Uporedi / ažuriraj iz fajla** da uporedite ovo istraživanje sa istraživanjem izvezenim sa drugog Arena servera (npr. test servera) ili sa drugim istraživanjem na ovom serveru.

Pregledajte razlike i primijenite samo izmjene koje izaberete: one se čuvaju kao nacrt dok ne objavite istraživanje.`,
    },
    usersBackup: {
      title: 'Rezervna kopija i vraćanje korisnika',
      description: `U odjeljku **Korisnici** koristite **Rezervna kopija / Vraćanje** da izvezete sve korisnike, sa njihovim ulogama u istraživanjima i korisničkim grupama, i vratite ih na drugi Arena server.

Prije vraćanja možete izabrati šta da uradite sa svakim korisnikom.`,
    },
    samplingPointDataWhisp: {
      title: 'Whisp analiza tačaka uzorka',
      description: `U kategoriji **podaci o tačkama uzorka** koristite **Generiši Whisp analizu** da analizirate sve lokacije tačaka uzorka pomoću alata **Open Foris Whisp**.

Analiza se izvršava u pozadini, a rezultati se čuvaju u novoj kategoriji.`,
    },
    dashboardUpgrade: {
      title: 'Nova kontrolna tabla',
      description: `**Kontrolna tabla** ima novi izgled: zapisi i saradnici na prvi pogled, mapa prikupljenih podataka i trend zapisa dodatih tokom vremena.`,
    },
    clearNonApplicableValues: {
      title: 'Vrijednosti koje nisu relevantne se brišu',
      description: `Tokom unosa podataka, kada izmjena učini da druga polja više nisu relevantna, njihove vrijednosti se brišu, nakon što od vas zatraži potvrdu.

Administratori istraživanja mogu zadržati staro ponašanje opcijom **Zadrži vrijednosti atributa koji nisu relevantni** (**Informacije o istraživanju > Bezbjednost**).`,
    },
    systemLogs: {
      title: 'Sistemski dnevnici',
      description: `U odjeljku **Administracija sistema > Sistemski dnevnici** pratite dnevnike servera uživo, sa filterima po tekstu i nivou.`,
    },
    dataQueryAiGenerate: {
      title: 'Kreiranje upita u Istraživaču podataka pomoću AI',
      description: `U **Istraživaču podataka** opišite podatke koje tražite običnim jezikom (npr. *"broj stabala po vrstama u svakoj opštini"*) i prepustite AI da napravi upit za vas.

AI može predložiti i naziv i opis kada čuvate upit.

*Zahtijeva da AI funkcije budu omogućene u vašem korisničkom profilu.*`,
    },
    recordPrint: {
      title: 'Štampanje zapisa',
      description: `Izvezite zapis kao dokument za štampu u formatu **Word** ili **PDF**, uključujući slike, pomoću PDF dugmeta u uređivaču zapisa.

Možete izabrati orijentaciju stranice (uspravna ili položena).`,
    },
    attributeClone: {
      title: 'Kloniranje atributa u dizajneru obrasca',
      description: `U **dizajneru obrasca** koristite meni atributa da ga **klonirate** u isti ili drugi entitet, sa svim njegovim svojstvima.`,
    },
    odkImport: {
      title: 'Uvoz istraživanja i podataka iz ODK',
      description: `Kreirajte novo istraživanje iz **ODK obrasca** (XForm, .xml): u **Početna > Novo istraživanje > Uvezi** izaberite **ODK (.xml)** kao **Izvor**, a zatim kliknite na **Pokreni uvoz**. Pitanja iz obrasca postaju atributi, ponavljanja (repeats) višestruki entiteti, a liste izbora kategorije, sa oznakama na svim jezicima obrasca. Pre objavljivanja definišite ključne atribute korenskog entiteta i ispravite greške koje prikaže **Objavi**, ako ih ima.

Zatim uvezite podatke prikupljene pomoću **ODK Collect** u **Podaci > Uvoz podataka > ODK / ODK Collect**: .zip datoteka sa jednom fasciklom po podnesku (ODK Briefcase izvoz). Već uvezeni podnesci se preskaču.`,
    },
    positionTracking: {
      title: 'Praćenje položaja: beleženje puta pređenog na terenu',
      description: `Označite **Praćenje položaja** na kartici **Osnovno** pojedinačnog atributa tipa **Geoprostorni**: u **Arena Mobile** vrednost atributa je put koji je korisnik prešao dok popunjava zapis, zabeležen praćenjem položaja uređaja.

Put ne može da se menja ručno. Opcija se primenjuje samo na Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Dinamičko nabrajanje entiteta',
      description: `Koristite **izraz** da izaberete koje stavke kategorije generišu redove nabrojanog višestrukog entiteta: npr. \`unique(plot.land_use)\` kreira red samo za načine korišćenja zemljišta koji su stvarno pronađeni na plohama.`,
    },
  },
}
