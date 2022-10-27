import { css } from "lit";

export const regexPatternString = "[a-zA-Z0-9]{4,10}";

export function preventDefault() {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): void | TypedPropertyDescriptor<EventListener> {
    const originalMethod: Function = descriptor.value;
    if (!(originalMethod instanceof Function)) return;
    descriptor.value = function (event: Event) {
      event.preventDefault();
      originalMethod.call(this, event);
    };
    return descriptor;
  };
}

export const formStyles = css`
  :host {
    display: none;
    max-width: 500px;
    margin: 1rem auto;
  }
  :host([show]) {
    display: block;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  form input {
    margin-bottom: 1rem;
  }
`;
