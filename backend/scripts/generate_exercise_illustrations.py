#!/usr/bin/env python3
"""
Generates the Flyway migration that gives catalog exercises a drawing from Everkinetic
(https://github.com/everkinetic/data, CC BY-SA 4.0): line art of a start and an end pose,
which the app recolors to its theme and credits.

The two datasets name exercises differently, so MAPPING pairs catalog names with Everkinetic
titles by hand (a name-matching pass, reviewed, plus the common lifts whose names share no
words). Both sides are checked: catalog names against the seeding migration, titles against
the dataset at COMMIT.

Usage: python3 generate_exercise_illustrations.py > ../training-backend/src/main/resources/db/migration/V19__add_exercise_illustrations.sql
Only regenerate a migration that has not been applied anywhere yet.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

COMMIT = "446bb9a3d0c3beb6b84f7c9d77dfc8af707a2ab6"
URL = f"https://raw.githubusercontent.com/everkinetic/data/{COMMIT}/dist/exercises.json"
CATALOG_MIGRATION = Path(__file__).parent / "../training-backend/src/main/resources/db/migration/V15__create_exercise_catalog.sql"

# Catalog exercise name -> Everkinetic title
MAPPING = [
    ("Air Bike", "Air Bike"),
    ("Alternate Incline Dumbbell Curl", "Alternating Incline Curl with Dumbbell"),
    ("Barbell Ab Rollout", "Ab Rollout with Barbell"),
    ("Barbell Ab Rollout - On Knees", "Ab Rollout on Knees with Barbell"),
    ("Barbell Bench Press - Medium Grip", "Bench Press: Barbell"),
    ("Barbell Curl", "Biceps Curl: Barbell"),
    ("Barbell Curls Lying Against An Incline", "Lying Incline Curl with Barbell"),
    ("Barbell Deadlift", "Dead Lifts: Barbell"),
    ("Barbell Full Squat", "Barbell Squat"),
    ("Barbell Hack Squat", "Hack Squat: Barbell"),
    ("Barbell Incline Bench Press - Medium Grip", "Bench Press: Barbell (Incline)"),
    ("Barbell Lunge", "Lunges: Barbell"),
    ("Barbell Rear Delt Row", "Rear Deltoid Row Barbell"),
    ("Barbell Seated Calf Raise", "Seated Calf Raise with Barbell"),
    ("Barbell Shrug", "Barbell Shrugs"),
    ("Barbell Squat", "Barbell Squat"),
    ("Barbell Squat To A Bench", "Squats: Barbell (to Bench)"),
    ("Barbell Step Ups", "Step Ups: Barbell"),
    ("Bench Dips", "Bench Dips"),
    ("Bent Over Barbell Row", "Reverse Grips Bent Over Barbell Rows"),
    ("Bent Over Dumbbell Rear Delt Raise With Head On Bench", "Bent Over Rear Deltoid Raise With Head On Bench"),
    ("Bent-Arm Barbell Pullover", "Bent Arm Pullover"),
    ("Bent-Arm Dumbbell Pullover", "Dumbbell Bent Arm Pullover"),
    ("Bent-Knee Hip Raise", "Bent Knee Hip Raise"),
    ("Cable Crossover", "Cable Crossover"),
    ("Cable Hammer Curls - Rope Attachment", "Hammer Curls with Rope and Cable"),
    ("Cable Hip Adduction", "Hip Adduction"),
    ("Cable Incline Pushdown", "Incline Pushdown with Cable"),
    ("Cable Incline Triceps Extension", "Triceps Extension: Cable (Incline)"),
    ("Cable Internal Rotation", "Internal Cable Rotation"),
    ("Cable Lying Triceps Extension", "Lying Tricep Extension with Cable"),
    ("Cable One Arm Tricep Extension", "One Arm Tricep Extension with Cable"),
    ("Cable Preacher Curl", "Preacher Curl: Cable"),
    ("Cable Seated Crunch", "Seated Ab Crunch with Cable"),
    ("Cable Shrugs", "Shoulder Shrugs: Cable"),
    ("Calf Press On The Leg Press Machine", "Calves Press on Leg Machine"),
    ("Close-Grip Barbell Bench Press", "Bench Press: Barbell (Close Grip)"),
    ("Close-Grip EZ Bar Curl", "Close Grip EZ Bar Curl with Barbell"),
    ("Close-Grip Front Lat Pulldown", "Pull Down: V Bar "),
    ("Close-Grip Standing Barbell Curl", "Close Grip Standing Biceps Curls with Barbell"),
    ("Concentration Curls", "Concentration Curls with Dumbbell"),
    ("Cross Body Hammer Curl", "Cross Body Hammer Curl with Dumbbell"),
    ("Cross-Body Crunch", "Cross Body Crunch"),
    ("Crunch - Legs On Exercise Ball", "Crunches with Legs on Stability Ball"),
    ("Crunches", "Crunches"),
    ("Decline Barbell Bench Press", "Bench Press: Barbell (Decline)"),
    ("Decline Close-Grip Bench To Skull Crusher", "Decline Close Grip Bench to Skull Crusher"),
    ("Decline Crunch", "Decline Crunch"),
    ("Decline Dumbbell Bench Press", "Bench Press: Dumbbell (Decline)"),
    ("Decline Dumbbell Flyes", "Decline Dumbbell Fly's"),
    ("Decline Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Decline)"),
    ("Decline EZ Bar Triceps Extension", "Triceps Extension: EZ Bar Barbell (Decline)"),
    ("Decline Oblique Crunch", "Decline Oblique Crunch"),
    ("Dip Machine", "Triceps Dips: Machine"),
    ("Dips - Chest Version", "Chest Dips"),
    ("Dips - Triceps Version", "Triceps Dips: Body Weight"),
    ("Donkey Calf Raises", "Donkey Calf Raises"),
    ("Drag Curl", "Drag Curl with Barbell"),
    ("Dumbbell Alternate Bicep Curl", "Alternating Bicep Curl with Dumbbell"),
    ("Dumbbell Bench Press", "Bench Press: Dumbbell"),
    ("Dumbbell Bicep Curl", "Biceps Curl: Dumbbell"),
    ("Dumbbell Flyes", "Dumbbell Flys"),
    ("Dumbbell Lunges", "Lunges: Dumbbell"),
    ("Dumbbell Lying One-Arm Rear Lateral Raise", "Lying One Arm Rear Lateral Raise"),
    ("Dumbbell Lying Rear Lateral Raise", "Lying Rear Lateral Raise"),
    ("Dumbbell One-Arm Shoulder Press", "One Arm Dumbbell Shoulder Press"),
    ("Dumbbell One-Arm Triceps Extension", "Triceps Extension: Dumbbell (One Arm)"),
    ("Dumbbell One-Arm Upright Row", "Upright Row: Dumbbell (One Arm)"),
    ("Dumbbell Prone Incline Curl", "Prone Incline Biceps Curl with Dumbbell"),
    ("Dumbbell Rear Lunge", "Lunges: Dumbbell (Rear)"),
    ("Dumbbell Seated One-Leg Calf Raise", "Seated One Leg Calf Raise with Dumbbell"),
    ("Dumbbell Shrug", "Shoulder Shrugs: Dumbbell"),
    ("Dumbbell Side Bend", "Side Bend with Dumbbell"),
    ("Dumbbell Squat", "Squats: Dumbbells"),
    ("Dumbbell Squat To A Bench", "Squats: Dumbbells (to Bench)"),
    ("Dumbbell Step Ups", "Step Ups: Dumbbell"),
    ("Exercise Ball Pull-In", "Exercise Ball Pull In"),
    ("EZ-Bar Curl", "EZ Bar Curl with Barbell"),
    ("Flat Bench Cable Flyes", "Flat Bench Cable Flys"),
    ("Flat Bench Lying Leg Raise", "Flat Bench Leg Raises"),
    ("Flexor Incline Dumbbell Curls", "Flexor Incline Curls with Dumbbell"),
    ("Flutter Kicks", "Flutter Kicks"),
    ("Front Barbell Squat", "Front Squat with Barbell"),
    ("Front Barbell Squat To A Bench", "Front Squat to Bench with Barbells"),
    ("Front Cable Raise", "Front Cable Raises"),
    ("Front Dumbbell Raise", "Front Dumbbell Raise"),
    ("Front Raise And Pullover", "Barbell Front Raise and Pullover"),
    ("Front Two-Dumbbell Raise", "Front Dumbbell Raise"),
    ("Good Morning", "Good Mornings: Barbell"),
    ("Hack Squat", "Hack Squat: Machine"),
    ("Hammer Curls", "Biceps Curl: Dumbbell (Hammer)"),
    ("Hammer Grip Incline DB Bench Press", "Bench Press: Dumbbell (Incline, Hammer Grip)"),
    ("High Cable Curls", "High Cable Curls"),
    ("Hyperextensions (Back Extensions)", "Hyperextensions"),
    ("Incline Barbell Triceps Extension", "Triceps Extension: Barbell (Incline)"),
    ("Incline Dumbbell Flyes", "Incline Dumbbell Fly's"),
    ("Incline Dumbbell Flyes - With A Twist", "Incline Fly's with a Twist"),
    ("Incline Dumbbell Press", "Incline Dumbbell Press"),
    ("Incline Inner Biceps Curl", "Incline Inner Biceps Curl with Dumbbell"),
    ("Inverted Row", "Body Row"),
    ("Iron Cross", "Iron Cross: Dumbbell"),
    ("Jefferson Squats", "Jefferson Squats: Barbell"),
    ("JM Press", "JM Press"),
    ("Kneeling Cable Triceps Extension", "Triceps Extension: Cable (Kneeling)"),
    ("Leg Extensions", "Leg Extensions"),
    ("Leg Press", "Leg Press"),
    ("Leg Pull-In", "Exercise Ball Pull In"),
    ("Leverage Decline Chest Press", "Decline Chest Press"),
    ("Low Cable Triceps Extension", "Triceps Extension: Cable (Low)"),
    ("Lying Cable Curl", "Lying Bicep Cable Curl"),
    ("Lying Close-Grip Barbell Triceps Extension Behind The Head", "Triceps Extension: Barbell (Lying, Close Grip, Behind the Head)"),
    ("Lying Close-Grip Barbell Triceps Press To Chin", "Lying Close Grip Triceps Press to Chin with Barbell"),
    ("Lying Dumbbell Tricep Extension", "Triceps Extension: Dumbbell (Lying)"),
    ("Lying High Bench Barbell Curl", "Lying High Bench Biceps Curl with Barbell"),
    ("Lying Leg Curls", "Lying Leg Curl Machine"),
    ("Lying Machine Squat", "Lying Squat"),
    ("Lying Rear Delt Raise", "Lying Rear Lateral Raise"),
    ("Lying Supine Dumbbell Curl", "Lying Supine Biceps Curl with Dumbbell"),
    ("Lying Triceps Press", "Lying Triceps Press with Barbell"),
    ("Machine Bench Press", "Bench Press: Machine"),
    ("Machine Bicep Curl", "Biceps Curl: Machine"),
    ("Machine Preacher Curls", "Preacher Curl: Machine"),
    ("Machine Triceps Extension", "Triceps Extension: Machine"),
    ("Narrow Stance Hack Squats", "Narrow Stance Hack Squats"),
    ("Narrow Stance Leg Press", "Narrow Stance Leg Press"),
    ("One Arm Dumbbell Bench Press", "Bench Press: Dumbbell (One Arm)"),
    ("One Arm Dumbbell Preacher Curl", "Preacher Curl: Dumbbell (One Arm)"),
    ("One Arm Floor Press", "One Arm Barbell Floor Press"),
    ("One Arm Pronated Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Single Arm, Pronated)"),
    ("One Arm Supinated Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Single Arm, Supinated)"),
    ("One Leg Barbell Squat", "One Leg Squat with Barbell"),
    ("One-Arm Side Deadlift", "Dead Lift: Barbell (One Arm Side)"),
    ("One-Legged Cable Kickback", "One Legged Cable Kickback"),
    ("Overhead Cable Curl", "Overhead Curl with Cable"),
    ("Overhead Squat", "Overhead Squat with Barbell"),
    ("Plie Dumbbell Squat", "Pile Squat with Dumbbell"),
    ("Preacher Curl", "Preacher Curl: Barbell"),
    ("Preacher Hammer Dumbbell Curl", "Preacher Curl: Dumbbell (Hammer)"),
    ("Pullups", "Pull Ups"),
    ("Pushups", "Push Up: Body Weight"),
    ("Reverse Grip Bent-Over Rows", "Reverse Grips Bent Over Barbell Rows"),
    ("Reverse Grip Triceps Pushdown", "Reverse Grip Triceps Pushdown"),
    ("Reverse Plate Curls", "Reverse Plate Curls with Weight"),
    ("Reverse Triceps Bench Press", "Bench Press: Barbell (Reverse Triceps)"),
    ("Rocking Standing Calf Raise", "Rocking Standing Calf Raise with Barbell"),
    ("Romanian Deadlift", "Romanian Dead Lift"),
    ("Seated Barbell Military Press", "Seated Military Press"),
    ("Seated Cable Rows", "Seated Cable Rows"),
    ("Seated Calf Raise", "Seated Calf Raise using Machine"),
    ("Seated Close-Grip Concentration Barbell Curl", "Seated Close Grip Concentration Curls with Barbell"),
    ("Seated Dumbbell Curl", "Seated Bicep Curl with Dumbbell"),
    ("Seated Leg Curl", "Seated Leg Curl"),
    ("Seated Triceps Press", "Seated Triceps Press with Dumbbell"),
    ("Side Bridge", "Side Plank"),
    ("Side Lateral Raise", "Lateral Dumbbell Raises"),
    ("Smith Machine Bench Press", "Bench Press: Smith Machine"),
    ("Smith Machine Close-Grip Bench Press", "Bench Press: Smith Machine (Close Grip)"),
    ("Smith Machine Incline Bench Press", "Bench Press: Smith Machine (Incline)"),
    ("Smith Machine Reverse Calf Raises", "Smith Machine Reverse Calf Raises"),
    ("Smith Machine Squat", "Squats: Smith Machine"),
    ("Smith Machine Upright Row", "Upright Row: Smith Machine"),
    ("Speed Squats", "Speed Squats: Barbell"),
    ("Spider Curl", "Spider Curl with Barbell"),
    ("Squat with Bands", "Squats: Exercise Bands"),
    ("Squats - With Bands", "Squats: Exercise Bands"),
    ("Standing Barbell Calf Raise", "Standing Barbell Calf Raise"),
    ("Standing Bent-Over One-Arm Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Bent-Over, One Arm)"),
    ("Standing Bent-Over Two-Arm Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Bent-Over, Two Arm)"),
    ("Standing Biceps Cable Curl", "Standing Biceps Curl with Cable"),
    ("Standing Calf Raises", "Standing Calf Raises using Machine"),
    ("Standing Dumbbell Reverse Curl", "Biceps Curl: Dumbbell (Reverse)"),
    ("Standing Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (Standing)"),
    ("Standing Dumbbell Upright Row", "Upright Row: Dumbbell"),
    ("Standing Inner-Biceps Curl", "Standing Inner Biceps Curl with Dumbbell"),
    ("Standing Leg Curl", "Standing Leg Curls"),
    ("Standing Low-Pulley One-Arm Triceps Extension", "Triceps Extension: Cable (One Arm, Low-Pulley)"),
    ("Standing One-Arm Cable Curl", "Standing One Arm Bicep Curl with Cable"),
    ("Standing One-Arm Dumbbell Curl Over Incline Bench", "Standing One Arm Curl Over Incline Bench with Dumbbell"),
    ("Standing One-Arm Dumbbell Triceps Extension", "Triceps Extension: Dumbbell (One Arm)"),
    ("Standing Overhead Barbell Triceps Extension", "Triceps Extension: Barbell (Standing, Overhead)"),
    ("Standing Towel Triceps Extension", "Triceps Extension: Towel (Standing)"),
    ("Stiff-Legged Dumbbell Deadlift", "Dead Lifts: Dumbbell"),
    ("Straight-Arm Dumbbell Pullover", "Straight Arm Dumbbell Pullover"),
    ("Straight-Arm Pulldown", "Straight Arm Push Down"),
    ("T-Bar Row with Handle", "T-Bar Rows"),
    ("Tate Press", "Tate Press with Dumbbell"),
    ("Thigh Abductor", "Thigh Abductor"),
    ("Thigh Adductor", "Thigh Adductor"),
    ("Tricep Dumbbell Kickback", "Triceps Kickback with Dumbbell"),
    ("Triceps Pushdown", "Triceps Pushdown: Cable"),
    ("Triceps Pushdown - Rope Attachment", "Triceps Pushdown: Cable (Rope)"),
    ("Triceps Pushdown - V-Bar Attachment", "Triceps Pushdown: Cable (V-Bar)"),
    ("Two-Arm Dumbbell Preacher Curl", "Preacher Curl: Dumbbell (Two Arm)"),
    ("Underhand Cable Pulldowns", "Pull Down: Underhand"),
    ("Upright Barbell Row", "Upright Barbell Rows"),
    ("Upright Cable Row", "Upright Cable Row"),
    ("Weighted Ball Side Bend", "Weighted Ball Side Bend"),
    ("Weighted Bench Dip", "Bench Dips"),
    ("Weighted Pull Ups", "Pull Ups"),
    ("Weighted Sissy Squat", "Weighted Sissy Squat with Weight Plate"),
    ("Wide Stance Barbell Squat", "Wide Stance Squat with Barbell"),
    ("Wide-Grip Barbell Bench Press", "Bench Press: Barbell (Wide Grip)"),
    ("Wide-Grip Decline Barbell Bench Press", "Bench Press: Barbell (Decline, Wide Grip)"),
    ("Wide-Grip Decline Barbell Pullover", "Wide Grip Decline Barbell Pullover"),
    ("Wide-Grip Standing Barbell Curl", "Wide Grip Standing Biceps Curl with Barbell"),
    ("Zercher Squats", "Zecher Squats"),
    ("Zottman Curl", "Zottman Curl with Dumbbells"),
    ("Zottman Preacher Curl", "Preacher Curl: Dumbbell (Zottman)")
]


def sql(value):
    return "'" + value.replace("'", "''") + "'"


def main():
    with urllib.request.urlopen(URL) as response:
        drawings = json.load(response)
    # Some entries have no drawings (or only one pose); titles can repeat
    ids = {}
    for d in drawings:
        if len(d.get("svg", [])) == 2:
            ids.setdefault(d["title"], d["id"])
    catalog = {name.replace("''", "'") for name in re.findall(r"^    \('[^']+', '((?:[^']|'')+)',", CATALOG_MIGRATION.read_text(), re.M)}

    errors = [f"not in the catalog: {name}" for name, _ in MAPPING if name not in catalog]
    errors += [f"no drawing in Everkinetic: {title}" for _, title in MAPPING if title not in ids]
    if errors:
        sys.exit("\n".join(errors))

    out = sys.stdout
    out.write(f"""-- ============================================================
-- Migration: Exercise drawings
--
-- Catalog exercises get the Everkinetic drawing of the same movement
-- ({COMMIT[:7]}, CC BY-SA 4.0): an id whose start and end poses the
-- backend serves and the app recolors and credits. Generated by
-- backend/scripts/generate_exercise_illustrations.py; don't edit by hand.
-- ============================================================

ALTER TABLE exercise_catalog ADD COLUMN illustration VARCHAR(10);

UPDATE exercise_catalog c
SET illustration = v.illustration
FROM (VALUES
""")
    out.write(",\n".join(f"    ({sql(name)}, {sql(ids[title])})" for name, title in MAPPING))
    out.write("""
) AS v(name, illustration)
WHERE c.name = v.name;
""")


if __name__ == "__main__":
    main()
