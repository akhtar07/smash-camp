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
    exercises: [{ name: "Dynamic mobility + activation drills", sets: "2", reps: "10 min", rest: "30s", rpe: "4", cue: "Prepare joints and nervous system." }]
  },
  {
    block: "Main",
    exercises: [
      { name: "Strength / power badminton-specific drills", sets: "4", reps: "6-12 reps", rest: "90-120s", rpe: "7-9", cue: "Explosive intent and movement quality." },
      { name: "Court movement + shadow badminton", sets: "4", reps: "30-60 sec", rest: "60s", rpe: "7-8", cue: "Stay on toes and recover quickly." }
    ]
  },
  {
    block: "Cool-down",
    exercises: [{ name: "Foam rolling + stretching + breathing", sets: "2", reps: "10 min", rest: "-", rpe: "2", cue: "Focus on recovery and mobility." }]
  }
];

const day1: DayProgram = {
  day: 1, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [{ name: "Joint circles, leg swings, walking lunges, world's greatest stretch", sets: "1", reps: "10/side", rest: "60-90s", rpe: "3", cue: "Establish baseline mobility." }] },
    { block: "Main", exercises: [
      { name: "FMS Movement Screen", sets: "1", reps: "As prescribed", rest: "60-90s", rpe: "5-6", cue: "Log FMS score." },
      { name: "800m Time Trial", sets: "1", reps: "As prescribed", rest: "60-90s", rpe: "5-6", cue: "Pacing is key." },
      { name: "Cooper 12-min Run", sets: "1", reps: "12 min", rest: "60-90s", rpe: "5-6", cue: "Maintain aerobic pace." },
      { name: "Body-weight Squat", sets: "3", reps: "12 reps", rest: "60s", rpe: "5-6", cue: "3-sec eccentric." },
      { name: "Push-ups", sets: "3", reps: "Max-2", rest: "60s", rpe: "5-6", cue: "Straight body." },
      { name: "Plank", sets: "3", reps: "30-45s", rest: "60s", rpe: "5-6", cue: "Brace core." }
    ]},
    { block: "Cool-down", exercises: [{ name: "90/90 hip stretch + doorway pec stretch", sets: "2", reps: "30s", rest: "-", rpe: "2", cue: "Breathe deeply." }] }
  ]
};

const day2: DayProgram = {
  day: 2, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [
      { name: "Skipping rope", sets: "3", reps: "1 min", rest: "30s", rpe: "4", cue: "Light on feet." },
      { name: "Banded glute walks", sets: "2", reps: "15 steps", rest: "30s", rpe: "4", cue: "Activate glutes." }
    ]},
    { block: "Main", exercises: [
      { name: "Goblet squat", sets: "3", reps: "10", rest: "90s", rpe: "6-7", cue: "Track knees." },
      { name: "Romanian deadlift", sets: "3", reps: "10", rest: "90s", rpe: "6-7", cue: "Hinge hips." },
      { name: "Reverse lunge", sets: "3", reps: "8/leg", rest: "60s", rpe: "6", cue: "Control knee." },
      { name: "Standing calf raise", sets: "3", reps: "15", rest: "45s", rpe: "6", cue: "Full range." }
    ]},
    { block: "Cool-down", exercises: [{ name: "Couch stretch + pigeon stretch", sets: "2", reps: "45s", rest: "-", rpe: "2", cue: "Recover." }] }
  ]
};

const day3: DayProgram = {
  day: 3, phase: "Foundation", color: "emerald",
  blocks: [
    { block: "Warm-up", exercises: [
      { name: "Band pull-aparts", sets: "2", reps: "15", rest: "30s", rpe: "4", cue: "Squeeze blades." },
      { name: "Wall slides", sets: "2", reps: "12", rest: "30s", rpe: "4", cue: "Flat back." }
    ]},
    { block: "Main", exercises: [
      { name: "Push-ups", sets: "4", reps: "AMRAP-2", rest: "75s", rpe: "7", cue: "Slow eccentric." },
      { name: "Inverted row", sets: "4", reps: "8", rest: "75s", rpe: "7", cue: "Chest to bar." },
      { name: "DB shoulder press", sets: "3", reps: "10", rest: "75s", rpe: "7", cue: "No arching." },
      { name: "Face pull", sets: "3", reps: "15", rest: "60s", rpe: "6", cue: "Forehead level." }
    ]},
    { block: "Cool-down", exercises: [{ name: "Thoracic foam roll + pec stretch", sets: "2", reps: "30s", rest: "-", rpe: "2", cue: "Shoulder recovery." }] }
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
