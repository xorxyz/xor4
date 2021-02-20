/*
 * living entities are called actors
 */
import * as uuid from 'uuid';
import {
  Item,
  Weapon,
  Clothes,
  Relic,
} from './items';
import {
  Health,
  Stamina,
  Mana,
  Wealth,
} from './capabilities';
import { Look, looks } from './looks';
import {
  Job,
  CritterJob,
  NoviceJob,
} from './jobs';
import { Command, MoveCommand } from './commands';
import { Vector } from '../../lib/math';
import { getRandomDirection } from '../../lib/utils';

export abstract class Actor {
  id: string = uuid.v4()
  name: string
  abstract job: Job
  abstract look: Look

  position: Vector = new Vector()
  velocity: Vector = new Vector()

  queue: Array<Command> = []

  health: Health = new Health()
  stamina: Stamina = new Stamina()
  mana: Mana = new Mana()
  wealth: Wealth = new Wealth()

  wield: Weapon | null = null
  wear: Clothes | null = null
  hold: Relic | null = null

  items: Array<Item> = []

  takeTurn() {
    return this.queue.shift();
  }
}

export abstract class Players extends Actor {
  name: string
  commands: Array<Command> = []
  job = new NoviceJob()

  constructor(name: string = 'AnonymousPlayer') {
    super();
    this.name = name;
  }
}

export abstract class Critter extends Actor {
  timer: NodeJS.Timeout
  job = new CritterJob()

  constructor(delayMs: number = 1000) {
    super();

    this.timer = setInterval(() => {
      const direction = getRandomDirection();

      this.queue.push(
        new MoveCommand(direction.x, direction.y),
      );
    }, delayMs);
  }
}

export abstract class Npc extends Actor {
  job = new NoviceJob()
  look = looks.npc
}

export abstract class Bug extends Actor {
  name = 'Bug'
  job = new NoviceJob()
  look = looks.bug
}

/* - Instances - */

export class Player extends Players {
  look = looks.me;
}

export class Sheep extends Critter {
  name = 'Sheep'
  look = looks.sheep
}

export class Tutor extends Npc {
  name = 'Tutor'
}
