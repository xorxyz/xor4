import { Vector } from '../shared';
import {
  LiteralList,
  LiteralRef, LiteralString, LiteralVector, Operator, Quotation,
} from '../interpreter';
import { PathFinder } from './pathfinding';
import { AgentTypeName, ThingTypeName, World } from './world';
import { Area } from './area';
import { Agent, Foe, Hero } from './agent';
import { Engine } from './engine';
import { Cell, Glyph } from './cell';
import { Thing } from './thing';
import words from './words';

export type ValidActions = (
  'save' | 'load' |
  'noop' |
  'right' | 'left' |
  'face' | 'step' | 'backstep' | 'goto' |
  'ls' | 'look' |
  'get' | 'put' | 'mv' | 'rm' |
  'exec' | 'create' | 'spawn' |
  'tell' | 'halt' |
  'prop' | 'that' | 'me' | 'define' | 'clear' | 'xy' | 'facing' | 'del' | 'puts' |
  'say' | 'hi' | 'talk' | 'read' | 'claim' | 'scratch' | 'erase' | 'path'
)

export type SerializableType = boolean | number | string

export type ActionArguments = Record<string, SerializableType>

export type HistoryEventState = Record<string, SerializableType | Record<string, SerializableType>>

export interface IActionContext {
  world: World
  area: Area
  agent: Agent
  engine: Engine
}

export interface IActionResult {
  status: 'success' | 'failure'
  message: string
  state?: HistoryEventState
}

export interface IActionDefinition<
    T extends ActionArguments = ActionArguments,
    Z extends HistoryEventState = HistoryEventState
  > {
  cost: number
  perform (ctx: IActionContext, arg: T): IActionResult
  undo (ctx: IActionContext, arg: T, previousState: Z): IActionResult
}

const undoNoop = () => succeed('');

export interface IAction {
  name: ValidActions
  args?: ActionArguments
}

export const save: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ engine }) {
    engine.save();
    return succeed('');
  },
  undo: undoNoop,
};

export const load: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ engine }) {
    engine.load();
    return succeed('');
  },
  undo: undoNoop,
};

export const noop: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform() {
    return succeed('');
  },
  undo: undoNoop,
};

export const right: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent, area }) {
    agent.facing.direction.rotateRight();
    agent.facing.cell = area.cellAt(agent.isLookingAt);
    return succeed('');
  },
  undo({ agent, area }) {
    agent.facing.direction.rotateLeft();
    agent.facing.cell = area.cellAt(agent.isLookingAt);
    return succeed('');
  },
};

export const left: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent, area }) {
    agent.facing.direction.rotateLeft();
    agent.facing.cell = area.cellAt(agent.isLookingAt);
    return succeed('');
  },
  undo({ agent, area }) {
    agent.facing.direction.rotateRight();
    agent.facing.cell = area.cellAt(agent.isLookingAt);
    return succeed('');
  },
};

export const face: IActionDefinition<
{ x: number, y: number }, { direction: { x: number, y: number}}> = {
  cost: 0,
  perform({ agent, area }, { x, y }) {
    const direction = new Vector(x, y);
    const previousDirection = agent.facing.direction.value;

    agent.facing.direction.rotateUntil(direction);
    agent.facing.cell = area.cellAt(
      agent.position.clone().add(agent.facing.direction.value),
    );

    return succeed('', {
      previousDirection: previousDirection.toObject(),
    });
  },
  undo({ agent, area }, args, previousState) {
    const previousDirection = Vector.from(previousState.direction);
    agent.facing.direction.rotateUntil(previousDirection);
    agent.facing.cell = area.cellAt(
      agent.position.clone().add(agent.facing.direction.value),
    );

    return succeed('');
  },
};

