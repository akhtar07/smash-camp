export type Exercise = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  rpe: string;
  cue: string;
  url?: string;
};

export type Block = {
  block: string;
  exercises: Exercise[];
};

export type DayProgram = {
  day: number;
  phase: string;
  color: string;
  blocks: Block[];
};

const sharedExercises: Block[] = [
  {
    block: "Warm-up",
    exercises: [{ name: "Dynamic mobility + activation drills", sets: "2", reps: "10 min", rest: "30s", rpe: "4", cue: "Prepare joints and nervous system.", url: "https://www.youtube.com/results?search_query=dynamic+warm+up+for+athletes" }]
  },
  {
    block: "Main",
    exercises: [
      { name: "Strength / power badminton-specific drills", sets: "4", reps: "6-12 reps", rest: "90-120s", rpe: "7-9", cue: "Explosive intent and movement quality.", url: "https://www.youtube.com/results?search_query=badminton+strength+training" },
      { name: "Court movement + shadow badminton", sets: "4", reps: "30-60 sec", rest: "60s", rpe: "7-8", cue: "Stay on toes and recover quickly.", url: "https://www.youtube.com/results?search_query=shadow+badminton+footwork" }
    ]
  },
  {
    block: "Cool-down",
    exercises: [{ name: "Foam rolling + stretching + breathing", sets: "2", reps: "10 min", rest: "-", rpe: "2", cue: "Focus on recovery and mobility.", url: "https://www.youtube.com/results?search_query=foam+rolling+for+athletes" }]
  }
];

const day1: DayProgram = {
  day: 1, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [{ name: "Joint circles, leg swings, walking lunges, world's greatest stretch", sets: "1", reps: "10/side", rest: "60-90s", rpe: "3", cue: "Establish baseline mobility and movement quality.", url: "https://www.youtube.com/results?search_query=Worlds+greatest+stretch" }] },
    { block: "Main", exercises: [
      { name: "FMS Movement Screen", sets: "1", reps: "As prescribed", rest: "60-90s", rpe: "5-6", cue: "Log FMS score. Focus on movement quality.", url: "https://www.youtube.com/results?search_query=FMS+movement+screen" },
      { name: "800m Time Trial", sets: "1", reps: "As prescribed", rest: "60-90s", rpe: "5-6", cue: "Pacing is key. Avoid starting too fast.", url: "https://www.youtube.com/results?search_query=800m+time+trial+pacing" },
      { name: "Cooper 12-min Run", sets: "1", reps: "12 min", rest: "60-90s", rpe: "5-6", cue: "Maintain consistent aerobic pace.", url: "https://www.youtube.com/results?search_query=Cooper+12+minute+run" },
      { name: "Body-weight Squat", sets: "3", reps: "12 reps", rest: "60s", rpe: "5-6", cue: "Use controlled 3-second eccentric descent.", url: "https://www.youtube.com/results?search_query=bodyweight+squat+tempo" },
      { name: "Push-ups", sets: "3", reps: "Max-2", rest: "60s", rpe: "5-6", cue: "Maintain straight body alignment.", url: "https://www.youtube.com/results?search_query=perfect+push+up+form" },
      { name: "Plank", sets: "3", reps: "30-45s", rest: "60s", rpe: "5-6", cue: "Brace core hard, avoid sagging hips.", url: "https://www.youtube.com/results?search_query=perfect+plank+form" }
    ]},
    { block: "Cool-down", exercises: [{ name: "90/90 hip stretch + doorway pec stretch", sets: "2", reps: "30s", rest: "-", rpe: "2", cue: "Breathe deeply during cooldown.", url: "https://www.youtube.com/results?search_query=90+90+hip+stretch" }] }
  ]
};

