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

        ::slotted(casper-epaper-tab:first-of-type) {
          border-top-left-radius: 20px;
          border-bottom-left-radius: 20px;
          border-left: 1px solid var(--primary-color) !important;
        }

        ::slotted(casper-epaper-tab:last-of-type) {
          border-top-right-radius: 20px;
          border-bottom-right-radius: 20px;
        }
      </style>
      <slot></slot>
    `;
  }

  ready () {
    super.ready();

    this.shadowRoot.addEventListener('click', event => {
      const clickedTab = event.composedPath().find(element => element.nodeName.toLowerCase() === 'casper-epaper-tab');
      clickedTab.setAttribute('active', true);

      Array.from(clickedTab.parentElement.children).forEach(children => {
        if (children.nodeName.toLowerCase() === 'casper-epaper-tab' && children !== clickedTab) {
          children.removeAttribute('active');
        }
      });
    });
  }
}

customElements.define(CasperEpaperTabs.is, CasperEpaperTabs);