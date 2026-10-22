# Entwicklungsplan Stufe 1 (MVP)

Stand: 22.10.2026. Grundlage: `pflichtenheft_pilates_workout_at_home.md` (Version 1.1).

Dieser Plan wird Phase für Phase von Claude-Cloud-Sessions abgearbeitet. Regeln dazu stehen in `CLAUDE.md`.

## Status

| Phase | Thema | Status |
|---|---|---|
| 0 | Projekt-Setup (Expo, Tooling, Expo Go, CI) | erledigt (Prototyp) |
| 1 | Inhaltsdaten und Platzhalter-Medien | erledigt (Prototyp) |
| 2 | Lokale Datenbank und Domänenlogik | erledigt (Prototyp) |
| 3 | Onboarding | erledigt (Prototyp) |
| 4 | Plan-Generator und Planansicht | erledigt (Prototyp) |
| 5 | Bibliothek, Suche, Übungsdetails | erledigt (Prototyp) |
| 6 | Workout-Player | erledigt (Prototyp) |
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

- [x] expo-sqlite + Drizzle ORM, Migrationen, Tabellen für /D010/, /D040/, /D050/, /D060/, /D070/, /D080/, /D090/ sowie Favoriten
- [x] DB-Zugriff nur über Repositories in `src/data/`
- [x] Verschlüsselung (/S040/) vorbereiten: SQLCipher-Option in der Konfiguration, aktiv nur im Development Build; in Expo Go unverschlüsselt mit Log-Hinweis. Schlüssel in expo-secure-store
- [x] Domänenfunktionen mit Tests: kcal (inkl. Standardgewicht 65 kg und Schätzungs-Kennzeichen), BMI mit Einordnung, Streak (Ruhetage unterbrechen nicht, /F240/), Einheitenumrechnung kg/lb, cm/ft-in
- [x] Zustand-Stores für Profil und Einstellungen, persistiert über die DB

Demo: keine sichtbare Änderung nötig; Tests grün.

Prototyp-Stand:

- Drizzle-Schema in `src/data/db/schema.ts`; Migrationen erzeugt `npm run db:generate` (drizzle-kit + `scripts/build-migrations.mjs`, bündelt die SQL-Dateien als `migrations.generated.ts`, damit kein Metro-SQL-Loader nötig ist). Migration beim Start über `drizzle-orm/expo-sqlite/migrator`
- Tabellen: profile, plans, plan_days, sessions, weight_entries, reminders, settings, favorites, kv (Dev-Schalter, Zähler). Persönliche Pläne werden generiert und deshalb mit ihren Übungen als JSON in `plan_days` gespeichert
- Repositories (`src/data/repositories/`) arbeiten gegen ein synchrones Drizzle-Interface und sind mit sql.js (In-Memory, echte Migrationen) getestet. `deleteAllData()` für /F1150/ ist vorbereitet. Größe / Gewicht werden ohne Einwilligung nie gespeichert (im Repository erzwungen)
- Verschlüsselung (/S040/): Plugin `expo-sqlite` mit `useSQLCipher: true` in `app.json`; zur Laufzeit wird in Expo Go nur ein Hinweis geloggt, im Development Build wird ein zufälliger Schlüssel in expo-secure-store erzeugt und per `PRAGMA key` gesetzt
- Stores: `useSettings` (Einstellungen /D090/ inkl. Farbschema und Sprache, ersetzt den Speicher-Store aus Phase 0) und `useProfile`; Start über `initData()` im Root-Layout (Splash bleibt bis DB und Schrift geladen sind)
- Domäne: kcal, BMI, Streak (Ruhetage unterbrechen nicht), Einheiten, Datumshilfen, Altersprüfung; alle mit Unit-Tests
- Offen: Verschlüsselung ist ohne Development Build nicht getestet. Ein Wechsel einer bereits unverschlüsselt angelegten DB auf SQLCipher (Migration) ist nicht umgesetzt; für das Prototyp-Stadium nicht nötig

Demo: keine sichtbare Änderung; Tests grün. Hell / Dunkel und Sprache bleiben nach App-Neustart erhalten.

