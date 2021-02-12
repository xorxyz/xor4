/*
 * the game engine
 */

import { EventEmitter } from 'events';
import { Action } from './actions';
import { Actor } from './actors';
import Clock from '../../lib/clock';
import { World } from './places';

const DEFAUT_CLOCK_RATE = 1 / 2;

export interface EngineOptions {
  rate?: number
}

export default class Engine extends EventEmitter {
  private clock: Clock
  private world: World
  private frame: number = 0

  constructor(opts: EngineOptions) {
    super();

    this.clock = new Clock(opts.rate || DEFAUT_CLOCK_RATE);
    this.world = new World();

    this.clock.on('tick', this.update.bind(this));

    this.reset();
  }

  reset() {
    this.clock.pause();
    this.clock.reset();
  }

  start() { this.clock.start(); }
  pause() { this.clock.pause(); }

  get currentFrame() {
    return this.frame;
  }

  update() {
    const actions: Array<Action> = [];

    this.world.zones.forEach(({ rooms }) => {
      rooms.forEach(({ actors }) => {
        actors.forEach((actor: Actor) => {
          const action = actor.takeTurn();

          if (action) {
            actions.push(action);
          }
        });
      });
    });
  }
}