export const step: IActionDefinition<
    ActionArguments,
    {
      position: { x: number, y: number }
      areaId?: number
    }
  > = {
    cost: 0,
    perform({
      agent, area, world, engine,
    }) {
      const target = area.cellAt(agent.isLookingAt);
      const previousPosition = agent.position.clone();

      // Collision with the edge of the area
      if (!target) {
        const { direction } = agent.facing;
        const nextAreaPosition = area.position.clone().add(direction.value);
        const nextArea = world.areas.find((a) => a.position.equals(nextAreaPosition));

        // If there is an adjacent area
        if (nextArea) {
          const nextPosition = agent.position.clone();
          if (direction.value.x === 1) nextPosition.setX(0);
          if (direction.value.x === -1) nextPosition.setX(15);
          if (direction.value.y === 1) nextPosition.setY(0);
          if (direction.value.y === -1) nextPosition.setY(9);
          if (nextArea.cellAt(nextPosition)?.slot) {
            if (engine.world.hero.id === agent.id) {
              engine.events.emit('sound:fail');
            }
            return fail('There is something blocking the way.');
          }
          area.remove(agent);
          agent.position.copy(nextPosition);
          nextArea.put(agent);
          agent.area = nextArea;

          return succeed('', {
            position: previousPosition.toObject(),
            areaId: area.id,
          });
        }
      }

      // Hero collides with enemy
      if (target?.slot instanceof Agent && target.slot.type instanceof Foe) {
        agent.hp.decrease(1);
        if (agent.hp.value === 0) {
        // TODO: Handle death of agent
        } else {
          agent.velocity.sub(agent.facing.direction.value);
        }
        return fail('');
      }

      // Enemy collides with hero
      if (agent.type instanceof Foe
        && target?.slot instanceof Agent
        && target.slot.type instanceof Hero) {
        if (target.slot.isAlive) {
          target.slot.hp.decrease(1);
          if (target.slot.hp.value === 0) {
            target.slot.type.glyph = new Glyph('☠️ ');
          } else {
            target.slot.velocity.add(agent.facing.direction.value);
          }
          return succeed('', {
            position: previousPosition.toObject(),
          });
        }
      }

      // Normal case, just a step
      if (target && (!target.isBlocked)) {
        area.cellAt(agent.position)?.take();
        target.put(agent);
        agent.position.add(agent.facing.direction.value);
        agent.facing.cell = area.cellAt(agent.isLookingAt);
        return succeed('', {
          position: previousPosition.toObject(),
        });
      }

      // Step through a door
      if (target?.slot?.type.name === 'door') {
        const next = area.cellAt(target.position.clone().add(agent.facing.direction.value));
        if (next && (!next.slot || !next.slot.type.isBlocking)) {
          console.log('its a door and theres a free cell after');
          area.cellAt(agent.position)?.take();
          next.put(agent);
          agent.position.add(agent.facing.direction.value);
          agent.position.add(agent.facing.direction.value);
          agent.facing.cell = area.cellAt(agent.isLookingAt);

          return succeed('', {
            position: previousPosition.toObject(),
          });
        }
      }

      if (engine.world.hero.id === agent.id) {
        engine.events.emit('sound:fail');
      }

      return fail('');
    },
    undo({ agent, area, world }, args, previousState) {
      const previousPosition = agent.position.clone();
      const targetPosition = Vector.from(previousState.position);
      const targetArea = world.areas.find((a) => a.id === previousState.areaId) || area;

      if (previousState.areaId !== undefined) {
        area.remove(agent);
        agent.area = targetArea;
      }

      const there = area.cellAt(previousPosition)?.take();
      console.log('there', there, previousPosition);
      targetArea.put(agent, targetPosition);
      agent.position.copy(targetPosition);

      return succeed('');
    },
  };

