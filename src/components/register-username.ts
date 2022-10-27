import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formStyles, regexPatternString } from "./shared";

export const tagName = "register-username";

@customElement(tagName)
export class RegisterUsername extends LitElement {
  @property({ attribute: "show", reflect: true, type: Boolean })
  public show = true;

  connectedCallback() {
    super.connectedCallback();
    const username = window.localStorage.getItem("username");
    if (username) {
      this.dispatchRegisteredEvent(username);
      this.show = false;
    }
  }

  private handleSubmit: EventListener = (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) throw TypeError("Event not from form element.");
    const formData = new FormData(target);
    const username = formData.get("username")!.toString().trim();
    window.localStorage.setItem("username", username);
    this.show = false;
    this.dispatchRegisteredEvent(username);
  };

  private dispatchRegisteredEvent(username: string) {
    const usernameRegisteredEvent = new CustomEvent("username-registered", { detail: username });
    window.dispatchEvent(usernameRegisteredEvent);
  }

  static styles = [formStyles];

  render() {
    return html`<form @submit=${this.handleSubmit} id="login">
      <label for="username">Username</label>
      <input
        type="text"
        name="username"
        id="username"
        required
        pattern="${regexPatternString}"
        minlength="4"
        maxlength="10"
      />
      <button type="submit">Register Username</button>
    </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: RegisterUsername;
  }
  interface WindowEventMap {
    "username-registered": CustomEvent<string>;
  }
}
