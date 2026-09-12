import { board, w, p, f } from '../dsl.mjs';

export const boards = [
  // The small words that hold a sentence together. Without "am", "is" and
  // "was" the tense buttons can only ever produce "I playing" — this board is
  // what makes the tense strip genuinely usable.
  board('build', 'Building Words', '🧩', 'social', 8, 5, [
    w('am', '🙋', { color: 'verb' }), w('is', '👉', { color: 'verb' }),
    w('are', '👥', { color: 'verb' }), w('was', '⏪', { color: 'verb' }),
    w('were', '⏪', { color: 'verb' }), w('will', '⏩', { color: 'verb' }),
    w('do', '✅', { color: 'verb' }), w('did', '⏪', { color: 'verb' }),

    w('does', '✅', { color: 'verb' }), w('have', '🫴', { color: 'verb' }),
    w('has', '🫴', { color: 'verb' }), w('had', '⏪', { color: 'verb' }),
    w('can', '💪', { color: 'verb' }), w('could', '🤔', { color: 'verb' }),
    w('should', '☝️', { color: 'verb' }), w('would', '🤔', { color: 'verb' }),

    w('a', '1️⃣', { color: 'describe' }), w('an', '1️⃣', { color: 'describe' }),
    w('the', '👉', { color: 'describe' }), w('and', '➕', { color: 'describe' }),
    w('but', '↔️', { color: 'describe' }), w('or', '🔀', { color: 'describe' }),
    w('because', '➡️', { color: 'describe' }), w('so', '➡️', { color: 'describe' }),

    w('in', '📥', { color: 'describe' }), w('on', '⬆️', { color: 'describe' }),
    w('under', '⬇️', { color: 'describe' }), w('with', '🤝', { color: 'describe' }),
    w('to', '➡️', { color: 'describe' }), w('from', '⬅️', { color: 'describe' }),
    w('for', '🎁', { color: 'describe' }), w('at', '📍', { color: 'describe' }),

    w('my', '🤲', { color: 'people' }), w('your', '🫵', { color: 'people' }),
    w('his', '👦', { color: 'people' }), w('her', '👧', { color: 'people' }),
    w('their', '👬', { color: 'people' }), w('our', '👨‍👩‍👧', { color: 'people' }),
    w('if', '🤔', { color: 'describe' }), w('than', '⚖️', { color: 'describe' }),
  ]),

  // She is learning flags, so she gets the words to talk about them.
  // Flag emoji render on iOS and Android; Windows shows letter pairs instead.
  board('world', 'Flags & Countries', '🌍', 'noun', 8, 5, [
    w('United States', '🇺🇸'), w('Canada', '🇨🇦'), w('Mexico', '🇲🇽'), w('Brazil', '🇧🇷'),
    w('United Kingdom', '🇬🇧'), w('Ireland', '🇮🇪'), w('France', '🇫🇷'), w('Germany', '🇩🇪'),
    w('Spain', '🇪🇸'), w('Italy', '🇮🇹'), w('Portugal', '🇵🇹'), w('Greece', '🇬🇷'),
    w('Netherlands', '🇳🇱'), w('Sweden', '🇸🇪'), w('Norway', '🇳🇴'), w('Poland', '🇵🇱'),
    w('Ukraine', '🇺🇦'), w('Russia', '🇷🇺'), w('Turkey', '🇹🇷'), w('Egypt', '🇪🇬'),
    w('Kenya', '🇰🇪'), w('Nigeria', '🇳🇬'), w('South Africa', '🇿🇦'), w('India', '🇮🇳'),
    w('China', '🇨🇳'), w('Japan', '🇯🇵'), w('South Korea', '🇰🇷'), w('Thailand', '🇹🇭'),
    w('Australia', '🇦🇺'), w('New Zealand', '🇳🇿'), w('Argentina', '🇦🇷'), w('Switzerland', '🇨🇭'),
    w('flag', '🏳️', { plural: 'flags' }), w('country', '🗺️', { plural: 'countries' }),
    w('map', '🗺️', { plural: 'maps' }), w('world', '🌍'),
    w('continent', '🌎', { plural: 'continents' }), w('ocean', '🌊', { plural: 'oceans' }),
    w('language', '💬', { plural: 'languages' }), w('capital city', '🏙️'),
  ]),
];
