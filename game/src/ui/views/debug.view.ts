import { Component } from '../component';
import { Vector } from '../../shared/vector';
import { TextInputComponent } from '../components/text_input_component';
import { TextOutputComponent } from '../components/text_output_component';
import { IRouter, View } from '../view';
import { EveryAction } from '../../world/actions';
import { IKeyboardEvent } from '../../shared/interfaces';
import { KeyCodes } from '../keys';
import { TitleBarComponent } from '../components/title_bar';
import { StackBarComponent } from '../components/stack_bar';

const OUTPUT_VERTICAL_OFFSET = 2;

export class DebugView extends View {
  private input: Component;

  private output: TextOutputComponent;

  constructor(router: IRouter) {
    super(router);

    this.registerComponent('title', new TitleBarComponent(new Vector(0, 0)));
    this.registerComponent('stack', new StackBarComponent(new Vector(2, 1)));

    this.output = this.registerComponent('output', new TextOutputComponent(new Vector(2, OUTPUT_VERTICAL_OFFSET)));
    this.input = this.registerComponent('input', new TextInputComponent(new Vector(2, OUTPUT_VERTICAL_OFFSET)));

    this.input.on('submit', function (event): EveryAction {
      if (event.text === '') {
        return { name: 'next', args: {} }
      }

      return {
        name: 'sh',
        args: {
          text: event.text,
        },
      }
    });

    this.focus(this.input);
  }

  override update(tick, shell, state, keyboardEvents: IKeyboardEvent[]): EveryAction | null {
    this.input.position.setY(OUTPUT_VERTICAL_OFFSET + this.output.linesOfText.length);
    let action: EveryAction | null = null
    keyboardEvents.forEach(event => {
      switch (event.keyCode) {
        case KeyCodes.BACKQUOTE:
          action = { name: 'debug', args: {} };
          break;
        case KeyCodes.PERIOD:
          action = { name: 'next', args: {} };
          break;
        default:
          break;
      }
    })
    return action;
  }
}
