import '@vaadin/vaadin-upload/vaadin-upload.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperEpaperUpload extends PolymerElement {

  static get is () {
    return 'casper-epaper-upload';
  }

  static get properties () {
    return {
      header: String,
      uploadUrl: String,
      acceptMimeTypes: String,
      additionalInformation: String,
    };
  }

  static get template () {
    return html`
      <style>
        .upload-container {
          display: flex;
          align-items: center;
          flex-direction: column;
          background-color: white;
          width: 500px;
          padding: 50px;
          height: calc(100% - 120px);
        }

        .upload-container .icon-container {
          width: 100px;
          height: 100px;
          display: flex;
          border-radius: 50%;
          margin-bottom: 25px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-color);
        }

        .upload-container .icon-container iron-icon {
          width: 70%;
          height: 70%;
          color: var(--primary-color);
        }

        .upload-container .title-container {
          font-weight: bold;
          margin-bottom: 15px;
          color: var(--primary-color);
        }

        .upload-container .sub-title-container {
          color: darkgray;
          margin-bottom: 25px;
        }

        .upload-container vaadin-upload {
          width: 100%;
          height: 150px;
        }
      </style>
      <div class="upload-container">
        <div class="icon-container">
          <iron-icon icon="casper-icons:download-pdf"></iron-icon>
        </div>

        <div class="title-container">[[title]]</div>
        <div class="sub-title-container">[[subTitle]]</div>

        <vaadin-upload
          target="[[uploadUrl]]"
          accept="[[acceptMimeTypes]]">
        </vaadin-upload>
      </div>
    `;
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);