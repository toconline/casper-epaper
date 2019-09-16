import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperEpaperImage extends PolymerElement {

  static get is () {
    return 'casper-epaper-image';
  }

  static get properties () {
    return {
      /**
       * The image's source url.
       */
      source: {
        type: String,
        observer: '__sourceChanged'
      },
      /**
       * The epaper's zoom that will resize the image accordingly.
       */
      zoom: {
        type: Number,
        observer: '__zoomChanged'
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
      <img src="[[__source]]" width="[[__width]]" height="[[__height]]"/>
    `;
  }

  ready() {
    super.ready();

    afterNextRender(this, () => {
      this.__availableWidth = this.parentElement.offsetWidth;
      this.__availableHeight = this.parentElement.offsetHeight;
    });
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
   * Observer that gets fired when the image's source url changes.
   *
   * @param {String} source The image's source url.
   */
  __sourceChanged (source) {
    const imageToLoad = new Image();
    imageToLoad.onload = event => {
      const imageLoaded = event.path.shift();

      this._aspectRatio = parseFloat((imageLoaded.width / imageLoaded.height).toFixed(2));

      // This means it's a horizontal image.
      if (imageLoaded.width > imageLoaded.height) {
        // Check if the original image fits within the available horizontal space, otherwise adjust its size.
        this.__width = Math.min(this.__availableWidth - 120, imageLoaded.width);
        this.__height = this.__width / this._aspectRatio;
      } else {
        // Check if the original image fits within the available vertical space, otherwise adjust its size.
        this.__height = Math.min(this.__availableHeight - 120, imageLoaded.height);
        this.__width = this.__height * this._aspectRatio;
      }

      this.__zoomChanged();
      this.__source = source;
    };

    // Trigger the image load.
    imageToLoad.src = source;
  }

  /**
   * Observer that gets fired when the epaper's zoom changes and the image
   * is scaled accordingly.
   */
  __zoomChanged (zoom) {
    this.shadowRoot.querySelector('img').style.transform = `scale(${zoom})`;
  }
}

customElements.define(CasperEpaperImage.is, CasperEpaperImage);