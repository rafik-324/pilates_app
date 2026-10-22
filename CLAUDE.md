# Pilates at Home (Arbeitstitel)

Mobile Pilates- und Wall-Pilates-App für zu Hause. React Native mit Expo, TypeScript. Demos laufen über die App Expo Go.

## Wichtige Dokumente

- `pflichtenheft_pilates_workout_at_home.md`: Anforderungen. IDs wie /F500/, /D020/, /T030/ verweisen dorthin
- `docs/DEV_PLAN.md`: Phasenplan Stufe 1 mit Status und Checkboxen
- `docs/higgsfield_video_prompts.md`: verbindliche Liste der 50 Übungen (IDs, Flags) und Videoproduktion

## Arbeitsweise für Cloud-Sessions

1. `docs/DEV_PLAN.md` lesen und die **erste Phase mit Status `offen` oder `in Arbeit`** bearbeiten. Keine Arbeit an späteren Phasen vorziehen, keine Stufe-2-Funktionen (Backend, Konto, Werbung, Abo, Health Connect)
2. Pro Phase ein Branch `phase-<n>-<kurzname>`, am Ende ein Pull Request nach `main`
3. Vor dem Abschluss die allgemeine Definition of Done im DEV_PLAN erfüllen, Checkboxen abhaken und die Statustabelle aktualisieren
4. Kann ein Punkt nicht umgesetzt werden, im DEV_PLAN unter der Phase als "Offen:" mit Grund vermerken statt ihn stillschweigend auszulassen
5. Widerspricht sich etwas zwischen Plan und Pflichtenheft, gilt das Pflichtenheft. Entscheidungen, die dort nicht geregelt sind, kurz im PR beschreiben
6. Commit-Nachrichten auf Englisch, Doku und UI-Texte auf Deutsch (EN-Übersetzung zusätzlich über i18n)

## Technische Regeln

- **Expo Go muss funktionieren.** Nur Bibliotheken, die in Expo Go enthalten sind. Ausnahmen (nur Development Build): SQLCipher-Verschlüsselung und Sperrbildschirm-Steuerung, beide mit Fallback in Expo Go (Pflichtenheft 3.3)
- Abhängigkeiten immer mit `npx expo install <paket>` hinzufügen, nie mit festen Versionen per `npm install`
- Keine nativen Ordner (`ios/`, `android/`) einchecken; Konfiguration nur über `app.json` / `app.config.ts` und Config Plugins
- Domänenlogik (`src/domain/`) ohne React- und Expo-Importe, vollständig mit Jest testbar
- Timer zeitstempelbasiert, nie über gezählte Intervalle
- Alle UI-Texte über i18n (`src/i18n/de.json`, `en.json`)
- Medien nur über `src/data/content/media.generated.ts` einbinden (wird von `scripts/generate-placeholders` erzeugt)
- Gesundheitsdaten (Gewicht, Größe) nur speichern, wenn die Einwilligung /F038/ erteilt ist

## Befehle

```bash
npm install
npm start              # Expo Dev Server, QR-Code mit Expo Go scannen
npm run start:tunnel   # falls Handy nicht im selben Netz
npm run typecheck
npm run lint
npm test
npx expo-doctor
```

(Die Skripte werden in Phase 0 angelegt.)
