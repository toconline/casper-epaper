import '@vaadin/vaadin-upload/vaadin-upload.js';
import '@casper2020/casper-button/casper-button.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { Casper } from '@casper2020/casper-common-ui/casper-i18n-behavior.js';

class CasperEpaperUpload extends Casper.I18n(PolymerElement) {

  static get is () {
    return 'casper-epaper-upload';
  }

  static get properties () {
    return {
      zoom: {
        type: Number,
        observer: '__zoomChanged'
      },
      title: {
        type: String,
        observer: '__titleChanged'
      },
      subTitle: {
        type: String,
        observer: '__subTitleChanged'
      },
      maxFiles: Number,
      uploadUrl: String,
      acceptMimeTypes: String,
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          width: 100%;
          height: 100%;
          display: block;
          overflow: auto;
          padding: 50px;
          box-sizing: border-box;
          background-color: white;
        }

        #uploadContainer {
          display: flex;
          align-items: center;
          flex-direction: column;
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

        #uploadContainer .icon-container iron-icon {
          width: 50%;
          height: 50%;
          color: var(--primary-color);
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
      </style>
      <div id="uploadContainer">
        <div class="icon-container">
          <iron-icon icon="casper-icons:question-solid"></iron-icon>
        </div>

        <div id="title-container"></div>
        <div id="sub-title-container"></div>

        <vaadin-upload
          id="upload"
          target="[[uploadUrl]]"
          max-files="[[maxFiles]]"
          accept="[[acceptMimeTypes]]"
          form-data-name="my-attachment">
          <casper-button slot="add-button">ABRIR</casper-button>
        </vaadin-upload>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.__titleContainer = this.shadowRoot.querySelector('#title-container');
    this.__subTitleContainer = this.shadowRoot.querySelector('#sub-title-container');

    this.i18nUpdateUpload(this.$.upload);
    this.$.upload.addEventListener('upload-request', this.__uploadRequest);
    this.$.upload.addEventListener('upload-success', this.__uploadSuccess);
  }

  clearUploadedFiles () {
    this.$.upload.files = [];
  }

  __uploadRequest (event) {
    event.preventDefault();
    event.detail.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    event.detail.xhr.setRequestHeader('Content-Disposition', `form-data; name="${event.detail.file.formDataName}"; filename="uploaded_file";`);
    event.detail.xhr.send(event.detail.file);
  }

  __uploadSuccess (event) {
    if (event.detail.xhr.status === 200) {
      const uploadedFile = JSON.parse(event.detail.xhr.response).file;
      this.dispatchEvent(new CustomEvent('casper-epaper-upload-success', {
        bubbles: true,
        composed: true,
        detail: {
          uploadedFile: uploadedFile,
          originalFileName: event.detail.file.name,
          originalFileType: event.detail.file.type,
        }
      }));
    }
  }

  __titleChanged (title) {
    this.__titleContainer.innerHTML = title;
  }

  __subTitleChanged (subTitle) {
    this.__subTitleContainer.innerHTML = subTitle;
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);