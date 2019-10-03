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
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        iframe {
          border: none;
          width: 100%;
          flex-grow: 1;
          background-color: white;
        }
      </style>
      <iframe id="iframe" srcdoc="[[__srcdoc]]" sandbox></iframe>
    `;
  }

  async open () {
    const fileRequest = await fetch(this.source);

    if (fileRequest.ok) {
      const fileContents = await fileRequest.text();

      switch (this.contentType) {
        case 'file/htm':
        case 'file/html':
          this.__srcdoc = fileContents;
          break;
        case 'file/xml':
        case 'file/txt':
          const xmlDocumentContainer = document.createElement('pre');
          xmlDocumentContainer.style.margin = 0;
          xmlDocumentContainer.style.padding = '20px';
          xmlDocumentContainer.style.overflow = 'auto';
          xmlDocumentContainer.style.backgroundColor = 'white';
          xmlDocumentContainer.innerText = fileContents;

          this.__srcdoc = xmlDocumentContainer.outerHTML;
      }
    }
  }
}

customElements.define(CasperEpaperIframe.is, CasperEpaperIframe);