# Übungsvideos mit Higgsfield

Stand: 22.10.2026. Gehört zu Pflichtenheft Kapitel 13 (Content-Produktion).

Dieses Dokument hat zwei Aufgaben:
1. **Produktionsanleitung** für die 50 Übungsvideos in Higgsfield.
2. **Verbindliche Übungsliste** für die Inhaltsdaten (`assets/content/exercises.json`). IDs, Flags und Dateinamen hier und in der App müssen übereinstimmen.

---

## 1. Technische Vorgaben

| Merkmal | Vorgabe |
|---|---|
| Format | 1:1, 1080 × 1080 px (Player zeigt Video in der oberen Bildschirmhälfte) |
| Länge | 6 bis 8 s, **nahtlose Schleife**: erstes und letztes Bild zeigen dieselbe Position |
| Ton | keiner (Sprachausgabe und Musik kommen aus der App) |
| Text / Logos / Wasserzeichen | keine |
| Kamera | statisch auf Stativ, keine Kamerafahrt, kein Zoom, keine Schnitte |
| Export | MP4 (H.264), danach auf unter 2 MB komprimieren |
| Dateiname | `<id>.mp4`, z. B. `ex01_breathing_standing.mp4` |
| Thumbnail | Standbild der Ausgangsposition, `<id>.jpg`, 512 × 512 px |
| Ablage | `assets/content/videos/` und `assets/content/thumbs/` (ersetzt die Platzhalter mit gleichem Namen) |

## 2. Arbeitsablauf (für einheitlichen Look)

1. **Referenzbild der Trainerin erzeugen** (Text-zu-Bild) mit dem Charakter-Prompt aus Abschnitt 3. Bestes Ergebnis auswählen und als Charakter-Referenz speichern (in Higgsfield z. B. als Soul ID / Character, falls verfügbar).
2. **Pro Übung ein Startbild erzeugen** (Bild mit Charakter-Referenz): Trainerin in der Ausgangsposition der Übung, gleiche Umgebung, gleiche Kameraposition.
3. **Bild-zu-Video** aus dem Startbild mit Basis-Prompt (Abschnitt 4) + Übungs-Prompt (Abschnitt 5). Mehrere Varianten erzeugen, beste auswählen.
4. **Prüfen** mit der Checkliste in Abschnitt 6. Bei Fehlern neu generieren, nicht nachbessern.
5. **Fachliche Freigabe** durch eine Pilates-Trainerin oder einen Pilates-Trainer. Erst danach in die App übernehmen.

Tipp: Wandübungen (ex32 bis ex42) in einer eigenen Session mit Startbildern vor derselben Wand erzeugen, damit Wand und Licht identisch bleiben.

## 3. Charakter- und Umgebungs-Prompt (Referenzbild)

Prompts auf Englisch, das liefert bei Videomodellen meist die besseren Ergebnisse.

```
Full-body photo of a friendly, athletic woman in her early 30s, natural look,
hair tied in a low bun, wearing a plain sage-green long-sleeve fitted top and
matching full-length leggings, barefoot. Bright, minimal home living room with
a plain off-white wall, light oak wooden floor, a light grey yoga mat, one green
plant in the far corner, soft diffuse daylight from a window on the left.
Camera at hip height, 3 meters away, straight-on, full body visible with space
around her. Calm, clean, premium fitness app aesthetic. No text, no logos.
```

Für Wandübungen dieselbe Umgebung, die off-white Wand ist dann direkt Teil des Bildes, Matte rechtwinklig zur Wand.

## 4. Basis-Prompt (wird jedem Video vorangestellt)

```
Same woman, same outfit, same room as the reference. Static locked-off tripod
shot, no camera movement, no zoom, no cuts. Full body always in frame with
margin. Slow, controlled, anatomically correct Pilates movement at a calm,
steady tempo. The clip starts and ends in exactly the same position so it loops
seamlessly. Soft even daylight. No text, no music, no other people.
Camera angle: {ANGLE}.
Movement: {MOVEMENT}
```

Negativ-Prompt (falls das Modell ihn unterstützt):

```
extra limbs, deformed hands, merged fingers, twisted joints, jerky motion,
camera shake, zoom, cut, text, watermark, logo, second person, mirror,
changing outfit, changing background
```

`{ANGLE}`: `side view` (Seitenansicht, Standard für Bodenübungen), `front view` oder `45-degree front-side view`.

## 5. Die 50 Übungen

