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

function EPaperInputRadioButtonMode_Initialize (a_root) {

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  a_root.EPaperInput.prototype.on_key_down_radio_button_mode = function (a_key) {

    if ( a_key === 'left' || a_key === 'right' || a_key === 'up' || a_key === 'down' ) {
      /* focus keys */
      this._epaper.send_command('set key "focus_' + a_key + '";');
    } else if ( a_key === 'tab' || a_key === 'shift+tab' ) {
      /* focus keys */
      if ( a_key == 'shift+tab' ) {
        this._epaper.send_command('set key "shift"+"tab";');
      } else {
        this._epaper.send_command('set key "' + a_key + '";');
      }
    } else if ( a_key === ' ' ) {
      /* toggle key */
      this._epaper.send_command('set key "toggle";');
    }
    return true;  // consume the key
  };

  /**
   * @brief Handler for key presses
   *
   * @param a_character The character typed
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_press_radio_button_mode = function (a_character) {
    return true;
  };

  /**
   * @brief Handle a mouse down event inside the combobox
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_down_handler_radio_button_mode = function (a_x, a_y) {
    return false;
  };

  /**
   * @brief Handle a mouse down event inside the combobox
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_up_handler_radio_button_mode = function (a_x, a_y) {
    return false;
  };

  /**
   * @brief Handle mouse over event
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_over_handler_radio_button_mode = function (a_x, a_y) {

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
   * @brief Default Paint method for input box
   */
  EPaperInput.prototype.paint_radio_button_mode = function () {

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