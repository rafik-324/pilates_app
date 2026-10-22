# Entwicklungsplan Stufe 1 (MVP)

Stand: 22.10.2026. Grundlage: `pflichtenheft_pilates_workout_at_home.md` (Version 1.1).

Dieser Plan wird Phase für Phase von Claude-Cloud-Sessions abgearbeitet. Regeln dazu stehen in `CLAUDE.md`.

## Status

| Phase | Thema | Status |
|---|---|---|
| 0 | Projekt-Setup (Expo, Tooling, Expo Go, CI) | erledigt (Prototyp) |
| 1 | Inhaltsdaten und Platzhalter-Medien | erledigt (Prototyp) |
| 2 | Lokale Datenbank und Domänenlogik | offen |
| 3 | Onboarding | offen |
| 4 | Plan-Generator und Planansicht | offen |
| 5 | Bibliothek, Suche, Übungsdetails | offen |
| 6 | Workout-Player | offen |
| 7 | Workout-Abschluss und Fortschritt | offen |
| 8 | Erinnerungen, Einstellungen, Datenschutz | offen |
| 9 | Feinschliff und MVP-Abnahme | offen |

Status-Werte: `offen`, `in Arbeit`, `erledigt (PR #n)`.

## Allgemeine Definition of Done (gilt für jede Phase)

- `npm run typecheck`, `npm run lint` und `npm test` laufen fehlerfrei
- `npx expo-doctor` meldet keine Fehler
- Neue Domänenlogik hat Unit-Tests; genannte Testfälle aus dem Pflichtenheft sind als automatisierte Tests umgesetzt, soweit ohne Gerät möglich
- Alle sichtbaren Texte über i18n (DE und EN), keine fest eingebauten Strings
- UI nur aus Komponenten und Tokens des Design-Systems (`docs/DESIGN.md`), keine festen Farben, Größen oder Abstände im Feature-Code
- App startet in Expo Go (keine Bibliothek ohne Expo-Go-Unterstützung, außer den Ausnahmen in Pflichtenheft 3.3)
- Checkboxen dieser Phase abgehakt, Statustabelle aktualisiert, Abschnitt "Demo" der Phase ausgefüllt

---

## Phase 0: Projekt-Setup

Ziel: lauffähiges Expo-Grundgerüst, das man per QR-Code in Expo Go öffnen kann.

- [x] Expo-Projekt mit TypeScript im Repo-Root anlegen (`npx create-expo-app@latest` in einem temporären Ordner, dann Dateien in den Root übernehmen; vorhandene Dateien und `docs/` nicht überschreiben). Aktuelles SDK verwenden, das die aktuelle Expo-Go-App unterstützt
- [x] `app.json` / `app.config.ts`: Name "Pilates at Home" (Arbeitstitel), slug `pilates-app`, Schema `pilatesapp`, Bundle-ID / Package `de.rafik.pilatesapp` (vor Store-Release änderbar), Hochformat, Light und Dark Mode (`userInterfaceStyle: automatic`)
- [x] Expo Router mit vier Tabs gemäß Pflichtenheft 8.1: Plan, Entdecken, Fortschritt, Profil (je ein Platzhalter-Screen)
- [x] Ordnerstruktur:
  - `app/` Routen (Expo Router)
  - `src/domain/` reine Logik ohne React (Plan-Generator, Player-Engine, kcal, BMI, Streak)
  - `src/data/` DB, Repositories, Content-Loader
  - `src/features/<feature>/` Screens-Komponenten, Hooks, Stores
  - `src/ui/` gemeinsame Komponenten und Theme
  - `src/i18n/` Übersetzungen
  - `assets/content/` Inhaltsdaten und Medien
- [x] Design-System gemäß `docs/DESIGN.md`: Theme-Struktur (`palette.ts`, `themes/mono.ts`, Registry, `ThemeProvider`, `useTheme`), Hell und Dunkel, Inter-Schrift, alle Basis-Komponenten aus Abschnitt 6, `Icon`-Wrapper
- [x] ESLint-Regel gegen Farbliterale außerhalb von `src/ui/theme/`; Test für WCAG-Kontraste der Theme-Tokens
- [x] Entwickler-Screen "Theme-Vorschau" mit allen Komponenten in Hell und Dunkel
- [x] i18n (expo-localization + i18next) mit `de.json` und `en.json`, Gerätesprache als Standard
- [x] Zustand installieren; Tooling: ESLint (`npx expo lint`), Prettier, TypeScript strict, Jest mit `jest-expo` und React Native Testing Library
- [x] npm-Skripte: `start`, `start:tunnel` (`expo start --tunnel`), `typecheck`, `lint`, `test`, `doctor`
- [x] Abhängigkeiten ausschließlich mit `npx expo install` hinzufügen (passende Versionen für Expo Go)
- [x] GitHub Actions Workflow: install, typecheck, lint, test bei Push und PR
- [x] `.gitignore` für Expo ergänzen (`.expo/`, `ios/`, `android/`, `dist/`, `web-build/`, `*.jks`, `*.p8`, `*.p12`, `*.mobileprovision`, `expo-env.d.ts`)
- [x] `README.md`: Voraussetzungen (Node LTS), Installation, Demo mit Expo Go (Schritt für Schritt, siehe unten), Skripte, verwendete SDK-Version

