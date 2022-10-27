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
    --border-color: #e1e1e1;
  }
  :host([show]) {
    display: block;
  }

  form {
    display: flex;
    flex-direction: column;
  }

  form input,
  button {
    margin-bottom: 1rem;
    height: 35px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  button {
    background-color: var(--border-color);
    cursor: pointer;
  }
`;

export const globalStyles = css`
  * {
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }
`;