const day2: DayProgram = {
  day: 2, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [
      { name: "Skipping rope", sets: "3", reps: "1 min", rest: "30s", rpe: "4", cue: "Stay light on feet.", url: "https://www.youtube.com/results?search_query=skipping+rope+exercise" },
      { name: "Banded glute walks", sets: "2", reps: "15 steps", rest: "30s", rpe: "4", cue: "Activate glutes before lifting.", url: "https://www.youtube.com/results?search_query=banded+glute+walk" }
    ]},
    { block: "Main", exercises: [
      { name: "Goblet squat", sets: "3", reps: "10", rest: "90s", rpe: "6-7", cue: "Knees track over toes.", url: "https://www.youtube.com/results?search_query=goblet+squat+tutorial" },
      { name: "Romanian deadlift", sets: "3", reps: "10", rest: "90s", rpe: "6-7", cue: "Hinge from hips, neutral spine.", url: "https://www.youtube.com/results?search_query=romanian+deadlift+tutorial" },
      { name: "Reverse lunge", sets: "3", reps: "8/leg", rest: "60s", rpe: "6", cue: "Control knee position.", url: "https://www.youtube.com/results?search_query=reverse+lunge+exercise" },
      { name: "Standing calf raise", sets: "3", reps: "15", rest: "45s", rpe: "6", cue: "Full range motion.", url: "https://www.youtube.com/results?search_query=standing+calf+raise" }
    ]},
    { block: "Cool-down", exercises: [{ name: "Couch stretch + pigeon stretch", sets: "2", reps: "45s", rest: "-", rpe: "2", cue: "Relax and recover.", url: "https://www.youtube.com/results?search_query=couch+stretch" }] }
  ]
};

const day3: DayProgram = {
  day: 3, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [
      { name: "Band pull-aparts", sets: "2", reps: "15", rest: "30s", rpe: "4", cue: "Squeeze shoulder blades.", url: "https://www.youtube.com/results?search_query=band+pull+apart" },
      { name: "Wall slides", sets: "2", reps: "12", rest: "30s", rpe: "4", cue: "Keep lower back flat.", url: "https://www.youtube.com/results?search_query=wall+slides+exercise" }
    ]},
    { block: "Main", exercises: [
      { name: "Push-ups", sets: "4", reps: "AMRAP-2", rest: "75s", rpe: "7", cue: "Slow eccentric.", url: "https://www.youtube.com/results?search_query=perfect+push+up+form" },
      { name: "Inverted row", sets: "4", reps: "8 reps", rest: "75s", rpe: "7", cue: "Chest to bar.", url: "https://www.youtube.com/results?search_query=inverted+row+tutorial" },
      { name: "DB shoulder press", sets: "3", reps: "10 reps", rest: "75s", rpe: "7", cue: "Do not arch lower back.", url: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press" },
      { name: "Face pull", sets: "3", reps: "15 reps", rest: "60s", rpe: "6", cue: "Pull to forehead level.", url: "https://www.youtube.com/results?search_query=face+pull+tutorial" }
    ]},
    { block: "Cool-down", exercises: [{ name: "Thoracic foam roll + pec stretch", sets: "2", reps: "30s", rest: "-", rpe: "2", cue: "Promote shoulder recovery.", url: "https://www.youtube.com/results?search_query=thoracic+foam+roll" }] }
  ]
};

export const PROGRAM_DATA: DayProgram[] = Array.from({ length: 45 }, (_, i) => {
  const day = i + 1;
  if (day === 1) return day1;
  if (day === 2) return day2;
  if (day === 3) return day3;

  let phase = "Foundation";
  let color = "emerald";
  if (day >= 13 && day <= 26) { phase = "Build"; color = "blue"; }
  else if (day >= 27 && day <= 38) { phase = "Peak"; color = "orange"; }
  else if (day >= 39) { phase = "Taper"; color = "purple"; }

  return { day, phase, color, blocks: sharedExercises };
});

export function getDayProgram(day: number): DayProgram | null {
  return PROGRAM_DATA.find(d => d.day === day) ?? null;
}

export function getCampDay(): number {
  const campStart = new Date('2025-06-01');
  const today = new Date();
  const diff = Math.floor((today.getTime() - campStart.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 45);
}
