import { board, w, p, f, gap } from '../dsl.mjs';

export const boards = [
  board('food', 'Food & Drink', '🍎', 'noun', 8, 5, [
    f('Fruit', '🍓', 'food_fruit'),
    f('Snacks', '🍿', 'food_snacks'),
    f('Meals', '🍕', 'food_meals'),
    f('Sweets', '🍦', 'food_sweets'),
    f('Drinks', '🥤', 'food_drinks'),
    f('Veggies', '🥕', 'food_veggies'),
    f('Tastes', '👅', 'food_tastes', { color: 'describe' }),
    f('At the table', '🍽️', 'food_table'),

    w('eat', '😋', { color: 'verb', pos: 'verb', past: 'ate', ing: 'eating' }),
    w('drink', '🥛', { color: 'verb', pos: 'verb', past: 'drank', ing: 'drinking' }),
    w('open', '🫙', { color: 'verb', pos: 'verb', past: 'opened', ing: 'opening' }),
    w('cut', '🔪', { color: 'verb', pos: 'verb', past: 'cut', ing: 'cutting' }),
    w('pour', '🫗', { color: 'verb', pos: 'verb', past: 'poured', ing: 'pouring' }),
    w('cook', '👩‍🍳', { color: 'verb', pos: 'verb', past: 'cooked', ing: 'cooking' }),
    w('share', '🤝', { color: 'verb', pos: 'verb', past: 'shared', ing: 'sharing' }),
    w('taste', '👅', { color: 'verb', pos: 'verb', past: 'tasted', ing: 'tasting' }),

    w('hungry', '😋', { color: 'describe' }),
    w('thirsty', '😛', { color: 'describe' }),
    w('full', '🫄', { color: 'describe' }),
    w('yummy', '😍', { color: 'describe' }),
    w('yucky', '🤢', { color: 'describe' }),
    p('too hot', '🥵', { color: 'describe' }),
    p('too cold', '🥶', { color: 'describe' }),
    p('all gone', '🫗', { color: 'describe' }),

    w('water', '💧', { pos: 'noun' }),
    w('milk', '🥛', { pos: 'noun' }),
    w('juice', '🧃', { pos: 'noun' }),
    w('bread', '🍞', { pos: 'noun' }),
    w('cheese', '🧀', { pos: 'noun' }),
    w('egg', '🥚', { pos: 'noun', plural: 'eggs' }),
    w('pasta', '🍝', { pos: 'noun' }),
    w('rice', '🍚', { pos: 'noun' }),

    p("I'm hungry", '🍽️', { color: 'social' }),
    p('I want a snack', '🍿', { color: 'social' }),
    p('more please', '➕', { color: 'social' }),
    p('no thank you', '🙅', { color: 'negation' }),
    p("I don't like it", '👎', { color: 'negation' }),
    p("that's too much", '🙌', { color: 'describe' }),
    p('a little bit', '🤏', { color: 'describe' }),
    p("I'm all done", '✅', { color: 'social' }),
  ]),

  board('food_fruit', 'Fruit', '🍓', 'noun', 8, 3, [
    w('apple', '🍎', { plural: 'apples' }), w('banana', '🍌', { plural: 'bananas' }),
    w('orange', '🍊', { plural: 'oranges' }), w('grapes', '🍇'),
    w('strawberry', '🍓', { plural: 'strawberries' }), w('watermelon', '🍉'),
    w('blueberry', '🫐', { plural: 'blueberries' }), w('peach', '🍑', { plural: 'peaches' }),
    w('pear', '🍐', { plural: 'pears' }), w('pineapple', '🍍', { plural: 'pineapples' }),
    w('mango', '🥭', { plural: 'mangoes' }), w('cherry', '🍒', { plural: 'cherries' }),
    w('lemon', '🍋', { plural: 'lemons' }), w('kiwi', '🥝', { plural: 'kiwis' }),
    w('melon', '🍈', { plural: 'melons' }), w('plum', '🫐', { plural: 'plums' }),
    w('raspberry', '🍇', { plural: 'raspberries' }), w('coconut', '🥥', { plural: 'coconuts' }),
    w('avocado', '🥑', { plural: 'avocados' }), w('tomato', '🍅', { plural: 'tomatoes' }),
    w('apple sauce', '🥣'), w('fruit cup', '🥣'),
    w('berries', '🫐'), w('dried fruit', '🍇'),
  ]),

  board('food_snacks', 'Snacks', '🍿', 'noun', 8, 2, [
    w('crackers', '🍘'), w('chips', '🍟'), w('popcorn', '🍿'), w('pretzel', '🥨', { plural: 'pretzels' }),
    w('cheese stick', '🧀', { plural: 'cheese sticks' }), w('yogurt', '🥛'),
    w('granola bar', '🍫', { plural: 'granola bars' }), w('fruit snacks', '🍬'),
    w('nuts', '🥜'), w('raisins', '🍇'), w('apple slices', '🍎'), w('cookie', '🍪', { plural: 'cookies' }),
    w('muffin', '🧁', { plural: 'muffins' }), w('toast', '🍞'), w('cereal', '🥣'), w('pickle', '🥒', { plural: 'pickles' }),
  ]),

  board('food_meals', 'Meals', '🍕', 'noun', 8, 3, [
    w('pizza', '🍕'), w('sandwich', '🥪', { plural: 'sandwiches' }), w('pasta', '🍝'),
    w('chicken nuggets', '🍗'), w('hot dog', '🌭', { plural: 'hot dogs' }),
    w('hamburger', '🍔', { plural: 'hamburgers' }), w('taco', '🌮', { plural: 'tacos' }), w('soup', '🍲'),
    w('rice', '🍚'), w('mac and cheese', '🧀'), w('eggs', '🍳'), w('pancakes', '🥞'),
    w('waffles', '🧇'), w('cereal', '🥣'), w('salad', '🥗'), w('french fries', '🍟'),
    w('noodles', '🍜'), w('fish', '🐟'), w('beans', '🫘'), w('potato', '🥔', { plural: 'potatoes' }),
    w('chicken', '🍗'), w('burrito', '🌯', { plural: 'burritos' }), w('quesadilla', '🫓'), w('breakfast', '🍳'),
  ]),

  board('food_sweets', 'Sweets', '🍦', 'noun', 8, 2, [
    w('ice cream', '🍦'), w('cookie', '🍪', { plural: 'cookies' }), w('cake', '🍰'),
    w('candy', '🍬'), w('chocolate', '🍫'), w('donut', '🍩', { plural: 'donuts' }),
    w('lollipop', '🍭', { plural: 'lollipops' }), w('cupcake', '🧁', { plural: 'cupcakes' }),
    w('pudding', '🍮'), w('jello', '🍮'), w('marshmallow', '🍡', { plural: 'marshmallows' }),
    w('pie', '🥧'), w('popsicle', '🍡', { plural: 'popsicles' }), w('gummy bears', '🐻'),
    w('sprinkles', '🎉'), w('milkshake', '🥤'),
  ]),

  board('food_drinks', 'Drinks', '🥤', 'noun', 8, 2, [
    w('water', '💧'), w('milk', '🥛'), w('juice', '🧃'), w('apple juice', '🍎'),
    w('orange juice', '🍊'), w('chocolate milk', '🍫'), w('smoothie', '🥤'), w('soda', '🥤'),
    w('lemonade', '🍋'), w('tea', '🍵'), w('hot chocolate', '☕'), w('water bottle', '🍶'),
    w('straw', '🥤'), w('cup', '🥛', { plural: 'cups' }), w('ice', '🧊'), p('more to drink', '🥤'),
  ]),

  board('food_veggies', 'Veggies', '🥕', 'noun', 8, 2, [
    w('carrot', '🥕', { plural: 'carrots' }), w('broccoli', '🥦'), w('corn', '🌽'), w('peas', '🫛'),
    w('potato', '🥔', { plural: 'potatoes' }), w('cucumber', '🥒', { plural: 'cucumbers' }),
    w('lettuce', '🥬'), w('pepper', '🫑', { plural: 'peppers' }),
    w('green beans', '🫛'), w('celery', '🥬'), w('sweet potato', '🍠'), w('onion', '🧅', { plural: 'onions' }),
    w('mushroom', '🍄', { plural: 'mushrooms' }), w('salad', '🥗'), w('vegetables', '🥗'), w('dip', '🥣'),
  ]),

  board('food_tastes', 'Tastes & Textures', '👅', 'describe', 8, 2, [
    w('yummy', '😍'), w('yucky', '🤢'), w('sweet', '🍬'), w('salty', '🧂'),
    w('sour', '🍋'), w('spicy', '🌶️'), w('hot', '🔥'), w('cold', '🧊'),
    w('crunchy', '🥨'), w('soft', '☁️'), w('chewy', '🍬'), w('too much', '🙌'),
    w('a little', '🤏'), w('enough', '✋'), w('all gone', '🫗'), w('different', '🔀'),
  ]),

  board('food_table', 'At the Table', '🍽️', 'noun', 8, 2, [
    w('plate', '🍽️', { plural: 'plates' }), w('bowl', '🥣', { plural: 'bowls' }),
    w('cup', '🥛', { plural: 'cups' }), w('fork', '🍴', { plural: 'forks' }),
    w('spoon', '🥄', { plural: 'spoons' }), w('knife', '🔪', { plural: 'knives' }),
    w('napkin', '🧻', { plural: 'napkins' }), w('table', '🪑'),
    w('high chair', '🪑'), w('lunch box', '🧰'), w('bib', '👶'), w('tray', '🍱'),
    p('I spilled', '💦', { color: 'social' }),
    p('I need a napkin', '🧻', { color: 'social' }),
    p('clean it up', '🧽', { color: 'social' }),
    p('sit down', '🪑', { color: 'verb' }),
  ]),
];
