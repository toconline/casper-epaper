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
       * This flag states if the epaper component is currently loading or not.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        notify: true
      },
      /**
       * The current zoom being applied to the epaper container.
       *
       * @type {Number}
       */
      zoom: {
        type: Number,
        observer: '__recalculateImageDimensions'
      },
    }
  }

  static get template () {
    return html`
      <style>
        :host {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
      <img
        src="[[__source]]"
        width="[[__width]]"
        height="[[__height]]" />
    `;
  }

  /**
   * Observer that gets fired when the image's source changes.
   */
  __sourceChanged () {
    const imageToLoad = new Image();
    imageToLoad.onload = event => {
      this.__loadedImage = event.path.shift();

      this.__recalculateImageDimensions();
      this.__source = this.source;
      this.loading = false;
    };

    // Trigger the image load.
    this.loading  = true;
    imageToLoad.src = this.source;
  }

  /**
   * This method re-calculates the image dimensions taking into account the available space
   * plus the image dimensions.
   */
  __recalculateImageDimensions () {
    if (!this.__loadedImage) return;

    afterNextRender(this, () => {
      const availableWidth = this.parentElement.offsetWidth - 30;
      const availableHeight = this.parentElement.offsetHeight - 30;

      const widthRatio = parseFloat(this.__loadedImage.width / availableWidth);
      const heightRatio = parseFloat(this.__loadedImage.height / availableHeight);

      // This means it's a horizontal image.
      if (widthRatio > heightRatio) {
        // Check if the original image fits within the available horizontal space, otherwise adjust its size.
        this.__width = Math.min(availableWidth, this.__loadedImage.width);
        this.__height = Math.min(this.__loadedImage.height / widthRatio, this.__loadedImage.height);
      } else {
        // Check if the original image fits within the available vertical space, otherwise adjust its size.
        this.__height = Math.min(availableHeight, this.__loadedImage.height);
        this.__width = Math.min(this.__loadedImage.width / heightRatio, this.__loadedImage.width);
      }
    });
  }
}

customElements.define(CasperEpaperImage.is, CasperEpaperImage);