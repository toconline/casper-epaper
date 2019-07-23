import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperPdf extends PolymerElement {

  static get is () {
    return 'casper-epaper-pdf';
  }

  static get properties () {
    return {
      source: {
        type: String,
        observer: '_sourceChanged'
      }
    }
  }

  static get template () {
    return html`
      <canvas id="canvas"></canvas>
    `;
  }

  _sourceChanged () {
    const pdfjsSource = 'https://mozilla.github.io/pdf.js/build/pdf.js';
    const pdfjsWorkerSource = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
    const testFile = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

    if (!this._scriptAlreadyLoaded) {
      const script = document.createElement('script');
      script.onload = async () => {
        const pdfjs = window['pdfjs-dist/build/pdf'];
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSource;
        const pdfFile = await pdfjs.getDocument(testFile).promise;
        const pdfFilePage = await pdfFile.getPage(1);
        const pdfFileViewport = pdfFilePage.getViewport({ scale: 1.5 });

        this.$.canvas.width = pdfFileViewport.width;
        this.$.canvas.height = pdfFileViewport.height;

        pdfFilePage.render({
          viewport: pdfFileViewport,
          canvasContext: this.$.canvas.getContext('2d')
        });
      };
      script.src = pdfjsSource;

      this.shadowRoot.appendChild(script);
    }
  }
}

customElements.define(CasperEpaperPdf.is, CasperEpaperPdf);