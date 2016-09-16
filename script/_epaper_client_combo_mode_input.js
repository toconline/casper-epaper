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

function EPaperInputClientComboMode_Initialize (a_root) {

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  a_root.EPaperInput.prototype.on_key_down_client_combo_mode = function (a_key) {

    if ( this._initial_selection === true ) {

      if ( a_key === 'enter' ) {
        if ( this._edit_subdocument_button.is_visible() ) {
          this._epaper.on_edit_subdocument(this._edit_subdocument_button);
        }
      } else if ( a_key === 'delete' || a_key === 'backspace' ) {
        this.clear_list_item();
      } else if ( a_key === 'left' || a_key === 'right' || a_key === 'up' || a_key === 'down' ) {
        this._epaper.send_command('set key "focus_' + a_key + '";');
      } else if ( a_key === 'tab' ) {
        this._epaper.send_command('set key "' + a_key + '";')
      } else if ( a_key === 'shift+tab' ) {
        this._epaper.send_command('set key "shift"+"tab";');
      }
      return true; // consume key
    }

    if ( a_key === 'esc' || a_key === 'shift+up' ) {

      if ( this._combo_box_list.isVisible() ) {
        this._combo_box_list.setVisible(false);
      }

    } else if ( a_key === 'shift+down' || a_key === 'alt' ) {

      if ( this._combo_box_list.isVisible() === false ) {
        this.toggle_combo_list()
      }

    } else if ( a_key === 'enter' || a_key === 'tab' || a_key === 'shift+tab' ) {

      /*this.commit_value_client_combo_mode();
      if ( ! (a_key === 'enter' && this._epaper._sub_document_uri !== undefined) ) {
        if ( a_key === 'shift+tab' ) {
          this._epaper.send_command('set key "shift"+"tab";');
        } else {
          this._epaper.send_command('set key "' + a_key + '";');
        }
      }*/

    } else if ( a_key === 'up' || a_key === 'down') {

      if ( this._combo_box_list.isVisible() || this._value .length ) {
        //this._combo_box_list.on_key_down(a_key);
        this._epaper.send_command('set key "' + a_key + '";');
      } else {
        this._epaper.send_command('set key "focus_' + a_key + '";');
      }

    } else if ( a_key === 'left' || a_key === 'right' ) {

      /*if ( this.commit_value_client_combo_mode(a_key) === false ) {
        this._epaper.send_command('set key "focus_' + a_key + '";');
      }*/

    } else {

      // ... pass the key down to update the value and then filter the list ...
      this.on_key_down(a_key);
      //this._combo_box_list.filter_model(this._value);
      this.layout_combo_list();

    }

    this.update_tooltip_client_combo();

    // ... update ui state ...
    if ( a_key !== 'esc' ) {
      this._display_value = this._combo_box_list.get_selected_text();
    }
    this.set_highlight(this._value);
    if ( this._value.length ) {
      this.cursor_on();
    } else {
      this.paint();
    }
    return true;
  };

  /**
   * @brief Handler for key presses
   *
   * @param a_character The character typed
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_press_client_combo_mode = function (a_character) {

    // ... If a nullable list can only be cleared with delete , backspace or a click ...
    if ( this._clear_combo_button.is_visible() ) {
      return true;
    }

    // ... pass key to default handler to update the value, then re-apply the filter
    this.on_key_press(a_character);
    this._combo_box_list.filter_model(this._value);
    if ( this._combo_box_list._lines.length === 0 ) {
      // ... If the list became empty reject the update, this ensures elements are always visible ...
      this.erase_text(this._cursor_pos - 1, this._cursor_pos - 1);
      this._cursor_pos -= 1;
      this._combo_box_list.filter_model(this._value);
    }
    this.layout_combo_list();
    this.update_tooltip_client_combo();

    // ... update ui state ...
    this._display_value = this._combo_box_list.get_selected_text();
    if ( this._display_value !== undefined ) {
      this.set_highlight(this._value);
    }
    if ( this._value.length ) {
      this.cursor_on();
    } else {
      this.paint();
    }
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
  EPaperInput.prototype.start_editor_client_combo_mode = function (a_text_left, a_baseline, a_max_width, a_id) {

    this.start_editor(a_text_left, a_baseline, a_max_width, a_id, true);
    this._combo_box_list.selectByIndex(a_id);

    if ( (this._options & (EPaperInput.NULLABLE_LIST | EPaperInput.SUB_DOCUMENT_VISIBLE)) && a_id.length ) {
      this._clear_combo_button.set_visible(true);
      this._open_combo_button.set_visible(false);
    } else {
      this._clear_combo_button.set_visible(false);
      this._open_combo_button.set_visible(true);
    }

    if ( (this._options & EPaperInput.SUB_DOCUMENT_VISIBLE) && a_id.length ) {
      this._edit_subdocument_button.set_visible(true);
    } else {
      this._edit_subdocument_button.set_visible(false);
    }

    this._epaper.set_cursor(this._cursor_type);
    this._value = '';
    //this._display_value = this._combo_box_list.get_selected_text();

    if ( this._display_value.length &&  (this._options & (EPaperInput.NULLABLE_LIST | EPaperInput.SUB_DOCUMENT_VISIBLE)) ) {
      this.set_selection(0, this._display_value.length);
      this._initial_selection = true;
    }

    this.paint();

    //this._combo_box_list._click_handler = function (a_combo_list) {
    //
    //  a_combo_list._epaper.send_command('set list item "' + a_combo_list.get_selected_id() + '";');
    //  a_combo_list._epaper.send_command('set key "save";');
    //  a_combo_list.set_visible(false);
    //};
  };

  /**
   * @brief Update the text displayed by the editor
   *
   * @param a_text the text to display
   * @param a_highlight an array of words to highlight
   * @param a_hint the text hint to display
   */
  EPaperInput.prototype.update_editor_client_combo_mode = function (a_text, a_highlight, a_hint) {
    /* server updates are not expected in this mode and will be ignored */
  };

  /**
   * @brief Finish the text edition
   *
   */
  EPaperInput.prototype.stop_editor_client_combo_mode = function () {
    this._combo_box_list.setVisible(false);
    this._tooltip.set_visible(false);
    this._combo_box_list._click_handler = undefined;
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
  EPaperInput.prototype.on_mouse_down_handler_client_combo_mode = function (a_x, a_y) {

    if ( a_x < this._bb_x || a_x > (this._bb_x + this._bb_w) || a_y < this._bb_y || a_y > (this._bb_y + this._bb_h) ) {
      return false;
    } else {

      if ( this._clear_combo_button.is_visible() === false ) {
        if ( this._combo_box_list.isVisible() === false ) {
          this.toggle_combo_list();
          return true;
        }
      }
      return false;
    }
  };

  /**
   * @brief If the combo value is changed update value on server and move focus if needed
   *
   * @param a_key the key that is provoking the update
   * @return @li true server value updated
   *         @li false server value not changed
   */
  EPaperInput.prototype.commit_value_client_combo_mode = function (a_key) {
    var selected_id;

    selected_id = this._combo_box_list.get_selected_id();

    if ( selected_id !== this._combo_box_list.get_initial_id() &&
         selected_id !== undefined &&
         this._display_value.length ) {

      this._epaper.send_command('set list item "' + selected_id + '";');
      this._combo_box_list.setVisible(false);

      if ( a_key === 'right' ) {
        this._epaper.send_command('set key "tab";');
      } else if ( a_key === 'left' ) {
        this._epaper.send_command('set key "shift"+"tab";');
      }
      return true;

    }
    return false;
  };

  /**
   * @brief Nullable list also updates the tooltip
   */
  EPaperInput.prototype.update_tooltip_client_combo = function () {
    if ( this._combo_box_list.isVisible() === false && (this._options & EPaperInput.NULLABLE_LIST) ) {
      var hint = this._combo_box_list.get_selected_field(1);

      if ( hint === undefined || hint.length === 0 ) {
        this.hide_tooltip();
      } else {
        this.set_tooltip_hint(this._bb_x, this._bb_y, this._bb_w, this._bb_h, this._combo_box_list.get_selected_field(1).toUpperCase());
      }
    }
  };

  /**
   * @brief Paint method for tree mode
   */
  EPaperInput.prototype.paint_client_combo_mode = function () {

    var len = (this._highlights == null) ? 0 : this._highlights.length;

    // ... update the cursor location ...
    if ( len === 0 ) {

      this._cursor_x = this._left_x;
      this._text_x   = this._left_x;

    } else {
      var up2cursor_length = this._ctx.measureText(this._display_value.substring(0, this._highlight_cursor)).width;

      // ... and check if it's still visible in the first 3/4 of the input control ...
      if ( up2cursor_length > this._max_width * 0.75 ) {
        this._cursor_x = this._left_x + this._max_width * 0.75;
        this._text_x   = this._cursor_x - up2cursor_length;
      } else {
        this._cursor_x = this._left_x + up2cursor_length;
        this._text_x = this._left_x;
      }
    }

    this._ctx.save();
    this._ctx.beginPath();
    this._ctx.rect(this._bb_x, this._bb_y, this._bb_w - this._open_combo_button._bb_w / 2.0, this._bb_h);
    this._ctx.clip();

    // ... draw the highlight boxes behind the text ...
    len = this._highlight_starts.length;
    if ( len !== 0 ) {
      this._ctx.beginPath();
      for ( var i = 0; i < len; i++ ) {
        this._ctx.rect(this._highlight_starts[i] + this._text_x, this._baseline + this._f_top, this._highlight_lenghts[i], this._f_bottom - this._f_top);
      }
      this._ctx.fillStyle = this._highlight_background;
      this._ctx.closePath();
      this._ctx.fill();
    }

    this.draw_selection_background();

    // ... Draw text and remove clipping box ...
    this._ctx.fillStyle = this._epaper._text_color;
    this._ctx.fillText(this._display_value || '', this._text_x, this._baseline);
    this._font = this._ctx.font;
    this._ctx.restore();
  };

}