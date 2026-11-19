export default {
  title: 'Neuigkeiten in Arena',
  since: 'Seit Version {{version}}',
  experimental: 'Experimentell',
  dontShowAgain: 'Nicht erneut anzeigen',
  slideCounter: '{{current}} von {{total}}',
  noItems: 'Keine neuen Funktionen vorhanden.',
  items: {
    loginProviders: {
      title: 'Mit Google, Microsoft oder dem Konto Ihrer Organisation anmelden',
      description: `Unter **Systemverwaltung > Anmeldeanbieter** können Sie Benutzern die Anmeldung mit **Google**, **Microsoft** oder einem beliebigen **OpenID-Connect-Anbieter** (z. B. Keycloak, Okta oder dem Single Sign-on Ihrer Organisation) ermöglichen. Jeder Anbieter erhält eine Schaltfläche auf der Anmeldeseite. Das Anbieterformular zeigt die beim Anbieter zu registrierende Weiterleitungs-URI, die Einrichtungsschritte und einen Link zu einer ausführlichen Anleitung. Mit **Verbindung testen** und **Anmeldung testen** lässt sich die Konfiguration prüfen, ohne jemanden anzumelden.

Nur Benutzer, die bereits ein Arena-Konto oder eine Einladung besitzen, können sich anmelden. Bei der ersten Anmeldung wird das Konto anhand der bestätigten E-Mail-Adresse zugeordnet. Eingeladene Benutzer können die Einladung über einen Anbieter annehmen, anstatt ein Passwort festzulegen. Jeder Benutzer kann unter **Mein Profil > Anmeldemethoden** Anbieter verknüpfen oder entfernen. Die Anmeldung mit E-Mail-Adresse und Passwort bleibt immer verfügbar.

Auf dem Server müssen die Umgebungsvariablen \`ARENA_PUBLIC_URL\` und \`AUTH_PROVIDER_SECRET_ENCRYPTION_KEY\` gesetzt sein (siehe \`.env.template\`).`,
    },
    mobileUploadEmailNotification: {
      title: 'E-Mail-Benachrichtigung bei aus Arena Mobile hochgeladenen Datensätzen',
      description: `Aktivieren Sie unter **Erhebungsinformationen → Sicherheit** die Option **Erhebungsadministratoren per E-Mail benachrichtigen, wenn Datensätze aus Arena Mobile hochgeladen werden**. Nach jedem Upload erhalten alle Erhebungsadministratoren eine E-Mail mit den hochgeladenen Datensätzen, ihren Schlüsselwerten, dem Status „neu“ oder „aktualisiert“, dem Ersteller, den Datumsangaben sowie der Anzahl der Validierungsfehler und Warnungen.

Pro Upload wird eine E-Mail gesendet, auch wenn ein Gerät viele Datensätze hochlädt. Die Option ist verfügbar, wenn **Hochladen von Datensätzen aus Arena Mobile auf den Server zulassen** aktiviert ist, und wird nach Veröffentlichung der Erhebung wirksam.`,
    },
    surveyGuestRole: {
      title: 'Neue Rolle „Gast“ zum Anzeigen von Datensätzen ohne Bearbeitungsrecht',
      description: `Laden Sie Benutzer mit der neuen Rolle **Gast** ein (**Benutzer → Benutzer einladen**). Sie können alle Datensätze der Erhebung auch in **Arena Mobile** anzeigen, jedoch weder bearbeiten oder löschen noch neue hinzufügen.

Fügen Sie den Gast einer **Benutzergruppe** (**Benutzer → Benutzergruppen**) mit Qualifikatoren hinzu, um nur einen Teil der Daten anzuzeigen: Datensätze, deren Qualifikatorattribute den Gruppenwerten entsprechen (z. B. Probeflächen einer Region). Gruppen mit der Einstellung **Kann Datensätze folgender Gruppen anzeigen** gewähren zusätzlich Zugriff auf Datensätze anderer Gruppen.

Vorhandene Erhebungen erhalten die neue Rolle automatisch.`,
    },
    areaOfInterest: {
      title: 'Interessengebiete: Prüfen, ob eine Position innerhalb eines Gebiets liegt',
      description: `Fügen Sie unter **Erhebungsinformationen → Karte** ein oder mehrere **Interessengebiete** hinzu (z. B. Gemeinden eines Pilotgebiets), jeweils mit Name und Polygon im GeoJSON-Format. Prüfen Sie sie beim Hinzufügen einzeln oder gemeinsam (**Alle auf der Karte anzeigen**) und zeigen Sie sie unter **Daten → Karte** als Ebenen an.

Die neue Ausdrucksfunktion \`geoDistanceToAOIBoundary(location, 'area_name')\` liefert den Abstand in Metern zwischen einer Position und der Gebietsgrenze: negativ innerhalb, positiv außerhalb. Vergleichen Sie ihn mit der GPS-Genauigkeit (\`location.accuracy\`), um Positionen als innen, außen oder unsicher einzustufen, etwa in Standardwerten schreibgeschützter Attribute und in Validierungsregeln mit Schweregrad *Warnung*. \`geoAOIContaining(location)\` liefert den Namen des Gebiets, das die Position enthält. Beide Funktionen arbeiten auch offline in **Arena Mobile**.

Vielen Dank an **[ASSEDEV Alerte Environnement](https://assedev.fr)** für die Anregung.`,
    },
    dataQueryTotals: {
      title: 'Gesamtsummen und Prozentwerte im Daten-Explorer',
      description: `Öffnen Sie unter **Daten → Explorer** im Modus **Aggregiert** mit einem einzelnen Messwert (z. B. Summe des Baumvolumens nach Art) das Menü **Ansicht** und wählen Sie **Gesamtsumme und Prozentsatz anzeigen**. Jede Zeile zeigt ihren Anteil an der Gesamtsumme; unten wird eine Zeile **Gesamt** ergänzt.

Auch die Optionen **Namen anzeigen** und **Codes anzeigen** befinden sich im Menü **Ansicht**.`,
    },
    mapWorkspace: {
      title: 'Ein neuer Kartenarbeitsbereich',
      description: `**Daten → Karte** besitzt ein neues Layout: oben die Menüs **Basiskarte**, **Daten hinzufügen**, **Anzeige** und **Werkzeuge** sowie ein Suchfeld für Koordinaten und Datensatzschlüssel; seitlich die Reiter **Ebenen**, **Datensätze** und **Legende**; unten eine Statusleiste mit Zeigerkoordinaten und Maßstab.

Durchsuchen Sie Datensätze auf der Karte, fügen Sie eigene Dateien (KML, Shapefile, GeoJSON) oder WMS-/WMTS-Dienste hinzu, messen Sie Entfernungen und Flächen und erstellen Sie Bildschirmfotos.`,
    },
    dataMatrixExport: {
      title: 'Daten als Matrix exportieren',
      description: `Wählen Sie unter **Daten → Explorer** eine mehrfache Entität aus (z. B. die Arten jedes Datensatzes), klicken Sie auf **Exportieren** und wählen Sie **Exportieren als: Datenmatrix**. Sie erhalten eine Tabelle mit einer Zeile pro Art (oder anderem Attribut), einer Spalte pro Datensatz und dem ausgewählten Wert in den Zellen (z. B. Deckung).

Dieses Format wird von Vegetationsanalysewerkzeugen wie **Turboveg**, **Juice** und **Synbiosys** benötigt. Setzen Sie im Explorer einen Filter, um nur bestimmte Datensätze zu exportieren.`,
    },
    mobilePreview: {
      title: 'Erhebungsvorschau in Arena Mobile',
      description: `Öffnen Sie im Formular-Designer das Menü neben **Vorschau** und wählen Sie **Vorschau (Mobilgerät)**, um den Erhebungsentwurf so auszuprobieren, wie er in **Arena Mobile** auf einem Smartphone oder Tablet im Hoch- oder Querformat erscheint.

Die Vorschau läuft im Browser; einige Funktionen eines echten Geräts, etwa Karten und Kamera, sind nicht verfügbar.`,
    },
    requiredIf: {
      title: 'Bedingt erforderliche Attribute',
      description: `Wählen Sie im Formular-Designer im Reiter **Validierungen** eines Attributs **Erforderlich, wenn Bedingung erfüllt ist** und geben Sie die Bedingung ein. Das Attribut ist nur erforderlich, wenn die Bedingung wahr ist.

Bei der Datenerfassung wird der Fehler „Wert erforderlich“ nur angezeigt, wenn die Bedingung erfüllt ist.`,
    },
    themeSelector: {
      title: 'Helles und dunkles Design',
      description:
        'Verwenden Sie das Menü **Design** in der Kopfzeile (auch auf der Anmeldeseite), um zwischen **Hell** und **Dunkel** zu wechseln oder der **Systemeinstellung** zu folgen.',
    },
    surveyCompare: {
      title: 'Erhebungen vergleichen und aktualisieren',
      description: `Verwenden Sie im **Dashboard** die Option **Erweiterte Funktionen → Mit Datei vergleichen/aktualisieren**, um diese Erhebung mit einer von einem anderen Arena-Server (z. B. Testserver) exportierten oder einer anderen Erhebung auf diesem Server zu vergleichen.

Prüfen Sie die Unterschiede und wenden Sie nur ausgewählte Änderungen an. Sie werden bis zur Veröffentlichung der Erhebung als Entwurf gespeichert.`,
    },
    usersBackup: {
      title: 'Benutzer sichern und wiederherstellen',
      description: `Verwenden Sie unter **Benutzer** die Funktion **Sichern/Wiederherstellen**, um alle Benutzer einschließlich ihrer Erhebungsrollen und Benutzergruppen zu exportieren und auf einem anderen Arena-Server wiederherzustellen.

Vor der Wiederherstellung können Sie für jeden Benutzer die gewünschte Aktion auswählen.`,
    },
    samplingPointDataWhisp: {
      title: 'Whisp-Analyse von Stichprobenpunkten',
      description: `Verwenden Sie in der Kategorie **Stichprobenpunktdaten** die Funktion **Whisp-Analyse erzeugen**, um alle Positionen der Stichprobenpunkte mit **Open Foris Whisp** zu analysieren.

Die Analyse läuft im Hintergrund; die Ergebnisse werden in einer neuen Kategorie gespeichert.`,
    },
    dashboardUpgrade: {
      title: 'Ein neues Dashboard',
      description:
        'Das **Dashboard** hat ein neues Erscheinungsbild: Datensätze und Mitwirkende auf einen Blick, eine Karte der erhobenen Daten und die zeitliche Entwicklung der hinzugefügten Datensätze.',
    },
    clearNonApplicableValues: {
      title: 'Nicht mehr relevante Werte werden gelöscht',
      description: `Wenn eine Änderung bei der Datenerfassung dazu führt, dass andere Felder nicht mehr relevant sind, werden deren Werte nach Ihrer Bestätigung gelöscht.

Erhebungsadministratoren können das bisherige Verhalten mit **Werte nicht relevanter Attribute beibehalten** unter **Erhebungsinformationen → Sicherheit** aktivieren.`,
    },
    systemLogs: {
      title: 'Systemprotokolle',
      description:
        'Verfolgen Sie unter **Systemverwaltung → Systemprotokolle** die Serverprotokolle live und filtern Sie nach Text und Protokollstufe.',
    },
    dataQueryAiGenerate: {
      title: 'Daten-Explorer-Abfragen mit KI erstellen',
      description: `Beschreiben Sie im **Daten-Explorer** in Alltagssprache, nach welchen Daten Sie suchen (z. B. *„Anzahl der Bäume nach Art in jeder Provinz“*), und lassen Sie die KI die Abfrage erstellen.

Beim Speichern einer Abfrage kann die KI außerdem einen Namen und eine Beschreibung vorschlagen.

*Die KI-Funktionen müssen in Ihrem Benutzerprofil aktiviert sein.*`,
    },
    recordPrint: {
      title: 'Datensätze drucken',
      description: `Exportieren Sie einen Datensatz einschließlich Bildern über die PDF-Schaltfläche im Datensatzeditor als druckbares **Word**- oder **PDF**-Dokument.

Sie können zwischen Hoch- und Querformat wählen.`,
    },
    attributeClone: {
      title: 'Attribute im Formular-Designer klonen',
      description:
        'Verwenden Sie im **Formular-Designer** das Menü eines Attributs, um es mit allen Eigenschaften in dieselbe oder eine andere Entität zu **klonen**.',
    },
    odkImport: {
      title: 'Erhebungen und Daten aus ODK importieren',
      description: `Erstellen Sie eine neue Erhebung aus einem **ODK-Formular (.xml)** und importieren Sie die mit **ODK Collect** erhobenen Daten.

*Diese Funktion befindet sich in der Betaphase.*`,
    },
    dynamicEnumerator: {
      title: 'Dynamische Aufzählung von Entitäten',
      description:
        'Wählen Sie mit einem **Ausdruck** aus, welche Kategorieelemente die Zeilen einer aufgezählten mehrfachen Entität erzeugen. Beispielsweise erstellt `unique(plot.land_use)` nur für die tatsächlich in den Probeflächen vorkommenden Landnutzungen eine Zeile.',
    },
  },
}
