import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperIframe extends PolymerElement {

  static get is () {
    return 'casper-epaper-iframe';
  }

  static get properties () {
    return {
      source: String,
    }
  }

  static get template () {
    return html`
      <style>
        :host {
          width: calc(100% - 120px);
          height: calc(100% - 120px);
        }
        iframe {
          border: none;
          width: 100%;
          height: 100%;
        }
      </style>
      <iframe src="[[source]]"></iframe>
    `;
  }
}

customElements.define(CasperEpaperIframe.is, CasperEpaperIframe);