export const backstep: IActionDefinition<{}> = {
  cost: 0,
  perform({ agent, area }) {
    const oppositeDirection = agent.facing.direction.clone().rotateRight().rotateRight();
    const target = area.cellAt(agent.position.clone().add(oppositeDirection.value));

    if (target?.slot instanceof Agent && target.slot.type instanceof Foe) {
      agent.hp.decrease(1);
      if (agent.hp.value === 0) {
        // TODO: Handle death of agent
      } else {
        agent.velocity.sub(agent.facing.direction.value);
      }
      return fail('');
    }

    if (agent.type instanceof Foe
      && target?.slot instanceof Agent
      && target.slot.type instanceof Hero) {
      if (target.slot.isAlive) {
        target.slot.hp.decrease(1);
        if (target.slot.hp.value === 0) {
          target.slot.type.glyph = new Glyph('☠️ ');
        } else {
          target.slot.velocity.add(agent.facing.direction.value);
        }
        return succeed('');
      }
    }

    if (target && (!target.isBlocked)) {
      area.cellAt(agent.position)?.take();
      target.put(agent);
      agent.position.sub(agent.facing.direction.value);
      agent.facing.cell = area.cellAt(agent.isLookingAt);
      return succeed('');
    }

    return fail('');
  },
  undo: undoNoop,
};

// export const goto: IActionDefinition<{ x: number, y: number }> = {
//   cost: 0,
//   perform({ area, agent }, { x, y }) {
//     const pathfinder = new PathFinder(x, y);

//     if (agent.position.equals(pathfinder.destination)) {
//       return fail('Already here.');
//     }

//     const path = pathfinder.findPath(area, agent);

//     if (!path.length) return fail('Could not find a path.');

//     const actions = pathfinder.buildPathActions(agent, path.reverse());

//     // actions.forEach((action) => agent.schedule(action));

//     agent.mind.interpreter.exec(actions, () => {
//       console.log('goto: done!!!');
//     });

//     return succeed('Found a path to the destination cell.');
//   },
//   undo: undoNoop,
// };

export const path: IActionDefinition<{ fromX: number, fromY: number, toX: number, toY: number }> = {
  cost: 0,
  perform({ area, agent }, {
    fromX, fromY, toX, toY,
  }) {
    const from = new Vector(fromX, fromY);
    const pathfinder = new PathFinder(toX, toY);

    if (from.equals(pathfinder.destination)) {
      return fail('Already here.');
    }

    const p = pathfinder.findPath(area, from);

    if (!p.length) return fail('Could not find a path.');

    agent.mind.stack.push(Quotation.from(p.map((c) => new LiteralRef(c.id))));

    return succeed('Found a path to the destination cell.');
  },
  undo({ agent }) {
    agent.mind.stack.pop();
    return succeed('');
  },
};

export const ls: IActionDefinition<{}> = {
  cost: 0,
  perform({ area, agent }) {
    const agents = area.list();
    const refs = agents.map((a) => new LiteralRef(a.id));

    agent.mind.interpreter.sysret(new LiteralList(refs));

    return succeed(`Found ${refs.length} things.`);
  },
  undo({ agent }) {
    agent.mind.stack.pop();
    return succeed('');
  },
};

export const look: IActionDefinition<{ x:number, y: number}> = {
  cost: 0,
  perform({ area }, { x, y }) {
    const vector = new Vector(x, y);
    const cell = area.cellAt(vector);
    const seen = cell?.slot;

    return seen
      ? succeed(seen.label)
      : fail('Nothing here.');
  },
  undo: undoNoop,
};

export const get: IActionDefinition<{}> = {
  cost: 0,
  perform({ agent, area }) {
    if (!agent.facing.cell || !agent.facing.cell.slot) {
      return fail('There\'s nothing here.');
    }

    if (agent.hand && agent.inventory.length >= 3) {
      return fail('You hands are full.');
    }

    if (agent.facing.cell.slot instanceof Agent
       || (agent.facing.cell.slot instanceof Thing && agent.facing.cell.slot.type.isStatic)) {
      return fail('You can\'t get this.');
    }

    if (agent.facing.cell && agent.facing.cell.containsFoe()) {
      agent.hp.decrease(1);
      return fail('');
    }

    if (agent.hand) {
      agent.inventory.push(agent.hand);
    }

    const thing = agent.get() as Thing;

    return succeed(`You get the ${thing.name}.`);
  },
  undo: undoNoop,
};

