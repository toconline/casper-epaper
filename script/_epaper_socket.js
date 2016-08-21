/*-------------------------------------------------------------------------*
 * Copyright (c) 2014-2016 Neto Ranito & Seabra LDA. All rights reserved.
 *
 * This file is part of casper-epaper.
 *
 * casper-epaper is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * casper-epaper  is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with casper-epaper.  If not, see <http://www.gnu.org/licenses/>.
 *-------------------------------------------------------------------------*/

"use strict";

function EPaperSocket_Initialize (a_root) {

    a_root.EPaperSocket = function (a_epaper, a_host, a_port, a_uri) {
      this._epaper = a_epaper;
      this._ws_uri = a_host + (a_port != undefined ? ':' + a_port : '') + '/' + a_uri;
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
        this._socket.onmessage = this.create_onmessage_handler(this._epaper);
        this._socket.onopen    = this.create_onopen_handler(this._epaper);
        this._socket.onclose   = this.create_onclose_handler(this._epaper);
      },

      create_onmessage_handler: function (a_epaper) {
        return function (a_message) {
          a_epaper.on_socket_message(a_message);
        };
      },

      create_onopen_handler: function (a_epaper) {
        return function (a_message) {
          a_epaper.on_socket_open(a_message);
        };
      },

      create_onclose_handler: function (a_epaper) {
        return function (a_message) {
          a_epaper.on_socket_close(a_message);
        };
      },

      disconnect: function () {
        this._socket.close();
      },

      send_command: function (a_message) {
        this._socket.send(a_message);
      }

    };

}