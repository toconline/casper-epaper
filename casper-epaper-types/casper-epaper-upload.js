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

        #upload-container #icon-container,
        #upload-container #title-container,
        #upload-container #sub-title-container {
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
      <div id="upload-container" no-module$=[[disabled]]>
        <div id="icon-container">
          <casper-icon icon="[[icon]]"></casper-icon>
        </div>

        <div id="title-container"></div>
        <div id="sub-title-container"></div>

        <vaadin-upload
          id="upload"
          nodrop
          target="[[target]]"
          accept="[[accept]]"
          hidden$="[[disabled]]"
          max-files="[[maxFiles]]"
          form-data-name="my-attachment">
          <casper-button slot="add-button">[[addFileButtonText]]</casper-button>
        </vaadin-upload>

        <div id="drop-zone-container">
          <casper-icon icon="fa-solid:upload"></casper-icon>
          Arraste os seus ficheiros para aqui
        </div>
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
    this.$.upload.addEventListener('file-reject', () => this.__alertUserAboutInvalidFiles());

    // This prevents the default behavior of the browser of opening the file.
    this.addEventListener('drop', event => event.preventDefault());
    this.addEventListener('dragover', event => event.preventDefault());

    this.$['upload-container'].addEventListener('dragenter', () => this.__toggleDropZoneContainer(true));
    this.$['upload-container'].addEventListener('dragleave', event => {
      const containerDimensions = this.$['upload-container'].getBoundingClientRect();

      if (parseInt(event.clientY) > parseInt(containerDimensions.top)
        && parseInt(event.clientY) < parseInt(containerDimensions.bottom)
        && parseInt(event.clientX) > parseInt(containerDimensions.left)
        && parseInt(event.clientX) < parseInt(containerDimensions.right)) return;

      this.__toggleDropZoneContainer();
    });

    this.$['upload-container'].addEventListener('drop', event => {
      event.preventDefault();

      this.__toggleDropZoneContainer();

      if (event.dataTransfer.files.length === 0) return;

      const droppedFiles = Array.from(event.dataTransfer.files);

      // Check the number of files and the MIME type of the uploaded files.
      const acceptMimeTypes = this.accept.split(',').map(mimeType => mimeType.trim());
      if (this.maxFiles && droppedFiles.length > this.maxFiles || droppedFiles.some(file => !acceptMimeTypes.includes(file.type))) {
        return this.__alertUserAboutInvalidFiles();
      }

      this.$.upload.files = droppedFiles;
      this.$.upload.uploadFiles(droppedFiles);
    });
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
    event.detail.xhr.setRequestHeader('Content-Disposition', `form - data; name = "${event.detail.file.formDataName}"; filename = "uploaded_file"; `);

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

  /**
   * This method applies / removes the drop-zone styles depending if the user is currently hovering it or not.
   *
   * @param {Boolean} isHovering Flag that checks if the user is currently hovering the drop-zone with a file.
   */
  __toggleDropZoneContainer (displayDropZone) {
    if (displayDropZone) {
      this.$['upload'].style.opacity = '0.2';
      this.$['icon-container'].style.opacity = '0.2';
      this.$['title-container'].style.opacity = '0.2';
      this.$['sub-title-container'].style.opacity = '0.2';
      this.$['drop-zone-container'].style.display = 'flex';
    } else {
      this.$['upload'].removeAttribute('style');
      this.$['icon-container'].removeAttribute('style');
      this.$['title-container'].removeAttribute('style');
      this.$['sub-title-container'].removeAttribute('style');
      this.$['drop-zone-container'].style.display = 'none';
    }
  }

  /**
   * This method returns the extension(s) associated with a mime type.
   *
   * @param {String} mimeType The file's mime type.
   */
  __fileExtensionByMimeType (mimeType) {
    switch (mimeType.trim()) {
      case 'text/xml': return '.xml';
      case 'image/png': return '.png';
      case 'text/html': return '.html';
      case 'text/plain': return '.txt';
      case 'application/pdf': return '.pdf';
      case 'image/jpeg': return '.jpg ou .jpeg';
    }
  }

  /**
   * When the user tries to upload more files than the limit and / or their extensions are invalid, this method
   * will display a toast to inform him.
   */
  __alertUserAboutInvalidFiles () {
    this.app.openToast({
      text: `Só pode fazer upload de ${this.maxFiles} ficheiro(s) de cada vez com as seguintes extensões: ${this.accept.split(',').map(mimeType => this.__fileExtensionByMimeType(mimeType)).join(' / ')}.`,
      backgroundColor: 'red'
    });
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);