Demo: App in Expo Go öffnen, vier Tabs sichtbar, Wechsel Hell / Dunkel und DE / EN funktionieren.

**Anleitung Expo-Go-Demo (in README übernehmen):**
1. Expo Go aus dem Play Store / App Store installieren
2. Im Projektordner `npm install`, dann `npm start`
3. Handy im selben WLAN: QR-Code mit Expo Go (Android) bzw. Kamera-App (iOS) scannen
4. Anderes Netz oder Probleme: `npm run start:tunnel`

Prototyp-Stand (Branch `prototype`):

- Verwendet wird Expo SDK 58 (aktuelles `create-expo-app`-Template). Routen liegen im Root-Ordner `app/` (nicht `src/app`), Pfad-Alias `@/` zeigt auf `src/`
- Zustand-Stores für Darstellung / Sprache sind in dieser Phase nur im Speicher; die Persistenz über die DB folgt in Phase 2
- Hex-Codes nur in `src/ui/theme/palette.ts`; ESLint verbietet Farbliterale außerhalb von `src/ui/theme/` sowie feste Schriftgrößen / Abstände / Radien in `app/` und `src/features/`
- Kontrasttest: für Rot als Text im Dunkelmodus gibt es zusätzlich den Token `dangerText` (`#FF4D5E`), weil `#E5172F` auf Schwarz die 4,5:1 nicht erreicht
- Prüfung der App-Startfähigkeit: `expo export --platform android` bündelt fehlerfrei; Render-Smoke-Tests für Profil und Theme-Vorschau laufen in Jest
- Offen: `npx expo-doctor` konnte in der Cloud-Umgebung zwei Netzwerk-Checks nicht ausführen (Expo-Config-Schema, React Native Directory; kein Zugriff auf exp.host / reactnative.directory). Alle 18 übrigen Checks sind grün. Lokal erneut prüfen
- Offen: `npx expo install` kann in der Cloud-Umgebung die Kompatibilitätsliste nicht laden; Installation mit `EXPO_OFFLINE=1 npx expo install` (nutzt `bundledNativeModules.json` des SDK, gleiche Versionen)
- Offen: App-Icon und Splash sind die Standard-Bilder des Expo-Templates (Platzhalter)

Demo: App in Expo Go öffnen, vier Tabs sichtbar, im Tab "Profil" Hell / Dunkel und DE / EN umschalten, Theme-Vorschau öffnen.

## Phase 1: Inhaltsdaten und Platzhalter-Medien

Ziel: alle 50 Übungen und ein Satz Workouts als Daten, mit Platzhaltern statt Videos.

- [x] TypeScript-Typen und Zod-Schemas für Übung (/D020/) und Workout (/D030/)
- [x] `assets/content/exercises.json` mit allen 50 Übungen aus `docs/higgsfield_video_prompts.md` Abschnitt 5.1 (IDs, Zielzonen, Level, Rolle, Typ, Standarddauer / -wiederholungen, boden, wand, belastungen, schwangerschaft_geeignet, premium, MET). Texte (Name, Beschreibung, 3 bis 5 Schritte, Atemhinweis, 2 bis 3 häufige Fehler) auf DE und EN, fachlich sinnvoll formuliert. Varianten leichter / schwerer verknüpfen, wo eine passende Übung in der Liste existiert
- [x] `assets/content/workouts.json` mit mindestens 16 Workouts verteilt auf die Kategorien aus /F300/ (Wall Pilates, Ganzkörper, Bauch, Po & Beine, Arme, Rücken / Haltung, Stretching, Anfänger), je 5 bis 20 Minuten, `premium` gemäß /F1200/
- [x] `assets/content/challenges.json`: Wall Pilates 28 Tage (gratis), Bauch 14 Tage (Premium)
- [x] Platzhalter-Medien: Skript `scripts/generate-placeholders` erzeugt pro Übung `assets/content/thumbs/<id>.jpg` (Graustufen-Fläche mit Übungsname, siehe `docs/DESIGN.md` Abschnitt 8) und verwendet für alle Übungen ein kleines gemeinsames Platzhalter-Loop-Video. Ersatz durch echte Videos darf keine Codeänderung erfordern
- [x] Skript erzeugt `src/data/content/media.generated.ts` (Zuordnung ID → `require(...)`), weil Metro nur statische `require`-Pfade bündelt; das Skript bevorzugt `videos/<id>.mp4`, falls vorhanden, sonst den Platzhalter
- [x] Content-Loader mit Validierung beim Start (im Dev-Modus Fehler bei ungültigen Daten)
- [x] Tests: Schema-Validierung aller Dateien, 50 eindeutige IDs, alle in Workouts referenzierten Übungen existieren, Varianten-Verweise gültig, mindestens 15 Übungen mit `boden = false`