## Phase 3: Onboarding

Umsetzung von /F010/ bis /F100/ (Paywall /F110/ entfällt in Stufe 1).

- [x] Ablauf eine Frage pro Bildschirm, Fortschrittsbalken, große Auswahlkarten (Pflichtenheft 8.2)
- [x] Reihenfolge: Begrüßung → Ziel → Geschlecht / Geburtsjahr → Altersprüfung (/F032/) → Gesundheitshinweis (/F035/) → Einwilligung Gesundheitsdaten (/F038/) → Körperdaten (/F040/, nur mit Einwilligung) → Erfahrung → Zielzonen → Einschränkungen inkl. Schwangerschaft (/F070/) → Trainingstage / Uhrzeit → Planvorschau (/F090/) → Benachrichtigungsberechtigung (/F100/)
- [x] Unter 16: Hinweis, keine Speicherung, Onboarding endet (/T150/)
- [x] Ohne Einwilligung: Körperdaten und BMI überspringen (/T160/)
- [x] Profil speichern, danach Weiterleitung zur Plan-Startseite; Onboarding nur beim ersten Start
- [x] Tests für Navigationslogik (welcher Schritt folgt auf welchen, abhängig von Antworten)

Demo: Onboarding in Expo Go komplett durchklicken, beide Varianten (mit / ohne Einwilligung).

Prototyp-Stand:

- Ablauf als Zustandsmaschine in `src/domain/onboarding.ts` (`nextStep`, `stepProgress`), UI in `src/features/onboarding/`. Antworten liegen nur im Speicher; das Profil wird erst am Ende gespeichert, daher werden unter 16 (Schritt "underage") und bei Abbruch keine Daten gespeichert (/T150/)
- Zusätzliche Entscheidungen: Geschlecht und Geburtsjahr sind zwei Bildschirme (eine Frage pro Bildschirm); bei Schwangerschaft folgt ein eigener Arzthinweis-Schritt, der bestätigt werden muss (/F070/); Trainingszeit als Auswahl (7 / 12 / 18 / 21 Uhr oder keine Vorgabe); Körperdaten sind auch mit Einwilligung überspringbar
- Unter 16: "Eingabe korrigieren" führt zurück zum Geburtsjahr (nichts gespeichert); die Altersprüfung arbeitet jahrgangsgenau (Jahr minus Geburtsjahr >= 16)
- Planvorschau (/F090/) zeigt Tage, Häufigkeit, Level, Fokus; mit Einwilligung zusätzlich BMI und Zielprognose (max. 0,5 kg pro Woche, Warnung bei Zielgewicht im Untergewicht), ohne Einwilligung einen Hinweis statt Prognose. Der eigentliche Plan wird in Phase 4 erzeugt
- Onboarding nur beim ersten Start: Tabs leiten ohne Profil nach `/onboarding`, `/onboarding` leitet mit Profil nach `/`
- Neue UI-Komponente `TextField` im Design-System
- Tests: Navigationslogik, Prognose, `buildProfile`, UI-Durchläufe mit und ohne Einwilligung, unter 16, Schwangerschaft
- Offen: Die Benachrichtigungsberechtigung wird abgefragt; das tatsächliche Anlegen einer Erinnerung zur gewählten Uhrzeit folgt in Phase 8

Demo: Onboarding in Expo Go komplett durchklicken, beide Varianten (mit / ohne Einwilligung). Zum erneuten Starten die App-Daten löschen (Expo Go: Projekt entfernen oder App-Speicher leeren), bis Phase 8 die Funktion "Daten löschen" liefert.

## Phase 4: Plan-Generator und Planansicht

