import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status';

class CasperEpaperCanvas extends PolymerElement {

  static get is () {
    return 'casper-epaper-canvas';
  }

  static get template () {
    return html`
      <canvas id="canvas"></canvas>
    `;
  }

  static get properties () {
    return {
      zoom: {
        type: Number,
        observer: '__zoomChanged'
      },
      landscape: {
        type: Boolean,
        observer: '__setupScale'
      },
      canvas: {
        type: Object,
        notify: true,
      },
      canvasContext: {
        type: Object,
        notify: true,
      },
    };
  }

  ready () {
    super.ready();

    afterNextRender(this, ()  => {

      this.__gridMajor       = 0.0;
      this.__gridMinor       = 0.0;
      this.__backgroundColor = '#FFF';
      this.pageWidth         = 595.0;
      this.pageHeight        = 842.0;
      this.epaper.__canvas            = this.$.canvas;
      this.epaper.__canvasContext     = this.epaper.__canvas.getContext('2d', { alpha: false });
      this.epaper.__canvasContext.globalCompositeOperation = 'copy';

      this.__canvasWidth   = this.epaper.__canvas.width;
      this.__canvasHeight  = this.epaper.__canvas.height;
      this.__initiaPointer = this.epaper.__canvas.style.cursor;

      this.__setupPixelRatio();
      this.__setupScale();
      this.__zoomChanged();
      this.epaper.__clearPage();
    });
  }

  /**
   * @brief Determine the device pixel ratio: 1 on classical displays 2 on retina/UHD displays.
   */
  __setupPixelRatio () {
    let devicePixelRatio  = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1.6) {
      devicePixelRatio = 2;
    } else {
      devicePixelRatio = 1;
    }

    const backingStoreRatio =
      this.epaper.__canvasContext.webkitBackingStorePixelRatio ||
      this.epaper.__canvasContext.mozBackingStorePixelRatio ||
      this.epaper.__canvasContext.msBackingStorePixelRatio ||
      this.epaper.__canvasContext.oBackingStorePixelRatio ||
      this.epaper.__canvasContext.backingStorePixelRatio || 1;

    this.epaper.__ratio = devicePixelRatio / backingStoreRatio;
  }

  /**
   * Adjust the canvas dimension taking into account the pixel ratio and also calculates the scale the server should use.
   */
  __setupScale () {
    this.epaper.__canvas.width        = (this.epaper.__landscape ? this.__canvasHeight : this.__canvasWidth) * this.epaper.__ratio;
    this.epaper.__canvas.height       = (this.epaper.__landscape ? this.__canvasWidth : this.__canvasHeight) * this.epaper.__ratio;
    this.epaper.__canvas.style.width  = `${this.epaper.__landscape ? this.__canvasHeight : this.__canvasWidth}px`;
    this.epaper.__canvas.style.height = `${this.epaper.__landscape ? this.__canvasWidth : this.__canvasHeight}px`;

    this.sx = parseFloat((this.epaper.__canvas.width  / this.pageWidth).toFixed(2));
    this.epaper.__scalePxToServer = this.pageWidth * this.epaper.__ratio / this.epaper.__canvas.width;
  }

  /**
   * Changes the size of the epaper canvas.
   *
   * @param {number} width Canvas width in px.
   * @param {number} height Canvas height in px.
   * @param {boolean} forced When true forces a size change.
   */
  __setSize (width, height, forced) {
    if (width !== this.__canvasWidth || height !== this.__canvasHeight || forced) {
      if (forced) {
        this.__canvasWidth = 100;
        this.__canvasHeight = 100;
        this.__setupScale();
      }

      this.__canvasWidth  = width;
      this.__canvasHeight = height;
      this.__setupScale();
    }
  }


  /**
   * Set the zoom factor (document pt to screen px ratio)
   */
  __zoomChanged () {
    if (!this.epaper.__canvas) return;

    this.__setSize(
      Math.round((this.pageWidth  || this.width) * this.epaper.__zoom),
      Math.round((this.pageHeight || this.height) * this.epaper.__zoom)
    );

    // This is used to avoid the blinking black background when resizing a canvas.
    this.epaper.__clearPage();
  }

  resetCanvasDimensions () {
    this.epaper.__canvas.width  = this.__canvasWidth  * this.epaper.__ratio;
    this.epaper.__canvas.height = this.__canvasHeight * this.epaper.__ratio;
    this.epaper.__clearPage();
  }
}

customElements.define(CasperEpaperCanvas.is, CasperEpaperCanvas);