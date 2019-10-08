import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
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
       * The current zoom being applied to the epaper container.
       *
       * @type {Number}
       */
      zoom: {
        type: Number,
        observer: 'open'
      },
      /**
       * The PDF document's current page.
       *
       * @type {Number}
       */
      currentPage: {
        type: Number,
        observer: 'open'
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
  open () {
    if (this.ignoreEvents || !this.source) return;

    if (!this.__scriptAlreadyLoaded) return this.__loadScript();

    // Debounce the all render operation to avoid multiple calls to the render method.
    this.__openPDFDebouncer = Debouncer.debounce(this.__openPDFDebouncer, timeOut.after(150), async () => {
      // Memoize the pdf.js worker.
      this.__pdfJSWorker = this.__pdfJSWorker || new this.__pdfJS.PDFWorker();

      const file = await this.__pdfJS.getDocument({
        url: this.source,
        worker: this.__pdfJSWorker
      }).promise;

      const filePage = await file.getPage(this.currentPage);
      const fileViewport = filePage.getViewport({ scale: this.epaperCanvas.ratio });

      this.landscape = fileViewport.height < fileViewport.width;
      this.epaperCanvas.canvas.width = fileViewport.width;
      this.epaperCanvas.canvas.height = fileViewport.height;
      this.epaperCanvas.clearPage();

      this.totalPageCount = file._pdfInfo.numPages;

      this.__pdfRenderTask = filePage.render({
        viewport: fileViewport,
        canvasContext: this.epaperCanvas.canvasContext
      });

      this.loading = true;
      await this.__pdfRenderTask.promise;
      this.loading = false;
    });
  }

  /**
   * Load the PDF.js script.
   */
  __loadScript () {
    const script = document.createElement('script');
    script.onload = () => {
      this.__pdfJS = window['pdfjs-dist/build/pdf'];
      this.__pdfJS.GlobalWorkerOptions.workerSrc = CasperEpaperPdf.PDF_JS_WORKER_SOURCE;

      this.__scriptAlreadyLoaded = true;
      this.open();
    };

    script.src = CasperEpaperPdf.PDF_JS_SOURCE;
    this.shadowRoot.appendChild(script);
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);