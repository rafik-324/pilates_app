# Pilates at Home (Arbeitstitel)

Mobile Pilates- und Wall-Pilates-App für zu Hause. React Native mit Expo (SDK 58), TypeScript, Expo Router. Anforderungen: `pflichtenheft_pilates_workout_at_home.md`, Plan: `docs/DEV_PLAN.md`, Design: `docs/DESIGN.md`.

## Voraussetzungen

- Node.js LTS (getestet mit 22)
- Expo Go (aktuelle Version) auf dem Handy: Play Store / App Store

## Installation

```bash
npm install
```

## Prototyp testen

```bash
git checkout prototype
npm install
npm start
```

1. QR-Code im Terminal mit Expo Go scannen (Android: in Expo Go; iOS: mit der Kamera-App)
2. Handy und Rechner müssen im selben WLAN sein
3. Anderes Netz oder Verbindungsprobleme: `npm run start:tunnel`

Hell / Dunkel und Deutsch / Englisch lassen sich im Tab "Profil" umschalten. Dort gibt es im Entwicklungsmodus auch die Theme-Vorschau.

## Demo mit Expo Go (Schritt für Schritt)

1. Expo Go aus dem Play Store / App Store installieren
2. Im Projektordner `npm install`, dann `npm start`
3. Handy im selben WLAN: QR-Code mit Expo Go (Android) bzw. Kamera-App (iOS) scannen
4. Anderes Netz oder Probleme: `npm run start:tunnel`

## Skripte

| Skript | Zweck |
|---|---|
| `npm start` | Expo Dev Server |
| `npm run start:tunnel` | Dev Server mit Tunnel (anderes Netz) |
| `npm run typecheck` | TypeScript (strict) |
| `npm run lint` | ESLint (inkl. Regeln gegen feste Farben / Abstände im Feature-Code) |
| `npm test` | Jest (jest-expo) |
| `npm run doctor` | `expo-doctor` |

Abhängigkeiten immer mit `npx expo install <paket>` hinzufügen.

## Verwendete SDK-Version

Expo SDK 58 (React Native 0.88, React 19.3, Expo Router 58).
