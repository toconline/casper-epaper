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

import { CasperBrowser } from '@casper2020/casper-utils/casper-utils.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperEpaperPdf extends PolymerElement {

  static get is () {
    return 'casper-epaper-pdf';
  }

  static get properties () {
    return {
      /**
       * The TOConline's app object.
       *
       * @type {Object}
       */
      app: Object,
      /**
       * The PDF document source url.
       *
       * @type {String}
       */
      source: String,
      /**
       * This flag states if the epaper component is currently loading or not.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        notify: true
      }
    }
  }

  static get template () {
    return html`
      <style>
        :host,
        iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
      </style>
      <iframe></iframe>
    `;
  }

  ready () {
    super.ready();

    this.__iframeElement = this.shadowRoot.querySelector('iframe');
    this.__iframeElement.addEventListener('load', () => {
      if (!this.source) return;

      afterNextRender(this, () => {
        this.loading = false;

        // Check if the iframe has an embed element, which would mean that the PDF was correctly rendered.
        !this.__iframeElement.contentDocument.querySelector('embed')
          ? this.__rejectCallback()
          : this.__resolveCallback();
      });
    });
  }

  /**
   * Opens a PDF document specified in the source property.
   */
  async open () {
    if (!this.source) return;

    const newSource = this.source.includes('?')
      ? `${this.source}&content-disposition=inline#view=Fit&toolbar=0`
      : `${this.source}?content-disposition=inline#view=Fit&toolbar=0`;

    if (this.__currentSource === newSource) return;

    return new Promise(async (resolve, reject) => {
      this.__rejectCallback = reject;
      this.__resolveCallback = resolve;

      try {
        if (CasperBrowser.isFirefox) {
          // Since we can't inspect the iframe contents in Firefox, send a pre-flight request to see if we have access to the file.
          const response = await fetch(this.source, {
            method: 'HEAD',
            headers: { 'Authorization': `Bearer ${this.app.socket.sessionCookie}` }
          });

          if (!response.ok) return this.__rejectCallback();
        }

        this.__iframeElement.src = newSource;
        this.__currentSource = newSource;

        this.loading = true;
      } catch (exception) {
        this.__rejectCallback();
      }
    });
  }

  /**
   * Prints the currently rendered PDF document.
   */
  print () {
    this.__iframeElement.contentWindow.print();
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);