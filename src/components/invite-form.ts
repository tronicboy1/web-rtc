import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { formStyles, globalStyles, preventDefault, regexPatternString } from "./shared";

export const tagName = "invite-form";

const invitationSentEventName = "invitation-sent";

@customElement(tagName)
export class InviteForm extends LitElement {
  private theirUsernameInputId = "their-username";
  @property({ attribute: "show", reflect: true, type: Boolean })
  public show = false;
  @property({ attribute: "username", type: String })
  public myUsername = "";

  @preventDefault()
  private handleSubmission(event: Event) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) throw TypeError("Event not from form element.");
    const formData = new FormData(target);
    const theirUsername = formData.get(this.theirUsernameInputId)!.toString().trim();
    const invitationSentEvent = new CustomEvent(invitationSentEventName, { detail: theirUsername, bubbles: true });
    this.dispatchEvent(invitationSentEvent);
    this.blur();
  }

  static styles = [formStyles, globalStyles];

  render() {
    return html` <h3><small>My Username:</small> <strong>${this.myUsername}</strong></h3>
      <form @submit=${this.handleSubmission}>
        <label for="">Their Username</label>
        <input
          id="${this.theirUsernameInputId}"
          name="${this.theirUsernameInputId}"
          type="search"
          autocomplete="off"
          autocapitalize="off"
          pattern="${regexPatternString}"
          required
        />
        <button type="submit">Send Invite</button>
      </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: InviteForm;
  }
  interface HTMLElementEventMap {
    [invitationSentEventName]: CustomEvent<string>;
  }
}
