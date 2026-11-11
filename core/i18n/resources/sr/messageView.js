export default {
  body: {
    label: 'Tekst poruke',
    info: `Možete koristiti **Markdown** sintaksu za formatiranje teksta poruke (posjetite https://www.markdownguide.org za više informacija).
Dostupne su i neke zamjenske promjenljive:
- \`{{userTitleAndName}}\`: zamjenjuje se titulom i imenom korisnika (npr. "g. Marko")
- \`{{userName}}\`: zamjenjuje se imenom korisnika (npr. "Marko")`,
  },
  dateSent: 'Datum slanja',
  dateValidUntil: 'Važi do',
  deleteMessage: {
    confirmTitle: 'Da li ste sigurni da želite da obrišete ovu poruku?',
  },
  messageDeleted: 'Poruka je uspješno obrisana.',
  notificationType: {
    label: 'Vrsta obavještenja',
    email: 'E-mail',
    push_notification: 'Obavještenje u aplikaciji',
  },
  preview: 'Pregled',
  sendMessage: {
    label: 'Pošalji poruku',
    confirmTitle: 'Da li ste sigurni da želite da pošaljete ovu poruku?',
  },
  status: {
    label: 'Status',
    draft: 'Nacrt',
    sent: 'Poslato',
  },
  subject: 'Naslov',
  target: {
    emailsExcluded: {
      label: 'Isključene e-mail adrese',
      placeholder: 'Unesite e-mail adresu koju želite da isključite, zatim pritisnite dugme Dodaj',
    },
    emailsIncluded: {
      label: 'Uključene e-mail adrese',
      placeholder: 'Unesite e-mail adresu koju želite da uključite, zatim pritisnite dugme Dodaj',
    },
    userType: {
      label: 'Ciljna vrsta korisnika',
      all: 'Svi korisnici',
      system_admins: 'Sistemski administratori',
      survey_admins: 'Administratori istraživanja',
      survey_managers: 'Menadžeri istraživanja',
      data_analysts: 'Analitičari podataka',
      data_cleaners: 'Čistači podataka',
      data_editors: 'Unosioci podataka',
      individual: 'Pojedinačni korisnici',
    },
  },
}
