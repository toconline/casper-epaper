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

class CasperEpaperPdf extends PolymerElement {

  static get PDF_JS_SOURCE () { return '/static/js/pdf.js'; }
  static get PDF_JS_WORKER_SOURCE () { return '/static/js/pdf.worker.js'; }

  static get is () {
    return 'casper-epaper-pdf';
  }

  static get properties () {
    return {
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
        embed {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
      <embed src="[[__source]]" type="application/pdf" />
    `;
  }

  ready () {
    super.ready();

    this.shadowRoot.querySelector('embed').addEventListener('load', () => { this.loading = false; });
  }

  /**
   * Opens a PDF document specified in the source property.
   */
  async open () {
    if (!this.source) return;

    this.loading = true;
    this.__source = this.source.includes('?')
      ? `${this.source}&content-disposition=inline#view=Fit&toolbar=0`
      : `${this.source}?content-disposition=inline#view=Fit&toolbar=0`;
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);