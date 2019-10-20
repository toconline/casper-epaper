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
       * This flag states if the epaper component is in landscape or not.
       *
       * @type {Boolean}
       */
      landscape: {
        type: Boolean,
        notify: true
      },
      /**
       * This flag states if the epaper component is currently loading or not.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        notify: true
      },
      /**
       * The canvas element that is shared in the epaper component
       *
       * @type {Object}
       */
      epaperCanvas: Object,
      /**
       * The PDF document source url.
       *
       * @type {String}
       */
      source: String,
      /**
       * The PDF document's current page.
       *
       * @type {Number}
       */
      currentPage: {
        type: Number,
        notify: true,
        observer: '__currentPageChanged'
      },
      /**
       * The total number of pages that the document has.
       *
       * @type {Number}
       */
      totalPageCount: {
        type: Number,
        notify: true
      }
    }
  }

  static get template () {
    return html``;
  }

  /**
   * Open a PDF document specified in the source property.
   */
  async open (currentPage = undefined) {
    if (!this.source) return;

    // If a page was specified and it's different from the current one, set it and return so that the observer fires this method.
    if (this.currentPage !== currentPage && currentPage !== undefined) {
      this.currentPage = currentPage;
      return;
    }

    if (!this.__scriptAlreadyLoaded) await this.__loadScript();

    // Memoize the pdf.js worker.
    this.__pdfJSWorker = this.__pdfJSWorker || new this.__pdfJS.PDFWorker();

    this.loading = true;

    const file = await this.__pdfJS.getDocument({ url: this.source, worker: this.__pdfJSWorker }).promise;
    const filePage = await file.getPage(this.currentPage);
    const fileViewport = filePage.getViewport({ scale: this.epaperCanvas.ratio });

    // Change the canvas dimensions.
    this.landscape = fileViewport.height < fileViewport.width;
    this.epaperCanvas.canvas.width = fileViewport.width;
    this.epaperCanvas.canvas.height = fileViewport.height;
    this.epaperCanvas.clearPage();

    this.totalPageCount = file._pdfInfo.numPages;

    await filePage.render({ viewport: fileViewport, canvasContext: this.epaperCanvas.canvasContext }).promise;

    this.loading = false;
  }

  __zoomChanged () {
    this.open();
  }

  __currentPageChanged () {
    this.open();
  }

  /**
   * Load the PDF.js script.
   */
  __loadScript () {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.onload = async () => {
        this.__pdfJS = window['pdfjs-dist/build/pdf'];
        this.__pdfJS.GlobalWorkerOptions.workerSrc = CasperEpaperPdf.PDF_JS_WORKER_SOURCE;

        this.__scriptAlreadyLoaded = true;
        resolve();
      };

      script.src = CasperEpaperPdf.PDF_JS_SOURCE;
      this.shadowRoot.appendChild(script);
    })
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);