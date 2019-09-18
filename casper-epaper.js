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
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

import '@polymer/iron-icon/iron-icon.js';
import '@casper2020/casper-icons/casper-icons.js';
import './casper-epaper-canvas.js';
import './casper-epaper-servertip-helper.js';
import './casper-epaper-types/casper-epaper-pdf.js';
import './casper-epaper-types/casper-epaper-image.js';
import './casper-epaper-types/casper-epaper-iframe.js';
import './casper-epaper-types/casper-epaper-upload.js';
import './casper-epaper-types/casper-epaper-server-document.js';

class CasperEpaper extends PolymerElement {

  static get EPAPER_MAX_ZOOM () { return 2; }
  static get EPAPER_MIN_ZOOM () { return 0.5; }

  static get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          background-color: var(--casper-moac-paper-background-color, #DDD);
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
          width: 100%;
          height: 100%;
          overflow: auto;
          display: flex;
          position: relative ;
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

        .toolbar {
          padding: 15px;
          z-index: 1;
          display: flex;
          width: 100%;
          position: absolute;
          align-items: center;
          box-sizing: border-box;
          justify-content: space-between;
        }

        .toolbar > div {
          display: flex;
        }

        .toolbar paper-icon-button,
        ::slotted(paper-icon-button),
        ::slotted(casper-epaper-tabs) {
          margin-left: 8px;
        }

        .toolbar-button,
        ::slotted(paper-icon-button) {
          padding: 0;
          max-width: 32px;
          max-height: 32px;
          border-radius: 50%;
          background-color: var(--primary-color);
          --iron-icon-width: 100%;
          --iron-icon-height: 100%;
          --iron-icon-fill-color: white;
          -webkit-box-shadow: 0px 2px 12px -1px rgba(0, 0, 0, 0.61);
          -moz-box-shadow:    0px 2px 12px -1px rgba(0, 0, 0, 0.61);
          box-shadow:         0px 2px 12px -1px rgba(0, 0, 0, 0.61);
        }

        .toolbar-button[disabled] {
          background-color: #E0E0E0;
          --iron-icon-fill-color: white;
        }

        .toolbar-white {
          --iron-icon-fill-color: var(--primary-color);
          background-color: white;
        }

        .spacer {
          flex-grow: 1.0;
        }

        #epaper-component-container {
          margin-top: 62px;
          position: relative;
          background-color: white;
          box-shadow: rgba(0, 0, 0, 0.24) 0px 5px 12px 0px,
                      rgba(0, 0, 0, 0.12) 0px 0px 12px 0px;
        }

