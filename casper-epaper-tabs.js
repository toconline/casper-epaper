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
        notify: true,
        observer: '__selectedIndexChanged'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          display: flex;
          border-radius: 15px;
          box-shadow: 0px 2px 12px -1px rgba(0, 0, 0, 0.61);
        }

        ::slotted(casper-epaper-tab:first-of-type) {
          border-top-left-radius: 15px;
          border-bottom-left-radius: 15px;
        }

        ::slotted(casper-epaper-tab:last-of-type) {
          border-right: none;
          border-top-right-radius: 15px;
          border-bottom-right-radius: 15px;
        }
      </style>
      <slot></slot>
    `;
  }

  ready () {
    super.ready();

    afterNextRender(this, () => {
      this.__epaperTabs = this.shadowRoot.querySelector('slot').assignedElements();

      this.__epaperTabs.forEach((tab, tabIndex) => {
        tab.addEventListener('active-changed', () => {
          if (!tab.active) return;

          this.selectedIndex = tabIndex;
          this.__epaperTabs
            .filter(epaperTab => epaperTab !== tab)
            .forEach(epaperTab => epaperTab.active = false);
        });

        tab.addEventListener('disabled-changed', () => {
          if (!tab.disabled && tabIndex === this.selectedIndex) {
            tab.active = true;
          }
        });
      });
    });
  }

  __selectedIndexChanged (selectedIndex) {
    if (this.__epaperTabs.length > selectedIndex && !this.__epaperTabs[selectedIndex].disabled) {
      this.__epaperTabs[selectedIndex].active = true;
    } else {
      this.selectedIndex = undefined;
      this.__epaperTabs.forEach(tab => tab.active = false);
    }
  }
}

customElements.define(CasperEpaperTabs.is, CasperEpaperTabs);