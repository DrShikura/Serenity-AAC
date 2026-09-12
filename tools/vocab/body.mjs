import { board, w, p, f, gap } from '../dsl.mjs';

export const boards = [
  board('body', 'My Body', '🫀', 'noun', 8, 5, [
    p('I need the bathroom', '🚽', { color: 'urgent' }),
    p('I need to pee', '🚽', { color: 'urgent' }),
    p('I need to poop', '🚽', { color: 'urgent' }),
    p('it hurts', '🤕', { color: 'urgent' }),
    p('I feel sick', '🤢', { color: 'urgent' }),
    p("I can't breathe", '😰', { color: 'urgent' }),
    p('I need my medicine', '💊', { color: 'urgent' }),
    p('I need a doctor', '🩺', { color: 'urgent' }),

    f('Body parts', '🦵', 'body_parts'),
    f('Hygiene', '🪥', 'body_hygiene'),
    f('Feelings', '😊', 'feelings', { color: 'describe' }),
    f('Help', '🆘', 'regulate', { color: 'urgent' }),
    w('hurt', '🤕', { color: 'verb', past: 'hurt', ing: 'hurting' }),
    w('sick', '🤒', { color: 'describe' }),
    w('tired', '😴', { color: 'describe' }),
    w('hungry', '😋', { color: 'describe' }),

    w('hot', '🥵', { color: 'describe' }),
    w('cold', '🥶', { color: 'describe' }),
    w('itchy', '😣', { color: 'describe' }),
    w('dizzy', '😵', { color: 'describe' }),
    w('sleepy', '🥱', { color: 'describe' }),
    w('thirsty', '😛', { color: 'describe' }),
    w('shaky', '🫨', { color: 'describe' }),
    w('better', '👍', { color: 'describe' }),

    w('band aid', '🩹', { plural: 'band aids' }),
    w('medicine', '💊'),
    w('ice pack', '🧊'),
    w('doctor', '🩺', { color: 'people' }),
    w('nurse', '🧑‍⚕️', { color: 'people' }),
    w('dentist', '🦷', { color: 'people' }),
    w('rest', '🛌', { color: 'verb', past: 'rested', ing: 'resting' }),
    w('sleep', '😴', { color: 'verb', past: 'slept', ing: 'sleeping' }),

    p('my tummy hurts', '🫄', { color: 'urgent' }),
    p('my head hurts', '🤕', { color: 'urgent' }),
    p('I bumped it', '💥', { color: 'social' }),
    p('I need a hug', '🤗', { color: 'social' }),
    p('I feel better', '😊', { color: 'social' }),
    p('I need to lie down', '🛌', { color: 'social' }),
    p('it hurts here', '❓', { color: 'question' }),
    p("I'm okay", '👌', { color: 'social' }),
  ]),

  board('body_parts', 'Body Parts', '🦵', 'noun', 8, 3, [
    w('head', '🗣️'), w('hair', '💇'), w('eye', '👁️', { plural: 'eyes' }), w('ear', '👂', { plural: 'ears' }),
    w('nose', '👃'), w('mouth', '👄'), w('teeth', '🦷'), w('tongue', '👅'),
    w('neck', '🧣'), w('shoulder', '💪', { plural: 'shoulders' }), w('arm', '💪', { plural: 'arms' }),
    w('hand', '✋', { plural: 'hands' }), w('finger', '👆', { plural: 'fingers' }), w('tummy', '🫄'),
    w('back', '🔙'), w('leg', '🦵', { plural: 'legs' }),
    w('knee', '🦵', { plural: 'knees' }), w('foot', '🦶', { plural: 'feet' }),
    w('toe', '🦶', { plural: 'toes' }), w('skin', '🖐️'),
    w('heart', '❤️'), w('bottom', '🍑'), w('throat', '🗣️'), w('chest', '🫁'),
  ]),

  board('body_hygiene', 'Washing & Care', '🪥', 'noun', 8, 2, [
    w('wash', '🧼', { color: 'verb', past: 'washed', ing: 'washing' }),
    w('brush teeth', '🪥', { color: 'verb', past: 'brushed teeth', ing: 'brushing teeth' }),
    w('bath', '🛁'), w('shower', '🚿'),
    w('soap', '🧼'), w('towel', '🧻', { plural: 'towels' }),
    w('toilet paper', '🧻'), w('hair brush', '💇'),
    w('toothbrush', '🪥'), w('toothpaste', '🪥'), w('shampoo', '🧴'), w('tissue', '🤧', { plural: 'tissues' }),
    p('I need to wash my hands', '🧼', { color: 'social' }),
    p('I need a tissue', '🤧', { color: 'social' }),
    p('I had an accident', '💧', { color: 'urgent' }),
    p('help me please', '🆘', { color: 'urgent' }),
  ]),

  // Like people/places, feelings used to be one flat, fully-packed board —
  // now a hub with the most frequent feelings and phrases, plus a folder to
  // the rest, with real empty space left on purpose.
  board('feelings', 'Feelings', '😊', 'describe', 8, 3, [
    f('More Feelings', '💭', 'feelings_more'),
    w('happy', '😀'), w('sad', '😢'), w('mad', '😠'), w('scared', '😨'),
    w('excited', '🤩'), w('calm', '😌'), w('silly', '🤪'),

    w('love', '❤️'), w('a little', '🤏'), w('very', '⬆️'), w('so much', '💯'),
    w('not', '🚫', { color: 'negation' }),
    gap, gap, gap,

    p('I feel happy', '😀', { color: 'social' }),
    p('I feel sad', '😢', { color: 'social' }),
    p('I am mad', '😠', { color: 'social' }),
    p("I'm scared", '😨', { color: 'social' }),
    p('I like it', '👍', { color: 'social' }),
    p("I don't like it", '👎', { color: 'negation' }),
    p('I love you', '❤️', { color: 'social' }),
    gap,
  ]),

  board('feelings_more', 'More Feelings', '💭', 'describe', 8, 2, [
    w('proud', '🥰'), w('lonely', '🥺'), w('bored', '😐'), w('surprised', '😲'),
    w('shy', '🫣'), w('confused', '😕'), w('embarrassed', '😳'), w('nervous', '😬'),

    w('frustrated', '😤'), w('worried', '😟'), w('grumpy', '😒'), w('safe', '🛡️'),
    p('why do I feel this way', '❓', { color: 'question' }),
    gap, gap, gap,
  ]),

  // Regulation and repair. Autistic kids are routinely given no way to say any
  // of this, so it gets a full board and a one-tap route from Home.
  board('regulate', 'Help & Feeling Big', '🆘', 'urgent', 8, 4, [
    p('I need a break', '⏸️', { color: 'urgent' }),
    p('I need space', '↔️', { color: 'urgent' }),
    p('too loud', '📢', { color: 'urgent' }),
    p('too bright', '💡', { color: 'urgent' }),
    p('too many people', '👥', { color: 'urgent' }),
    p("don't touch me", '🙅', { color: 'urgent' }),
    p('I need quiet', '🤫', { color: 'urgent' }),
    p('I need to go now', '🚪', { color: 'urgent' }),

    p('something is wrong', '⚠️', { color: 'urgent' }),
    p("I'm not okay", '😞', { color: 'urgent' }),
    p('I feel too big', '🌋', { color: 'urgent' }),
    p('I want to be alone', '🚶', { color: 'urgent' }),
    p('stay with me', '🤝', { color: 'social' }),
    p('I need my person', '🫂', { color: 'social' }),
    p('I need my toy', '🧸', { color: 'social' }),
    p('I need headphones', '🎧', { color: 'social' }),

    p("that's not what I meant", '🔄', { color: 'social' }),
    p('let me try again', '↩️', { color: 'social' }),
    p("you're not listening", '👂', { color: 'social' }),
    p('wait for me', '✋', { color: 'social' }),
    p('slow down', '🐌', { color: 'social' }),
    p('I need more time', '⏳', { color: 'social' }),
    p("I don't understand", '❓', { color: 'social' }),
    p('ask me again', '🔁', { color: 'social' }),

    // Single comfort words, not emergencies — the red urgent face and its halo
    // stay meaningful only if they are reserved for the rows above.
    w('break', '⏸️', { color: 'describe' }), w('quiet', '🤫', { color: 'describe' }),
    w('calm', '😌', { color: 'describe' }), w('safe', '🛡️', { color: 'describe' }),
    w('squeeze', '🫂', { color: 'describe' }), w('rock', '🪑', { color: 'describe' }),
    w('dark', '🌙', { color: 'describe' }), w('soft', '☁️', { color: 'describe' }),
  ]),
];
