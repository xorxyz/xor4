/*
 * living entities are called actors
 */
import * as uuid from 'uuid';
import { Stack } from '../../../lib/stack';
import { Vector, getRandomDirection } from '../../../lib/math';
import { Look, looks } from '../visuals/looks';
import { Item } from '../things/items';
import { Spell } from '../magic/spells';
import { Health, Stamina, Mana, Wealth } from './stats';
import { Job, CritterJob, NoviceJob } from './jobs';
import { Command, Move } from './commands';
import { Room } from '../world/rooms';
import Engine from '../engine';

export abstract class Being {
  id: string = uuid.v4()

  position: Vector = new Vector()
  velocity: Vector = new Vector()

  health: Health = new Health()
  stamina: Stamina = new Stamina()

  get nextPosition() {
    return new Vector(
      Math.min(Math.max(0, this.position.x + this.velocity.x), 15),
      Math.min(Math.max(0, this.position.y + this.velocity.y), 9),
    );
  }
}

export class AgentModel {
  room: Room

  constructor(engine: Engine) {
    this.room = new Proxy(engine.room, {});
  }
}

export abstract class Agent extends Being {
  look: Look
  job: Job

  name: string
  model: AgentModel

  spells: Array<Spell> = []

  queue: Array<Command> = []
  stack: Stack<Item> = new Stack()

  mana: Mana = new Mana()
  wealth: Wealth = new Wealth()

  items: Array<Item> = []

  constructor(engine: Engine) {
    super();
    this.model = new AgentModel(engine);
  }

  takeTurn() {
    return this.queue.shift();
  }
}

export abstract class Npc extends Agent {
  job = new NoviceJob()
  look = looks.npc
  spells: Array<Spell> = []

  health: Health = new Health()
  stamina: Stamina = new Stamina()
  mana: Mana = new Mana()
  wealth: Wealth = new Wealth()
}

export abstract class Critter extends Agent {
  timer: NodeJS.Timeout
  job = new CritterJob()

  constructor(engine, delayMs: number = 1000) {
    super(engine);

    this.timer = setInterval(() => {
      const direction = getRandomDirection();

      this.queue.push(
        new Move(this, direction.x, direction.y),
      );
    }, delayMs);
  }
}

export abstract class Bug extends Agent {
  name = 'Bug'
  job = new NoviceJob()
  look = looks.bug
}

/* - Instances - */

export class Player extends Agent {
  constructor(engine: Engine, name: string, job: Job) {
    super(engine);

    this.name = name;
    this.job = job;
    this.look = job.look;
  }
}

export class Sheep extends Critter {
  name = 'Sheep'
  look = looks.sheep
}

export class Tutor extends Npc {
  name = 'Tutor'
}