- [x] Plan-Generator in `src/domain/` gemäß Pflichtenheft Kapitel 10 und Tabelle "Abbildung Einschränkung auf Übung" (Kapitel 5): filtern, Aufwärmen / Hauptteil / Cool-down, Zielzonen gewichtet, Progression alle 5 bis 7 Tage ca. 10 %, Ruhetage. Deterministisch über Seed (testbar)
- [x] Tests: /T010/ (30 Tage), /T020/ (kein Boden), /T170/ (Schwangerschaft), jede Kombination der drei Level erzeugt gültige Pläne, keine leeren Tage
- [x] Freischaltung und Ruhetage nach /F230/ und /F240/, Test /T180/
- [x] Plan-Tab: Karte "Tag X" mit Dauer, Übungsanzahl, kcal (/F220/), Raster der 30 Tage mit Status (/F210/), Button "Ruhetag abschließen"
- [x] Challenges auswählen und starten (/F260/), Plan zurücksetzen / neu generieren mit Bestätigung (/F250/)
- [x] Adaptive Anpassung (/F270/): Funktion vorbereiten, die Feedback der letzten Session auf Folgetage anwendet (wird in Phase 7 aufgerufen)

Demo: nach dem Onboarding erscheint der persönliche Plan; Challenge starten.

Prototyp-Stand:

- Generator in `src/domain/plan/` (rein, seed-basiert): Pool nach Einschränkungen (Kapitel 5) und Level filtern; pro Trainingstag 2 Aufwärmübungen, Hauptteil in zwei Runden (4 / 5 / 6 Übungen je Level, nach Zielzonen gewichtet, Vortagsübungen seltener), 1 bis 2 Cool-downs. Progression: alle 6 Tage x1,1 auf Dauer / Wiederholungen. Übungen mit höherem Level fließen erst in der zweiten Planhälfte ein. Persönliche Pläne enthalten bewusst auch Übungen mit `premium = true` (Stufe 1: alles frei; Zuordnung für Stufe 2 offen)
- Ruhetage: jeder 4. Tag (bei 2 Trainingstagen / Woche jeder 3., ab 5 jeder 5. Tag); Tag 30 ist immer ein Trainingstag. Ein Ruhetag wird mit "Ruhetag abschließen" oder automatisch am nächsten Kalendertag erledigt und auf den Folgetag des vorherigen Abschlusses datiert, damit der Streak nicht reißt (/T180/)
- Freischaltung (/F230/): nur der erste nicht erledigte Tag ist offen, kein Kalendersperre
- Adaptive Anpassung (/F270/): `adaptUpcomingDays` wirkt auf die nächsten 3 Trainingstage (zu schwer: -10 % und leichtere Variante, zu leicht: +10 % und schwerere Variante, höchstens ein Level über dem Profil, Einschränkungen bleiben maßgeblich); `applyFeedback` im Plan-Service wird in Phase 7 aufgerufen
- Plan-Service (`src/features/plan/service.ts`) orchestriert Repositories, Generator, Ruhetage, Challenges; getestet gegen echte SQLite-Migrationen (sql.js)
- Plan-Tab: Tageskarte (inverse) mit Dauer, Übungen, kcal (Schätzung gekennzeichnet), Raster mit 30 Tagen, Fortschritt, Challenges starten / beenden, Plan zurücksetzen mit Bestätigung. Challenges sind in Stufe 1 trotz Premium-Kennzeichnung startbar
- Der Start-Button öffnet vorerst die Workout-Detailseite (`/workout`), der Player folgt in Phase 6
- Zusätzlich (für Tests des Prototyps): im Profil-Tab im Dev-Modus "Daten löschen, Onboarding neu starten" (`deleteAllLocalData`, wird in Phase 8 für /F1150/ weiterverwendet)

Demo: nach dem Onboarding erscheint der persönliche Plan; Challenge starten.

## Phase 5: Bibliothek, Suche, Übungsdetails

- [x] Entdecken-Tab mit Kategorien (/F300/), Filter nach Level, Dauer, Zielzone, Wand, Boden (/F310/)
- [x] Stichwortsuche über Workouts und Übungen, DE und EN, tolerant gegenüber Umlauten und Groß- / Kleinschreibung (/F320/, Test /T130/ mit "Brücke")
- [x] Workout-Detailseite (/F330/) inkl. Anpassung von Dauer / Wiederholungen vor dem Start (/F440/)
- [x] Favoriten (/F340/), Premium-Schloss-Symbol (/F360/), Premium-Inhalte in Stufe 1 trotzdem nutzbar (Schalter in den Entwicklereinstellungen, Standard: alles frei)
- [x] Übungsdetail: Video in Schleife, stumm (/F400/), Schritte, Atemhinweis, Fehler (/F410/), Fokusbereiche als einfache Körpergrafik (SVG, /F420/), Varianten (/F430/)

