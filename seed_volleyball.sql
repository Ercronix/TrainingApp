-- Volleyball Off-Season Training Plan seed script
-- Usage: psql -U <db_user> -d <db_name> -f seed_volleyball.sql
--
-- Before running: set v_user_id to your actual user ID.
-- Find it with:  SELECT id, username FROM users;

DO $$
DECLARE
  v_user_id   BIGINT := 1;  -- <-- CHANGE THIS to your user ID
  v_split_id  BIGINT;
  v_mon_id    BIGINT;
  v_tue_id    BIGINT;
  v_thu_id    BIGINT;
  v_sat_id    BIGINT;
  v_mob_id    BIGINT;
BEGIN

-- ──────────────────────────────────────────────
-- 1. Training Split
-- ──────────────────────────────────────────────
INSERT INTO training_splits (user_id, name, is_active, current_block, created_at, updated_at)
VALUES (v_user_id, 'Volleyball Off-Season', true, 1, now(), now())
RETURNING id INTO v_split_id;

-- Deactivate any other splits for this user
UPDATE training_splits SET is_active = false
WHERE user_id = v_user_id AND id <> v_split_id;

-- ──────────────────────────────────────────────
-- 2. Workout days
-- ──────────────────────────────────────────────
INSERT INTO workouts (split_id, name, order_index, created_at, updated_at)
VALUES (v_split_id, 'Monday – Calisthenics Park', 0, now(), now())
RETURNING id INTO v_mon_id;

INSERT INTO workouts (split_id, name, order_index, created_at, updated_at)
VALUES (v_split_id, 'Tuesday – Legs A + Push/Pull', 1, now(), now())
RETURNING id INTO v_tue_id;

INSERT INTO workouts (split_id, name, order_index, created_at, updated_at)
VALUES (v_split_id, 'Thursday – Optional Core + Light Upper', 2, now(), now())
RETURNING id INTO v_thu_id;

INSERT INTO workouts (split_id, name, order_index, created_at, updated_at)
VALUES (v_split_id, 'Saturday – Legs B + Rotation Power', 3, now(), now())
RETURNING id INTO v_sat_id;

INSERT INTO workouts (split_id, name, order_index, created_at, updated_at)
VALUES (v_split_id, 'Mobility (Wed / Fri / Sun)', 4, now(), now())
RETURNING id INTO v_mob_id;