Legende: **Rolle** A = Aufwärmen, H = Hauptteil, C = Cool-down. **Typ** Z = zeitbasiert (Standard 30 s), W = Wiederholungen (Standard in Klammern). **Boden / Wand**: ja = x. **Belastungen**: kn = Knie, rü = Rücken, hg = Handgelenke, bl = Bauchlage, rl = Rückenlage. **SS** = schwangerschaftsgeeignet. **P** = Premium.

### 5.1 Übersicht

| ID | Name (DE) | Name (EN) | Zielzonen | Level | Rolle | Typ | Boden | Wand | Belastungen | SS | P |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ex01_breathing_standing | Pilates-Atmung im Stand | Standing Pilates Breathing | Bauch | 1 | A | Z | | | | x | |
| ex02_shoulder_rolls | Schulterkreisen | Shoulder Rolls | Arme | 1 | A | Z | | | | x | |
| ex03_pelvic_tilt | Beckenkippen | Pelvic Tilt | Bauch, Rücken | 1 | A | W (10) | x | | rl | x | |
| ex04_cat_cow | Katze-Kuh | Cat-Cow | Rücken | 1 | A | W (8) | x | | hg, kn | x | |
| ex05_standing_roll_down | Abrollen im Stand | Standing Roll Down | Rücken | 1 | A | W (6) | | | rü | x | |
| ex06_hundred_tabletop | Hundred (Tischposition) | The Hundred (Tabletop) | Bauch | 1 | H | Z | x | | rl | | |
| ex07_roll_up_modified | Roll Up (modifiziert) | Modified Roll Up | Bauch | 2 | H | W (8) | x | | rü, rl | | |
| ex08_single_leg_stretch | Single Leg Stretch | Single Leg Stretch | Bauch | 2 | H | W (10) | x | | rl | | |
| ex09_double_leg_stretch | Double Leg Stretch | Double Leg Stretch | Bauch | 3 | H | W (8) | x | | rl | | x |
| ex10_criss_cross | Criss Cross | Criss Cross | Bauch | 2 | H | W (12) | x | | rl | | |
| ex11_toe_taps | Toe Taps | Toe Taps | Bauch | 1 | H | W (12) | x | | rl | | |
| ex12_dead_bug | Dead Bug | Dead Bug | Bauch | 1 | H | W (10) | x | | rl | | |
| ex13_single_leg_circles | Beinkreisen liegend | Single Leg Circles | Bauch, Beine | 1 | H | W (8) | x | | rl | | |
| ex14_rolling_like_a_ball | Rolling Like a Ball | Rolling Like a Ball | Bauch, Rücken | 2 | H | W (8) | x | | rü | | x |
| ex15_spine_stretch_forward | Spine Stretch Forward | Spine Stretch Forward | Rücken | 1 | H | W (6) | x | | | x | |
| ex16_saw | Säge | Saw | Rücken, Bauch | 2 | H | W (8) | x | | | x | |
| ex17_teaser_modified | Teaser (modifiziert) | Modified Teaser | Bauch | 3 | H | W (6) | x | | rü | | x |
| ex18_swan_prep | Schwan (Vorstufe) | Swan Prep | Rücken | 1 | H | W (8) | x | | bl | | |
| ex19_swimming | Swimming | Swimming | Rücken, Po | 2 | H | Z | x | | bl | | |
| ex20_bird_dog | Bird Dog | Bird Dog | Rücken, Bauch | 1 | H | W (10) | x | | hg, kn | x | |
| ex21_bridge | Schulterbrücke | Glute Bridge | Po, Beine | 1 | H | W (12) | x | | rl | | |
| ex22_bridge_leg_lift | Schulterbrücke mit Beinheben | Single Leg Bridge | Po, Beine | 3 | H | W (8) | x | | rl | | x |
| ex23_side_leg_lift | Seitliches Beinheben | Side-Lying Leg Lift | Beine, Po | 1 | H | W (12) | x | | | x | |
| ex24_clamshell | Clamshell | Clamshell | Po | 1 | H | W (15) | x | | | x | |
| ex25_side_kick | Side Kick | Side Kick Front/Back | Beine, Po | 2 | H | W (10) | x | | | x | |
| ex26_donkey_kick | Donkey Kick | Donkey Kick | Po | 1 | H | W (12) | x | | hg, kn | x | |
| ex27_fire_hydrant | Fire Hydrant | Fire Hydrant | Po | 1 | H | W (12) | x | | hg, kn | x | |
| ex28_forearm_plank | Unterarmstütz | Forearm Plank | Bauch, Ganzkörper | 2 | H | Z | x | | rü | | |
| ex29_side_plank_knee | Seitstütz auf dem Knie | Kneeling Side Plank | Bauch | 2 | H | Z | x | | kn | x | |
| ex30_pushup_knees | Pilates-Liegestütz (Knie) | Kneeling Pilates Push-up | Arme, Brust | 2 | H | W (8) | x | | hg, kn | | |
| ex31_leg_pull_front | Leg Pull Front | Leg Pull Front | Ganzkörper | 3 | H | W (8) | x | | hg | | x |
| ex32_wall_bridge | Wand-Brücke | Wall Bridge | Po, Beine | 1 | H | W (12) | x | x | rl | | |
| ex33_wall_bridge_march | Wand-Brücke mit Marschieren | Wall Bridge March | Po, Bauch | 2 | H | W (10) | x | x | rl | | |
| ex34_wall_sit | Wandsitzen | Wall Sit | Beine | 2 | H | Z | | x | kn | x | |
| ex35_wall_pushup | Wand-Liegestütz | Wall Push-up | Arme, Brust | 1 | H | W (12) | | x | | x | |
| ex36_wall_roll_down | Abrollen an der Wand | Wall Roll Down | Rücken | 1 | A | W (6) | | x | | x | |
| ex37_wall_leg_slides | Beinscheren an der Wand | Wall Leg Slides | Bauch, Beine | 1 | H | W (10) | x | x | rl | | |
| ex38_wall_side_leg_lift | Seitliches Beinheben an der Wand | Wall Side Leg Lift | Po, Beine | 1 | H | W (12) | | x | | x | |
| ex39_wall_calf_raises | Wadenheben an der Wand | Wall Calf Raises | Beine | 1 | H | W (15) | | x | | x | |
| ex40_wall_plank | Schrägstütz an der Wand | Wall Plank | Bauch, Arme | 1 | H | Z | | x | hg | x | |
| ex41_wall_angels | Wall Angels | Wall Angels | Rücken, Arme | 1 | A | W (10) | | x | | x | |
| ex42_wall_kickback | Po-Kickback an der Wand | Wall Glute Kickback | Po | 1 | H | W (12) | | x | | x | |
| ex43_standing_knee_to_elbow | Knie zum Ellbogen im Stand | Standing Knee-to-Elbow Crunch | Bauch | 1 | H | W (12) | | | | x | |
| ex44_standing_side_bend | Seitbeuge im Stand | Standing Side Bend | Bauch | 1 | A | W (8) | | | | x | |
| ex45_plie_squat | Plié-Kniebeuge | Plié Squat | Beine, Po | 1 | H | W (12) | | | kn | x | |
| ex46_standing_leg_circles | Beinkreisen im Stand | Standing Leg Circles | Beine, Po | 2 | H | W (8) | | | | x | |
| ex47_arm_circles | Armkreisen | Arm Circles | Arme | 1 | H | Z | | | | x | |
| ex48_childs_pose | Kindhaltung | Child's Pose | Rücken | 1 | C | Z | x | | kn | x | |
| ex49_supine_twist | Wirbelsäulendrehung liegend | Supine Spinal Twist | Rücken | 1 | C | Z | x | | rl | | |
| ex50_standing_hip_flexor_stretch | Hüftbeuger-Dehnung im Stand | Standing Hip Flexor Stretch | Beine | 1 | C | Z | | | | x | |