Demo: Entdecken-Tab zeigt eine einfache Liste aller Workouts mit Platzhalter-Thumbnails.

Prototyp-Stand:

- Schemas verwenden die deutschen Feldnamen aus /D020/ und /D030/; Texte als `{ de, en }`. Ein zusätzliches Feld `zielzonen: rücken` ("ruecken") ergänzt die Zonen-Liste, weil die Übungsliste Rücken als Zielzone führt
- 21 Workouts (alle 8 Kategorien, 5 bis 13 Minuten). `premium` folgt /F1200/ (Anfänger, Ganzkörper, Wall Pilates frei, Rest Premium); freie Workouts enthalten keine Premium-Übungen (Test)
- Geschätzte Dauer: Zeitübungen nach `dauer_s`, Wiederholungsübungen mit 4 s pro Wiederholung, plus Pausen (10 s)
- Zwei Challenges: Wall Pilates 28 Tage (gratis, 6 Ruhetage, Tag 28 ist ein Trainingstag) und Bauch 14 Tage (Premium, 3 Ruhetage)
- Platzhalter: 50 Graustufen-Thumbnails (512 x 512) und ein gemeinsames Loop-Video (`assets/content/videos/placeholder.mp4`, 4 s) sind eingecheckt; `npm run generate:placeholders` erzeugt fehlende Dateien und `media.generated.ts` neu und bevorzugt `videos/<id>.mp4`
- Der Content-Loader wirft im Dev-Modus bei ungültigen Daten, in Produktion wird nur geloggt
- Die fachlichen Texte (Schritte, Fehler, Atemhinweise) sind eine Erstfassung und müssen fachlich freigegeben werden (siehe auch Hinweis zu Belastungen im Übungsverzeichnis)

Demo: Entdecken-Tab zeigt alle Workouts je Kategorie mit Platzhalter-Thumbnails.

## Phase 2: Lokale Datenbank und Domänenlogik

- [ ] expo-sqlite + Drizzle ORM, Migrationen, Tabellen für /D010/, /D040/, /D050/, /D060/, /D070/, /D080/, /D090/ sowie Favoriten
- [ ] DB-Zugriff nur über Repositories in `src/data/`
- [ ] Verschlüsselung (/S040/) vorbereiten: SQLCipher-Option in der Konfiguration, aktiv nur im Development Build; in Expo Go unverschlüsselt mit Log-Hinweis. Schlüssel in expo-secure-store
- [ ] Domänenfunktionen mit Tests: kcal (inkl. Standardgewicht 65 kg und Schätzungs-Kennzeichen), BMI mit Einordnung, Streak (Ruhetage unterbrechen nicht, /F240/), Einheitenumrechnung kg/lb, cm/ft-in
- [ ] Zustand-Stores für Profil und Einstellungen, persistiert über die DB

Demo: keine sichtbare Änderung nötig; Tests grün.

## Phase 3: Onboarding

Umsetzung von /F010/ bis /F100/ (Paywall /F110/ entfällt in Stufe 1).

