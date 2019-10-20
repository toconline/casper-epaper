/*
  - Copyright (c) 2014-2019 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-epaper.
  -
  - casper-epaper is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-epaper  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-epaper.  If not, see <http://www.gnu.org/licenses/>.
  -
 */

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
      source: String,
      /**
       * This flag states if the epaper component is currently loading or not.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        notify: true
      }
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
    `;
  }

  /**
   * Observer that gets fired when the image's source changes.
   */
  open () {
    return new Promise((resolve, reject) => {
      const imageToLoad = new Image();

      imageToLoad.onerror = error => reject(error);
      imageToLoad.onload = event => {
        this.__loadedImage = event.path.shift();

        // Remove the existing image if there is any.
        if (this.__imageElement) this.shadowRoot.removeChild(this.__imageElement);

        // Create a new image and append it to the DOM.
        this.__imageElement = document.createElement('img');
        this.__imageElement.src = this.source;
        this.__recalculateImageDimensions();

        this.shadowRoot.appendChild(this.__imageElement);

        this.loading = false;
        resolve();
      };


      // Trigger the image load.
      this.loading = true;
      imageToLoad.src = this.source;
    })
  }

  /**
   * This method gets manually invoked when the epaper container is resized.
   */
  __zoomChanged () {
    this.__recalculateImageDimensions();
  }

  /**
   * This method re-calculates the image dimensions taking into account the available space
   * plus the image dimensions.
   */
  __recalculateImageDimensions () {
    const availableWidth = this.parentElement.offsetWidth - 30;
    const availableHeight = this.parentElement.offsetHeight - 30;

    const widthRatio = parseFloat(this.__loadedImage.width / availableWidth);
    const heightRatio = parseFloat(this.__loadedImage.height / availableHeight);

    // This means it's a horizontal image.
    if (widthRatio > heightRatio) {
      // Check if the original image fits within the available horizontal space, otherwise adjust its size.
      this.__imageElement.width = Math.min(availableWidth, this.__loadedImage.width);
      this.__imageElement.height = Math.min(this.__loadedImage.height / widthRatio, this.__loadedImage.height);
    } else {
      // Check if the original image fits within the available vertical space, otherwise adjust its size.
      this.__imageElement.height = Math.min(availableHeight, this.__loadedImage.height);
      this.__imageElement.width = Math.min(this.__loadedImage.width / heightRatio, this.__loadedImage.width);
    }
  }
}

customElements.define(CasperEpaperImage.is, CasperEpaperImage);