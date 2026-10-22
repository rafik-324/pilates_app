# Design-System

Stand: 22.10.2026. Ergänzt Pflichtenheft Kapitel 8. Verbindlich für alle UI-Arbeiten.

## 1. Leitlinie

**Minimalistisch, Schwarz-Weiß, sehr sparsame Akzente.**

- Die Oberfläche besteht fast nur aus Schwarz, Weiß und Grautönen
- **Lila (shiny)** ist die einzige Markenfarbe. Sie markiert die eine wichtigste Aktion eines Bildschirms
- **Grün** steht nur für Erfolg und Bestätigung, **Rot** nur für Fehler, Abbruch und Löschen
- Viel Weißraum, klare Typografie, Linien statt Schatten, keine Dekoration
- Faustregel: **höchstens ein lila Element pro Bildschirm**, Grün und Rot nur, wenn der Zustand es verlangt

## 2. Austauschbarkeit (Architektur)

Die UI muss sich ändern lassen, ohne Feature-Code anzufassen. Dafür gibt es drei Ebenen:

```
src/ui/theme/
  palette.ts          Ebene 1: rohe Farbwerte (nur hier stehen Hex-Codes)
  themes/
    mono.ts           Ebene 2: semantische Tokens je Theme (hell + dunkel)
    index.ts          Registry aller Themes, Standard: "mono"
  tokens.ts           Typen: Farben, Typografie, Abstände, Radien, Animation
  ThemeProvider.tsx   liefert aktives Theme + Farbschema, useTheme()
src/ui/components/    Ebene 3: Basis-Komponenten, die nur Tokens verwenden
src/ui/icons/         Icon-Komponente mit semantischen Namen
```

Regeln:

1. **Feature-Code verwendet nur Komponenten aus `src/ui/components/` und `useTheme()`.** Keine Farben, Schriftgrößen oder Abstände als feste Werte in `src/features/` oder `app/`
2. **Hex-Codes nur in `palette.ts`.** Eine ESLint-Regel verbietet Farbliterale (`#...`, `rgb(...)`) außerhalb von `src/ui/theme/`
3. **Komponenten sprechen semantisch**, nicht optisch: `<Button variant="primary">`, nicht `<Button color="purple">`; `theme.colors.accent`, nicht `theme.colors.purple`
4. **Icons über `<Icon name="play" />`** mit eigenen semantischen Namen. Die Zuordnung zum Icon-Set steht nur in `src/ui/icons/`, damit das Set austauschbar ist
5. **Neues Theme = eine neue Datei** in `themes/` mit allen Tokens (Typ erzwingt Vollständigkeit) + Eintrag in der Registry. Kein weiterer Code nötig
6. **Theme-Vorschau:** Ein Entwickler-Screen zeigt alle Komponenten und Farben in Hell und Dunkel, um Änderungen am Theme sofort zu prüfen

## 3. Farb-Tokens (Theme "mono")

### 3.1 Neutral

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `background` | `#FFFFFF` | `#000000` | Bildschirmhintergrund |
| `surface` | `#F5F5F5` | `#111111` | Karten, Eingabefelder |
| `surfaceRaised` | `#EBEBEB` | `#1C1C1C` | gedrückte / ausgewählte Flächen |
| `inverse` | `#0A0A0A` | `#FFFFFF` | invertierte Karte (z. B. "Tag X") |
| `onInverse` | `#FFFFFF` | `#000000` | Text auf `inverse` |
| `border` | `#E0E0E0` | `#2A2A2A` | Linien, Trenner, Kartenränder |
| `text` | `#0A0A0A` | `#FFFFFF` | Haupttext |
| `textMuted` | `#6B6B6B` | `#A0A0A0` | Nebentext, Beschriftungen |
| `textDisabled` | `#B5B5B5` | `#555555` | deaktiviert |

### 3.2 Akzente

| Token | Hell | Dunkel | Text darauf | Verwendung |
|---|---|---|---|---|
| `accent` | `#7C3AED` | `#7C3AED` | `onAccent` = `#FFFFFF` | Flächen: primäre Aktion (Start, Weiter, Bestätigen), Fortschrittsring, Auswahlrahmen |
| `accentText` | `#7C3AED` | `#B57BFF` | – | Lila als Text oder Icon auf `background` (z. B. aktiver Tab) |
| `accentGradient` | `#8445F0 → #5B21B6` | `#8445F0 → #5B21B6` | `#FFFFFF` | "shiny"-Effekt: nur auf primärem Button und Fortschrittsring |
| `accentGlow` | – | `#9D5CFF` mit 35 % Deckkraft | – | weicher Leuchtschein um primäre Elemente, nur im Dunkelmodus |
| `success` | `#00C853` | `#00E676` | `onSuccess` = `#000000` | Flächen: erledigt, Workout abgeschlossen, Haken-Kreis |
| `successText` | `#00873A` | `#00E676` | – | Grün als Text oder Icon auf `background` |
| `danger` | `#E5172F` | `#E5172F` | `onDanger` = `#FFFFFF` | Abbrechen, Löschen, Fehler, Warnung (Fläche und Text) |

Der Lila-Glanz entsteht über einen leichten Verlauf (expo-linear-gradient) und im Dunkelmodus einen weichen Schein. Keine weiteren Effekte. Das leuchtende Grün funktioniert auf Weiß nur als Fläche mit schwarzem Symbol, deshalb gibt es für Text und Icons `successText`.

