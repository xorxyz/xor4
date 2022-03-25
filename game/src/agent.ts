import { Points, Rectangle, Vector } from 'xor4-lib/math';
import { Direction, EAST, NORTH, SOUTH, WEST } from 'xor4-lib/directions';
import { Colors, esc } from 'xor4-lib/esc';
import { EntityType, Thing } from './thing';
import { Action, TerminalAction } from './action';
import { Cell } from './cell';
import { Mind } from './mind';
import { Capability } from './capability';

/**
 states:

  halt (pause ai brain)
  listen (direction, wait for a message to interpret)
  sleep (duration)
  random (speed)
  patrol (row or column)
  find (thing or agent)
  walk (towards route tree root or leaves)
  follow (agent)
  visit (agent's last known position)
  return (bring the flag home and return the value in hand)

*/

/** @category Agent */
export class HP extends Points {}

/** @category Agent */
export class SP extends Points {}

/** @category Agent */
export class MP extends Points {}

/** @category Agent */
export class GP extends Points {}

/** @category Agent */
export class AgentType extends EntityType {
  public weight: number = 10;
  public capabilities: Array<Capability> = [];
}

/** @category Agent */
export abstract class Hero extends AgentType {
  style = esc(Colors.Bg.Purple);
}

/** @category Agent */
export abstract class Friend extends AgentType {
  style = esc(Colors.Bg.Yellow);
}

/** @category Agent */
export abstract class Foe extends AgentType {
  style = esc(Colors.Bg.Red);
}

/** @category Agent */
export interface IFacing {
  direction: Direction,
  cell: Cell | null
}

/** @category Agent */
export enum AgentLogType {
  Info,
  Debug
}

/** @category Agent */
export interface AgentLog {
  tick: number,
  message: string,
  type?: AgentLogType,
  eventName?: string,
}

/** @category Agent */
export class Agent extends Thing {
  public name: string = 'anon';
  declare public type: AgentType;
  public mind: Mind;
  public hand: Agent | Thing | null = null;
  public eyes: Agent | Thing | null = null;
  public hp = new HP();
  public sp = new SP();
  public mp = new MP();
  public gp = new GP();
  public flashing: boolean = true;
  public isWaitingUntil: null | number = null;
  public halted: boolean = false;
  public dict = {};
  public facing: IFacing = {
    direction: new Direction(SOUTH),
    cell: null,
  };
  public cursorPosition: Vector = new Vector(0, 0);
  public experience: number = 0;
  public logs: Array<AgentLog> = [];

  constructor(type: AgentType) {
    super(type);
    this.mind = new Mind();

    type.capabilities.forEach((capability) => {
      capability.bootstrap(this);
    });
  }
  get level() { return 1; }

  get isAlive() { return this.hp.value > 0; }

  get isLookingAt() {
    return this.position.clone().add(this.facing.direction.value);
  }

  get(): Agent | Thing | null {
    if (this.hand || !this.facing.cell) return this.hand || null;

    this.hand = this.facing.cell.take();

    return this.hand;
  }

  drop(): boolean {
    if (!this.hand || !this.facing.cell || this.facing.cell.isBlocked) return false;

    this.facing.cell.put(this.hand);
    this.hand = null;

    return true;
  }

  schedule(action: Action) {
    if (action instanceof TerminalAction) {
      this.mind.queue.items.unshift(action);
    } else {
      this.mind.queue.add(action);
    }
  }

  takeTurn(tick: number): Action | null {
    this.mind.update(tick);
    this.type.capabilities.forEach((capability) => capability.run(this, tick));

    if (this.isWaitingUntil) {
      if (this.mind.tick >= this.isWaitingUntil) {
        this.isWaitingUntil = null;
      } else {
        return null;
      }
    }

    if (this.halted && !(this.mind.queue.peek() instanceof TerminalAction)) {
      return null;
    }

    const action = this.mind.queue.next();

    return action;
  }

  isFacing(vector: Vector) {
    // eslint-disable-next-line prefer-const
    let x1 = 0; let y1 = 0; let x2 = 16; let y2 = 10;

    if (this.facing.direction.value.equals(NORTH)) {
      y1 = 0;
      y2 = this.position.y + 1;
    }

    if (this.facing.direction.value.equals(EAST)) {
      x1 = this.position.x;
      x2 = 16;
    }

    if (this.facing.direction.value.equals(SOUTH)) {
      y1 = this.position.y;
      y2 = 10;
    }

    if (this.facing.direction.value.equals(WEST)) {
      x1 = 0;
      x2 = this.position.x + 1;
    }

    const rectangle = new Rectangle(new Vector(x1, y1), new Vector(x2, y2));

    return rectangle.contains(vector);
  }

  sees() {
    // eslint-disable-next-line prefer-const
    let x1 = 0; let y1 = 0; let x2 = 16; let y2 = 10;

    const rect = new Rectangle(new Vector(x1, y1), new Vector(x2, y2));

    return rect;
  }
}
