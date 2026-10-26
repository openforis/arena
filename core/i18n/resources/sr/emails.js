export default {
  signature: `<p>Hvala,<br>
      platforma $t(common.appNameFull)
      </p>
      <p><i>Napomena: ovo je automatska poruka, molimo <b>NE ODGOVARAJTE</b> na ovu e-poruku.</i></p>
      `,
  temporaryMsg: '<p><i>Ovaj link važi samo narednih 7 dana. Molimo ne dijelite ga ni sa kim.</i></p>',
  userInviteCommon: `<p>Korisnik {{invitingUserName}} vas je pozvao da se pridružite istraživanju '{{surveyName}} - {{surveyLabel}}' na platformi $t(common.appNameFull) sa ulogom {{groupLabel}}</p>
      {{-message}}
      <p>Sa ulogom <b>{{groupLabel}}</b> imate sljedeće dozvole: <br/>
        <ul>{{groupPermissions}}</ul>
      </p>`,
  userInvite: {
    subject: 'Pozvani ste na $t(common.appNameFull)!',
    body: `<p>Zdravo,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{urlResetPassword}}">Kliknite ovdje da završite registraciju na $t(common.appNameFull)</a></p>
             <p>Ako link ne radi, molimo kopirajte i nalijepite ovu adresu u vaš pregledač: {{urlResetPassword}}</p>
             $t(emails:temporaryMsg)
             <p><i>Primili ste ovu e-poruku jer vas je {{invitingUserName}} pozvao da pristupite platformi $t(common.appNameFull) preko {{serverUrl}}. Ako niste vi primalac, molimo zanemarite je.</i></p>
             <p>Nakon što završite registraciju, platformi $t(common.appNameFull) možete pristupiti direktno preko ovog linka: <a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>$t(common.raiseTicketInSupportForum)</p>
             $t(emails:signature)`,
  },
  userInviteExistingUser: {
    subject: `Pozvani ste da se pridružite istraživanju '{{surveyLabel}}' na $t(common.appNameFull)!`,
    body: `<p>Zdravo,</p>
             $t(emails:userInviteCommon)
             <p><a href="{{serverUrl}}">Kliknite ovdje da pristupite platformi $t(common.appNameFull)</a></p>
             <p>Ako link ne radi, molimo kopirajte i nalijepite ovu adresu u vaš pregledač: {{serverUrl}}</p>
             $t(emails:signature)`,
  },
  userAccessRequestConfirmation: {
    subject: '$t(common.appNameFull) - Zahtjev za pristup je primljen',
    body: `<p>Zdravo {{firstName}},</p>
      <p>Primili smo vaš zahtjev za pristup platformi $t(common.appNameFull). Zahtjev će biti razmotren i kontaktiraćemo vas što je prije moguće.</p>
      <p><i>Primili ste ovu e-poruku jer je ova adresa navedena u zahtjevu za pristup na {{serverUrl}}. Ako niste vi podnijeli ovaj zahtjev, molimo obavijestite nas pisanjem na <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</i></p>
      $t(emails:signature)`,
  },
  userAccessRequest: {
    subject: '$t(common.appNameFull) - Zahtjev korisnika za pristup',
    body: `<p>Zdravo,</p>
      <p>Sljedeći korisnik je zatražio pristup platformi $t(common.appNameFull).</p>
      <p>
        <ul>
          <li>$t(guest:accessRequestView.fields.email): {{email}}</li>
          <li>$t(guest:accessRequestView.fields.props.firstName): {{firstName}}</li>
          <li>$t(guest:accessRequestView.fields.props.lastName): {{lastName}}</li>
          <li>$t(guest:accessRequestView.fields.props.institution): {{institution}}</li>
          <li>$t(guest:accessRequestView.fields.props.country): {{country}}</li>
          <li>$t(guest:accessRequestView.fields.props.purpose): {{purpose}}</li>
          <li>$t(guest:accessRequestView.fields.props.surveyName): {{surveyName}}</li>
        </ul>
      </p>
      <p>Molimo razmotrite ovaj zahtjev i odgovorite korisniku što je prije moguće.</p>
      <p><a href="{{serverUrl}}">Kliknite ovdje da pristupite platformi $t(common.appNameFull)</a></p>
      $t(emails:signature)`,
  },
  userInviteRepeatConfirmation: 'Korisnik {{email}} je uspješno ponovo pozvan. $t(common.emailSentConfirmation)',
  userResetPassword: {
    subject: '$t(common.appNameFull). Ponovno postavljanje lozinke',
    body: `<p>Zdravo {{name}},</p>
             <p>Nedavno ste zatražili ponovno postavljanje lozinke za vaš nalog na platformi $t(common.appNameFull). Kliknite na link ispod da je ponovo postavite.</p>
             <p><a href="{{url}}">Ponovo postavite lozinku</a></p>
             <p>Ako link ne radi, molimo kopirajte i nalijepite ovu adresu u vaš pregledač: {{url}}</p>
             $t(emails:temporaryMsg)
             <p>Ako niste zatražili ponovno postavljanje lozinke, molimo zanemarite ovu e-poruku ili nas obavijestite.</p>
             $t(emails:signature)`,
  },
  userDeleted: {
    subject: `Uklonjeni ste iz istraživanja {{surveyLabel}} na $t(common.appNameFull)`,
    body: `<p>Zdravo {{name}},</p>
      <p>Uklonjeni ste iz istraživanja <strong>{{surveyName}} - {{surveyLabel}}</strong></p>
      <p>Ako želite ponovo da imate pristup tom istraživanju, molimo kontaktirajte administratora istraživanja.</p>
      $t(emails:signature)`,
  },
  userRegistrationExpired: {
    subject: 'Vaš nalog na $t(common.appNameFull) je uklonjen',
    accountRemoved: '<p>Iz tog razloga vaš nalog je uklonjen.</p>',
    accountAndSurveysRemoved: `<p>Iz tog razloga vaš nalog je uklonjen, zajedno sa sljedećim istraživanjima, koja nisu bila izmijenjena od kreiranja:</p>
      <ul>{{-surveysList}}</ul>`,
    surveyItem: '<li><b>{{survey}}</b></li>',
    requestAccessAgain: `<p>Ako i dalje želite da koristite $t(common.appNameFull), ovdje možete ponovo zatražiti pristup: <a href="{{serverUrl}}">{{serverUrl}}</a></p>`,
    body: `<p>Zdravo,</p>
      <p>Vaša registracija na $t(common.appNameFull) nije završena u roku od 7 dana od prijema linka za registraciju, pa je link istekao.</p>
      {{-accountRemovedMsg}}
      {{-requestAccessAgainMsg}}
      <p>$t(common.raiseTicketInSupportForum)</p>
      $t(emails:signature)`,
  },
}
