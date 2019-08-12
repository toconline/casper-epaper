/*
  - Copyright (c) 2014-2016 Cloudware S.A. All rights reserved.
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

import '@polymer/iron-icon/iron-icon.js';
import '@casper2020/casper-icons/casper-icons.js';
import './casper-epaper-input.js';
import './casper-epaper-servertip-helper.js';
import './casper-epaper-types/casper-epaper-pdf.js';
import './casper-epaper-types/casper-epaper-image.js';
import './casper-epaper-types/casper-epaper-iframe.js';
import './casper-epaper-types/casper-epaper-document.js';

class CasperEpaper extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          background-color: #ddd;
          position: relative;
          width: 100%;
          height: 100%;
        }

        iron-icon {
          position: absolute;
          display: inline-block;
          cursor: pointer;
          padding: 1px;
          margin: 0px;
          width: 24px;
          height: 24px;
          fill: var(--dark-primary-color);
        }

        #line_add_button:hover {
          fill: var(--primary-color);
        }

        #line_del_button:hover {
          fill: #B94F4F;
        }

        .desktop {
          top: 0px;
          left: 0px;
          width: 100%;
          height: 100%;
          position: absolute;
          overflow: auto;
          display: flex;
        }

        .shadow {
          top: 0px;
          left: 0px;
          position: absolute;
          width: 100%;
          height: 100%;
          -moz-box-shadow:    inset 0 0 10px #00000080;
          -webkit-box-shadow: inset 0 0 10px #00000080;
          box-shadow:         inset 0 0 10px #00000080;
          pointer-events:     none;
        }

        canvas {
          outline: none;
          box-shadow: rgba(0, 0, 0, 0.24) 0px 5px 12px 0px,
                      rgba(0, 0, 0, 0.12) 0px 0px 12px 0px;
        }

        canvas,
        casper-epaper-pdf,
        casper-epaper-image,
        casper-epaper-iframe {
          margin: 60px 0;
        }

        .toolbar {
          top: 6px;
          right: 32px;
          position: absolute;
          z-index: 1;
        }

        .toolbar-button {
          padding: 0px;
          margin: 6px 2px;
          max-width: 32px;
          max-height: 32px;
          border-radius: 50%;
          background-color: var(--primary-color);
          --iron-icon-width: 100%;
          --iron-icon-height: 100%;
          --iron-icon-fill-color: white;
          -webkit-box-shadow: 0px 2px 12px -1px rgba(0, 0, 0, 0.61);
          -moz-box-shadow: 0px 2px 12px -1px rgba(0, 0, 0, 0.61);
          box-shadow: 0px 2px 12px -1px rgba(0, 0, 0, 0.61);
        }

        .toolbar-button[disabled] {
          background-color: lightgray;
          --iron-icon-fill-color: darkgray;
        }        

        .toolbar-white {
          --iron-icon-fill-color: var(--primary-color);
          background-color: white;
        }

        .spacer {
          flex-grow: 1.0;
        }

      </style>
      <div class="toolbar">
        <paper-icon-button on-click="__zoomOut"      id="zoomOut"      tooltip="Reduzir"         icon="casper-icons:minus"        class="toolbar-button toolbar-white"></paper-icon-button>
        <paper-icon-button on-click="__zoomIn"       id="zoomIn"       tooltip="Ampliar"         icon="casper-icons:plus"         class="toolbar-button toolbar-white"></paper-icon-button>
        <paper-icon-button on-click="__previousPage" id="previousPage" tooltip="Página anterior" icon="casper-icons:arrow-left"   class="toolbar-button"></paper-icon-button>
        <paper-icon-button on-click="__nextPage"     id="nextPage"     tooltip="Página seguinte" icon="casper-icons:arrow-right"  class="toolbar-button"></paper-icon-button>
        <paper-icon-button on-click="__print"        id="print"        tooltip="Imprimir"        icon="casper-icons:print"        class="toolbar-button"></paper-icon-button>
        <paper-icon-button on-click="__download"     id="download"     tooltip="Descarregar PDF" icon="casper-icons:download-pdf" class="toolbar-button"></paper-icon-button>
      </div>
      <div id="desktop" class="desktop">
        <div class="spacer"></div>

        <!--Document Epaper-->
        <casper-epaper-document
          id="document"
          zoom="[[zoom]]"
          width="[[width]]"
          height="[[height]]"
          socket="[[_socket]]"
          scroller="[[scroller]]"
          current-page="{{_currentPage}}"
          total-page-count="{{__totalPageCount}}"></casper-epaper-document>
        <!--PDF Epaper-->
        <casper-epaper-pdf
          id="pdf"
          zoom="[[zoom]]"
          page="[[_currentPage]]"
          total-page-count="{{__totalPageCount}}">
        </casper-epaper-pdf>
        <!--Iframe Epaper-->
        <casper-epaper-iframe id="iframe"></casper-epaper-iframe>
        <!--Image Epaper-->
        <casper-epaper-image id="image" zoom="[[zoom]]"></casper-epaper-image>

        <div class="spacer"></div>

      </div>
      <div class="shadow"></div>
    `;
  }

  static get is () {
    return 'casper-epaper';
  }

  static get EPAPER_TYPES () {
    return {
      PDF: 'PDF',
      IMAGE: 'IMAGE',
      IFRAME: 'IFRAME',
      DOCUMENT: 'DOCUMENT'
    }
  }

  static get properties () {
    return {
      /** The casper application  */
      app: Object,
      /** component width in px */
      width: {
        type: Number,
        value: 595
      },
      /** component height in px */
      height: {
        type: Number,
        value: 842
      },
      /** zoom factor when zoom is 1 one pt in report is one px in the screen */
      zoom: {
        type: Number,
        value: 1
      },
      /** object that specifies the document being displayed/edited */
      document: {
        type: Object,
        observer: '_documentChanged'
      },
      /** id of the containing element that can be scrolled */
      scroller: {
        type: String,
        value: undefined
      },
      __totalPageCount: {
        type: Number,
        observer: '__totalPageCountChanged'
      }
    };
  }

  ready () {
    super.ready ();

    window.epig = this;
    console.warn("EPaper pinned to window.epig TODO remove this");

    this._currentPage       = 1;
    this._pageNumber        = 1;
    this.__totalPageCount   = 0;
    this._chapterPageCount  = 0;
    this._chapterPageNumber = 1;
    this._socket            = this.app.socket;
    this.__toggleBetweenEpaperTypes('document');
  }

  isPrintableDocument () {
    return this._document.loading
      || this._document === undefined
      || this._documentId === undefined
      || this._document.chapters === undefined;
  }

  //***************************************************************************************//
  //                                                                                       //
  //                                  ~~~ Public API ~~~                                   //
  //                                                                                       //
  //***************************************************************************************//

  /**
   * Open server document

   * @param {Object} documentModel An object that specifies the layout and data of the document.
   */
  async open (documentModel) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.DOCUMENT);
    return this.$.document.open(documentModel);
  }

  /**
   * Open a new image.
   *
   * @param {String} imageSource The image's source URL.
   */
  openImage (imageSource) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.IMAGE);

    this.$.image.source = imageSource;
  }

  /**
   * Open an iframe.
   *
   * @param {String} iframeSource The iframe's source URL.
   */
  openIframe (iframeSource) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.IFRAME);

    this.$.iframe.source = iframeSource;
  }

  /**
   * Open a PDF file.
   *
   * @param {String} iframeSource The PDF's source URL.
   */
  openPDF (iframePDF) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.PDF);

    this.$.pdf.source = iframePDF;
  }

  /**
   * Open specified chapter, page can also be specified.
   *
   * @param {number} chapterIndex zero page index of the chapter in the document model
   * @param {number} pageNumber page to open, 1 for 1st page
   */
  gotoChapter (chapterIndex, pageNumber) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.DOCUMENT);

    if ( this._document && this._document.chapters && this._document.chapters.length >= 1 ) {
      this._chapterIndex = chapterIndex;
      this._chapter      = this._document.chapters[chapterIndex];
      return this._openChapter(pageNumber);
    } else {
      // warning
    }
  }

  /**
   * Open document and highlight field or parameter on the specified chapter
   *
   * @param {object} documentModel an object that specifies the layout and data of the document
   * @param {string} chaperReport name of the chapter's JRXML report
   * @param {string} fieldName name field or parameter to highlight
   * @param {string} rowIndex undefined to highlight a parameter or the rowIndex to highligth a field
   */
  openAndGotoParamOrField (documentModel, chapterReport, fieldName, rowIndex) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.DOCUMENT);

    this.$.document.openAndGotoParamOrField(documentModel, chapterReport, fieldName, rowIndex);
  }

  /**
   * Highlight field or parameter on the specified chapter
   *
   * @param {string} chaperReport name of the chapter's JRXML report
   * @param {string} fieldName name field or parameter to highlight
   * @param {string} rowIndex undefined to highlight a parameter or the rowIndex to highligth a field
   */
  gotoParamOrField (chapterReport, fieldName, rowIndex) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.DOCUMENT);

    this.$.document.gotoParamOrField(chapterReport, fieldName, rowIndex);
  }

  previousChapter () {
    if ( this._document && this._document.chapters && this._document.chapters.length >= 1 ) {
      if (this._chapterIndex >= 1 ) {
        this._chapterIndex -= 1;
        this.gotoChapter(this._chapterIndex, -1);
        return true;
      }
    }
    return false;
  }

  nextChapter () {
    if ( this._document && this._document.chapters && this._document.chapters.length >= 1 ) {
      if ( this._chapterIndex < (this._document.chapters.length - 1) ) {
        this._chapterIndex += 1;
        this.gotoChapter(this._chapterIndex, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Goto to the specified page. Requests page change or if needed loads the required chapter
   *
   * @param {number} pageNumber the page to render
   */
  async gotoPage (pageNumber) {

    if ( this._document && this._document.chapters && this._document.chapters.length >= 1 ) {
      let currentPage = 1;

      pageNumber = parseInt(pageNumber);
      for ( let i = 0;  i < this._document.chapters.length; i++ ) {
        if ( pageNumber >= currentPage && pageNumber < (currentPage + this._document.chapters[i].pageCount) ) {
          let newPageNumber;

          newPageNumber = 1 + pageNumber - currentPage;
          if ( i === this._chapterIndex ) {
            if ( this._chapterPageNumber !== newPageNumber ) {
              this._resetScroll();
              await this._socket.gotoPage(this._documentId, newPageNumber);
              return pageNumber;
            }
          } else {
            this.gotoChapter(i, newPageNumber);
            return pageNumber;
          }
          this._chapterPageNumber = newPageNumber;
        }
        currentPage += this._document.chapters[i].pageCount;
      }
    }
    return this._currentPage;
  }

  /**
   * @brief Retrieve the number of pages in the document
   *
   * @return page count
   */
  getPageCount () {
    return this.__totalPageCount;
  }

  async closeDocument () {
    this._clear();
    this._hideWidgets(true);
    this._resetCommandData();
    this._fireEvent('casper-epaper-notification', { message: 'update:variable,PAGE_COUNT,1;' });  // TODO needed by whom?
    this._fireEvent('casper-epaper-notification', { message: 'update:variable,PAGE_NUMBER,1;' }); // TODO needed by whom?
    this._document = undefined;
    await this._socket.closeDocument(this._documentId);
    return true;
  }

  __print () {
    this.app.showPrintDialog(this.getPrintJob(true));
  }

  __download () {
    this.app.showPrintDialog(this.getPrintJob(false));
  }

  getPrintJob (print) {
    let name  = 'TESTE'; ///*this.i18n.apply(this, */this._document.filename_template;
    let title = name

    if ( this.isPrintableDocument() ) { // ??? reverted logic WTF?
      return undefined;
    }

    let job = {
      tube: 'casper-print-queue',
      name: name,
      validity: 3600,
      locale: this._locale,
      continous_pages: true,
      auto_printable: print == true,
      documents: [],
      public_link: {
        path: print ? 'print' : 'download'
      },
      action: print ? 'epaper-print' : 'epaper-download'
    }
    for ( let i = 0; i < this._document.chapters.length; i++) {
      let chapter = {
        name: name,
        title: title,
        jrxml: this._document.chapters[i].jrxml,
        jsonapi: {
          // TODO extract list of relationships from the report!!!! // TODO NO TOCONLINE
          urn: 'https://app.toconline.pt/' + this._document.chapters[i].path + '?' + ((undefined !== this._document.chapters[i].params && '' !== this._document.chapters[i].params) ? this._document.chapters[i].params : 'include=lines'),
          prefix: null,
          user_id: null,
          entity_id: null,
          entity_schema: null,
          sharded_schema: null,
          accounting_schema: null,
          accounting_prefix: null
        }
      }
      job.documents.push(chapter);
    }
    return job;
  }

  getBatchPrintJob (print, documents) {
    documents = documents || []

    first_document = documents[0]

    if ( first_document !== undefined ) {
      name = first_document.name || this.i18n.apply(this, first_document.filename_template)
      title = first_document.title || name
    }

    name = name || this.i18n.apply(this, this._document.filename_template);
    title = title || name

    if ( this.isPrintableDocument() ) {
      return undefined;
    }

    let job = {
      tube: 'casper-print-queue',
      name: name,
      validity: 3600,
      locale: this._locale,
      continous_pages: true,
      auto_printable: print == true,
      documents: [],
      public_link: {
        path: print ? 'print' : 'download'
      },
    }

    for (let i = 0; i < documents.length; i++) {
      _document = documents[i]
      _document_name = this.i18n.apply(this, _document.filename_template)

      for (let j = 0; j < _document.chapters.length; j++) {
        _chapter = _document.chapters[j]

        _print_document = {
          name: _document.name || _document_name || name,
          title: _document.title || _document_name || title,
          jrxml: _chapter.jrxml + '.jrxml',
          jsonapi: {
            urn: _chapter.path + '?include=lines', // Make this optional on CPQ???
            prefix: null,
            user_id: null,
            company_id: null,
            company_schema: null,
            sharded_schema: null,
            accounting_schema: null,
            accounting_prefix: null
          }
        }

        job.documents.push(_print_document);
      }
    }

    return job;
  }

  _documentChanged (document) {
    if ( document ) {
      this.open(document);
    }
  }

  //***************************************************************************************//
  //                                                                                       //
  //                             ~~~ Private methods ~~~                                   //
  //                                                                                       //
  //***************************************************************************************//

  __zoomOut () {
    if (this.zoom > 0.5) {
      this.zoom *= 0.8;
      this.$.zoomIn.disabled = false;

      // Disable the button if the epaper is zoomed out too much.
      if (this.zoom <= 0.5) {
        this.$.zoomOut.disabled = true;
      }
    }
  }

  __zoomIn () {
    if (this.zoom < 2) {
      this.zoom *= 1.2;
      this.$.zoomOut.disabled = false;

      // Disable the button if the epaper is zoomed in too much.
      if (this.zoom >= 2) {
        this.$.zoomIn.disabled = true;
      }
    }
  }

  __enableOrDisablePageButtons () {
    this.$.previousPage.disabled = this._currentPage === 1;
    this.$.nextPage.disabled = this._currentPage === this.__totalPageCount;
  }

  __previousPage () {
    if (this._currentPage > 1) {
      this._currentPage--;
      this.__enableOrDisablePageButtons();
    }
  }

  __nextPage () {
    if (this._currentPage < this.__totalPageCount) {
      this._currentPage++;
      this.__enableOrDisablePageButtons();
    }
  }

  __totalPageCountChanged () {
    this.__enableOrDisablePageButtons();
  }

  //***************************************************************************************//
  //                                                                                       //
  //                               ~~~ Websocket handlers ~~~                              //
  //                                                                                       //
  //***************************************************************************************//

  _fireEvent (eventName, eventData) { // TODO check legacy
    //if ( this.iframe ) {
      window.parent.document.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
    //} else {
      // @TODO remove legacy API
      //if ( undefined !== this.fire ) {
      //  this.fire(eventName, eventData);
      //}
    //}
  }

  __toggleBetweenEpaperTypes (epaperType) {
    this.$.pdf.style.display = epaperType === CasperEpaper.EPAPER_TYPES.PDF ? 'block' : 'none';
    this.$.image.style.display = epaperType === CasperEpaper.EPAPER_TYPES.IMAGE ? 'block' : 'none';
    this.$.iframe.style.display = epaperType === CasperEpaper.EPAPER_TYPES.IFRAME ? 'block' : 'none';
    this.$.document.style.display = epaperType === CasperEpaper.EPAPER_TYPES.DOCUMENT ? 'block' : 'none';
  }
}

window.customElements.define(CasperEpaper.is, CasperEpaper);