export const put: IActionDefinition<{}> = {
  cost: 0,
  perform({ area, agent }) {
    if (!agent.hand) return fail('You are not holding anything.');

    const target = area.cellAt(agent.isLookingAt);

    return target && !target.isBlocked && agent.drop()
      ? succeed(`You put down the ${(target.slot as Thing).name}.`)
      : fail('There\'s already something here.');
  },
  undo: undoNoop,
};

export const mv: IActionDefinition<{fromX: number, fromY: number, toX: number, toY: number}> = {
  cost: 0,
  perform({ area }, {
    fromX, fromY, toX, toY,
  }) {
    const fromCell = area.cellAt(new Vector(fromX, fromY));
    const toCell = area.cellAt(new Vector(toX, toY));

    const thing = fromCell?.take();

    if (thing) {
      toCell?.put(thing);
      return succeed(
        `Moved [${thing.label}] from [${fromCell?.position.label}] to [${toCell?.position.label}].`,
      );
    }

    return fail('');
  },
  undo: undoNoop,
};

export const rm: IActionDefinition<{ id: number }> = {
  cost: 0,
  perform({ agent, area }, { id }) {
    const body = area.findBodyById(id);

    if (body && !(body instanceof Cell)) {
      if (body.id === agent.id) {
        agent.mind.interpreter.sysret(new LiteralRef(0));
        return fail('Cannot remove self.');
      }

      const cell = area.cellAt(body.position) as Cell;
      area.remove(body);
      agent.mind.interpreter.sysret(new LiteralRef(cell.id));
      return succeed(`Removed ${body.name}.`);
    }

    return fail('Nothing here.');
  },
  undo: undoNoop,
};

export const exec: IActionDefinition<{ text: string }> = {
  cost: 0,
  perform({ agent }, { text }) {
    try {
      const term = agent.mind.compiler.compile(text);

      agent.mind.interpreter.update(term);

      return succeed('');
    } catch (err) {
      return fail((err as Error).message);
    }
  },
  undo: undoNoop,
};

export const create: IActionDefinition<{ thingName: ThingTypeName, x: number, y: number }> = {
  cost: 0,
  perform({ world, area, agent }, { thingName, x, y }) {
    try {
      const position = new Vector(x, y);
      const thing = world.create(thingName, area, position);
      agent.mind.interpreter.sysret(new LiteralRef(thing.id));
      return succeed(`Created a ${thingName} at ${position.label}`);
    } catch (err) {
      agent.mind.interpreter.sysret(new LiteralRef(0));
      return fail(`Can't create a '${thingName}'`);
    }
  },
  undo: undoNoop,
};

export const spawn: IActionDefinition<{ agentName: AgentTypeName, x: number, y: number }> = {
  cost: 0,
  perform({ world, area }, { agentName, x, y }) {
    const position = new Vector(x, y);
    if (area.cellAt(position)?.slot) return fail('There is already something here');

    try {
      world.spawn(agentName, area, position);
      return succeed(`Created a ${agentName} at ${position.label}`);
    } catch (err) {
      return fail(`Can't spawn a '${agentName}'`);
    }
  },
  undo: undoNoop,
};

export const tell: IActionDefinition<{ agentId: number, message: string }> = {
  cost: 0,
  perform({ area }, { agentId, message }) {
    const targetAgent = area.findAgentById(agentId);

    if (!targetAgent) {
      return fail(`Could not find an agent with id ${agentId}`);
    }

    targetAgent.mind.queue.add({
      name: 'exec',
      args: {
        text: message,
      },
    });

    return succeed(`Told ${targetAgent.type.name} #${targetAgent.id}: "${message}".`);
  },
  undo: undoNoop,
};

