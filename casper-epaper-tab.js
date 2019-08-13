import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperTab extends PolymerElement {

  static get is () {
    return 'casper-epaper-tab';
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
          border-left: none;
          border-top: 1px solid var(--primary-color);
          border-right: 1px solid var(--primary-color);
          border-bottom: 1px solid var(--primary-color);
          transition: background-color 100ms linear;
        }

        :host([active]) {
          color: white;
          background-color: var(--primary-color);
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
}

customElements.define(CasperEpaperTab.is, CasperEpaperTab);