/*
  - Copyright (c) 2014-2019 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-epaper.
  -
  - casper-epaper is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-epaper  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-epaper.  If not, see <http://www.gnu.org/licenses/>.
  -
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperIframe extends PolymerElement {

  static get is () {
    return 'casper-epaper-iframe';
  }

  static get properties () {
    return {
      /**
       * The iframe's source URL.
       *
       * @type {String}
       */
      source: String,
      /**
       * The iframe's source content type.
       *
       * @type {String}
       */
      contentType: String
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

  /**
   * Method that will fetch the remote source and render it in the iframe.
   */
  async open () {
    this.__srcdoc = null;

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
    } else {
      throw new Error(fileRequest.statusText);
    }
  }
}

customElements.define(CasperEpaperIframe.is, CasperEpaperIframe);