export const halt: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent }) {
    agent.halt();
    return succeed('Halted.');
  },
  undo: undoNoop,
};

export const prop: IActionDefinition<{ id: number, propName: string }> = {
  cost: 0,
  perform({ agent, area }, { id, propName }) {
    const target = area.findBodyById(id);

    if (!target) {
      return fail(`Cannot find &${id}`);
    }

    const props = {
      id: (body) => new LiteralRef(body.id),
      name: (body) => new LiteralString(body.name || body.id),
      xy: (body) => new LiteralVector(body.position),
      type: (body) => new LiteralString(body.type?.name || 'cell'),
    };

    const fn = props[propName];

    const propValue = fn
      ? fn(target)
      : undefined;

    if (typeof propValue === 'undefined') {
      return fail(`Cannot find prop ${propName} on &${id}`);
    }

    agent.mind.interpreter.sysret(propValue);

    return succeed('');
  },
  undo: undoNoop,
};

export const that: IActionDefinition<{ x: number, y: number }> = {
  cost: 0,
  perform({ agent, area }, { x, y }) {
    const cell = area.cellAt(new Vector(x, y));

    if (!cell) {
      agent.mind.interpreter.sysret(new LiteralRef(0));
      return fail('');
    }

    if (!cell.slot) {
      agent.mind.interpreter.sysret(new LiteralRef(cell.id));
      return succeed('');
    }

    agent.mind.interpreter.sysret(new LiteralRef(cell.slot.id));

    return succeed('');
  },
  undo: undoNoop,
};

export const me: IActionDefinition<{ id: number }> = {
  cost: 0,
  perform({ agent }) {
    agent.mind.interpreter.sysret(new LiteralRef(agent.id));

    return succeed('');
  },
  undo: undoNoop,
};

export const define: IActionDefinition<{ name: string, program: string}> = {
  cost: 0,
  perform({ agent }, { name, program }) {
    if (agent.mind.compiler.dict[name]) {
      return fail(`The word '${name}' already exists.`);
    }

    agent.mind.compiler.dict[name] = new Operator([name], [], (ctx) => {
      const compiled = agent.mind.compiler.compile(program);
      console.log(compiled);
      compiled.forEach((f) => {
        agent.mind.interpreter.term.push(f);
      });
    });

    return succeed(`Defined [${program}] as '${name}'`);
  },
  undo: undoNoop,
};

export const clear: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent }) {
    const { tick } = agent.mind;

    agent.mind.stack.popN(agent.mind.stack.length);
    agent.logs = new Array(7).fill(0).map(() => ({
      tick,
      message: ' ',
    }));

    agent.mind.interpreter.sysret();

    return succeed('');
  },
  undo: undoNoop,
};

export const xy: IActionDefinition<{ refId: number }> = {
  cost: 0,
  perform({ area, agent }, { refId }) {
    const referenced = area.findBodyById(refId);
    if (referenced) {
      agent.mind.interpreter.sysret(new LiteralVector(referenced.position));
      return succeed('');
    }
    return fail(`There is no agent with ref id ${refId}`);
  },
  undo: undoNoop,
};

export const facing: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent }) {
    agent.mind.interpreter.sysret(
      new LiteralVector(agent.facing.direction.value),
    );

    return succeed('');
  },
  undo: undoNoop,
};

export const del: IActionDefinition<{ word: string }> = {
  cost: 0,
  perform({ agent }, { word }) {
    if (agent.mind.compiler.dict[word]) {
      delete agent.mind.compiler.dict[word];
      return succeed(`Deleted the word '${word}'`);
    }
    return fail(`Word '${word}' does not exist`);
  },
  undo: undoNoop,
};

export const puts: IActionDefinition<{ message: string }> = {
  cost: 0,
  perform(_, { message }) {
    return succeed(message);
  },
  undo: undoNoop,
};