        #epaper-component-sticky {
          opacity: 0.2;
          overflow: auto;
          display: none;
          transition: height 100ms linear, opacity 100ms linear;
          position: absolute;
          box-sizing: border-box;
          flex-direction: column;
          background-size: cover;
          background-repeat: no-repeat;
          background-image: url('/node_modules/@casper2020/casper-epaper/static/epaper-sticky.svg');
        }

        #epaper-component-sticky:hover {
          opacity: 1;
          cursor: pointer;
        }
      </style>
      <div class="toolbar">
        <div>
          <paper-icon-button on-click="zoomOut"          id="zoomOut"      tooltip="Reduzir"         icon="casper-icons:minus"        class="toolbar-button toolbar-white"></paper-icon-button>
          <paper-icon-button on-click="zoomIn"           id="zoomIn"       tooltip="Ampliar"         icon="casper-icons:plus"         class="toolbar-button toolbar-white"></paper-icon-button>
          <paper-icon-button on-click="goToPreviousPage" id="previousPage" tooltip="Página anterior" icon="casper-icons:arrow-left"   class="toolbar-button"></paper-icon-button>
          <paper-icon-button on-click="goToNextPage"     id="nextPage"     tooltip="Página seguinte" icon="casper-icons:arrow-right"  class="toolbar-button"></paper-icon-button>
          <!--Casper-epaper-tabs-->
          <slot name="casper-epaper-tabs"></slot>
        </div>

        <div>
          <!--Casper-epaper-actions-->
          <slot name="casper-epaper-actions"></slot>

          <paper-icon-button on-click="print"    id="print"    tooltip="Imprimir"        icon="casper-icons:print"        class="toolbar-button"></paper-icon-button>
          <paper-icon-button on-click="download" id="download" tooltip="Descarregar PDF" icon="casper-icons:download-pdf" class="toolbar-button"></paper-icon-button>

          <!--Context menu-->
          <template is="dom-if" if="[[__hasContextMenu]]">
            <paper-icon-button icon="casper-icons:bars" class="toolbar-button toolbar-white" id="context-menu-trigger"></paper-icon-button>
          </template>
        </div>

      </div>
      <div id="desktop" class="desktop">
        <div class="spacer"></div>

        <div id="epaper-component-container">
          <!--Sticky that will be used to display information about the component-->
          <div id="epaper-component-sticky"></div>

          <!--Canvas that will be shared between the document and PDF-->
          <casper-epaper-canvas
            id="epaperCanvas"
            zoom="[[__zoom]]"
            landscape="[[__landscape]]"></casper-epaper-canvas>

          <!--Document Epaper-->
          <casper-epaper-document
            id="serverDocument"
            app="[[app]]"
            zoom="[[__zoom]]"
            socket="[[__socket]]"
            scroller="[[scroller]]"
            current-page="{{__currentPage}}"
            epaper-canvas="[[__epaperCanvas]]"
            total-page-count="{{__totalPageCount}}"></casper-epaper-document>

            <!--PDF Epaper-->
            <casper-epaper-pdf
              id="pdf"
              zoom="[[__zoom]]"
              landscape="{{__landscape}}"
              current-page="[[__currentPage]]"
              epaper-canvas="[[__epaperCanvas]]"
              total-page-count="{{__totalPageCount}}">
            </casper-epaper-pdf>

            <!--Iframe Epaper-->
            <casper-epaper-iframe id="iframe"></casper-epaper-iframe>

            <!--Image Epaper-->
            <casper-epaper-image id="image" zoom="[[__zoom]]"></casper-epaper-image>

            <!--Upload Epaper-->
          <casper-epaper-upload id="upload"></casper-epaper-upload>
        </div>
        <div class="spacer"></div>

      </div>
      <div class="shadow"></div>
      <slot name="casper-epaper-context-menu"></slot>
    `;
  }

  static get is () {
    return 'casper-epaper';
  }

  static get EPAPER_TYPES () {
    return {
      PDF: 'PDF',
      IMAGE: 'IMAGE',
      UPLOAD: 'UPLOAD',
      IFRAME: 'IFRAME',
      SERVER_DOCUMENT: 'SERVER_DOCUMENT'
    }
  }

  static get properties () {
    return {
      /**
       * The casper application.
       *
       * @type {Object}
       */
      app: Object,
      /** id of the containing element that can be scrolled */
      scroller: {
        type: String,
        value: undefined
      },
      __landscape: {
        type: Boolean,
        observer: '__recalculateEpaperDimensions'
      },
      __epaperComponentWidth: {
        type: Number,
        value: 595.0
      },
      __epaperComponentHeight: {
        type: Number,
        value: 842.0
      },
      __epaperComponentStickyStyle: {
        type: Object,
        value: {
          top: -19,
          right: 15,
          width: 150,
          height: 90,
          fontSize: 10,
          fullHeight: 180,
          paddingTop: 45,
          paddingLeft: 10,
          paddingRight: 10,
        }
      },
      /** zoom factor when zoom is 1 one pt in report is one px in the screen */
      __zoom: {
        type: Number,
        value: 1,
        observer: '__recalculateEpaperDimensions'
      },
      __totalPageCount: {
        type: Number,
        observer: '__enableOrDisablePageButtons'
      },
      __currentPage: {
        type: Number,
        observer: '__enableOrDisablePageButtons'
      }
    };
  }

  ready () {
    super.ready();

    this.__epaperCanvas = this.$.epaperCanvas;
    this.__currentPage      = 1;
    this.__totalPageCount   = 0;
    this._pageNumber        = 1;
    this._chapterPageCount  = 0;
    this._chapterPageNumber = 1;
    this.__socket           = this.app.socket;
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT);

    afterNextRender(this, () => {
      this.__handleContextMenu();
      this.$.pdf.addEventListener('pdf-render-started', () => {
        this.__disablePageButtons();
        this.__disableZoomButtons();
      });

      this.$.pdf.addEventListener('pdf-render-ended', () => {
        this.__enableOrDisablePageButtons();
        this.__enableOrDisableZoomButtons();
      });
    });

    this.__epaperComponentContainer = this.shadowRoot.querySelector('#epaper-component-container');
    this.__epaperComponentSticky = this.shadowRoot.querySelector('#epaper-component-sticky');
    this.__epaperComponentSticky.addEventListener('mouseover', () => {
      this.__epaperComponentSticky.style.height = `${parseInt(this.__epaperComponentStickyStyle.fullHeight * this.__zoom)}px`;
    });

    this.__epaperComponentSticky.addEventListener('mouseleave', () => {
      this.__epaperComponentSticky.style.height = `${parseInt(this.__epaperComponentStickyStyle.height * this.__zoom)}px`;
    });
  }

  //***************************************************************************************//
  //                                                                                       //
  //                                  ~~~ Public API ~~~                                   //
  //                                                                                       //
  //***************************************************************************************//

  /**
   * Opens an attachment with the correct "type" of epaper.
   *
   * @param {Object} attachment The attachment's metadata. This object should contain property
   * that contains the attachment's type so the component can react accordingly.
   */

  async openAttachment (attachment) {
    this.__currentAttachment = attachment;
    this.__displayOrHideSticky();

    try {
      switch (attachment.type) {
        case 'file/pdf':
          return this.__openPDF();
        case 'file/xml':
        case 'file/txt':
        case 'file/htm':
        case 'file/html':
          this.__landscape = false;
          return this.__openIframe();
        case 'file/png':
        case 'file/jpg':
        case 'file/jpeg':
          this.__landscape = false;
          return this.__openImage();
        case 'epaper':
          return this.__openServerDocument();
      }
    } catch (error) {

    }
  }

  /**
   * Open server document
   */
  __openServerDocument () {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT);
    this.__enableOrDisablePageButtons();
    this.__enableOrDisableZoomButtons();

    return this.$.serverDocument.open(this.__currentAttachment);
  }

  /**
   * Open a new image.
   */
  __openImage () {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.IMAGE);
    this.__enableOrDisablePageButtons();
    this.__enableOrDisableZoomButtons();

    this.$.image.source = `/file/${this.__currentAttachment.id}`;
    this.$.image.open();
  }

  /**
   * Open an iframe.
   *
   * @param {String} iframeSource The iframe's source URL.
   */
  __openIframe () {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.IFRAME);
    this.__enableOrDisableZoomButtons();
    this.__disablePageButtons();

    this.$.iframe.source = `/file/${this.__currentAttachment.id}`;
    this.$.iframe.title = this.__currentAttachment.name;
    this.$.iframe.contentType = this.__currentAttachment.type;
    this.$.iframe.open();
  }

  /**
   * Open a PDF file.
   */
  __openPDF () {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.PDF);
    this.__enableOrDisablePageButtons();
    this.__enableOrDisableZoomButtons();

    this.$.pdf.source = `/file/${this.__currentAttachment.id}`;
    this.$.pdf.openPDF();
  }

  __displayOrHideSticky () {
    this.__epaperComponentSticky.innerHTML = '';

    if (!Object.keys(this.__currentAttachment).includes('sticky')) {
      this.__epaperComponentSticky.style.display =  'none';
      return;
    }

    this.__epaperComponentSticky.style.display =  'flex';
    // Print the text lines.
    if (this.__currentAttachment.sticky.text_lines && this.__currentAttachment.sticky.text_lines.length > 0) {
      this.__currentAttachment.sticky.text_lines.forEach(textLine => {
        const textLineContainer = document.createElement('span');
        const key = document.createElement('strong');
        const value = document.createTextNode(textLine.value)

        key.innerText = `${textLine.key}: `;
        textLineContainer.appendChild(key);
        textLineContainer.appendChild(value);

        this.__epaperComponentSticky.appendChild(textLineContainer);
      });
    }

    // Archived when.
    if (this.__currentAttachment.sticky.archived_at) {
      const archivedAt = document.createElement('span');
      archivedAt.innerText = this.__currentAttachment.sticky.archived_at;
      archivedAt.style.marginTop = '10px';

      this.__epaperComponentSticky.appendChild(archivedAt);
    }

    // Archived by.
    if (this.__currentAttachment.sticky.archived_by) {
      const archivedBy = document.createElement('span');
      archivedBy.innerText = this.__currentAttachment.sticky.archived_by;
      archivedBy.style.marginTop = '10px';
      archivedBy.style.color = 'var(--primary-color)';

      this.__epaperComponentSticky.appendChild(archivedBy);
    }
  }

  /**
   * Open a new uplaod page.
   *
   * @param {Object} options
   */
  openUploadPage (options) {
    Object.keys(options).forEach(option => this.$.upload[option] = options[option]);

    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.UPLOAD);
    this.__enableOrDisableZoomButtons();
    this.__disablePageButtons();
  }

  /**
   * Navigate to the previous page.
   */
  goToPreviousPage () {
    if (this.__currentPage > 1) {
      this.__currentPage--;
    }
  }

  /**
   * Navigate to the next page.
   */
  goToNextPage () {
    if (this.__currentPage < this.__totalPageCount) {
      this.__currentPage++;
    }
  }

  /**
   * Sets the epaper's zoom to a specific value.
   */
  setZoom (zoom) {
    if (this.__zoom >= CasperEpaper.EPAPER_MIN_ZOOM && this.__zoom <= CasperEpaper.EPAPER_MAX_ZOOM) {
      this.__zoom = zoom;
    }
  }

  /**
   * Decreases the epaper's zoom.
   */
  zoomOut () {
    if (this.__zoom > CasperEpaper.EPAPER_MIN_ZOOM) {
      this.__zoom *= 0.8;
    }
  }

  /**
   * Increases the epaper's zoom.
   */
  zoomIn () {
    if (this.__zoom < CasperEpaper.EPAPER_MAX_ZOOM) {
      this.__zoom *= 1.2;
    }
  }

  __recalculateEpaperDimensions () {
    afterNextRender(this, () => {
      // Scale the epaper component container.
      this.__epaperComponentContainer.style.width =  `${parseInt((this.__landscape ? this.__epaperComponentHeight : this.__epaperComponentWidth) * this.__zoom)}px`;
      this.__epaperComponentContainer.style.height = `${parseInt((this.__landscape ? this.__epaperComponentWidth : this.__epaperComponentHeight) * this.__zoom)}px`;

      // Scale the post-it dimensions and position.
      this.__epaperComponentSticky.style.top        = `${parseInt(this.__epaperComponentStickyStyle.top * this.__zoom)}px`;
      this.__epaperComponentSticky.style.right      = `${parseInt(this.__epaperComponentStickyStyle.right * this.__zoom)}px`;
      this.__epaperComponentSticky.style.width      = `${parseInt(this.__epaperComponentStickyStyle.width * this.__zoom)}px`;
      this.__epaperComponentSticky.style.height     = `${parseInt(this.__epaperComponentStickyStyle.height * this.__zoom)}px`;
      this.__epaperComponentSticky.style.fontSize   = `${parseInt(this.__epaperComponentStickyStyle.fontSize * this.__zoom)}px`;
      this.__epaperComponentSticky.style.paddingTop = `${parseInt(this.__epaperComponentStickyStyle.paddingTop * this.__zoom)}px`;
      this.__epaperComponentSticky.style.paddingLeft = `${parseInt(this.__epaperComponentStickyStyle.paddingLeft * this.__zoom)}px`;
      this.__epaperComponentSticky.style.paddingRight = `${parseInt(this.__epaperComponentStickyStyle.paddingRight * this.__zoom)}px`;
    });
  }

  clearUploadedFiles () {
    this.$.upload.clearUploadedFiles();
  }

  print () {
    this.__epaperActiveComponent.print();
  }

  download () {
    this.__epaperActiveComponent.download();
  }

  /**
   * Open specified chapter, page can also be specified.
   *
   * @param {number} chapterIndex zero page index of the chapter in the document model
   * @param {number} pageNumber page to open, 1 for 1st page
   */
  gotoChapter (chapterIndex, pageNumber) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT);

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
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT);

    this.$.serverDocument.openAndGotoParamOrField(documentModel, chapterReport, fieldName, rowIndex);
  }

  /**
   * Highlight field or parameter on the specified chapter
   *
   * @param {string} chaperReport name of the chapter's JRXML report
   * @param {string} fieldName name field or parameter to highlight
   * @param {string} rowIndex undefined to highlight a parameter or the rowIndex to highligth a field
   */
  gotoParamOrField (chapterReport, fieldName, rowIndex) {
    this.__toggleBetweenEpaperTypes(CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT);

    this.$.serverDocument.gotoParamOrField(chapterReport, fieldName, rowIndex);
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
    await this.__socket.closeDocument(this._documentId);
    return true;
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

    if (this.isPrintableDocument()) return undefined;

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

  __documentChanged (document) {
    if (document) this.open(document);
  }

  //***************************************************************************************//
  //                                                                                       //
  //                             ~~~ Private methods ~~~                                   //
  //                                                                                       //
  //***************************************************************************************//

  __handleContextMenu () {
    let contextMenu;
    const contextMenuSlot = this.shadowRoot.querySelector('slot[name="casper-epaper-context-menu"]');
    const contextMenuSlotElement = contextMenuSlot.assignedElements().shift();

    if (contextMenuSlotElement) {
      // This happens when the epaper is used inside a casper-moac element.
      if (contextMenuSlotElement.nodeName.toLowerCase() === 'slot') {
        contextMenu = contextMenuSlotElement.assignedElements().shift();
        this.__hasContextMenu = contextMenu && contextMenu.nodeName.toLowerCase() === 'casper-context-menu';
      } else if (contextMenuSlotElement.nodeName.toLowerCase() === 'casper-context-menu') {
        // This is the normal situation when the casper-context-menu is not nested.
        contextMenu = contextMenuSlotElement;
        this.__hasContextMenu = true;
      }
    }

    if (this.__hasContextMenu) {
      afterNextRender(this, () => {
        const contextMenuTrigger = this.shadowRoot.querySelector('#context-menu-trigger');
        contextMenu.positionTarget = contextMenuTrigger;
        contextMenu.verticalAlign = 'top';
        contextMenu.horizontalAlign = 'right';
        contextMenu.verticalOffset = contextMenuTrigger.offsetHeight + 10;

        contextMenuTrigger.addEventListener('click', () => contextMenu.toggle());
        contextMenu.addEventListener('iron-overlay-canceled', event => {
          if (event.detail.path.includes(contextMenuTrigger)) {
            event.preventDefault();
          }
        })
      });
    }
  }

  __disablePageButtons () {
    this.$.nextPage.disabled = true;
    this.$.previousPage.disabled = true;
  }

  __disableZoomButtons () {
    this.$.zoomIn.disabled = true;
    this.$.zoomOut.disabled = true;
  }

  __enableOrDisablePageButtons () {
    if ([CasperEpaper.EPAPER_TYPES.PDF, CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT].includes(this.__epaperType)) {
      this.$.previousPage.disabled = this.__currentPage === 1;
      this.$.nextPage.disabled = this.__currentPage === this.__totalPageCount;
    } else {
      this.$.nextPage.disabled = true;
      this.$.previousPage.disabled = true;
    }
  }

  __enableOrDisableZoomButtons () {
    this.$.zoomIn.disabled = this.__zoom >= CasperEpaper.EPAPER_MAX_ZOOM;
    this.$.zoomOut.disabled = this.__zoom <= CasperEpaper.EPAPER_MIN_ZOOM;
  }

  __toggleBetweenEpaperTypes (epaperType) {
    this.__epaperType = epaperType;
    this.__epaperActiveComponent = this.$[epaperType.toLowerCase().replace(/([-_][a-z])/ig, (lowercase) => lowercase.toUpperCase().replace('_', ''))];

    this.$.pdf.style.display = epaperType === CasperEpaper.EPAPER_TYPES.PDF ? '' : 'none';
    this.$.image.style.display = epaperType === CasperEpaper.EPAPER_TYPES.IMAGE ? '' : 'none';
    this.$.upload.style.display = epaperType === CasperEpaper.EPAPER_TYPES.UPLOAD ? '' : 'none';
    this.$.iframe.style.display = epaperType === CasperEpaper.EPAPER_TYPES.IFRAME ? '' : 'none';
    this.$.serverDocument.style.display = epaperType === CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT ? '' : 'none';
    this.$.epaperCanvas.style.display = epaperType === CasperEpaper.EPAPER_TYPES.PDF || epaperType === CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT ? '' : 'none';

    this.$.pdf.ignoreEvents = epaperType !== CasperEpaper.EPAPER_TYPES.PDF;
    this.$.serverDocument.ignoreEvents = epaperType !== CasperEpaper.EPAPER_TYPES.SERVER_DOCUMENT;
  }
}

window.customElements.define(CasperEpaper.is, CasperEpaper);