-- ──────────────────────────────────────────────
-- 3. Monday – Calisthenics Park
--    Vertikal Push/Pull, Schulter, Körperspannung
-- ──────────────────────────────────────────────
INSERT INTO exercises (workout_id, name, description, sets, reps, rep_unit, order_index, temporary, created_at, updated_at) VALUES
  (v_mon_id, 'Klimmzüge', 'Toter Hang, volles ROM. Block 1: 4×8 | Block 2: 4×6 +Rucksack | Block 3: 4×4 explosiv. Sobald 8 saubere Wdh. → Zusatzlast.', 4, 8, 'reps', 0, false, now(), now()),
  (v_mon_id, 'Dips', 'Leichter Vorneigen für Brustfokus, oben komplett durchstrecken. Block 1: 4×10 | Block 2: 4×8 +Rucksack | Block 3: 4×6. Progresse wie Klimmzüge.', 4, 10, 'reps', 1, false, now(), now()),
  (v_mon_id, 'Pike Push-ups', 'Hüften hoch, Kopf am Boden durch. Ziel: Wand-HSPU. Block 1: 3×8 | Block 2: 3×8 Füße erhöht | Block 3: 3×6 Wand-HSPU.', 3, 8, 'reps', 2, false, now(), now()),
  (v_mon_id, 'Australian Rows (Tief-Stange)', 'Körper gerade wie ein Brett, Brust zur Stange. Füßwinkel erhöhen für mehr Last. 3×10.', 3, 10, 'reps', 3, false, now(), now()),
  (v_mon_id, 'Lateral Raises (Band)', 'Seitliche Schulter, Breite & Stabilität im Schlagarm. Arm leicht gebeugt, kontrolliert senken. 3×15.', 3, 15, 'reps', 4, false, now(), now()),
  (v_mon_id, 'Reverse Flys / Butterfly (Band)', 'Hintere Schulter. Arme leicht gebeugt, schulterbreit auseinander. Balanciert das viele Drücken. 3×15.', 3, 15, 'reps', 5, false, now(), now()),
  (v_mon_id, 'Außenrotation (Band)', 'Wichtigste Einzelübung für die Hitter-Schulter. Ellenbogen nah am Körper, 90°. Langsam und kontrolliert. 3×15.', 3, 15, 'reps', 6, false, now(), now()),
  (v_mon_id, 'Face Pulls (Band)', 'Auf Stirnhöhe ziehen, Ellenbogen hoch. Schulterstabilität und hintere Delts. 3×15.', 3, 15, 'reps', 7, false, now(), now()),
  (v_mon_id, 'Prone Y-T-W', 'Auf dem Bauch, Schulterblätter aktivieren. Y = Daumen hoch über Kopf, T = 90° zur Seite, W = Ellenbogen beugen. 2×10 je.', 2, 10, 'reps', 8, false, now(), now()),
  (v_mon_id, 'Hollow Hold', 'Unterer Rücken flach auf dem Boden. Arme neben Ohren strecken wenn möglich. Das Fundament aller Körperspannung. 3×30 Sek.', 3, 30, 'seconds', 9, false, now(), now()),
  (v_mon_id, 'L-Sit-Progression', 'Tuck → Advanced Tuck → voller L-Sit. Gerade Arme, Schulterblätter gedrückt (deprimiert). Auf Paralleletten oder Stangen. 3×20 Sek.', 3, 20, 'seconds', 10, false, now(), now()),
  (v_mon_id, 'Front Lever Tuck', 'Körper parallel zum Boden, Hüft/Knie 90°. Schulterblätter protrahiert (nach vorne). Extreme Anti-Extension. 3×10 Sek.', 3, 10, 'seconds', 11, false, now(), now()),
  (v_mon_id, 'Hanging Hold (Active)', 'Aktiver Hang: Schulterblätter runterziehen, Körper lang. Verbindet Schulter + Rumpf in genau der Schlagposition. 3×20 Sek.', 3, 20, 'seconds', 12, false, now(), now()),
  (v_mon_id, 'Sleeper Stretch', 'Auf der Schlagarmseite liegen, Arm 90° gebeugt. Anderen Arm drückt Handgelenk Richtung Boden (Innenrotation). 30 Sek./Seite.', 2, 30, 'seconds', 13, false, now(), now());

-- ──────────────────────────────────────────────
-- 4. Tuesday – Legs A + horiz. Push/Pull + Rumpf
--    MODERAT – Volleyball am Abend!
-- ──────────────────────────────────────────────
INSERT INTO exercises (workout_id, name, description, sets, reps, rep_unit, order_index, temporary, created_at, updated_at) VALUES
  (v_tue_id, 'Back Squat', '3 Sek. exzentrisch. MODERAT – Abendtraining beachten! Block 1: 4×8 | Block 2: 4×4 | Block 3: 5×3 explosiv. Patellasehne: Knie-Tracking, bei Schmerz sofort stoppen.', 4, 8, 'reps', 0, false, now(), now()),
  (v_tue_id, 'Bulgarian Split Squat', 'Hinterfuß erhöht. Vorderfuß weit genug vor, damit Schienbein senkrecht bleibt. 3×8 pro Bein.', 3, 8, 'reps', 1, false, now(), now()),
  (v_tue_id, 'Spanish Squat (isometrisch)', 'Band/Seil um Pfosten, Knie tracking über Zehen. Patellasehnen-Therapie-Position. SCHLÜSSELÜBUNG. 5×45 Sek. Kurze Pause (60–90 Sek.) zwischen Sätzen.', 5, 45, 'seconds', 2, false, now(), now()),
  (v_tue_id, 'Wadenheben', 'Gerade Knie (Gastrocnemius) + leicht gebeugt (Soleus). Langsam senken. 3×15 pro Seite oder beidbeinig.', 3, 15, 'reps', 3, false, now(), now()),
  (v_tue_id, 'Bankdrücken / KH-Druck', 'Horizontaler Push – am Park fehlend. Block 1: 4×8 | Block 2: 4×6 | Block 3: 4×4. Kontrolliert senken, explosiv drücken.', 4, 8, 'reps', 4, false, now(), now()),
  (v_tue_id, 'LH- / KH-Rudern', 'Rudern balanciert das viele Drücken. Hüftgelenk gebeugt, Stange zur Unterbrust. 3 Sek. exzentrisch. 4×8.', 4, 8, 'reps', 5, false, now(), now()),
  (v_tue_id, 'Pallof Press (Band)', 'Anti-Rotations-Training für die Schlagkette. Rumpf HALTEN, keine Rumpfrotation. 3×10 pro Seite.', 3, 10, 'reps', 6, false, now(), now()),
  (v_tue_id, 'Hollow Body Hold', 'Unterer Rücken gedrückt. Qualität über Dauer. 3× bis Form bricht.', 3, 30, 'seconds', 7, false, now(), now()),
  (v_tue_id, 'Dead Bug', 'Gegenläufig Arm+Bein strecken. Unterer Rücken bleibt FLACH auf dem Boden. Langsam atmen. 3×10 pro Seite.', 3, 10, 'reps', 8, false, now(), now());

