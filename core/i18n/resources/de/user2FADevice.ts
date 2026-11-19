export default {
  authenticatorCodeOne: 'Authentifizierungscode 1',
  authenticatorCodeTwo: 'Authentifizierungscode 2',
  authenticatorCodeTwoInfo: 'Warten Sie 30 Sekunden und geben Sie einen zweiten Code ein',
  backupCodesRegenerated: {
    title: 'Backup-Codes erfolgreich neu erzeugt',
    message: `Bewahren Sie die folgenden 8 Backup-Codes an einem sicheren Ort auf:  
{{backupCodes}}  

Mit ihnen können Sie auf Ihr Konto zugreifen, falls Sie den Zugriff auf Ihr Authentifizierungsgerät verlieren.  
**Jeder Backup-Code kann nur einmal verwendet werden**.  
Die Codes werden nur jetzt angezeigt. Stellen Sie daher sicher, dass Sie sie **jetzt speichern**.`,
  },
  create: {
    label: 'Erstellen',
  },
  creationSuccessful: {
    title: '2FA-Gerät erfolgreich erstellt',
    message: `Das 2FA-Gerät "{{deviceName}}" wurde erstellt.  
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Möchten Sie das Gerät "{{deviceName}}" wirklich löschen?',
    error: 'Fehler beim Löschen des Geräts: {{message}}',
    successful: 'Gerät erfolgreich gelöscht',
  },
  deviceName: 'Gerätename',
  deviceNameFinal: 'In der Authenticator-App angezeigter Gerätename',
  enabled: 'Aktiviert',
  error: {
    fetchDevice: 'Fehler beim Abrufen der Gerätedetails: {{message}}',
    createDevice: 'Fehler beim Erstellen des Geräts: {{message}}',
    updateDevice: 'Fehler beim Aktualisieren des Geräts: {{message}}',
    regenerateBackupCodes: 'Fehler beim Neuerzeugen der Backup-Codes: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Backup-Codes neu erzeugen',
    confirm: `Möchten Sie die Backup-Codes für das Gerät "{{deviceName}}" wirklich neu erzeugen?  
Die bisherigen Backup-Codes funktionieren anschließend nicht mehr.`,
  },
  showSecretKey: 'Geheimschlüssel anzeigen',
  validation: {
    label: 'Überprüfen',
    successful: 'Gerät erfolgreich überprüft',
    error: 'Ungültige Authentifizierungscodes',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Authenticator-App installieren',
      description:
        'Installieren Sie eine Authenticator-App auf Ihrem Mobilgerät (z. B. Google Authenticator oder Authy).',
    },
    scanCode: {
      title: 'QR-Code scannen',
      description: 'Scannen Sie den unten angezeigten QR-Code mit der Authenticator-App.',
      descriptionAlternative: 'Alternativ können Sie den Geheimschlüssel in der Authenticator-App eingeben.',
    },
    typeAuthenticatorCodes: {
      title: 'Authentifizierungscodes eingeben',
      description:
        'Geben Sie zwei aufeinanderfolgende, von der Authenticator-App erzeugte Codes ein, um das Gerät zu bestätigen.',
    },
  },
}
