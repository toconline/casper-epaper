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
       * The list of MIME types accepted by the vaadin-upload component.
       *
       * @type {String}
       */
      accept: String,
      /**
       * The text that will be shown in the vaadin-upload button.
       *
       * @type {String}
       */
      addFileButtonText: {
        type: String,
        value: 'Carregar ficheiro(s)'
      },
      /**
       * The TOConline's app object.
       *
       * @type {Object}
       */
      app: Object,
      /**
       * Flag which states if the component is disabled or not.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        reflectToAttribute: true
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
       * If this property is set, append it to the XMLHttpRequest.
       *
       * @type {String}
       */
      identifier: {
        type: String,
        observer: '__identifierChanged'
      },
      /**
       * The vaadin-uploads's maximum number of files.
       *
       * @type {Number}
       */
      maxFiles: Number,
      /**
       * The component's sub-title.
       *
       * @type {String}
       */
      subTitle: {
        type: String,
      },
      /**
       * The vaadin-uploads's maximum upload URL.
       *
       * @type {String}
       */
      target: String,
      /**
       * The component's title.
       *
       * @type {String}
       */
      title: {
        type: String,
      },
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

        :host([disabled]) casper-upload-dropzone {
          --casper-upload-dropzone-title: { color: var(--status-red); }
          --casper-upload-dropzone-header-icon: {
            width: 150px;
            height: 150px;
            color: var(--status-red);
          }
        }

        casper-upload-dropzone {
          --casper-upload-dropzone-vaadin-upload: { padding: 35px; }
          --casper-upload-dropzone-header-icon: {
            width: 150px;
            height: 150px;
          }
        }
      </style>

      <casper-upload-dropzone
        id="upload"
        icon="[[icon]]"
        title="[[title]]"
        target="[[target]]"
        accept="[[accept]]"
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
