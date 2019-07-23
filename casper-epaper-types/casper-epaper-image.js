import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperEpaperImage extends PolymerElement {

  static get is () {
    return 'casper-epaper-image';
  }

  static get properties () {
    return {
      source: {
        type: String,
        observer: '_sourceChanged'
      },
      zoom: {
        type: Number,
        observer: '_zoomChanged'
      }
    }
  }

  static get template () {
    return html`
      <style>
        img {
          box-shadow: rgba(0, 0, 0, 0.24) 0px 5px 12px 0px, 
                      rgba(0, 0, 0, 0.12) 0px 0px 12px 0px;
        }
      </style>
      <img src="[[_source]]" width="[[_width]]" height="[[_height]]"/>
    `;
  }

  ready() {
    super.ready();

    afterNextRender(this, () => {
      this._availableWidth = this.parentElement.offsetWidth;
      this._availableHeight = this.parentElement.offsetHeight;
    });
  }

  _sourceChanged (source) {
    const imageToLoad = new Image();
    imageToLoad.onload = event => {
      const imageLoaded = event.path.shift();
      
      this._aspectRatio = parseFloat((imageLoaded.width / imageLoaded.height).toFixed(2));

      // This means it's a horizontal image.
      if (imageLoaded.width > imageLoaded.height) {
        // Check if the original image fits within the available horizontal space, otherwise adjust its size.
        this._originalWidth = Math.min(this._availableWidth - 120, imageLoaded.width);
        this._originalHeight = this._originalWidth / this._aspectRatio;
      } else {
        // Check if the original image fits within the available vertical space, otherwise adjust its size.
        this._originalHeight = Math.min(this._availableHeight - 120, imageLoaded.height);
        this._originalWidth = this._originalHeight * this._aspectRatio;
      }

      this._zoomChanged();
      this._source = source;
    };

    // Trigger the image load.
    imageToLoad.src = source;
  }

  _zoomChanged () {
    if (!this._originalWidth && !this._originalHeight) return;

    this._width = this._originalWidth * this.zoom;
    this._height = this._originalHeight * this.zoom;
  }
}

customElements.define(CasperEpaperImage.is, CasperEpaperImage);