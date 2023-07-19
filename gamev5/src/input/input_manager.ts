import { InputEvent } from '../shared/events';
import { IKeyboardEvent, ITerminal } from '../shared/interfaces';
import { Queue } from '../shared/queue';

export class InputManager {
  private terminal: ITerminal;

  private keyboardEvents = new Queue<IKeyboardEvent>();

  constructor(terminal: ITerminal) {
    this.terminal = terminal;

    this.terminal.onKey(this.handleInput.bind(this));
  }

  getInputEvents(): InputEvent[] {
    const events: InputEvent[] = [];
    for (let i = 0; i < this.keyboardEvents.size; i += 1) {
      const keyboardEvent = this.keyboardEvents.next();
      if (keyboardEvent) {
        events.push(new InputEvent(keyboardEvent));
      }
    }
    return events;
  }

  private handleInput(event: IKeyboardEvent): void {
    this.keyboardEvents.add(event);
  }
}
