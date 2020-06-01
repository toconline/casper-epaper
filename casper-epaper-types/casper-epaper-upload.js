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

import '@cloudware-casper/casper-icons/casper-icon.js';
import '@cloudware-casper/casper-button/casper-button.js';
import '@cloudware-casper/casper-upload-dropzone/casper-upload-dropzone.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { Casper } from '@cloudware-casper/casper-common-ui/casper-i18n-behavior.js';

class CasperEpaperUpload extends Casper.I18n(PolymerElement) {

  static get is () {
    return 'casper-epaper-upload';
  }

  static get properties () {
    return {
      /**
       * The TOConline's app object.
       *
       * @type {Object}
       */
      app: Object,
      /**
       * The component's title.
       *
       * @type {String}
       */
      title: {
        type: String,
      },
      /**
       * The component's sub-title.
       *
       * @type {String}
       */
      subTitle: {
        type: String,
      },
      /**
       * The vaadin-uploads's maximum number of files.
       *
       * @type {Number}
       */
      maxFiles: Number,
      /**
       * The vaadin-uploads's maximum upload URL.
       *
       * @type {String}
       */
      target: String,
      /**
       * The list of MIME types accepted by the vaadin-upload component.
       *
       * @type {String}
       */
      accept: String,
      /**
       * If this property is set, append it to the XMLHttpRequest.
       *
       * @type {String}
       */
      identifier: {
        type: String,
        observer: '__identifierChanged'
      },
      /**
       * The component's icon that appears in the top.
       *
       * @type {String}
       */
      icon: {
        type: String,
        value: 'fa-solid:question'
      },
      /**
       * The text that will be shown in the vaadin-upload button.
       *
       * @type {String}
       */
      addFileButtonText: {
        type: String,
        value: 'Carregar ficheiro(s)'
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          width: 100%;
          height: 100%;
          padding: 50px;
          display: block;
          overflow: auto;
          box-sizing: border-box;
          background-color: white;
        }

        #upload-container {
          height: 100%;
          display: flex;
          padding: 45px;
          overflow: auto;
          align-items: center;
          flex-direction: column;
          box-sizing: border-box;
          border: 1px dashed var(--primary-color);
        }

        #upload-container:not([no-module]) #icon-container,
        #upload-container:not([no-module]) #title-container,
        #upload-container:not([no-module]) #sub-title-container {
          pointer-events: none;
        }

        #upload-container #icon-container {
          width: 150px;
          height: 150px;
          display: flex;
          flex-shrink: 0;
          border-radius: 50%;
          margin-bottom: 40px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-color);
        }

        #upload-container #icon-container casper-icon {
          width: 50%;
          height: 50%;
          color: var(--primary-color);
        }

        #upload-container #title-container {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          color: var(--primary-color);
        }

        #upload-container #sub-title-container {
          color: darkgray;
          text-align: center;
          margin-bottom: 25px;
        }

        #upload-container vaadin-upload {
          width: 100%;
        }

        #upload-container vaadin-upload casper-button {
          margin: 0;
        }

        #upload-container[no-module] #icon-container {
          border: 0px solid var(--status-red);
        }

        #upload-container[no-module] #icon-container casper-icon {
          width: 100%;
          height: 100%;
        }


        #upload-container[no-module] #title-container,
        #upload-container[no-module] #sub-title-container a {
          color: var(--status-red);
        }

        #upload-container[no-module] #icon-container casper-icon {
          color: var(--status-red);
        }

        #drop-zone-container {
          top: 50px;
          left: 50px;
          display: none;
          font-size: 20px;
          font-weight: bold;
          position: absolute;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          width: calc(100% - 100px);
          height: calc(100% - 100px);
          color: var(--primary-color);
          background-color: rgba(var(--primary-color-rgb), 0.2);
        }

        #drop-zone-container casper-icon {
          width: 75px;
          height: 75px;
          margin-bottom: 25px;
        }
      </style>

      <casper-upload-dropzone
        id="upload"
        target="[[target]]"
        accept="[[accept]]"
        title="[[title]]"
        sub-title="[[subTitle]]"
        disabled="[[disabled]]"
        max-files="[[maxFiles]]"
        add-file-button-text="[[addFileButtonText]]">
      </casper-upload-dropzone>
    `;
  }

  ready () {
    super.ready();

    this.$.upload.addEventListener('on-upload-success', event => {
      this.dispatchEvent(new CustomEvent('casper-epaper-upload-success', {
        bubbles: true,
        composed: true,
        detail: {
          uploadedFile: event.detail.uploadedFile,
          originalFileName: event.detail.originalFileName,
          originalFileType: event.detail.originalFileType,
          identifier: event.detail.additionalParams.identifier
        }
      }));
    });
  }

  /**
   * This method clears locally the files that were uploaded.
   */
  clearUploadedFiles () {
    this.$.upload.clearUploadedFiles();
  }

  /**
   * This method sets the additional parameters for the upload component.
   */
  __identifierChanged () {
    this.$.upload.additionalParams = {
      identifier: this.identifier
    }
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);
