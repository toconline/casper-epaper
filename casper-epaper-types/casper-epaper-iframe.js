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
          display: flex;
          flex-direction: column;
          width: calc(100% - 120px);
          height: calc(100% - 120px);
        }

        h3 {
          margin: 0;
          text-align: center;
          margin-bottom: 10px;
        }

        iframe {
          border: none;
          width: 100%;
          flex-grow: 1;
        }
      </style>
      <h3>[[__title]]</h3>
      <iframe srcdoc="[[__srcdoc]]"></iframe>
    `;
  }

  async open (contentType, source, title) {
    const fileRequest = await fetch(source);

    if (fileRequest.ok) {
      const fileContents = await fileRequest.text();

      this.__title = title;

      switch (contentType) {
        case 'html':
          this.__srcdoc = fileContents;
          break;
        case 'xml':
        case 'txt':
          const xmlDocumentContainer = document.createElement('pre');
          xmlDocumentContainer.style.margin = 0;
          xmlDocumentContainer.style.padding = '20px';
          xmlDocumentContainer.style.backgroundColor = 'white';
          xmlDocumentContainer.innerText = fileContents;

          this.__srcdoc = xmlDocumentContainer.outerHTML;
      }
    }
  }
}

customElements.define(CasperEpaperIframe.is, CasperEpaperIframe);