Demo: Suche "Brücke", Filter "ohne Boden", Übungsdetail mit Platzhalter-Video.

Prototyp-Stand:

- Suche und Filter rein funktional in `src/domain/library.ts`: Normalisierung (klein, ä = ae = a, ß = ss, Akzente und Satzzeichen entfernt), alle Suchwörter müssen vorkommen; durchsucht Name, Beschreibung und ID der Übungen auf DE und EN, Workouts über Titel und enthaltene Übungen. /T130/ ("Brücke", "BRUECKE", "bridge") als Unit- und UI-Test
- Filter als Chips: Favoriten, ohne / mit Boden, mit / ohne Wand, Level, Dauer (bis 7 / 8–10 / über 10 Min.), Zielzone. Ein Workout gilt als "mit Boden" bzw. "mit Wand", sobald eine enthaltene Übung das tut. Bei aktiver Suche oder Filter werden Workouts und passende Übungen getrennt gelistet, sonst die Kategorien
- Workout-Detail: Kennzahlen, Favorit (Herz), Button "Anpassen" mit +/- je Übung (Zeit in 5-s-Schritten 10 bis 180 s, Wiederholungen 1 bis 50), Übung antippen öffnet das Übungsdetail. "Workout starten" übergibt die angepasste Übungsliste an den Player
- Übungsdetail (`/exercise?id=`): Video über `expo-video` in Schleife und stumm, Kennzeichen (Level, Dauer, Wand, Boden, Schwangerschaft), Schritte, Atmung, Fehler, Körpergrafik als SVG (Vorder- und Rückseite, Zonen in `accent`, neue Komponente `BodyMap`), Varianten leichter / schwerer verlinkt
- Premium (/F360/): Schloss-Symbol in Listen und Details. Entwicklerschalter "Premium-Inhalte freigeschaltet" im Profil (Dev-Modus, gespeichert in `kv`, Standard an); aus = Premium-Workouts nicht startbar
- Favoriten und Schalter liegen im Store `src/features/library/store.ts`; "Daten löschen" setzt ihn zurück
- Bis Phase 6 öffnet "Workout starten" einen Platzhalter-Screen

## Phase 6: Workout-Player

Kernstück; Logik strikt von UI trennen.

- [x] Player-Engine in `src/domain/player/` als reine Zustandsmaschine (Vorbereitung, Übung, Pause, fertig, abgebrochen) mit injizierbarer Uhr; Zeit über Zeitstempel berechnet, nicht über Ticks (/L060/)
- [x] Tests mit Fake-Uhr: /T030/ (läuft ohne Eingriff bis zum Ende), /T040/ (Pause überspringen), /T050/ (Halbzeit bei 15 s einer 30-s-Übung), +20 s, vorherige / nächste, Pause / Fortsetzen, Wiederholungsübung mit Weiter
- [x] Player-Screen gemäß 8.2: Video oben ca. 50 %, großer Timer, Fortschrittsbalken, Steuerung unten, lesbar aus 2 m (/F500/ bis /F530/, /F580/, /F590/)
- [x] Sprachausgabe mit expo-speech: Übungsname, Start, Halbzeit, letzte 3 Sekunden, Ende, nächste Übung (/F540/, /F550/), Sprache gemäß App-Sprache
- [x] Hintergrundmusik mit expo-audio, Ein / Aus, getrennte Lautstärken Stimme / Musik (/F560/); Audio-Modus so, dass fremde Musik geduckt statt gestoppt wird (/F570/, /T140/). Platzhalter-Musikdatei (lizenzfrei oder generierter Ton) verwenden
- [x] Display bleibt an (expo-keep-awake, /F600/)
- [x] Abbruchdialog (/F610/), Fortsetzen nach Neustart (/F620/, /T070/): Player-Zustand in DB sichern
- [x] Hintergrund / Sperre: Timer korrekt nach Rückkehr (Zeitstempel). Medienbenachrichtigung (/F630/) nur im Development Build, in Expo Go sauber deaktiviert; Umsetzung als eigener Punkt dokumentieren, falls nicht in dieser Phase möglich

