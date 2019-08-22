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
      title: String,
      subTitle: String,
      uploadUrl: String,
      acceptMimeTypes: String,
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          width: 50%;
          height: 80%;
          padding: 50px;
          overflow: auto;
          transform-origin: 0 0;
          background-color: white;
        }

        .upload-container {
          display: flex;
          align-items: center;
          flex-direction: column;
        }

        .upload-container .icon-container {
          width: 150px;
          height: 150px;
          display: flex;
          border-radius: 50%;
          margin-bottom: 30px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-color);
        }

        .upload-container .icon-container iron-icon {
          width: 50%;
          height: 50%;
          color: var(--primary-color);
        }

        .upload-container .title-container {
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
          color: var(--primary-color);
        }

        .upload-container .sub-title-container {
          color: darkgray;
          text-align: center;
          margin-bottom: 25px;
        }

        .upload-container vaadin-upload {
          width: 100%;
          height: 150px;
        }

        .upload-container vaadin-upload casper-button {
          margin: 0;
        }
      </style>
      <div class="upload-container">
        <div class="icon-container">
          <iron-icon icon="casper-icons:question-solid"></iron-icon>
        </div>

        <div class="title-container">[[title]]</div>
        <div class="sub-title-container">[[subTitle]]</div>

        <vaadin-upload
          id="upload"
          target="[[uploadUrl]]"
          accept="[[acceptMimeTypes]]">
          <casper-button slot="add-button">ABRIR</casper-button>
        </vaadin-upload>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.i18nUpdateUpload(this.$.upload);
  }

  __zoomChanged (zoom) {
    this.shadowRoot.host.style.transform = `scale(${zoom})`;
  }
}

customElements.define(CasperEpaperUpload.is, CasperEpaperUpload);