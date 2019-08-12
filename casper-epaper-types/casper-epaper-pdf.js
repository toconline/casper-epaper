import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';

class CasperEpaperPdf extends PolymerElement {

  static get PDF_JS_SOURCE () { return 'https://mozilla.github.io/pdf.js/build/pdf.js'; }
  static get PDF_JS_WORKER_SOURCE () { return 'https://mozilla.github.io/pdf.js/build/pdf.worker.js'; }

  static get is () {
    return 'casper-epaper-pdf';
  }

  static get properties () {
    return {
      /**
       * The PDF document source url.
       * @type {String}
       */
      source: {
        type: String,
        observer: '__openPDF'
      },
      /**
       * The zoom that should be applied to the document.
       * @type {Number}
       */
      zoom: {
        type: Number,
        observer: '__openPDF'
      },
      /**
       * The PDF document's current page.
       * @type {Number}
       */
      currentPage: {
        type: Number,
        observer: '__openPDF'
      },
      /**
       * The total number of pages that the document has.
       * @type {Number}
       */
      totalPageCount: {
        type: Number,
        notify: true
      }
    }
  }

  static get template () {
    return html`
      <canvas id="canvas"></canvas>
    `;
  }

  /**
   * Open a PDF document specified in the source property.
   */
  __openPDF () {
    // Debounce the all render operation to avoid multiple calls to the render method.
    this.__openPDFDebouncer = Debouncer.debounce(
      this.__openPDFDebouncer,
      timeOut.after(150),
      async () => {
        this.__loadScript();

        if (!this.source) return;

        // Cancel the existing render to avoid errors from simultaneous operations.
        if (this.__pdfRenderTask) {
          await this.__pdfRenderTask._internalRenderTask.cancel();
        }

        const file = await this.__pdfJS.getDocument(this.source).promise;
        const filePage = await file.getPage(this.currentPage);
        const fileViewport = filePage.getViewport({ scale: this.zoom });

        this.$.canvas.width = fileViewport.width;
        this.$.canvas.height = fileViewport.height;
        this.totalPageCount = file._pdfInfo.numPages;

        this.__pdfRenderTask = filePage.render({
          viewport: fileViewport,
          canvasContext: this.$.canvas.getContext('2d')
        });

        this.__pdfRenderTask.promise
          .then(() => { this.__pdfRenderTask = undefined; })
          .catch(exception => {
            // This means an error has occurred while displaying the PDF not caused by cancelling the render.
            if (!exception instanceof this.__pdfJS.RenderingCancelledException) {
              this.__openPDF();
            }
          });
      }
    );
  }

  /**
   * Load the PDF.js script.
   */
  __loadScript () {
    if (!this.__scriptAlreadyLoaded) {
      const script = document.createElement('script');
      script.onload = () => {
        this.__pdfJS = window['pdfjs-dist/build/pdf'];
        this.__pdfJS.GlobalWorkerOptions.workerSrc = CasperEpaperPdf.PDF_JS_WORKER_SOURCE;

        this.__scriptAlreadyLoaded = true;
        this.__openPDF();
      };

      script.src = CasperEpaperPdf.PDF_JS_SOURCE;
      this.shadowRoot.appendChild(script);
    }
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);