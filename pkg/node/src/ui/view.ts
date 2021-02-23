import { Terminal } from '../shell/terminal';
import {
  UiComponent,
  Navbar,
  Sidebar,
  Axis,
  RoomMap,
  Stats,
  Output,
  Input,
  Scroll,
} from './components';

export abstract class View {
  abstract boxes: Record<string, UiComponent>

  render(term: Terminal): string {
    return Object.values(this.boxes)
      .map((box) => box.render(term))
      .join('');
  }
}

export const boxes = {
  // top
  nav: new Navbar(1, 1),
  // left side
  side: new Sidebar(2, 4),
  stats: new Stats(2, 15),
  // right side
  axis: new Axis(20, 3),
  room: new RoomMap(22, 4),
  scroll: new Scroll(47, 5),
  output: new Output(20, 15),
  prompt: new Input(20, 20),
};

export const CURSOR_OFFSET_X = boxes.prompt.position.x + 2;
export const CURSOR_OFFSET_Y = boxes.prompt.position.y;

export class MainView extends View {
  boxes = boxes
}
