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
        notify: true,
        observer: '__activeChanged'
      },
      disabled: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '__disabledChanged'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          height: 32px;
          display: flex;
          user-select: none;
          align-items: center;
          justify-content: center;
          background-color: white;
          color: var(--primary-color);
          border-right: 1px solid var(--primary-color);
          transition: background-color 100ms linear;
        }

        :host([active]) {
          color: white;
          background-color: var(--primary-color);
        }

        :host([disabled]) {
          color: white;
          pointer-events: none;
          border-color: #D4D4D4;
          background-color: #E0E0E0;
        }

        :host(:hover) {
          color: white;
          cursor: pointer;
          background-color: var(--primary-color);
        }

        .tab-container {
          width: 100%;
          height: 100%;
          padding: 0 25px;
          display: flex;
          align-items: center;
        }
      </style>
      <div class="tab-container" on-click="__activateTab">
        <slot></slot>
      </div>
    `;
  };

  __activateTab (event) {
    // Stop the bubbling of the event if the tab is currently active.
    if (this.active) event.stopPropagation();

    this.active = true;
  }

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