Kontrast (WCAG AA, geprüft): Alle Text-Kombinationen mindestens 4,5:1, z. B. Weiß auf `accent` 5,7:1, Weiß auf dem hellsten Verlaufston 5,1:1, Schwarz auf `success` ab 9,4:1, Weiß auf `danger` 4,7:1. Ein Test prüft bei jeder Theme-Änderung die Paare `text/background`, `textMuted/background`, `accentText/background`, `successText/background`, `danger/background`, `onAccent/accent`, `onAccent/accentGradient` (beide Enden), `onSuccess/success`, `onDanger/danger`.

## 4. Typografie

Schrift: **Inter** (über `@expo-google-fonts/inter`, in Expo Go nutzbar). Austauschbar über den Token `fontFamily`.

| Token | Größe / Zeilenhöhe | Gewicht | Verwendung |
|---|---|---|---|
| `timer` | 88 / 96 | 600, tabellarische Ziffern | Countdown im Player (lesbar aus 2 m) |
| `display` | 40 / 48 | 700 | große Zahlen, Abschluss-Bildschirm |
| `title1` | 28 / 34 | 700 | Bildschirmtitel |
| `title2` | 22 / 28 | 600 | Abschnittstitel, Übungsname im Player |
| `title3` | 18 / 24 | 600 | Kartentitel |
| `body` | 16 / 24 | 400 | Fließtext |
| `bodyStrong` | 16 / 24 | 600 | Buttons, Hervorhebung |
| `caption` | 13 / 18 | 500 | Beschriftungen, Kennzahlen-Labels |

Alle Größen skalieren mit der Systemschriftgröße (/L090/), Timer mit Obergrenze, damit er nicht umbricht.

## 5. Abstände, Radien, Linien, Bewegung

| Token | Werte |
|---|---|
| `space` | 4, 8, 12, 16, 24, 32, 48, 64 (Seitenrand: 20) |
| `radius` | `sm` 8, `md` 14, `lg` 22, `full` 999 |
| `borderWidth` | 1 |
| `touchMin` | 48 |
| `duration` | `fast` 150 ms, `normal` 250 ms |

Keine Schatten im hellen Modus; Tiefe entsteht durch `surface` und `border`. Animationen nur funktional (Übergänge, Fortschritt), keine Deko-Animationen.

## 6. Basis-Komponenten

| Komponente | Varianten / Hinweise |
|---|---|
| `Screen` | Hintergrund, Seitenrand, Safe Area |
| `Text` | Prop `variant` = Typografie-Token, Prop `tone` = text / muted / accent / success / danger |
| `Button` | `primary` (Lila-Verlauf, max. einer pro Screen), `secondary` (Umriss in `text`), `ghost` (nur Text), `success`, `danger`; Größen `md` / `lg`; volle Breite optional |
| `IconButton` | rund, mindestens 48 dp, für Player-Steuerung |
| `Card` | `surface` mit `border`; Variante `inverse` für die Tageskarte |
| `SelectCard` | große Auswahlkarte im Onboarding; ausgewählt = Rand und Haken in `accent` |
| `Chip` | Filter, Tags; ausgewählt = `inverse` |
| `ProgressBar` / `ProgressRing` | Füllung in `accent`, Spur in `border` |
| `ListItem` | Zeile mit Thumbnail, Titel, Untertitel, Chevron |
| `StatTile` | Zahl in `display` / `title2`, Label in `caption` |
| `Dialog` / `Sheet` | Bestätigungen; destruktive Aktion als `danger` |
| `Icon` | semantische Namen, Linien-Icons (Standard: Feather aus `@expo/vector-icons`) |

## 7. Anwendung auf die Screens

| Screen | Gestaltung |
|---|---|
| Tabs | weiße / schwarze Leiste, Linien-Icons in `textMuted`, aktiver Tab in `accentText` |
| Onboarding | eine Frage pro Screen, großer Titel, `SelectCard`s, dünner `ProgressBar` oben, `primary`-Button unten |
| Plan | Tageskarte als `Card inverse` (schwarz auf weiß bzw. weiß auf schwarz) mit `primary` "Start"; Tagesraster in Grau, erledigte Tage mit grünem Haken (`successText`), gesperrte mit Schloss in `textDisabled` |
| Entdecken | Suchfeld oben, `Chip`-Filter, Listen in Schwarz-Weiß, Premium als kleines Schloss-Icon (keine Farbe) |
| Workout-Detail | Thumbnail, Titel, drei `StatTile`s (Dauer, Übungen, kcal), Übungsliste, `primary` "Start" |
| Player | **immer dunkles Schema** (Fokus, Akku, Lesbarkeit aus Distanz); Video oben ca. 50 %, Timer im `timer`-Stil, `ProgressRing` / `ProgressBar` in `accent`, Steuerung als `IconButton`s, Abbrechen in `danger` nur im Abbruchdialog |
| Pause | großer Countdown, Vorschau nächste Übung, "Überspringen" `primary`, "+20 s" `secondary` |
| Abschluss | großer grüner Haken (`success`), Kennzahlen in `display`, Feedback als `Chip`s |
| Fortschritt | Diagramme in Schwarz / Grau, aktueller Wert in `accentText`, Trainingstage im Kalender als gefüllte Punkte |
| Profil | schlichte `ListItem`-Gruppen, "Alle Daten löschen" in `danger` |

## 8. Medien

Platzhalter-Thumbnails in Graustufen statt bunter Flächen, damit sie zum Schwarz-Weiß-Look passen. Echte Medien (offen, siehe Content-Produktion) sollen neutrale Farben haben, damit Lila die einzige Akzentfarbe bleibt.
