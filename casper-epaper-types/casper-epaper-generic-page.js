import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperGenericPage extends PolymerElement {

  static get is () {
    return 'casper-epaper-generic-page';
  }

  static get template () {
    return html`
      <style>
        #template-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div id="template-container"></div>
    `;
  }

  static get properties () {
    return {
      /**
       * The template that will be stamped by this component.
       *
       * @type {Object}
       */
      template: {
        type: Object,
        observer: '__templateChanged'
      }
    };
  }

  /**
   * Method that gets called as soon as the template changes and stamps it in the DOM.
   *
   * @param {Object} template The template that will be stamped by this component.
   */
  __templateChanged (template) {
    const templateClass = templatize(template);
    this.$['template-container'].innerHTML = '';
    this.$['template-container'].appendChild(new templateClass().root);
  }
}

customElements.define(CasperEpaperGenericPage.is, CasperEpaperGenericPage);