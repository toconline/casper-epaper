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
          background-color: white;
        }
      </style>
      <h3>[[__title]]</h3>
      <iframe id="iframe" srcdoc="[[__srcdoc]]" sandbox></iframe>
    `;
  }

  download () {
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', this.source);
    downloadLink.setAttribute('download', true);
    downloadLink.setAttribute('target', '_blank');
    downloadLink.style.display = 'none';
    this.shadowRoot.appendChild(downloadLink);
    downloadLink.click();
    this.shadowRoot.removeChild(downloadLink);
  }

  async open () {
    const fileRequest = await fetch(this.source);

    if (fileRequest.ok) {
      const fileContents = await fileRequest.text();

      this.__title = this.title;

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