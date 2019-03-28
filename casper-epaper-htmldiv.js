/*
  - Copyright (c) 2016 Neto Ranito & Seabra LDA. All rights reserved.
  -
  - This file is part of casper-combolist.
  -
  - casper-combolist is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-combolist  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-combolist.  If not, see <http://www.gnu.org/licenses/>.
  -
 */

import { PolymerElement, html } from '@polymer/polymer/poylmer-element.js';

class CasperEpaperHtmldiv extends PolymerElement {
  static get template () {
    return html`
      <style>
        .highligth {
          border: 1px solid #ccc;
          font-weight: bold;
          border-radius: 4px;
        }
        .justify {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
        }
        .normal {
          display: flex;
          align-items: stretch;
        }
        .main {
          flex: flex-grow;
        }
        .left {
          margin-right: 5px;
        }
        .right {
          margin-left: 5px;
        }
      </style>
      <template>
        <div id="content"></div>
      </template>
    `;
  }

  static get is () {
    return 'casper-epaper-htmldiv';
  }

  static get properties () {
    return {
      innerHtml: {
        type: Object,
        observer: '_onInnerHtmlChanged'
      }
    };
  }

  /** copies the html from the attribute into the node DOM */
  _onInnerHtmlChanged (a_html) {
    Polymer.dom(this.$.content).innerHTML = a_html;
  }
}
