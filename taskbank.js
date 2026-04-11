/* ============================================================
   NEURO — TASK BANK
   The complete library of tasks, organised by category and
   sub-category. Used by the picker, by Neuro's AI extraction,
   and by the random task feature.
   ============================================================ */

const TASKBANK = {
  cleaning: {
    name: 'Cleaning',
    color: '#f472b6',
    sub: {
      Kitchen: [
        ['Wipe sides', 5, 'Low'],
        ['Clean hob', 10, 'Med'],
        ['Empty bin', 3, 'Low'],
        ['Clean microwave', 5, 'Low'],
        ['Mop floor', 15, 'Med'],
        ['Organise under sink', 15, 'Med'],
        ['Clean oven', 30, 'High'],
        ['Descale kettle', 10, 'Low'],
        ['Wipe cupboards', 10, 'Med'],
        ['Clean fridge', 20, 'Med'],
        ['Wash up', 15, 'Med'],
        ['Put shopping away', 10, 'Low'],
        ['Meal prep', 45, 'High'],
      ],
      Bathroom: [
        ['Clean toilet', 10, 'Med'],
        ['Clean shower screen', 10, 'Med'],
        ['Wipe mirror', 3, 'Low'],
        ['Clean tile grout', 20, 'High'],
        ['Empty bin', 2, 'Low'],
        ['Replace towels', 3, 'Low'],
        ['Scrub sink', 5, 'Low'],
        ['Mop floor', 10, 'Med'],
        ['Sort medicine cabinet', 10, 'Med'],
      ],
      Bedroom: [
        ['Change bedding', 15, 'Med'],
        ['Hoover', 10, 'Med'],
        ['Dust surfaces', 10, 'Low'],
        ['Organise wardrobe', 30, 'High'],
        ['Clear floordrobe', 15, 'Med'],
        ['Fold clothes', 15, 'Med'],
        ['Sort drawers', 20, 'Med'],
      ],
      Living: [
        ['Hoover', 10, 'Med'],
        ['Dust surfaces', 10, 'Low'],
        ['Tidy coffee table', 5, 'Low'],
        ['Plump cushions', 3, 'Low'],
        ['Sort post pile', 5, 'Low'],
        ['Tidy cables', 10, 'Low'],
      ],
      Laundry: [
        ['Put a wash on', 5, 'Low'],
        ['Hang washing up', 10, 'Low'],
        ['Iron', 30, 'Med'],
        ['Fold and put away', 15, 'Med'],
      ],
    },
  },
  selfcare: {
    name: 'Self Care',
    color: '#a78bfa',
    sub: {
      Basics: [
        ['Eat a proper meal', 20, 'Low'],
        ['Drink a glass of water', 1, 'Low'],
        ['Brush teeth (am)', 3, 'Low'],
        ['Brush teeth (pm)', 3, 'Low'],
        ['Have a shower', 15, 'Med'],
        ['Wash face', 3, 'Low'],
        ['Fresh clothes', 5, 'Low'],
        ['Take meds', 1, 'Low'],
      ],
      Pamper: [
        ['Full skincare', 15, 'Med'],
        ['Hair wash day', 20, 'Med'],
        ['Do nails', 20, 'Med'],
        ['Face mask', 20, 'Low'],
        ['Relax bath', 30, 'Low'],
        ['Everything shower', 30, 'Med'],
      ],
      Rest: [
        ['Phone down 30 min', 30, 'Low'],
        ['Nap', 30, 'Low'],
        ['Sit outside 10 min', 10, 'Low'],
        ['Cup of tea, no phone', 10, 'Low'],
        ['Lie down 10 min', 10, 'Low'],
      ],
    },
  },
  pets: {
    name: 'Pets',
    color: '#fb923c',
    sub: {
      Walking: [
        ['Walk the dog 15 min', 15, 'Low'],
        ['Walk the dog 30 min', 30, 'Med'],
        ['Walk the dog 45 min', 45, 'Med'],
      ],
      Care: [
        ['Bath dog', 30, 'High'],
        ['Brush dog', 10, 'Low'],
        ['Trim nails', 10, 'Med'],
        ['Clean bowls', 5, 'Low'],
        ['Fresh food prep', 15, 'Med'],
      ],
    },
  },
  exercise: {
    name: 'Exercise',
    color: '#34d399',
    sub: {
      Gentle: [
        ['Stretch in bed', 5, 'Low'],
        ['Walk to end of road', 5, 'Low'],
        ['10 min YouTube stretch', 10, 'Low'],
        ['Dance to one song', 4, 'Low'],
        ['5 min yoga', 5, 'Low'],
      ],
      Medium: [
        ['20 min walk', 20, 'Med'],
        ['Yoga video', 30, 'Med'],
        ['Pilates', 30, 'Med'],
        ['Cycle', 30, 'Med'],
      ],
      Strong: [
        ['Run', 30, 'High'],
        ['HIIT', 25, 'High'],
        ['Gym session', 60, 'High'],
        ['Long walk 1 hr', 60, 'Med'],
      ],
    },
  },
  admin: {
    name: 'Life Admin',
    color: '#60a5fa',
    sub: {
      Quick: [
        ['Check bank balance', 2, 'Low'],
        ['Reply to that text', 3, 'Low'],
        ['Check post', 3, 'Low'],
        ['Order meds', 5, 'Low'],
      ],
      Calls: [
        ['Book GP', 10, 'High'],
        ['Book dentist', 10, 'Med'],
        ['Call about bill', 15, 'High'],
        ['Renew prescription', 10, 'Med'],
      ],
      Money: [
        ['Check direct debits', 10, 'Med'],
        ['Update budget', 15, 'Med'],
        ['Log spending', 5, 'Low'],
        ['Review subscriptions', 10, 'Med'],
      ],
      Digital: [
        ['Clear email inbox', 15, 'Med'],
        ['Sort photos', 20, 'Med'],
        ['Back up phone', 10, 'Low'],
      ],
    },
  },
  creative: {
    name: 'Creative',
    color: '#e879f9',
    sub: {
      All: [
        ['Draw / doodle', 20, 'Low'],
        ['Journal', 15, 'Low'],
        ['Try a new recipe', 45, 'Med'],
        ['Colouring book', 20, 'Low'],
        ['Read 30 min', 30, 'Low'],
        ['Write something', 20, 'Low'],
        ['Photography', 20, 'Low'],
        ['Bake something', 45, 'Med'],
      ],
    },
  },
  social: {
    name: 'Social',
    color: '#fbbf24',
    sub: {
      Connect: [
        ['Text a friend', 5, 'Low'],
        ['Call family', 15, 'Med'],
        ['Reply to avoided message', 5, 'Med'],
        ['Send someone a meme', 2, 'Low'],
      ],
    },
  },
};

