import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperTabs extends PolymerElement {

  static get is () {
    return 'casper-epaper-tabs';
  }

  static get template () {
    return html`
      <style>
        :host {
          display: flex;
        }

        ::slotted(casper-epaper-tab:first-child) {
          border-top-left-radius: 20px;
          border-bottom-left-radius: 20px;
          border-left: 1px solid var(--primary-color);
        }

        ::slotted(casper-epaper-tab:last-child) {
          border-top-right-radius: 20px;
          border-bottom-right-radius: 20px;
        }
      </style>
      <slot></slot>
    `;
  }

  ready () {
    super.ready();

    const epaperTabs = this.shadowRoot.querySelector('slot').assignedElements()[0].assignedElements();

    this.shadowRoot.addEventListener('click', event => {
      epaperTabs.forEach(epaperTab => epaperTab.removeAttribute('active'));

      event.composedPath().find(element => element.nodeName.toLowerCase() === 'casper-epaper-tab').setAttribute('active', true);
    });
  }
}

customElements.define(CasperEpaperTabs.is, CasperEpaperTabs);