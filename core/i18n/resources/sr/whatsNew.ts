export default {
  title: `Šta je novo u aplikaciji Arena`,
  since: 'Od verzije {{version}}',
  experimental: 'Eksperimentalno',
  dontShowAgain: `Ne prikazuj ponovo`,
  slideCounter: '{{current}} od {{total}}',
  noItems: 'Nema novih funkcija za prikaz.',
  items: {
    areaOfInterest: {
      title: 'Područja od interesa: provera da li je lokacija unutar područja',
      description: `U **Informacije o istraživanju → Mapa** dodajte jedno ili više **područja od interesa** (npr. opštine pilot područja), svako sa nazivom i poligonom u GeoJSON formatu.

Nova funkcija izraza \`geoDistanceToAOIBoundary(location, 'area_name')\` vraća udaljenost u metrima između lokacije i granice područja: negativnu unutar, pozitivnu van njega. Uporedite je sa GPS preciznošću (\`location.accuracy\`) da biste lokacije klasifikovali kao unutar, van ili neizvesne, npr. u podrazumevanim vrednostima atributa samo za čitanje i u pravilima validacije sa nivoom *upozorenje*. \`geoAOIContaining(location)\` vraća naziv područja koje sadrži lokaciju. Obe rade i oflajn u **Arena Mobile**.

Hvala **[ASSEDEV Alerte Environnement](https://assedev.fr)** na zahtevu.`,
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
      description: `Kreirajte novo istraživanje iz **ODK obrasca (.xml)** i uvezite podatke prikupljene pomoću **ODK Collect**.

*Ova funkcija je u beta fazi.*`,
    },
    dynamicEnumerator: {
      title: 'Dinamičko nabrajanje entiteta',
      description: `Koristite **izraz** da izaberete koje stavke kategorije generišu redove nabrojanog višestrukog entiteta: npr. \`unique(plot.land_use)\` kreira red samo za načine korišćenja zemljišta koji su stvarno pronađeni na plohama.`,
    },
  },
}
