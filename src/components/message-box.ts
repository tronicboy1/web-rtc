import { css, html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { formStyles, globalStyles } from "./shared";

export const tagName = "message-box";

type DecodedMessage = { sender: string; message: string };

@customElement(tagName)
export class MessageBox extends LitElement {
  @state()
  private messages: DecodedMessage[] = [];
  @query("ul")
  private ul!: HTMLUListElement;

  constructor(
    private myUsername: string,
    private dataChannel: ReturnType<InstanceType<typeof RTCPeerConnection>["createDataChannel"]>
  ) {
    super();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.dataChannel.addEventListener("message", this.handleIncomingMessage);
  }

  private handleIncomingMessage = (event: MessageEvent<string>) => {
    console.log("Message Received: ", event);
    const data = JSON.parse(event.data) as DecodedMessage;
    console.log(data);
    this.messages = [...this.messages, data];
    this.ul.scroll({ top: -1 });
  };

  private handleSubmit: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("Must be used with form element.");
    const formData = new FormData(form);
    const message = formData.get("message")!.toString().trim();
    const data: DecodedMessage = { message, sender: this.myUsername };
    const JSONData = JSON.stringify(data);
    this.dataChannel.send(JSONData);
    this.messages = [...this.messages, data];
    this.updateComplete.then(() => {
      const lastElement = this.ul.lastElementChild!;
      if (lastElement) lastElement.scrollIntoView({ behavior: "smooth" });
    });
  };

  static styles = [
    globalStyles,
    formStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        max-width: 500px;
        min-height: 30vh;
        width: 90%;
        margin: 0 auto;
      }

      ul {
        max-height: 20vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        list-style-type: none;
      }

      li {
        border-bottom: 1px solid var(--border-colo);
      }
      li:last-child {
        border: none;
      }

      svg {
        width: auto;
        max-height: 100%;
      }

      form {
        flex-direction: row;
      }

      input {
        flex: 1 1 80%;
      }

      button {
        flex: 0 0 20%;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    `,
  ];

  render() {
    return html`<ul>
        ${this.messages.map((message) => html`<li>${message.sender}: ${message.message}</li>`)}
      </ul>
      <form @submit=${this.handleSubmit}>
        <input type="text" name="message" required />
        <button type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" viewbox="0,0,48,48">
            <path d="M6 40V8l38 16Zm3-4.65L36.2 24 9 12.5v8.4L21.1 24 9 27Zm0 0V12.5 27Z" />
          </svg>
        </button>
      </form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: MessageBox;
  }
}
