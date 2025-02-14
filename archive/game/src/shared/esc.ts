import { Vector } from './math';

export const ESC = '\u001B';
export const esc = (str: string) => `${ESC}${str}`;

export const Colors = {
  Bg: {
    Black: '[40m',
    Gray: '[48;5;248m',
    White: '[107m',
    Red: '[41m',
    Green: '[42m',
    Blue: '[044m',
    Cyan: '[0;106m',
    DarkCyan: '[48;5;6m',
    Purple: '[0;105m',
    Yellow: '[0;103m',
    Brown: '[0;43m',
  },
  Fg: {
    Black: '[30m',
    White: '[37m',
    Green: '[32m',
    Gray: '[38;5;248m',
  },
};

export const Style = {
  Invert: '[7m',
  Reset: '[0m',
  White: '[37m',
  Dim: '[2m',
  inverted: (str: string) => Style.Invert + str,
  in: (fg, bg, str) => esc(fg) + esc(bg) + str,
};

export const Screen = {
  Clear: '[2J',
};

export const Line = {
  ClearAfter: '[0K',
  ClearBefore: '[1L',
  Clear: '[2K',
  Start: '[G',
};

export const Cursor = {
  Blink: '[5;m',
  EraseRight: '[K',
  MoveLeft: '[1D',
  MoveRight: '[1C',
  up: (n) => `[${n}A`,
  right: (n) => `[${n}C`,
  down: (n) => `[${n}B`,
  left: (n) => `[${n}D`,
  setX: (x: number) => `[;${x}H]`,
  setXY: (x: number, y: number) => `[${y};${x}H`,
  set: (v: Vector) => `[${v.y};${v.x}H`,
};

export const AnsiRegex = new RegExp([
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;'
  + '[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
  '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
].join('|'), 'g');

export const stripAnsi = (s: string) => s.replace(AnsiRegex, '');
