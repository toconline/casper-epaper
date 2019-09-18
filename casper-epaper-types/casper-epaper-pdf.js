import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';

class CasperEpaperPdf extends PolymerElement {

  static get PDF_JS_SOURCE () { return '/static/js/pdf.js'; }
  static get PDF_JS_WORKER_SOURCE () { return '/static/js/pdf.worker.js'; }

  static get is () {
    return 'casper-epaper-pdf';
  }

  static get properties () {
    return {
      ratio: Number,
      zoom: {
        type: Number,
        observer: 'open'
      },
      landscape: {
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

  ready () {
    super.ready();

    this.__loadScript();
  }

  /**
   * Open a PDF document specified in the source property.
   */
  open () {
    if (this.ignoreEvents || !this.source) return;

    // Debounce the all render operation to avoid multiple calls to the render method.
    this.__openPDFDebouncer = Debouncer.debounce(this.__openPDFDebouncer, timeOut.after(150), async () => {
      // Throw an event to disable the previous / next page buttons to avoid concurrent draws.
      this.dispatchEvent(new CustomEvent('pdf-render-started', { bubbles: true }));

      const file = await this.__pdfJS.getDocument(this.source).promise;
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


      this.__pdfRenderTask.promise
        .then(() => this.dispatchEvent(new CustomEvent('pdf-render-ended', { bubbles: true })))
        .catch(exception => {
          // This means an error has occurred while displaying the PDF not caused by cancelling the render.
          if (!exception instanceof this.__pdfJS.RenderingCancelledException) {
            this.__openPDF();
          }
        });
      }
    );
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
      };

      script.src = CasperEpaperPdf.PDF_JS_SOURCE;
      this.shadowRoot.appendChild(script);
    }
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);