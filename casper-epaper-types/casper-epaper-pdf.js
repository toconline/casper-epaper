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
      epaper: {
        type: Object
      },
      __reactWhenZoomChanges: {
        type: Boolean,
        value: true
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
    if (!this.source) return;

    // Debounce the all render operation to avoid multiple calls to the render method.
    this.__openPDFDebouncer = Debouncer.debounce(this.__openPDFDebouncer, timeOut.after(150), async () => {
      // Memoize the pdf.js worker.
      this.__pdfJSWorker = this.__pdfJSWorker || new this.__pdfJS.PDFWorker();

      const file = await this.__pdfJS.getDocument({ url: this.source, worker: this.__pdfJSWorker }).promise;
      const filePage = await file.getPage(this.epaper.__currentPage);

      const fileViewport = filePage.getViewport({ scale: this.epaper.__ratio });
      this.epaper.__landscape = fileViewport.height < fileViewport.width;
      this.epaper.__canvas.width = fileViewport.width;
      this.epaper.__canvas.height = fileViewport.height;

      this.epaper.__totalPageCount = file._pdfInfo.numPages;

      this.__pdfRenderTask = filePage.render({
        viewport: fileViewport,
        canvasContext: this.epaper.__canvasContext
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