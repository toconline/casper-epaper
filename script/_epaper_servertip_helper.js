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

function EPaperServertipHelper_Initialize (a_root) {

  /**
   * @brief Input box constructor
   *
   * @param a_epaper Parent EPaper object
   * @param a_input_box The input box that manages the tooltip
   */
  a_root.EPaperServertipHelper = function (a_epaper, a_input_box) {

    EPaperWidget.call(this, a_epaper);

    this._last_x           = undefined;
    this._last_y           = undefined;
    this._center_x         = undefined;
    this._center_y         = undefined;
    this._bb_x             = undefined;
    this._px_threshold     = 5 * this._epaper._ratio;
    this._min_overing_time = 500;
    this._timer_key        = '_epaper_tt_onover_timer';
    this._input_box        = a_input_box;

    this.reset_timer();
  };

  EPaperServertipHelper.prototype = Object.create(EPaperWidget.prototype, {
    constructor: {
      configurable: true,
      enumarable: true,
      value: EPaperServertipHelper.prototype,
      writable: true
    }
  });

  /**
   * @param Requests the server side hint for the current overing point
   *
   * @param a_x X coordinate where the mouse is overing
   * @param a_y Y coordinate where the mouse is overing
   */
  EPaperServertipHelper.prototype.get_hint = function (a_x, a_y) {
    var self = this;

    this._epaper.call_rpc('hint', 'get hint ' + a_x.toFixed(2) + ',' + a_y.toFixed(2) + ';',

        function (a_epaper, a_message) {
          var x, y, w, h, l, t;

          a_epaper._message = a_message;
          a_epaper._r_idx   = 'S:ok:hint:'.length;
          x = a_epaper.get_double();
          y = a_epaper.get_double();
          w = a_epaper.get_double();
          h = a_epaper.get_double();
          l = a_epaper.get_double();
          if ( l ) {
            t = a_message.substring(a_epaper._r_idx, a_epaper._r_idx + l);

            // Update the bounding box
            self.set_location(x,y);
            self.set_size(w, h);

            // Activate the tooltip
            self._input_box.set_tooltip_hint(x, y, w, h, t.toUpperCase());
            self._input_box.show_tooltip();
            self._input_box.paint();
          }
        }
    );
  };

  /**
   * @brief Handle mouse over event
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperServertipHelper.prototype.mouse_over = function (a_x, a_y) {
    var mouse_over;

    if ( ! (this._state & EPaperWidget.IS_VISIBLE) ) {
      return;
    }

    if ( this._bb_x === undefined ) {
      if ( this._center_x === undefined                        ||
           Math.abs(this._center_x - a_x) > this._px_threshold ||
           Math.abs(this._center_y - a_y) > this._px_threshold ) {
        // ... (re)initialize the reference center and (re)start the timeout ...
        this.update_center(a_x, a_y);
      }
    } else {

      // if the mouse leaves the tip's reference BB hide the tooltip
      if ( a_x < this._bb_x || a_x > this._bb_x + this._bb_w || a_y < this._bb_y || a_y > this._bb_y + this._bb_h ) {
        this._input_box.hide_tooltip();
        this._bb_x = undefined;
        this.reset_timer();
      }
    }
    this._last_x = a_x;
    this._last_y = a_y;
  };

  /**
   * @brief Update the reference point for mouse overing
   *
   * @param a_x X coordinate of the new reference center
   * @param a_x Y coordinate of the new reference center
   */
  EPaperServertipHelper.prototype.update_center = function (a_x, a_y) {

    this._center_x   = a_x;
    this._center_y   = a_y;

    if ( window[this._timer_key] !== undefined ) {
      window.clearTimeout(window[this._timer_key]);
      window[this._timer_key] = undefined;
    }
    window[this._timer_key] = setInterval(this.create_onover_timer_handler(this), this._min_overing_time);
  };

  /**
   * @brief Resets the mouse over control timer
   */
  EPaperServertipHelper.prototype.reset_timer = function () {

    if ( window[this._timer_key] !== undefined ) {
      window.clearTimeout(window[this._timer_key]);
      window[this._timer_key] = undefined;
    }
  };

  /**
   * @brief Create the handler for the mouse over time-out
   *
   * @param a_self The tooltip helper instance
   * @return the handler function
   */
  EPaperServertipHelper.prototype.create_onover_timer_handler = function (a_self) {
    return function () {

      if ( Math.abs(a_self._center_x - a_self._last_x) <= a_self._px_threshold &&
           Math.abs(a_self._center_y - a_self._last_y) <= a_self._px_threshold ) {
        if ( a_self._input_box.enable_toolip()) {
          a_self.get_hint(a_self._center_x, a_self._center_y);
        }
        a_self.reset_timer();
      } else {
        a_self.update_center(a_self._last_x, a_self._last_y);
      }
    };
  };

  /**
   * @brief Handle mouse click event
   *
   * @param a_x horizontal coordinate of the mouse event (relative to canvas)
   * @param a_y vertical coordinate of the mouse event (relative to canvas)
   * @param a_down true for mouse down, false for mouse up
   *
   * @return false this widget never consumes the click
   */
  EPaperServertipHelper.prototype.mouse_click = function (a_x, a_y, a_down) {
    return false;
  }

  /**
   * @brief Update background function is a no-op the component is transparent
   */
  EPaperServertipHelper.prototype.update_background = function () {
    // empty This component is always transparent
  };

  /**
   * @brief Paint function is a no-op the component is transparent
   */
  EPaperServertipHelper.prototype.paint = function () {
    // empty This component is always transparent
  };

}