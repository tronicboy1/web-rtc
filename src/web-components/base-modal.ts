import { css, html, LitElement } from "lit";
import { property, customElement } from "lit/decorators.js";
import { globalStyles } from "./shared";

export const tagName = "base-modal";
const closeModalEventName = "modal-closed";

@customElement(tagName)
export class BaseModal extends LitElement {
  @property({ attribute: "modal-title" })
  modalTitle: string = "";
  @property({ attribute: true, reflect: true, type: Boolean })
  show: boolean = false;

  static styles = [
    globalStyles,
    css`
      :host([show]) #backdrop {
        display: flex;
        animation: fadeIn forwards 0.3s;
      }
      #backdrop {
        display: none;
        position: fixed;
        opacity: 0;
        z-index: 10;
        left: 0;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
      }
      #modal-container {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        background: var(--primary-color);
        border: 1px var(--primary-color) solid;
        border-radius: 10px;
        padding: 1rem;
        width: 90%;
        max-width: 450px;
        max-height: 70%;
        margin: auto;
        overflow-y: auto;
      }

      #title {
        font-size: 1.5rem;
      }

      header {
        border-bottom: 1px solid var(--secondary-color);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      header h1 {
        word-wrap: break-word;
      }

      svg {
        height: 34px;
        width: auto;
        cursor: pointer;
        fill: var(--secondary-color);
      }

      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    `,
  ];

  #stopPropagation: EventListener = (event) => event.stopPropagation();

  #closeModal: EventListener = () => {
    this.dispatchEvent(new Event(closeModalEventName));
  };

  render() {
    return html`
      <div @mousedown=${this.#closeModal} id="backdrop" class="modal">
        <div @mousedown=${this.#stopPropagation} id="modal-container">
          <header>
            <h1 id="title">${this.modalTitle}</h1>
            <svg
              @click=${this.#closeModal}
              xmlns="http://www.w3.org/2000/svg"
              height="48"
              width="48"
              viewBox="0, 0, 48, 48"
            >
              <path
                d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"
              />
            </svg>
          </header>
          <div id="modal-content">
            <slot></slot>
            <slot name="buttons"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElemenTagNamMap {
    [tagName]: BaseModal;
  }
  interface HTMLElementEventMap {
    [closeModalEventName]: Event;
  }
}