Kontrolle: 17 Übungen ohne Boden (für "keine Bodenübungen"), 11 Wandübungen, Aufwärmen 8, Cool-down 3. Level 1 = Anfänger, 2 = Mittel, 3 = Fortgeschritten. Die Zuordnungen bei Belastungen und Schwangerschaft sind eine fachliche Erstfassung und müssen bei der Freigabe geprüft werden.

### 5.2 Bewegungs-Prompts

Jeweils `{ANGLE}` und `{MOVEMENT}` für den Basis-Prompt. Start- und Endposition sind identisch (Schleife).

| ID | ANGLE | MOVEMENT |
|---|---|---|
| ex01 | front view | She stands tall, feet hip-width, hands resting on her lower ribs. She inhales slowly through the nose, ribs expanding sideways into her hands, then exhales through the mouth, ribs drawing in. One full breath cycle. |
| ex02 | 45-degree front-side view | Standing tall, arms relaxed by her sides, she slowly rolls both shoulders up, back and down in one smooth circle, twice. |
| ex03 | side view | Lying on her back on the mat, knees bent, feet flat, arms long by her sides. She gently tilts her pelvis, flattening the lower back into the mat, then releases back to neutral. |
| ex04 | side view | On hands and knees on the mat, wrists under shoulders, knees under hips. She slowly arches her back, lifting chest and tailbone (cow), then rounds her spine up toward the ceiling, head dropping (cat), then returns to a flat back. |
| ex05 | side view | Standing tall, she nods her chin and slowly rolls down vertebra by vertebra, arms hanging, knees soft, until her hands are near her shins, then rolls back up to standing. |
| ex06 | side view | Lying on her back, legs lifted in tabletop with knees at 90 degrees, head and shoulders curled up off the mat, arms long and hovering beside her hips. She pumps her straight arms up and down in small, quick, controlled beats while the body stays still. |
| ex07 | side view | Sitting on the mat with knees bent and feet flat, arms reaching forward. She rolls back slowly halfway down with a rounded spine, then curls back up to sitting. |
| ex08 | side view | Lying on her back, head and shoulders curled up. One knee pulls toward the chest with both hands while the other leg extends at 45 degrees, then she switches legs smoothly, two times each side. |
| ex09 | side view | Lying on her back, head curled up, both knees pulled to the chest. She extends arms overhead and legs forward at 45 degrees simultaneously, circles the arms around, and hugs the knees back in. |
| ex10 | 45-degree front-side view | Lying on her back, hands behind head, shoulders curled up, legs in tabletop. She rotates her torso to bring the right elbow toward the left knee while extending the right leg, then switches sides, once each side. |
| ex11 | side view | Lying on her back, legs in tabletop, arms by her sides, lower back stable. She slowly lowers one foot to tap the mat and returns it, then the other foot. |
| ex12 | side view | Lying on her back, arms reaching to the ceiling, legs in tabletop. She slowly extends the opposite arm overhead and the opposite leg forward close to the floor, then returns and switches sides. |
| ex13 | side view | Lying on her back, one leg extended to the ceiling, the other bent with the foot flat on the mat. The raised leg draws a slow, controlled circle in the air while the pelvis stays still. |
| ex14 | side view | Sitting balanced on her sit bones, knees hugged to the chest, spine rounded, feet hovering. She rolls back onto the shoulder blades and rolls back up to balance without touching the feet down. |
| ex15 | side view | Sitting tall on the mat, legs extended slightly wider than hips, feet flexed, arms reaching forward at shoulder height. She rounds forward from the head, reaching toward the feet, then stacks back up to a tall seated spine. |
| ex16 | 45-degree front-side view | Sitting tall, legs wide, arms extended to the sides. She twists the torso to one side and reaches the front hand past the outside of the opposite foot in a sawing motion, then returns to center. |
| ex17 | side view | Lying on her back with knees bent in tabletop. She rolls up into a V-sit balance, arms reaching parallel to the shins, holds briefly, then rolls back down with control. |
| ex18 | side view | Lying face down on the mat, hands under shoulders, elbows bent close to the body, legs long. She gently presses up, lifting head and chest a little with a long neck, then lowers back down. |
| ex19 | 45-degree front-side view | Lying face down, arms extended overhead, legs long. She lifts arms, chest and legs slightly off the mat and flutters opposite arm and leg in small alternating movements. |
| ex20 | side view | On hands and knees, back flat. She extends the right arm forward and the left leg back to hip height, holds briefly, returns, then repeats with the left arm and right leg. |
| ex21 | side view | Lying on her back, knees bent, feet flat hip-width, arms by her sides. She lifts her hips into a straight line from shoulders to knees, holds briefly, then rolls the spine back down. |
| ex22 | side view | In a bridge position with hips lifted, she extends one leg straight up toward the ceiling, keeps the hips level, lowers it back and sets the foot down, hips staying lifted. |
| ex23 | front view | Lying on her side, head resting on the lower arm, legs long and stacked. She lifts the top leg to hip height and lowers it slowly with control. |
| ex24 | front view | Lying on her side, knees bent at 45 degrees, feet together. She opens the top knee like a clamshell while the feet stay together, then closes it slowly. |
| ex25 | side view | Lying on her side, propped on the forearm, legs long. The top leg swings forward at hip height with a flexed foot, then sweeps back behind her with a pointed foot, and returns to center. |
| ex26 | side view | On hands and knees, back flat. She lifts one bent leg back and up, sole of the foot pressing toward the ceiling, then lowers it without touching the mat. |
| ex27 | 45-degree front-side view | On hands and knees, back flat. She lifts one bent knee out to the side to hip height, keeping the pelvis level, then lowers it. |
| ex28 | side view | Holding a forearm plank on the mat, elbows under shoulders, body in one straight line from head to heels, breathing calmly with very small natural breathing movement only. |
| ex29 | front view | Side plank supported on one forearm and the lower knee, hips lifted in line with the shoulders, top arm reaching to the ceiling, holding steady with calm breathing. |
| ex30 | side view | In a kneeling plank position, hands under shoulders, body straight from head to knees. She bends the elbows close to the ribs to lower the chest, then pushes back up. |
| ex31 | side view | In a high plank on straight arms. She lifts one straight leg a little off the mat, lowers it, then lifts the other leg, body staying stable. |
| ex32 | side view | Lying on her back on the mat with the feet flat on the off-white wall, knees at 90 degrees. She presses through the feet to lift the hips into a bridge, then rolls back down. |
| ex33 | side view | In a bridge with feet on the wall and hips lifted, she lifts one foot off the wall toward her chest, places it back, then lifts the other foot. |
| ex34 | front view | Back flat against the off-white wall, knees bent at about 90 degrees as if sitting on an invisible chair, arms crossed over the chest, holding steady. |
| ex35 | side view | Standing an arm's length from the wall, hands on the wall at shoulder height. She bends the elbows to bring the chest toward the wall, body straight, then presses back. |
| ex36 | side view | Standing with the back against the wall, feet a step away. She peels the spine off the wall vertebra by vertebra, rolling down, then rolls back up, pressing each vertebra back into the wall. |
| ex37 | side view | Lying on her back with hips close to the wall and both legs straight up resting on the wall. She slowly slides one leg down the wall and back up, then the other leg, like scissors. |
| ex38 | front view | Standing side-on to the wall, one hand on the wall for support. She lifts the outer leg straight out to the side and lowers it slowly, torso staying upright. |
| ex39 | side view | Standing facing the wall, fingertips touching it for balance. She rises slowly onto the balls of both feet and lowers the heels back down. |
| ex40 | side view | Standing facing the wall, hands on the wall at chest height, feet stepped back so the body leans in one straight diagonal line. She holds this incline plank steadily. |
| ex41 | front view | Standing with back, head and arms against the wall, elbows bent at 90 degrees like goal posts. She slides the arms up the wall and back down. |
| ex42 | side view | Standing facing the wall, hands on the wall at chest height, slight forward lean. She kicks one straight leg back, squeezing the glute, then returns it. |
| ex43 | front view | Standing tall, hands behind the head. She lifts one knee diagonally toward the opposite elbow with a slight torso twist, returns, then the other side. |
| ex44 | front view | Standing tall, feet hip-width. She reaches one arm overhead and bends the torso sideways to the opposite side, returns to center, then the other side. |
| ex45 | front view | Standing in a wide stance, toes turned out, hands at the chest. She bends the knees outward over the toes into a plié squat and rises back up. |
| ex46 | 45-degree front-side view | Standing tall, hands on the hips. She lifts one straight leg slightly forward off the floor and draws a slow circle with it, then sets it down. |
| ex47 | front view | Standing tall, arms extended straight out to the sides at shoulder height. She makes small, controlled forward circles with the arms. |
| ex48 | side view | Kneeling on the mat, she sits back on the heels, folds forward and rests the forehead on the mat, arms extended forward, breathing slowly and calmly. |
| ex49 | 45-degree front-side view | Lying on her back, arms out in a T, knees bent together. She lowers both knees slowly to one side while the head turns the other way, holds, and returns to center. |
| ex50 | side view | Standing in a split stance, the back heel lifted, hands on the hips. She gently tucks the pelvis and shifts slightly forward to stretch the front of the back hip, holds, and returns. |