Demo: ein komplettes Workout in Expo Go laufen lassen, ohne etwas anzufassen.

Prototyp-Stand:

- Engine `src/domain/player/engine.ts`: Phasen Vorbereitung, Übung, Pause, fertig; Zeit nur aus Zeitstempeln (`now` wird übergeben). `tick` holt nach Hintergrund / Sperre alle verpassten Phasenwechsel exakt nach. Aktionen: weiter / überspringen, vorherige, Pause / Fortsetzen, +20 s, Wiederholungen bestätigen. Ereignisse für Ansagen: Phasenwechsel, Halbzeit (ab 10-s-Übungen), Countdown 3 / 2 / 1, fertig. 13 Unit-Tests mit Fake-Uhr (/T030/, /T040/, /T050/, /T070/, Pause, +20 s, Navigation, Wiederholungen, Hintergrund)
- "Abgebrochen" ist kein eigener Engine-Zustand: der Abbruch speichert eine Session mit `abgeschlossen = false` und Grund (neue Spalten `abbruch_grund`, `uebungen_gesamt`, Migration 0001) und sichert den pausierten Zustand
- Player-Screen (`/player`, immer dunkel): Fortschrittsbalken, Video ca. 50 % der Höhe, Name, Timer im `timer`-Stil, Steuerung als `IconButton`s; Wiederholungsübung mit "Fertig, weiter"; Vorbereitung und Pause mit "Jetzt starten" / "Überspringen" und "+20 s". Wischgeste zurück ist im Player gesperrt, die Zurück-Taste (Android) öffnet den Abbruchdialog
- Sprachausgabe (expo-speech, Sprache der App, Stimme / Lautstärke aus den Einstellungen): Vorbereitung mit erster Übung, Übungsstart mit Dauer bzw. Wiederholungen, Halbzeit, Pause mit nächster Übung, Abschluss. Letzte 3 Sekunden als Signalton
- Musik (expo-audio): Platzhalter-Schleife und Signalton werden synthetisch von `npm run generate:audio` erzeugt (`assets/audio/`, lizenzfrei). Ton-Sheet im Player: Musik an / aus, Lautstärke Stimme und Musik getrennt (in den Einstellungen gespeichert). Audio-Modus `duckOthers`: fremde Musik läuft leiser weiter (/F570/)
- Pausendauer kommt aus den Einstellungen (`pauseS`, Standard 10 s), nicht aus dem Workout, damit /F1130/ überall gilt; Countdown aus `countdownS`
- Fortsetzen (/F620/): Zustand liegt bei jedem Phasenwechsel, beim Wechsel in den Hintergrund und beim Abbruch in `kv` (`player.resume`). Der Plan-Tab zeigt dann "Unterbrochenes Workout" mit Fortsetzen / Verwerfen; die Zeit seit dem Schließen zählt als Pause. Beim Abschluss wird dieselbe Session aktualisiert
- Regulärer Abschluss: Session speichern (kcal aus tatsächlich trainierter Zeit je Übung), Plantag erledigt, Weiterleitung auf `/complete` (einfacher Abschlussbildschirm, Ausbau in Phase 7)
- Offen: Medienbenachrichtigung und Weiterlaufen bei gesperrtem Bildschirm (/F630/, /T060/ Benachrichtigung) brauchen einen Development Build mit Hintergrund-Audio und sind nicht umgesetzt. Der Timer selbst stimmt nach Rückkehr, Ansagen während der Sperre entfallen
- Offen: Sprachausgabe, Ducking und Musik sind nur in Jest (gemockt) geprüft, nicht auf einem Gerät

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
