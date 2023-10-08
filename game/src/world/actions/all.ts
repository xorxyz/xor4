import { Idea } from '../../scripting/types/idea';
import { StringType } from '../../scripting/types/string';
import { LiteralVector } from '../../scripting/types/vector';
import * as v from '../../shared/validation';
import { createActionDefinition, fail, succeed } from '../action';
import { Scroll } from '../agent';

export const sh = createActionDefinition({
  name: 'sh',
  args: v.object({
    text: v.string(),
  }),
  sig: ['text'],
  perform({ state, shell }, args) {
    try {
      shell.execute(args.text);
      return succeed('# ' + args.text);
    } catch (err) {
      const { message } = err as Error;
      shell.print(message);

      return fail(message);
    }
  },
  undo() {
    return succeed();
  },
});

export const next = createActionDefinition({
  name: 'next',
  perform({ shell }) {
    shell.continue();
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const debug = createActionDefinition({
  name: 'debug',
  perform({ state }) {
    state.debugMode = !state.debugMode;

    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const clear = createActionDefinition({
  name: 'clear',
  perform({ state, shell }) {
    shell.clear();

    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const create = createActionDefinition({
  name: 'create',
  sig: ['type', 'position'],
  args: v.object({
    type: v.string(),
    position: v.tuple([v.number(), v.number()]),
  }),
  perform() {
    return fail('TODO');
  },
  undo() {
    return succeed();
  },
});

export const heading = createActionDefinition({
  name: 'heading',
  perform({ agent, shell }) {
    shell.push(new LiteralVector(agent.heading.get()))
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const facing = createActionDefinition({
  name: 'facing',
  perform({ agent, shell }) {
    shell.push(new LiteralVector(agent.facing()))
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const left = createActionDefinition({
  name: 'left',
  perform({ agent, shell }) {
    agent.heading.left();
    shell.push(new LiteralVector(agent.heading.get()));
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const right = createActionDefinition({
  name: 'right',
  perform({ agent, shell }) {
    agent.heading.right();
    shell.push(new LiteralVector(agent.heading.get()));
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const point = createActionDefinition({
  name: 'point',
  sig: ['position'],
  args: v.object({
    position: v.vector(),
  }),
  perform({ area, shell }, { position }) {
    try {
      const cell = area.cellAt(position);
      shell.push(new Idea(cell.get()));
      return succeed();
    } catch (err) {
      shell.push(new Idea(0));
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const xy = createActionDefinition({
  name: 'xy',
  perform({ agent, area, shell }) {
    shell.push(new LiteralVector(area.find(agent.id).position));
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const step = createActionDefinition({
  name: 'step',
  perform({ agent, area, shell }) {
    try {
      const destination = agent.position.clone().add(agent.heading.get());
      area.move(agent, destination);
      shell.push(new LiteralVector(agent.position));
      return succeed();
    } catch (err) {
      shell.push(new LiteralVector(agent.position));
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const look = createActionDefinition({
  name: 'look',
  sig: ['id'],
  args: v.object({
    id: v.number(),
  }),
  perform({ shell, entities }, { id }) {
    try {
      if (id === 0) throw new Error(`It's nothing.`);
      const agent = entities.getAgent(id);
      shell.print(agent.describe());
      return succeed();
    } catch (err) {
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const hands = createActionDefinition({
  name: 'hands',
  perform({ agent, shell }) {
    try {
      const id = agent.holding();
      if (!id) throw new Error('There is nothing in your hands.');
      shell.push(new Idea(id));
      return succeed();
    } catch (err) {
      shell.push(new Idea(0));
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const get = createActionDefinition({
  name: 'get',
  perform({ agent, area, entities, shell }) {
    try {
      const target = area.cellAt(agent.position.clone().add(agent.heading.get()));
      const id = target.get();
      if (!id) throw new Error('There is nothing here.');
      const entity = entities.getAgent(id);
      agent.get(entity);
      target.remove(id);
      shell.push(new Idea(id));
      return succeed(`You take the ${entity.type}.`);
    } catch (err) {
      shell.push(new Idea(0));
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const put = createActionDefinition({
  name: 'put',
  perform({ agent, area, entities, shell }) {
    try {
      const entity = agent.put();
      if (!entity) throw new Error('You are not holding anything.');
      area.put(agent.facing(), entity);
      return succeed(`You put the ${entity.type} down.`);
    } catch (err) {
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const type = createActionDefinition({
  name: 'type',
  perform({ shell }) {
    const atom = shell.pop();
    if (!atom) {
      shell.push(new StringType('None'))
      return fail('`type` expecteds an atom on the stack.')
    }
    shell.push(new StringType(atom.type));
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const read = createActionDefinition({
  name: 'read',
  perform({ agent, entities, shell }) {
    try {
      const id = agent.holding();
      const entity = entities.getAgent(id);
      if (entity.type !== 'scroll') throw new Error(`That is not something you can read.`);
      const text = (entity as Scroll).read();
      shell.push(new StringType(text));
      shell.print(`It reads: '${text}'.`);
      return succeed();
    } catch (err) {
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const write = createActionDefinition({
  name: 'write',
  sig: ['text'],
  args: v.object({
    text: v.string()
  }),
  perform({ agent, entities, shell }, { text }) {
    try {
      const id = agent.holding();
      const entity = entities.getAgent(id);
      if (entity.type !== 'scroll') throw new Error(`That is not something you can write.`);
      (entity as Scroll).write(text);
      shell.print(`You write: '${text}' on the ${entity.type}.`);
      return succeed();
    } catch (err) {
      return fail((err as Error).message);
    }
  },
  undo() {
    return succeed();
  },
});

export const play_music = createActionDefinition({
  name: 'play_music',
  sig: ['title'],
  args: v.object({
    title: v.string()
  }),
  perform() {
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const pause_music = createActionDefinition({
  name: 'pause_music',
  perform() {
    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const help = createActionDefinition({
  name: 'help',
  perform({ shell }) {
    [
      'kernelquest, v5.0.0',
      'Type `"abc" about` to find more about the `abc` word.',
      'help\tabout\theading\tfacing\tstep\tleft\tright\tpop\tclear',
      'point\txy\tlook\thands\tget\tput\tread\twrite',
    ].forEach(line => shell.print(line));

    return succeed();
  },
  undo() {
    return succeed();
  },
});

export const about = createActionDefinition({
  name: 'about',
  sig: ['word'],
  args: v.object({
    word: v.string(),
  }),
  perform({ shell }, { word }) {
    const lines = {
      help: [
        'help == [] -> []',
        `\tLists the available words.`
      ],
      about: [
        'about == [word:String] -> []',
        `\tDescribes the usage of a given word.`
      ],
      pop: [
        'pop == [x:Atom] -> []',
        `\tRemoves the atom that's on top of the stack.`
      ],
      clear: [
        'clear == [] -> []',
        `\tClears the terminal output.`
      ],
      heading: [
        'heading == [] -> [v:Vector]',
        `\tReturns your current heading.`
      ],
      facing: [
        'facing == [] -> [v:Vector]',
        `\tReturns the position in front of you.`
      ],
      left: [
        'left == [] -> []',
        `\tRotates your heading left and returns your new heading.`
      ],
      right: [
        'right == [] -> []',
        `\tRotates your heading right and returns your new heading.`
      ],
      step: [
        'step == [] -> [v:Vector]',
        `\tIncrements your position by your heading, if the cell is free. Returns your position.`
      ],
      xy: [
        'xy == [] -> [v:Vector]',
        `\tReturns your current position.`
      ],
      point: [
        'point == [v:Vector] -> [i:Idea]',
        `\tReturns an idea of what's at a given position.`
      ],
      look: [
        'look == [i:Idea] -> []',
        `\tDescribes the thing represented by an idea.`
      ],
      hands: [
        'hands == [] -> [i:Idea]',
        '\tReturns an idea of what is your hands.'
      ],
      get: [
        'get == [] -> [i:Idea]',
        `\tPicks up what is in front of you, if possible. Returns an idea of that thing.`
      ],
      put: [
        'put == [] -> []',
        `\tDrops what's in your hands, if possible.`
      ],
      read: [
        'read == [] -> [q:Quotation]',
        `\tReturns the value contained in the readable thing you might be holding.`
      ],
      write: [
        'write == [q:Quotation] -> []',
        `\tWrites a value down if you are holding a writable thing.`
      ],
    }[word];

    if (!lines) return fail(`There is no help text for command '${word}'.`);

    lines.forEach(line => shell.print(line));

    return succeed();
  },
  undo() {
    return succeed();
  },
});

