import joi from 'joi';
import { Component, ComponentType } from '../../lib/ecs';

export const type: ComponentType = 'command';
export const schema: joi.ObjectSchema = joi.object({
  type: joi.string(),
  payload: joi.object()
});

export default class Command extends Component {
  constructor(data) {
    super(type, schema, data)
  }
}
