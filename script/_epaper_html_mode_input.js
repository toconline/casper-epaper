/*-------------------------------------------------------------------------*
 * Copyright (c) 2010-2016 Neto Ranito & Seabra LDA. All rights reserved.
 *
 * This file is part of casper.
 *
 * casper is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * casper  is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with casper.  If not, see <http://www.gnu.org/licenses/>.
 *-------------------------------------------------------------------------*/
"use strict";

function EPaperInputHtmlMode_Initialize (a_root) {

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  a_root.EPaperInput.prototype.on_key_down_html_mode = function (a_key) {

    if ( this._initial_selection === true ) {
      if ( a_key === 'left' || a_key === 'right' || a_key === 'up' || a_key === 'down' ) {

        this._epaper.send_command('set key "focus_' + a_key + '";');
        return true; //consume key

      } else if ( a_key === 'enter' || a_key === 'F2' ) {

        this._initial_selection = false;
        this.reset_selection();
        this._cursor_pos = this._display_value.length;
        this.activate_html_input();
        this._cursor_enabled = true;
        return false;  // do not consume the key to keep HTML editor active

      } else if ( a_key === 'backspace' || a_key === 'delete' ||
                 ! (a_key === 'ctrl'        || a_key === 'alt'         || a_key === 'shift'     ||
                    a_key === 'enter'       || a_key === 'tab'         || a_key === 'shift+tab' ||
                    a_key === 'window+left' || a_key === 'window+right') ) {

        this._initial_selection = false;
        this._value = this._display_value = '';
        this.reset_selection();
        this._cursor_pos = 0;
        this.activate_html_input();
        this._cursor_enabled = true;
        return false;  // do not consume the key to keep HTML editor active

      }
    }

    if ( a_key === 'enter' || a_key === 'tab' || a_key === 'shift+tab' ) {

      this._html_input.blur();
      this._epaper._canvas.focus();
      if ( a_key == 'shift+tab' ) {
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true; set key "shift"+"tab";');
      } else {
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true; set key "' + a_key + '";');
      }
      return true;  // consume the key

    }
    return false; // not consumed
  };

  /**
   * @brief Handler for key presses
   *
   * @param a_character The character typed
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_press_html_mode = function (a_character) {
    var filtered;

    if ( this._valid_chars !== undefined &&
         this._valid_chars.indexOf(String.fromCharCode(a_character)) === -1 ) {
      filtered = true;
    } else {
      filtered = false;
    }

    if ( filtered === false ) {
      this.on_key_press(a_character);
    }
    this._initial_selection = false;
    this.cursor_on();
    this._html_input.focus();
    this._epaper._canvas.blur();
    return true;
  };

  /**
   * @brief Start the text editor
   *
   * @param a_text_left    Starting point of left aligned text
   * @param a_baseline     Vertical baseline of the first text line
   * @param a_max_width    Maximum width of the text
   * @param a_id           Initial text to display, in this mode it's an ID
   *
   * @note This must be preceded by a prepare_editor to define the bounding box
   */
  EPaperInput.prototype.start_editor_html_mode = function (a_text_left, a_baseline, a_max_width, a_id) {

    this.start_editor(a_text_left, a_baseline, a_max_width, a_id, true);
    if ( this._html_input === undefined ) {
      this.create_html_input();
    }
    this.activate_html_input();
    this.paint();
  };

  /**
   * @brief Finish the text edition
   */
  EPaperInput.prototype.stop_editor_html_mode = function () {
    this._html_input.value = '';
    this._html_input.blur();
    this._epaper._canvas.focus();
    this.stop_editor();
  };

  /**
   * @brief Handle a mouse down event inside the combobox
   *
   * Shows the combo list if it's not visible
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperInput.prototype.on_mouse_down_handler_html_mode = function (a_x, a_y) {
    var rv;

    rv = this.on_mouse_down_handler_normal_mode(a_x, a_y);

    if ( !(a_x < this._bb_x || a_x > (this._bb_x + this._bb_w) || a_y < this._bb_y || a_y > (this._bb_y + this._bb_h)) ) {
      this.activate_html_input();
      this._prevent_event_default = true;
    }
    return rv;
  };

  EPaperInput.prototype.create_html_onkeydown_handler = function (a_input) {
    return function (a_event) {

      var vkey = EPaper.keycode_to_vkey(a_event);

      if ( a_input._on_key_down_handler(vkey) === true ) {

        a_input._html_input.blur();
        a_input._epaper._canvas.focus();
        a_event.preventDefault();
        return;
      }
      a_input.update_from_html();
    };
  };

  EPaperInput.prototype.create_html_onkeypress_handler = function (a_input) {
    return function (a_event) {

      var unicode_char = a_event.which || a_event.keyCode;

      if ( a_input._valid_chars !== undefined ) {
        if ( a_input._valid_chars.indexOf(String.fromCharCode(unicode_char)) === -1 ) {
          a_event.preventDefault();
        }
      }
    };
  };

  EPaperInput.prototype.create_html_onkeyup_handler = function (a_input) {
    return function (a_event) {

      a_input.update_from_html();
    };
  };

  /**
   * @brief Copies text and selection from canvas to the HTML input box, transfers focus to the HTML input
   */
  EPaperInput.prototype.activate_html_input = function () {

    this._html_input.value = this._display_value;
    if ( this._initial_selection === true ) {
      this.set_selection(0, this._display_value.length);
      this._html_input.selectionStart = 0;
      this._html_input.selectionEnd   = this._display_value.length;
      this.cursor_off();
    } else {
      this._html_input.selectionStart = this._cursor_pos;
      this._html_input.selectionEnd   = this._cursor_pos;
    }
    this._html_input.selectionDirection = 'none';
    this._epaper._canvas.blur();
    this._html_input.focus();
  };

  // TODO change set selection to match the HTML definition

  EPaperInput.prototype.update_from_html = function () {

    this._display_value = this._value = this._html_input.value;
    if ( this._html_input.selectionDirection === 'none' ) {

      if ( this._html_input.selectionEnd != this._html_input.selectionStart ) {
        this.set_selection(this._html_input.selectionStart, this._html_input.selectionEnd);
      } else {
        this.reset_selection();
      }
      this._cursor_pos = this._html_input.selectionStart;

    } else if ( this._html_input.selectionDirection === 'forward' ) {

      this.set_selection(this._html_input.selectionStart, this._html_input.selectionEnd);
      this._cursor_pos = this._html_input.selectionEnd;

    } else {

      this.set_selection(this._html_input.selectionStart, this._html_input.selectionEnd);
      this._cursor_pos = this._html_input.selectionStart;

    }
    this.restart_cursor();
    this.paint();
  };

  EPaperInput.prototype.on_focus_html_mode = function () {
    if ( this._initial_selection === false && this._enabled === true ) {
      this._epaper._canvas.blur();
      this._html_input.focus();
    } else {
      this._html_input.blur();
      this._epaper._canvas.focus();
    }
  };

  EPaperInput.prototype.on_blur_html_mode = function () {

  };

  EPaperInput.prototype.create_html_onfocus_handler = function (a_input) {
    return function () {
      a_input._is_focused = true;
      a_input._epaper.repaint_page();
      a_input._epaper._canvas.contentEditable = false;
      console.log('+++ HTML input focused');
    }
  };

  EPaperInput.prototype.create_html_onblur_handler = function (a_input) {
    return function () {
      a_input._is_focused = false;
      a_input._epaper.repaint_page();
      a_input._epaper._canvas.contentEditable = true;

      console.log('--- HTML input lost focus');
    }
  };

  EPaperInput.prototype.create_html_onpaste_handler = function (a_input) {
    return function (a_event) {
      if ( a_input._mode !== EPaperInput.CLIENT_COMBO_MODE ) {
        a_input._initial_selection = false;
        a_input._cursor_enabled = true;
        a_input.update_from_html();
      }
      console.log("Paste on HTML");
    };
  };

  EPaperInput.prototype.paste_from_canvas = function (a_event) {

    if ( this._enabled === true && this._mode !== EPaperInput.CLIENT_COMBO_MODE ) {
      if ( this._initial_selection === true ) {
        this._cursor_enabled = true;
        this._value = this._display_value = a_event.clipboardData.getData('text/plain');
        this.reset_selection();
        this._cursor_pos = this._display_value.length;
      } else {
        this.write_text(a_event.clipboardData.getData('text/plain'));
      }
      this.activate_html_input();
      a_event.preventDefault();
    }
  };

  /**
   * @brief Create the Hidden HTML input DOM element
   */
  EPaperInput.prototype.create_html_input = function () {

    this._html_input      = document.createElement('input');
    this._html_input.type = 'text';

    this._html_input.style.position      = 'absolute';
    this._html_input.style.opacity       =  0.0;
    this._html_input.style.pointerEvents = 'none';
    this._html_input.style.left          = '10px';
    this._html_input.style.top           = '10px';
    this._html_input.style.width         = '300px';
    this._html_input.style.height        = '20px';
    this._html_input.style.zIndex        = 0;
    this._html_input.style['text-indent'] = '-9999em';

    this._html_input.addEventListener('keydown' , this.create_html_onkeydown_handler(this));
    this._html_input.addEventListener('keypress', this.create_html_onkeypress_handler(this));
    this._html_input.addEventListener('keyup'   , this.create_html_onkeyup_handler(this));
    this._html_input.addEventListener('focus'   , this.create_html_onfocus_handler(this));
    this._html_input.addEventListener('blur'    , this.create_html_onblur_handler(this));
    this._html_input.addEventListener('paste'   , this.create_html_onpaste_handler(this));

    document.body.appendChild(this._html_input);
  };

}