export const say: IActionDefinition<{ message: string }> = {
  cost: 0,
  perform({ area }, { message }) {
    [...area.agents].forEach((a) => {
      message.split('\n').forEach((m) => {
        a.logs.push({
          message: m,
          tick: a.mind.tick,
        });
      });
    });

    return succeed('');
  },
  undo: undoNoop,
};

export const hi: IActionDefinition<{ agentId: number }> = {
  cost: 0,
  perform({ area, engine }, { agentId }) {
    const target = area.findAgentById(agentId);

    if (target) {
      while (engine.story.canContinue) {
        const message = engine.story.Continue() || '';
        target.mind.queue.add({
          name: 'say',
          args: {
            message,
          },
        });
      }

      if (engine.story.currentChoices.length) {
        target.mind.queue.add({
          name: 'say',
          args: {
            message: engine.story.currentChoices.map((c) => `${c.index}) ${c.text}`).join('\n'),
          },
        });
      }

      return succeed('');
    }

    return fail(`No agent with id ${agentId}`);
  },
  undo: undoNoop,
};

export const talk: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent, area, engine }) {
    const targetId = agent.facing.cell?.slot?.id;
    if (targetId) {
      const target = area.findAgentById(targetId);

      if (target) {
        engine.story.ChoosePathString('intro');
        if (engine.story.canContinue) {
          engine.story.Continue();
          engine.tty.talking = true;
        } else {
          return fail('');
        }

        return succeed('');
      }
    }

    return fail('There is no one here to talk to.');
  },
  undo: undoNoop,
};

export const read: IActionDefinition<ActionArguments> = {
  cost: 0,
  perform({ agent, engine }) {
    const thing = agent.hand;
    if (thing) {
      engine.story.ChoosePathString('example_book');
      if (engine.story.canContinue) {
        engine.story.Continue();
        engine.tty.talking = true;
      } else {
        return fail('Could not find content for this book.');
      }

      return succeed('');
    }

    return fail('You are not holding a book.');
  },
  undo: undoNoop,
};

export const claim: IActionDefinition<{ x: number, y: number, w: number, h: number}> = {
  cost: 0,
  perform({ agent }, {
    x, y, w, h,
  }) {
    agent.mind.interpreter.exec([new LiteralVector(new Vector(x, y)), words.goto], () => {
      console.log('claim: goto done !!!!!!!!!!');
    });

    return succeed('Claiming...');
  },
  undo: undoNoop,
};

export const scratch: IActionDefinition<{ n: number}> = {
  cost: 0,
  perform({ agent }, { n }) {
    const { cell } = agent.facing;

    if (!cell) {
      return fail('There is no cell here.');
    }

    cell.scratch(n);

    agent.mind.stack.push(new LiteralRef(cell.id));

    return succeed(`Scratched ${n} at ${cell.position.label}`);
  },
  undo: undoNoop,
};

export const erase: IActionDefinition<{}> = {
  cost: 0,
  perform({ agent }) {
    const { cell } = agent.facing;

    if (!cell) {
      return fail('There is no cell here.');
    }

    cell.erase();

    agent.mind.stack.push(new LiteralRef(cell.id));

    return succeed(`Erased ${cell.position.label}`);
  },
  undo: undoNoop,
};

export const actions: Record<ValidActions, IActionDefinition<any>> = {
  save,
  load,
  noop,
  right,
  left,
  face,
  step,
  backstep,
  // goto,
  path,
  ls,
  look,
  get,
  put,
  mv,
  rm,
  exec,
  create,
  spawn,
  tell,
  halt,
  prop,
  that,
  me,
  define,
  clear,
  xy,
  facing,
  del,
  puts,
  say,
  hi,
  talk,
  read,
  claim,
  scratch,
  erase,
};

export function succeed(msg: string, state?: HistoryEventState): IActionResult {
  return {
    status: 'success',
    message: msg,
    state,
  };
}

export function fail(msg: string): IActionResult {
  return {
    status: 'failure',
    message: msg,
  };
}