-- ──────────────────────────────────────────────
-- 5. Thursday – Optional Rumpf + leichtes Oberkörper
--    Echter Erholungstag – nur wenn Energie vorhanden
-- ──────────────────────────────────────────────
INSERT INTO exercises (workout_id, name, description, sets, reps, rep_unit, order_index, temporary, created_at, updated_at) VALUES
  (v_thu_id, 'Hollow Hold', 'Auffrischung. Nicht bis zur Erschöpfung. 3×30 Sek. Qualität zählt.', 3, 30, 'seconds', 0, false, now(), now()),
  (v_thu_id, 'Pallof Press (Band)', 'Anti-Rotation, leichter als Di. 3×10 pro Seite. Kein Maximalreiz.', 3, 10, 'reps', 1, false, now(), now()),
  (v_thu_id, 'Außenrotation (Band)', 'Rotatorenmanschetten-Gesundheit. Leichtes Band, locker. 2–3 Sätze.', 3, 15, 'reps', 2, false, now(), now()),
  (v_thu_id, 'Face Pulls (Band)', 'Schulterstabilität-Auffrischung. Leicht und locker. 2–3 Sätze.', 3, 15, 'reps', 3, false, now(), now()),
  (v_thu_id, 'Leichte Klimmzüge (optional)', 'Nur wenn Lust und Energie da. 2–3 Sätze locker, kein Maximalreiz. Komplett weglassen ist auch ok!', 2, 8, 'reps', 4, false, now(), now());

