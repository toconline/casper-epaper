/*
  - Copyright (c) 2014-2016 Neto Ranito & Seabra LDA. All rights reserved.
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

export function EPaperSocket_Initialize(a_root) {

  a_root.EPaperSocket = function (a_epaper, a_host, a_port, a_uri) {
    this._epaper = a_epaper;
    this._ws_uri = a_host + ((a_port != undefined && a_port !== '') ? ':' + a_port : '') + '/' + a_uri;
    this._socket = undefined;
    this.connect();
  }

  EPaperSocket.prototype = {
    constructor: a_root.EpaperSocket,

    connect: function () {
      if (typeof MozWebSocket != "undefined") {
        this._socket = new MozWebSocket(this._ws_uri, "skunk-epaper");
      } else {
        this._socket = new WebSocket(this._ws_uri, "skunk-epaper");
      }
      this._socket.onmessage = function (a_message) {
        this._epaper._onSocketMessage(a_message);
      }.bind(this);

      this._socket.onopen = function (a_message) {
        this._epaper._onSocketOpen(a_message);
      }.bind(this);

      this._socket.onclose = function (a_message) {
        this._epaper._onSocketClose(a_message);
      }.bind(this);
    },

    disconnect: function () {
      this._socket.close();
    },

    sendCommand: function (a_message) {
      this._socket.send(a_message);
    }
  };
}
