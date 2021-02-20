/**
 * - ui boxes: x,y numbering starts at 1.
 * - input fields - edit lines before before evaluating them as expressions
 */
import Connection from '../server/connection';
import * as esc from '../../lib/esc';
import { Vector } from '../../lib/math';
import {
  ARROW_LEFT,
  ARROW_RIGHT,
  BACKSPACE,
} from '../../lib/input';

export const SCREEN_WIDTH = 60;
export const LINE_LENGTH = 42;
export const N_OF_LINES = 5;
export const CELL_WIDTH = 3;

export abstract class UiComponent {
  position: Vector

  constructor(x: number, y: number) {
    this.position = new Vector(x, y);
  }

  abstract print(connection: Connection):Array<string>

  render(connection: Connection): string {
    return this
      .print(connection)
      .map((line, y) => (
        esc.cursor.setXY(this.position.x, this.position.y + y) + line
      ))
      .join('');
  }
}

export class Navbar extends UiComponent {
  print() {
    return [
      esc.style.invert +
      [
        ' xor4>',
        'King\'s Valley (0,0)',
        '1st 1/4 moon, 2038',
      ].join('    ').padEnd(SCREEN_WIDTH, ' ') +
      esc.style.reset,
    ];
  }
}

export class Axis extends UiComponent {
  print() {
    return [
      esc.style.dim,
      '   x0 x1 x2 x3 x4 x5 x6 x7 x8 x9',
      'x0 ',
      'x1 ',
      'x2 ',
      'x3 ',
      'x4 ',
      'x5 ',
      'x6 ',
      'x7 ',
      'x8 ',
      'x9 ',
      esc.style.reset,
    ];
  }
}

export class RoomMap extends UiComponent {
  print(connection: Connection) {
    return [
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. 🌵 .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
      '.. .. .. .. .. .. .. .. .. ..',
    ].map((line, y) => {
      const actors = connection.engine.actors.filter((a) => a.position.y === y);
      const items = connection.engine.items.filter((a) => a.position.y === y);
      const walls = connection.engine.walls.filter((a) => a.position.y === y);
      if (!actors.length && !items.length && !walls.length) return line;

      return line.split(' ').map((bytes, x) => {
        const actor = actors.find((a) => a.position.x === x);
        if (actor && actor.look) {
          return actor.look.bytes;
        }

        const item = items.find((i) => i.position.x === x);
        if (item && item.look) {
          return item.look.bytes;
        }

        const wall = walls.find((w) => w.position.x === x);
        if (wall && wall.look) {
          return wall.look.bytes;
        }

        return bytes;
      }).join(' ');
    });
  }
}

export class Sidebar extends UiComponent {
  print() {
    return [
      '🧙 John',
      'the Wizard',
      '',
      'X: 🔮 M Orb',
      `Y: ${esc.style.dim}nothing${esc.style.reset}`,
      `A: ${esc.style.dim}nothing${esc.style.reset}`,
      `B: ${esc.style.dim}nothing${esc.style.reset}`,
    ];
  }
}

export class Stats extends UiComponent {
  print({ player }: Connection) {
    return [
      'LV: 1',
      'XP: 0 of 100 ',
      'HP: 5 of 5',
      'SP: 5 of 5',
      'MP: 5 of 5',
      `GP: ${player.wealth.value}`,
    ];
  }
}

export class Output extends UiComponent {
  print({ state }) {
    return state.stdout
      .slice(-N_OF_LINES)
      .map((line) => line.padEnd(LINE_LENGTH, ' '));
  }
}

export class Input extends UiComponent {
  print({ state }) {
    const { line, prompt } = state;

    return [
      (prompt + line).padEnd(LINE_LENGTH, ' '),
    ];
  }
}

export class InputField {
  private line: string = ''
  private cursor: Vector = new Vector()

  get value() {
    return this.line;
  }

  get x() {
    return this.cursor.x;
  }

  get y() {
    return this.cursor.y;
  }

  /* returns true if input box needs an update */
  insert(buf: Buffer): boolean {
    if (this.line.length === LINE_LENGTH) return false;

    const hex = buf.toString('hex');

    if (hex === BACKSPACE) return this.backspace();
    if (hex === ARROW_LEFT) return this.moveLeft();
    if (hex === ARROW_RIGHT) return this.moveRight();

    /* catch all other ctrl sequences */
    if (hex.startsWith('1b')) return false;

    const char = buf.toString();
    const chars = this.line.split('');
    const { x } = this.cursor;

    this.line = [...chars.slice(0, x), char, ...chars.slice(x)].join('');
    this.cursor.x++;

    return true;
  }

  backspace(): boolean {
    if (!this.line.length) return false;

    const chars = this.line.split('');
    const { x } = this.cursor;

    this.cursor.x--;
    this.line = [...chars.slice(0, x - 1), ...chars.slice(x)].join('');
    this.line = this.line.slice(0, this.line.length);

    return true;
  }

  moveLeft(): boolean {
    if (this.cursor.x === 0) return false;
    this.cursor.x--;
    return true;
  }

  moveRight(): boolean {
    if (this.cursor.x === this.line.length) return false;
    this.cursor.x++;
    return true;
  }

  reset(): boolean {
    this.line = '';
    this.cursor.x = 0;
    return true;
  }
}
