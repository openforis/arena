export default {
  title: 'Neuigkeiten in Arena',
  since: 'Seit Version {{version}}',
  experimental: 'Experimentell',
  dontShowAgain: 'Nicht erneut anzeigen',
  slideCounter: '{{current}} von {{total}}',
  noItems: 'Keine neuen Funktionen vorhanden.',
  items: {
    googleSignIn: {
      title: 'Mit Ihrem Google-Konto anmelden',
      description: `Klicken Sie auf der Anmeldeseite auf **Mit Google anmelden**, um sich mit Ihrem Google-Konto (Gmail oder Google Workspace) anzumelden, ohne Ihr Passwort einzugeben.

Beim ersten Mal wird das Google-Konto über seine E-Mail-Adresse mit Ihrem Arena-Konto verknüpft: Verwenden Sie dieselbe E-Mail-Adresse wie für Ihr Arena-Konto. Eingeladene Benutzer können die Einladung auch mit Google annehmen. Verknüpfen oder trennen Sie Ihr Google-Konto unter **Mein Profil > Anmeldemethoden**; die Anmeldung mit E-Mail und Passwort bleibt verfügbar.`,
    },
    aiFeatures: {
      title: 'KI-Unterstützung',
      description: `Aktivieren Sie die KI-Unterstützung unter **Mein Profil > KI-Funktionen** und wählen Sie die gewünschten Funktionen:

- **Dokumentations-Chatbot**: eine Hilfeschaltfläche, die Fragen zu Arena beantwortet;
- **Ausdruckserzeugung und -prüfung**: Ausdrücke im Ausdruckseditor entwerfen und erklären lassen;
- **Übersetzung von Bezeichnungen**: die Beschriftungen der Erhebung in ihre anderen Sprachen übersetzen (Formular-Designer);
- **Datenwörterbuch**: ein Datenwörterbuch mit von der KI entworfenen Beschreibungen exportieren (Formular-Designer);
- **Benutzeraktivität**: Zusammenfassungen des Aktivitätsprotokolls (Dashboard);
- **Datenabfragen**: Daten-Explorer-Abfragen aus einer Beschreibung in Alltagssprache erstellen.

Arena verwendet den vom Administrator eingerichteten KI-Anbieter oder Ihren eigenen Anbieter und API-Schlüssel (OpenAI, Anthropic, Google Gemini und andere).`,
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
      description: `Erstellen Sie eine neue Erhebung aus einem **ODK-Formular** (XForm, .xml): Wählen Sie unter **Startseite > Neue Erhebung > Import** als **Quelle** **ODK (.xml)** und klicken Sie auf **Import starten**. Die Fragen des Formulars werden zu Attributen, die Wiederholungen (Repeats) zu mehrfachen Entitäten und die Auswahllisten zu Kategorien, mit den Beschriftungen in allen Sprachen des Formulars. Legen Sie vor der Veröffentlichung die Schlüsselattribute der Stammentität fest und beheben Sie gegebenenfalls die unter **Veröffentlichen** angezeigten Fehler.

Importieren Sie anschließend die mit **ODK Collect** erhobenen Daten unter **Daten > Datenimport > ODK / ODK Collect**: eine .zip-Datei mit einem Ordner pro Übermittlung (ODK-Briefcase-Export). Bereits importierte Übermittlungen werden übersprungen.`,
    },
    positionTracking: {
      title: 'Positionsverfolgung: den im Gelände zurückgelegten Weg aufzeichnen',
      description: `Aktivieren Sie **Positionsverfolgung** auf der Registerkarte **Allgemein** eines einfachen **Geodaten**-Attributs: In **Arena Mobile** ist der Wert des Attributs der Weg, den der Benutzer beim Ausfüllen des Datensatzes zurücklegt, aufgezeichnet durch Verfolgung der Geräteposition.

Der Weg kann nicht manuell bearbeitet werden. Die Option gilt nur für Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Dynamische Aufzählung von Entitäten',
      description:
        'Wählen Sie mit einem **Ausdruck** aus, welche Kategorieelemente die Zeilen einer aufgezählten mehrfachen Entität erzeugen. Beispielsweise erstellt `unique(plot.land_use)` nur für die tatsächlich in den Probeflächen vorkommenden Landnutzungen eine Zeile.',
    },
  },
}