// Flat list for search and random pick
const FLAT_TASKS = (() => {
  const out = [];
  Object.entries(TASKBANK).forEach(([catKey, cat]) => {
    Object.entries(cat.sub).forEach(([subKey, tasks]) => {
      tasks.forEach(([name, mins, effort]) => {
        out.push({ catKey, cat: cat.name, color: cat.color, sub: subKey, name, mins, effort });
      });
    });
  });
  return out;
})();

// Day modes — preset suggestions
const DAY_MODES = [
  { id: 'light',    name: 'Light Day',       desc: 'easy tasks only',          cats: ['selfcare', 'pets', 'creative'] },
  { id: 'reset',    name: 'Self Care Reset', desc: 'put yourself first',       cats: ['selfcare', 'pets'] },
  { id: 'house',    name: 'Sort The House',  desc: 'cleaning focus',           cats: ['cleaning', 'selfcare', 'pets'] },
  { id: 'work',     name: 'Work Focused',    desc: 'minimal distractions',     cats: ['selfcare', 'pets', 'admin'] },
  { id: 'admin',    name: 'Life Admin',      desc: 'tackle the boring stuff',  cats: ['admin', 'selfcare'] },
  { id: 'move',     name: 'Get Moving',      desc: 'body day',                 cats: ['exercise', 'pets'] },
  { id: 'creative', name: 'Creative',        desc: 'make something',           cats: ['creative', 'selfcare'] },
  { id: 'design',   name: 'Design My Day',   desc: 'pick everything yourself', cats: [] },
];

window.TASKBANK = TASKBANK;
window.FLAT_TASKS = FLAT_TASKS;
window.DAY_MODES = DAY_MODES;