## 6. Prüf-Checkliste pro Video

- [ ] Übung fachlich korrekt (Gelenkwinkel, neutrale Wirbelsäule wo gefordert, keine Hohlkreuz-Belastung)
- [ ] Keine Anatomie-Fehler (Hände, Finger, Füße, Gelenke, Körperteile verschmelzen nicht)
- [ ] Gleiche Person, Kleidung, Raum und Licht wie in den anderen Videos
- [ ] Ganzer Körper immer im Bild, Kamera unbewegt
- [ ] Schleife ohne sichtbaren Sprung
- [ ] Ruhiges, gleichmäßiges Tempo (nicht beschleunigt)
- [ ] Kein Text, Logo, Wasserzeichen, keine zweite Person
- [ ] Dateiname = ID, unter 2 MB, Thumbnail vorhanden
- [ ] Fachliche Freigabe erteilt (Name, Datum in `docs/content_freigabe.md` eintragen)

## 7. Rechtliches

- Nutzungsrechte und kommerzielle Nutzung im gewählten Higgsfield-Tarif prüfen und dokumentieren.
- Die Trainerin ist KI-generiert: keine Ähnlichkeit mit realen Personen anstreben, keine Referenzbilder realer Personen verwenden.
- In der App bzw. Datenschutzerklärung kennzeichnen, dass Übungsvideos KI-generiert sind (Transparenzpflicht nach EU AI Act, Art. 50).
