export class Stack<T> {
  list: Array<T>

  constructor() {
    this.list = [];
  }

  push(value: T) {
    this.list.push(value);
  }

  pop() {
    return this.list.pop();
  }

  peek() {
    return this.list[this.length - 1];
  }

  get length() {
    return this.list.length;
  }
}
