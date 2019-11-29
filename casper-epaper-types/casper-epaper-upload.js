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

import '@vaadin/vaadin-upload/vaadin-upload.js';
import '@casper2020/casper-icons/casper-icon.js';
import '@casper2020/casper-button/casper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { Casper } from '@casper2020/casper-common-ui/casper-i18n-behavior.js';

class CasperEpaperUpload extends Casper.I18n(PolymerElement) {

  static get is () {
    return 'casper-epaper-upload';
  }

  static get properties () {
    return {
      /**
       * The component's title.
       *
       * @type {String}
       */
      title: {
        type: String,
        observer: '__titleChanged'
      },
      /**
       * The component's sub-title.
       *
       * @type {String}
       */
      subTitle: {
        type: String,
        observer: '__subTitleChanged'
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
      identifier: String,
      /**
       * The component's icon that appears in the top.
       *
       * @type {String}
       */
      icon: {
        type: String,
        value: 'fa-solid:question'
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
          display: flex;
          overflow: auto;
          align-items: center;
          box-sizing: border-box;
          background-color: white;
        }

        #uploadContainer {
          display: flex;
          align-items: center;
          flex-direction: column;
          width: 100%;
        }

        #uploadContainer .icon-container {
          width: 150px;
          height: 150px;
          display: flex;
          border-radius: 50%;
          margin-bottom: 40px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-color);
        }

        #uploadContainer .icon-container casper-icon {
          width: 50%;
          height: 50%;
          --casper-icon-fill-color: var(--primary-color);
        }

        #uploadContainer #title-container {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          color: var(--primary-color);
        }

        #uploadContainer #sub-title-container {
          color: darkgray;
          text-align: center;
          margin-bottom: 25px;
        }

        #uploadContainer vaadin-upload {
          width: 100%;
          height: 250px;
        }

        #uploadContainer vaadin-upload casper-button {
          margin: 0;
        }

        #uploadContainer[no-module] .icon-container {
          border: 0px solid var(--status-red);
        }

        #uploadContainer[no-module] .icon-container casper-icon {
          width: 100%;
          height: 100%;
        }


        #uploadContainer[no-module] #title-container,
        #uploadContainer[no-module] #sub-title-container a {
          color: var(--status-red);
        }

        #uploadContainer[no-module] .icon-container casper-icon {
          --casper-icon-fill-color: var(--status-red);
        }
      </style>
      <div id="uploadContainer" no-module$=[[disabled]]>
        <div class="icon-container">
          <casper-icon icon="[[icon]]"></casper-icon>
        </div>

        <div id="title-container"></div>
        <div id="sub-title-container"></div>

        <vaadin-upload
          id="upload"
          target="[[target]]"
          accept="[[accept]]"
          hidden$="[[disabled]]"
          max-files="[[maxFiles]]"
          form-data-name="my-attachment">
          <casper-button slot="add-button">ABRIR</casper-button>
        </vaadin-upload>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.__titleContainer = this.$['title-container'];
    this.__subTitleContainer = this.$['sub-title-container'];

    this.i18nUpdateUpload(this.$.upload);
    this.$.upload.addEventListener('upload-request', event => this.__uploadRequest(event));
    this.$.upload.addEventListener('upload-success', event => this.__uploadSuccess(event));
  }

  /**
   * This method clears locally the files that were uploaded.
   */
  clearUploadedFiles () {
    this.$.upload.files = [];
  }

  /**
   * Intercept the vaadin-upload's request event to add some additional information.
   *
   * @param {Object} event The event's object.
   */
  __uploadRequest (event) {
    event.preventDefault();
    event.detail.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    event.detail.xhr.setRequestHeader('Content-Disposition', `form-data; name="${event.detail.file.formDataName}"; filename="uploaded_file";`);

    if (this.identifier) {
      event.detail.xhr.identifier = this.identifier;
    }

    event.detail.xhr.send(event.detail.file);
  }

  /**
   * Intercept the vaadin-upload's successful request event and dispatch an event with information
   * regarding the recently uploaded file.
   *
   * @param {Object} event The event's object.
   */
  __uploadSuccess (event) {
    if (event.detail.xhr.status === 200) {
      const uploadedFile = JSON.parse(event.detail.xhr.response).file;

      this.dispatchEvent(new CustomEvent('casper-epaper-upload-success', {
        bubbles: true,
        composed: true,
        detail: {
          identifier: event.detail.xhr.identifier,
          uploadedFile: uploadedFile,
          originalFileName: event.detail.file.name,
          originalFileType: event.detail.file.type,
        }
      }));
    }
  }

  /**
   * Observer that gets fired when the component's title changes.
   *
   * @param {String} title The component's title.
   */
  __titleChanged (title) {
    this.__titleContainer.innerHTML = title;
  }

  /**
   * Observer that gets fired when the component's sub-title changes.
   *
   * @param {String} title The component's sub-title.
   */
  __subTitleChanged (subTitle) {
    this.__subTitleContainer.innerHTML = subTitle;
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);
