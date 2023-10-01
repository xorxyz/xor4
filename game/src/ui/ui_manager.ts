import { IKeyboardEvent, ITerminal } from '../shared/interfaces';
import { IRouter, View } from './view';
import { Ansi } from './ansi';
import { DebugView } from './views/debug.view';
import { TitleView } from './views/title.view';
import { EveryAction } from '../world/actions';
import { IGameState } from '../state/valid_state';
import { Runtime } from '../scripting/runtime';

export class UIManager {
  private activeView: View;

  private shell: Runtime;

  private terminal: ITerminal;

  private tick = 0;

  private views = new Map<string, View>();

  private router = {
    go: this.go.bind(this),
  };

  constructor(terminal: ITerminal, shell: Runtime) {
    this.shell = shell;
    this.terminal = terminal;

    this.activeView = this.registerView('title', TitleView);
    this.registerView('debug', DebugView);
  }

  render(): void {
    const output = this.activeView.render();
    const cursorPosition = this.activeView.getCursorPosition();
    const moveCursor = Ansi.setXY(cursorPosition.x, cursorPosition.y);

    this.terminal.write(Ansi.clearScreen() + output + moveCursor);
  }

  update(tick: number, shell: Runtime, state: IGameState, events: IKeyboardEvent[]): EveryAction | null {
    const action = this.activeView.$update(tick, shell, state, events);

    return action;
  }

  private registerView(name: string, Ctor: new (router: IRouter) => View): View {
    const view = new Ctor(this.router);
    this.views.set(name, view);
    return view;
  }

  private go(name: string): void {
    if (!this.views.has(name)) {
      throw new Error(`viewManager.go(): View '${name}' does not exist.`);
    }

    this.activeView = this.views.get(name);

    if (this.activeView.onLoad) this.activeView.onLoad(this.tick);
  }
}