-- ──────────────────────────────────────────────
-- 6. Saturday – Legs B (schwer) + Rotationspower + 2. Push/Pull
--    SCHWERER Beintag. Sonntag ist Ruhetag.
-- ──────────────────────────────────────────────
INSERT INTO exercises (workout_id, name, description, sets, reps, rep_unit, order_index, temporary, created_at, updated_at) VALUES
  (v_sat_id, 'Back Squat / Front Squat', 'DER schwere Hauptlift. Block 1: 4×8 | Block 2: 4×5 steigernd | Block 3: 4×3 + Sprung danach (Kontrastmethode). Hauptmotor für Sprunghöhe. Ziel: 1,4–1,5× Körpergewicht.', 4, 5, 'reps', 0, false, now(), now()),
  (v_sat_id, 'Romanian Deadlift (RDL)', 'Hüftgelenk, leichte Kniebeugung. Hamstrings fühlen die Dehnung unten. Rücken gerade. 4×6. Hintere Kette halten.', 4, 6, 'reps', 1, false, now(), now()),
  (v_sat_id, 'Step-ups', 'Auf eine Box/Bank. Führungsbein zieht oben durch. 3×8 pro Bein. Uni-laterale Kniestärke.', 3, 8, 'reps', 2, false, now(), now()),
  (v_sat_id, 'Nordic Curls / Negative Curls', 'Füße fixieren. 3–5 Sek. langsam senken, mit Händen auffangen. Stärkstes Hamstrings-Training. 3×6 Negative.', 3, 6, 'reps', 3, false, now(), now()),
  (v_sat_id, 'Tempo Squat / Beinstrecker', '3 Sek. exzentrisch. Sehnenfreundlich, trainiert Patellasehne unter Kontrolle. 3×10.', 3, 10, 'reps', 4, false, now(), now()),
  (v_sat_id, 'Banded Wood Chop (hoch→tief)', 'Band auf Schulterhöhe. Rotiere EXPLOSIV von Hüfte, Arme folgen. Simuliert Rumpfrotation des Spikes. 4×5 pro Seite.', 4, 5, 'reps', 5, false, now(), now()),
  (v_sat_id, 'Banded Wood Chop (tief→hoch)', 'Band tief, gleiche Bewegung andersrum. Trainiert Aufwärtsbewegung der Schlagkette. 4×5 pro Seite.', 4, 5, 'reps', 6, false, now(), now()),
  (v_sat_id, 'Explosive Pallof Press (Band)', 'Schnell und kräftig auspressen, kontrolliert zurück. Rotationspower, nicht nur Anti-Rotation. 4×6 pro Seite.', 4, 6, 'reps', 7, false, now(), now()),
  (v_sat_id, 'Schrägbank / KH-Druck', 'Zweite Push-Exposition der Woche. Leichter als Di. 3×10. Schulterfreundlicher Winkel.', 3, 10, 'reps', 8, false, now(), now()),
  (v_sat_id, 'Kabelzug- / Band-Rudern', 'Zweite Pull-Exposition. 3×10. Rücken und hintere Schulter.', 3, 10, 'reps', 9, false, now(), now());

-- ──────────────────────────────────────────────
-- 7. Mobility (Mi / Fr / So)
--    8–10 Min täglich vor Sessions; 20 Min So
-- ──────────────────────────────────────────────
INSERT INTO exercises (workout_id, name, description, sets, reps, rep_unit, order_index, temporary, created_at, updated_at) VALUES
  (v_mob_id, 'Knie-zur-Wand (Ankle Mobility)', 'PRIORITÄT. Zehen ~10 cm von der Wand, Knie berührt Wand. Steife Sprunggelenke überlasten Patellasehne & deckeln Sprunghöhe. 2×15 pro Seite.', 2, 15, 'reps', 0, false, now(), now()),
  (v_mob_id, 'Couch Stretch (Hüftbeuger)', 'Hinterknie auf dem Boden, Fuß an die Wand. Hüfte nach vorne schieben. Löst Hüftbeuger, die durch viel Sitzen verkürzt sind. 2×45 Sek. pro Seite.', 2, 45, 'seconds', 1, false, now(), now()),
  (v_mob_id, '90/90 Hüftwechsel', 'Aufrecht sitzen, beide Hüften 90°. Wechseln & nach vorne falten. Hüftrotation für explosiven Anlauf. 2×8 pro Seite.', 2, 8, 'reps', 2, false, now(), now()),
  (v_mob_id, 'BWS-Extension (Foam Roller)', 'Foam Roller quer, Segment für Segment. Arme hinter dem Kopf. Oberer Rücken für Schlagbewegung. 2×10.', 2, 10, 'reps', 3, false, now(), now()),
  (v_mob_id, 'Tiefe Goblet-Squat-Haltung', 'Unten versinken, mit Ellenbogen Knie ausdrücken ("pry"). Trainiert Sprunggelenk, Hüfte, Squat-Tiefe zugleich. 2×60 Sek.', 2, 60, 'seconds', 4, false, now(), now());

RAISE NOTICE 'Volleyball Off-Season split created with ID: %', v_split_id;
RAISE NOTICE 'Monday workout ID: %', v_mon_id;
RAISE NOTICE 'Tuesday workout ID: %', v_tue_id;
RAISE NOTICE 'Thursday workout ID: %', v_thu_id;
RAISE NOTICE 'Saturday workout ID: %', v_sat_id;
RAISE NOTICE 'Mobility workout ID: %', v_mob_id;

END $$;
