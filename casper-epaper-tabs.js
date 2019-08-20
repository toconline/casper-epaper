import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperEpaperTabs extends PolymerElement {

  static get is () {
    return 'casper-epaper-tabs';
  }

  static get properties () {
    return {
      selectedIndex: {
        type: Number,
        notify: true
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          display: flex;
          margin-left: 8px;
        }

        ::slotted(casper-epaper-tab:first-of-type) {
          border-top-left-radius: 20px;
          border-bottom-left-radius: 20px;
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

    afterNextRender(this, () => {
      const epaperTabs = this.shadowRoot.querySelector('slot').assignedElements();

      epaperTabs.forEach((tab, tabIndex) => {
        tab.addEventListener('active-changed', () => {
          if (!tab.active) return;

          this.selectedIndex = tabIndex;
          epaperTabs
            .filter(epaperTab => epaperTab !== tab)
            .forEach(epaperTab => epaperTab.active = false);
        });

        tab.addEventListener('disabled-changed', () => {
          if (tab.disabled && this.selectedIndex === tabIndex) {
            this.selectedIndex = undefined;
          }
        });
      });
    });
  }
}

customElements.define(CasperEpaperTabs.is, CasperEpaperTabs);