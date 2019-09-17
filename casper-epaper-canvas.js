import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperCanvas extends PolymerElement {

  static get is () {
    return 'casper-epaper-canvas';
  }

  static get template () {
    return html`
      <style>
        canvas {
          outline: none;
        }
      </style>
      <canvas id="canvas"></canvas>
    `;
  }

  static get properties () {
    return {
      zoom: {
        type: Number,
        observer: '__zoomChanged'
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

    this.__gridMajor       = 0.0;
    this.__gridMinor       = 0.0;
    this.__backgroundColor = '#FFF';
    this.pageWidth         = 595.0;
    this.pageHeight        = 842.0;
    this.canvas            = this.$.canvas;
    this.canvasContext     = this.canvas.getContext('2d', { alpha: false });
    this.__canvasWidth     = this.canvas.width;
    this.__canvasHeight    = this.canvas.height;
    this.__initiaPointer   = this.canvas.style.cursor;
    this.canvasContext.globalCompositeOperation = 'copy';

    this.__setupPixelRatio();
    this.__setupScale();
    this.__zoomChanged();
    this.clearPage();
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
      this.canvasContext.webkitBackingStorePixelRatio ||
      this.canvasContext.mozBackingStorePixelRatio ||
      this.canvasContext.msBackingStorePixelRatio ||
      this.canvasContext.oBackingStorePixelRatio ||
      this.canvasContext.backingStorePixelRatio || 1;

    this.ratio = devicePixelRatio / backingStoreRatio;
  }

  /**
   * Adjust the canvas dimension taking into account the pixel ratio and also calculates the scale the server should use.
   */
  __setupScale () {
    this.canvas.width        = this.__canvasWidth  * this.ratio;
    this.canvas.height       = this.__canvasHeight * this.ratio;
    this.canvas.style.width  = `${this.__canvasWidth}px`;
    this.canvas.style.height = `${this.__canvasHeight}px`;

    this.sx = parseFloat((this.canvas.width  / this.pageWidth).toFixed(2));
    this.scalePxToServer = this.pageWidth * this.ratio / this.canvas.width;
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
    if (!this.canvas) return;

    this.__setSize(
      Math.round((this.pageWidth  || this.width) * this.zoom),
      Math.round((this.pageHeight || this.height) * this.zoom)
    );

    // This is used to avoid the blinking black background when resizing a canvas.
    this.clearPage();
  }

  /**
   * Paints blank page
   */
  clearPage () {
    const savedFill = this.canvasContext.fillStyle;

    this.canvasContext.fillStyle = this.__backgroundColor;
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.__gridMajor !== 0.0) {
      this.__paintGrid(this.__gridMajor, this.__gridMinor);
    }
    this.canvasContext.fillStyle = savedFill;
  }

  resetCanvasDimensions () {
    this.canvas.width  = this.__canvasWidth  * this.ratio;
    this.canvas.height = this.__canvasHeight * this.ratio;
    this.clearPage();
  }

  paintGrid (gridMajor, gridMinor) {
    let x      = 0;
    let y      = 0;
    const width  = this.canvas.width;
    const height = this.canvas.height;

    this.canvasContext.beginPath();
    this.canvasContext.strokeStyle = '#C0C0C0';
    this.canvasContext.lineWidth   = 0.15;

    for (x = 0; x < width; x += gridMinor) {
      if ((x % gridMajor) !== 0) {
        this.canvasContext.moveTo(x, 0);
        this.canvasContext.lineTo(x, height);
      }
    }

    for (y = 0; y < height; y += gridMinor) {
      if ((y % gridMajor) !== 0) {
        this.canvasContext.moveTo(0, y);
        this.canvasContext.lineTo(width, y);
      }
    }

    this.canvasContext.stroke();
    this.canvasContext.beginPath();
    this.canvasContext.strokeStyle = '#C0C0C0';
    this.canvasContext.lineWidth   = 0.5;

    for (x = 0; x < width; x += gridMinor) {
      if ((x % gridMajor) === 0) {
        this.canvasContext.moveTo(x, 0);
        this.canvasContext.lineTo(x, height);
      }
    }

    for (y = 0; y < height; y += gridMinor) {
      if ((y % gridMajor) === 0) {
        this.canvasContext.moveTo(0, y);
        this.canvasContext.lineTo(width, y);
      }
    }

    this.canvasContext.stroke();
    this.canvasContext.strokeStyle = '#000000';
  }
}

customElements.define(CasperEpaperCanvas.is, CasperEpaperCanvas);