- [ ] Ablauf eine Frage pro Bildschirm, Fortschrittsbalken, große Auswahlkarten (Pflichtenheft 8.2)
- [ ] Reihenfolge: Begrüßung → Ziel → Geschlecht / Geburtsjahr → Altersprüfung (/F032/) → Gesundheitshinweis (/F035/) → Einwilligung Gesundheitsdaten (/F038/) → Körperdaten (/F040/, nur mit Einwilligung) → Erfahrung → Zielzonen → Einschränkungen inkl. Schwangerschaft (/F070/) → Trainingstage / Uhrzeit → Planvorschau (/F090/) → Benachrichtigungsberechtigung (/F100/)
- [ ] Unter 16: Hinweis, keine Speicherung, Onboarding endet (/T150/)
- [ ] Ohne Einwilligung: Körperdaten und BMI überspringen (/T160/)
- [ ] Profil speichern, danach Weiterleitung zur Plan-Startseite; Onboarding nur beim ersten Start
- [ ] Tests für Navigationslogik (welcher Schritt folgt auf welchen, abhängig von Antworten)

Demo: Onboarding in Expo Go komplett durchklicken, beide Varianten (mit / ohne Einwilligung).

## Phase 4: Plan-Generator und Planansicht

- [ ] Plan-Generator in `src/domain/` gemäß Pflichtenheft Kapitel 10 und Tabelle "Abbildung Einschränkung auf Übung" (Kapitel 5): filtern, Aufwärmen / Hauptteil / Cool-down, Zielzonen gewichtet, Progression alle 5 bis 7 Tage ca. 10 %, Ruhetage. Deterministisch über Seed (testbar)
- [ ] Tests: /T010/ (30 Tage), /T020/ (kein Boden), /T170/ (Schwangerschaft), jede Kombination der drei Level erzeugt gültige Pläne, keine leeren Tage
- [ ] Freischaltung und Ruhetage nach /F230/ und /F240/, Test /T180/
- [ ] Plan-Tab: Karte "Tag X" mit Dauer, Übungsanzahl, kcal (/F220/), Raster der 30 Tage mit Status (/F210/), Button "Ruhetag abschließen"
- [ ] Challenges auswählen und starten (/F260/), Plan zurücksetzen / neu generieren mit Bestätigung (/F250/)
- [ ] Adaptive Anpassung (/F270/): Funktion vorbereiten, die Feedback der letzten Session auf Folgetage anwendet (wird in Phase 7 aufgerufen)

Demo: nach dem Onboarding erscheint der persönliche Plan; Challenge starten.

## Phase 5: Bibliothek, Suche, Übungsdetails

- [ ] Entdecken-Tab mit Kategorien (/F300/), Filter nach Level, Dauer, Zielzone, Wand, Boden (/F310/)
- [ ] Stichwortsuche über Workouts und Übungen, DE und EN, tolerant gegenüber Umlauten und Groß- / Kleinschreibung (/F320/, Test /T130/ mit "Brücke")
- [ ] Workout-Detailseite (/F330/) inkl. Anpassung von Dauer / Wiederholungen vor dem Start (/F440/)
- [ ] Favoriten (/F340/), Premium-Schloss-Symbol (/F360/), Premium-Inhalte in Stufe 1 trotzdem nutzbar (Schalter in den Entwicklereinstellungen, Standard: alles frei)
- [ ] Übungsdetail: Video in Schleife, stumm (/F400/), Schritte, Atemhinweis, Fehler (/F410/), Fokusbereiche als einfache Körpergrafik (SVG, /F420/), Varianten (/F430/)

Demo: Suche "Brücke", Filter "ohne Boden", Übungsdetail mit Platzhalter-Video.

## Phase 6: Workout-Player

Kernstück; Logik strikt von UI trennen.

- [ ] Player-Engine in `src/domain/player/` als reine Zustandsmaschine (Vorbereitung, Übung, Pause, fertig, abgebrochen) mit injizierbarer Uhr; Zeit über Zeitstempel berechnet, nicht über Ticks (/L060/)
- [ ] Tests mit Fake-Uhr: /T030/ (läuft ohne Eingriff bis zum Ende), /T040/ (Pause überspringen), /T050/ (Halbzeit bei 15 s einer 30-s-Übung), +20 s, vorherige / nächste, Pause / Fortsetzen, Wiederholungsübung mit Weiter
- [ ] Player-Screen gemäß 8.2: Video oben ca. 50 %, großer Timer, Fortschrittsbalken, Steuerung unten, lesbar aus 2 m (/F500/ bis /F530/, /F580/, /F590/)
- [ ] Sprachausgabe mit expo-speech: Übungsname, Start, Halbzeit, letzte 3 Sekunden, Ende, nächste Übung (/F540/, /F550/), Sprache gemäß App-Sprache
- [ ] Hintergrundmusik mit expo-audio, Ein / Aus, getrennte Lautstärken Stimme / Musik (/F560/); Audio-Modus so, dass fremde Musik geduckt statt gestoppt wird (/F570/, /T140/). Platzhalter-Musikdatei (lizenzfrei oder generierter Ton) verwenden
- [ ] Display bleibt an (expo-keep-awake, /F600/)
- [ ] Abbruchdialog (/F610/), Fortsetzen nach Neustart (/F620/, /T070/): Player-Zustand in DB sichern
- [ ] Hintergrund / Sperre: Timer korrekt nach Rückkehr (Zeitstempel). Medienbenachrichtigung (/F630/) nur im Development Build, in Expo Go sauber deaktiviert; Umsetzung als eigener Punkt dokumentieren, falls nicht in dieser Phase möglich

