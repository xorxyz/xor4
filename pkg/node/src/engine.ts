import { EventEmitter } from 'events';
import Clock from './clock';

const DEFAUT_CLOCK_RATE = 1 / 2;

export interface EngineOptions {
  rate?: number
}

export default class Engine extends EventEmitter {
  private clock: Clock
  private frame: number = 0

  constructor(opts: EngineOptions) {
    super();

    this.clock = new Clock(opts.rate || DEFAUT_CLOCK_RATE);

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

  }
}
