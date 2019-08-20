import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperTab extends PolymerElement {

  static get is () {
    return 'casper-epaper-tab';
  }

  static get properties () {
    return {
      active: {
        type: Boolean,
        value: false,
        observer: '__activeChanged'
      },
      disabled: {
        type: Boolean,
        value: false,
        observer: '__disabledChanged'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          height: 32px;
          padding: 0 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color);
          border-left: 1px solid var(--primary-color);
          border-top: 1px solid var(--primary-color);
          border-right: 1px solid var(--primary-color);
          border-bottom: 1px solid var(--primary-color);
          transition: background-color 100ms linear;
        }

        :host([active]) {
          color: white;
          background-color: var(--primary-color);
        }

        :host([disabled]) {
          color: #B3B3B3;
          border-color: #B3B3B3;
          pointer-events: none;
        }

        :host(:hover) {
          color: white;
          cursor: pointer;
          background-color: var(--primary-color);
        }
      </style>
      <slot></slot>
    `;
  };

  __activeChanged () {
    if (this.active) {
      this.setAttribute('active', true);
      this.removeAttribute('disabled');
    } else {
      this.removeAttribute('active');
    }
  }

  __disabledChanged () {
    if (this.disabled) {
      this.removeAttribute('active');
      this.setAttribute('disabled', true);
    } else {
      this.removeAttribute('disabled');
    }
  }
}

customElements.define(CasperEpaperTab.is, CasperEpaperTab);