Demo: ein komplettes Workout in Expo Go laufen lassen, ohne etwas anzufassen.

## Phase 7: Workout-Abschluss und Fortschritt

- [ ] Automatischer Abschluss (/F700/), Session speichern, Plantag erledigt (/F750/)
- [ ] Abschlussbildschirm: Dauer, Übungen, kcal (ggf. als Schätzung), Streak (/F710/), Feedback zu leicht / passend / zu schwer (/F720/) → adaptive Anpassung aus Phase 4 aufrufen, Gewicht eintragen (nur mit Einwilligung, /F730/)
- [ ] Fortschritt-Tab: Gesamtstatistik (/F800/), Wochen-Balkendiagramm (/F810/), Kalender (/F820/), Streak (/F830/), Gewichtsverlauf mit Hinzufügen / Bearbeiten / Löschen (/F840/), BMI (/F850/, /T110/), Historie (/F860/)
- [ ] CSV-Export über Teilen-Dialog (/F880/)

Demo: Workout abschließen, Statistik und Kalender aktualisieren sich.

## Phase 8: Erinnerungen, Einstellungen, Datenschutz

- [ ] Erinnerungen mit expo-notifications: Uhrzeit, Wochentage, mehrere, aktiv / inaktiv (/F900/ bis /F920/); geplante lokale Benachrichtigungen bleiben nach Neustart bestehen (/F930/, /T090/ manuell prüfen)
- [ ] Profil-Tab: Profil bearbeiten (/F1100/), Einheiten (/F1110/), Sprache, Stimme mit Testansage (/F1120/), Countdown- und Pausendauer (/F1130/)
- [ ] Datenschutz: Einwilligung ansehen und widerrufen (/S100/), alle Daten löschen (/F1150/, /T120/), Datenexport (/S070/), Gesundheitshinweis erneut abrufbar (/S090/)
- [ ] Rechtliche Seiten als Platzhaltertexte: Datenschutzerklärung (inkl. Hinweis KI-generierte Videos), Nutzungsbedingungen, Impressum, Support-Kontakt (/F1160/)
- [ ] Entwicklereinstellungen (nur im Dev-Modus): Premium-Schalter, Onboarding zurücksetzen, Testdaten erzeugen

Demo: Erinnerung in 2 Minuten setzen und erhalten; Daten löschen führt zurück zum Onboarding.

## Phase 9: Feinschliff und MVP-Abnahme

- [ ] Offline-Prüfung: gesamte App ohne Netz nutzbar (/M11/, /T080/)
- [ ] Barrierefreiheit (/L090/): Screenreader-Labels, skalierbare Schrift, Kontrast WCAG AA in Hell und Dunkel
- [ ] Übersetzungen DE / EN vollständig, keine fehlenden Schlüssel (Test)
- [ ] Leistung: Kaltstart, Listen virtualisiert, Bildgrößen (/L010/, /L020/)
- [ ] `eas.json` mit Profilen `development`, `preview`, `production`; Anleitung für Development Build im README (für /S040/ und /F630/)
- [ ] `docs/ABNAHME.md`: Checkliste aller Abnahmekriterien Stufe 1 (Pflichtenheft Kapitel 12) mit Status, welche Testfälle automatisiert sind und welche manuell auf dem Gerät geprüft werden müssen
- [ ] Offene Punkte und bekannte Einschränkungen dokumentieren

Demo: vollständiger Durchlauf Onboarding → Workout → Fortschritt in Expo Go.

---

## Nach Stufe 1 (nicht Teil dieses Plans)

Echte Videos einbinden (`docs/higgsfield_video_prompts.md`), Backend, Konto und Sync, Werbung und Abo (/M09/), Health Connect / Apple Health, eigene Workouts, Wissensartikel. Dafür wird ein eigener Plan erstellt.
