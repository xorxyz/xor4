/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { IKeyboardEvent } from '../shared/interfaces';
import { logger } from '../shared/logger';
import { Vector } from '../shared/vector';
import { Queue } from '../shared/queue';
import { EveryAction } from '../world/actions';
import { IEngineState } from '../state/valid_state';

export interface Component {
  getCursorOffset?(): Vector
}

export interface IEvent {}

export type EventHandler = (event: IEvent) => EveryAction | null

export abstract class Component {
  public queue = new Queue<EveryAction>();

  readonly position: Vector;

  private handlers: Record<string, EventHandler> = {};

  constructor(position: Vector) {
    this.position = position;
  }

  emit(eventName: string, event: IEvent): void {
    const handler = this.handlers[eventName];
    if (handler) {
      const action = handler(event);
      if (action) this.queue.add(action);
    }
  }

  on(eventName: string, handler: EventHandler): void {
    if (this.handlers[eventName]) {
      logger.error(`Handler already exists for ${eventName}`);
      return;
    }
    this.handlers[eventName] = handler;
  }

  $update(state: IEngineState, keyboardEvents: IKeyboardEvent[]): void {
    if (this.update) this.update(state, keyboardEvents);
  }

  $render(): string[] {
    return this.render();
  }

  abstract update?(state: IEngineState, keyboardEvents: IKeyboardEvent[]): void

  abstract render(): string[]
}
