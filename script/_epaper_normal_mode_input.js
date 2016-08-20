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

function EPaperInputNormalMode_Initialize (a_root) {

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  a_root.EPaperInput.prototype.on_key_down_normal_mode = function (a_key) {

    if ( this._initial_selection === true ) {
      if ( a_key === 'left' || a_key === 'right' || a_key === 'up' || a_key === 'down' ) {

        this._epaper.send_command('set key "focus_' + a_key + '";');
        return true; //consume key

      } else if ( a_key === 'enter' || a_key === 'F2' ) {

        this._initial_selection = false;
        this.reset_selection();
        this._cursor_pos = this._display_value.length;
        this.cursor_on();
        return true;  // consume the key

      }
    }
    return this.on_key_down(a_key);
  };

  /**
   * @brief Handler for key presses
   *
   * @param a_character The character typed
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_press_normal_mode = function (a_character) {
    this._initial_selection = false;
    return this.on_key_press(a_character);
  };

  /**
   * @brief Handle a mouse down event inside the input box
   *
   * If the click is inside the box sets the cursor postions inside the text and clears the initial selection
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_down_handler_normal_mode = function (a_x, a_y) {
    if ( a_x < this._bb_x || a_x > (this._bb_x + this._bb_w) || a_y < this._bb_y || a_y > (this._bb_y + this._bb_h) ) {

      return false;

    } else {

      this._epaper.set_cursor(this._cursor_type);
      this.set_cursor_pos_with_mouse(a_x);
      if ( this._initial_selection === true ) {
        this._initial_selection = false;
        this.reset_selection();
        this.cursor_on();
        return true;
      } else {
        this.cursor_on();
      }
      return false;
    }
  };

  /**
   * @brief Handle a mouse down event inside the input box
   *
   * If the click is outside the input box commit the current value to the server
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */

  EPaperInput.prototype.on_mouse_up_handler_normal_mode =  function (a_x, a_y) {
    if ( a_x < this._bb_x || a_x > (this._bb_x + this._bb_w) || a_y < this._bb_y || a_y > (this._bb_y + this._bb_h) ) {
      this.commit_value_to_server();
      return false;
    } else {
      return true;
    }
  };

  /**
   * @brief Given the x coordinate of mouse click find the best match to place the cursor
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   */
  EPaperInput.prototype.set_cursor_pos_with_mouse = function (a_x) {
    var min, mid, max, relative_x, delta, best_delta, delta, len, idx, font;

    font = this._ctx.font;
    this._ctx.font = this._font;

    relative_x = a_x - this._text_x;
    min        = 0.0;
    max        = this._display_value.length;
    delta      = Number.MAX_VALUE;
    best_delta = Number.MAX_VALUE;
    idx        = undefined;

    while ( min <= max ) {
      mid = Math.floor((min + max) / 2.0);


      len   = this._ctx.measureText(this._display_value.substring(0,mid)).width;
      delta = Math.abs(relative_x - len);

      if ( delta <= best_delta ) {
        best_delta = delta;
        idx = mid;
      }
      if ( len == relative_x ) {
        break;
      } else if ( relative_x > len ) {
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }
    if ( idx != undefined ) {
      this._cursor_pos = idx;
    }
    this._ctx.font = font;

  };

  /**
   * @brief Handle mouse over event
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_over_handler_normal_mode = function (a_x, a_y) {

    if ( this._enabled &&
         a_x > this._bb_x && a_x < this._bb_x + this._bb_w &&
         a_y > this._bb_y && a_y < this._bb_y + this._bb_h ) {
      this._epaper.set_cursor(this._cursor_type);
      return true;
    } else {
      return false;
    }
  };

  /**
   * @brief Draws selection background
   */
  EPaperInput.prototype.draw_selection_background = function () {
    if ( this._epaper.is_focused() ) {
      if ( this._selection_px_length !== 0 ) {
        this._ctx.fillStyle = this._selection_background;
        this._ctx.fillRect(this._selection_px_start + this._text_x, this._baseline + this._f_top, this._selection_px_length, this._f_bottom - this._f_top);
      }
    }
  };

  /**
   * @brief Default Paint method for input box
   */
  EPaperInput.prototype.paint_normal_mode = function () {

    // ... update the cursor location ...
    var up2cursor_length = this._ctx.measureText((this._display_value || '').substring(0, this._cursor_pos)).width;
    this._cursor_x = this._text_x + up2cursor_length;

    // ... and check if it's still visible , if not handle "page" scrolling ...
    if ( this._cursor_x < this._left_x || this._cursor_x > this._left_x + this._max_width ) {

      if ( up2cursor_length < this._max_width ) { // ... on first page align to left ...

        this._text_x   = this._left_x;
        this._cursor_x = this._left_x + up2cursor_length;

      } else {
        var total_length = this._ctx.measureText(this._display_value).width;

        if ( (total_length - up2cursor_length) < this._max_width ) { // ... on last page align to right ...

          this._text_x   = this._left_x + this._max_width - total_length;
          this._cursor_x = this._text_t + up2cursor_length;

        } else { // ... center cursor in middle of box ...

          this._cursor_x = this._left_x + this._max_width / 2;
          this._text_x   = this._cursor_x - up2cursor_length;

        }
      }
    }

    // ... apply clipping to draw truncated scrolled text ...
    this._ctx.save();
    this._ctx.beginPath();
    this._ctx.rect(this._bb_x, this._bb_y, this._bb_w, this._bb_h);
    this._ctx.clip();

    this.draw_selection_background();

    // ... Draw text and remove clipping box ...
    this._ctx.fillStyle = this._epaper._text_color;
    this._ctx.fillText(this._display_value || '', this._text_x, this._baseline);
    this._font = this._ctx.font;
    this._ctx.restore();
  };

}