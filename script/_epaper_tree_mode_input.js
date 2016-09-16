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

function EPaperInputTreeMode_Initialize (a_root) {

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
  EPaperInput.prototype.start_editor_tree_mode = function (a_text_left, a_baseline, a_max_width, a_id) {

    this.start_editor(a_text_left, a_baseline, a_max_width, a_id, true);
    this._value = a_id;
    this.set_selection(0, this._value.length);
    this._display_value = this._value;
    this._leaf_ids = {};
    this._epaper.set_cursor(this._cursor_type);
    this._search_str = '';
    this._search_on  = false;

    this._combo_box_list._click_handler = function (a_combo_list) {
      a_combo_list._epaper._input_box.set_value_from_list_tree_mode();
    };
    this.paint();
  };

  EPaperInput.prototype.set_value_from_list_tree_mode = function () {

      var val = this._combo_box_list.get_selected_id() || this._value;

      this._value = this._display_value = val;
      this._cursor_pos = this._value.length;
      this.reset_selection();
      this.set_or_update_account();
  };

  /**
   * @brief Update the text displayed by the editor
   *
   * @param a_text the text to display
   * @param a_highlight an array of words to highlight
   * @param a_hint the text hint to display
   */
  EPaperInput.prototype.update_editor_tree_mode = function (a_text, a_highlight, a_hint) {
    var first_id, len, i;

    this.hide_tooltip();
    this._search_str = '';
    if ( this._combo_box_list.get_size() ) {

      this._search_on  = true;

      first_id = this._combo_box_list._model[0].id;
      if ( first_id !== undefined ) {

        if ( first_id.indexOf(this._value) === 0 && this._value.length < first_id.length) {
          this._display_value = first_id;
          this.set_selection(this._value.length, first_id.length);
          this._value = first_id;
          this._combo_box_list.select_index(first_id);
          if ( this._combo_box_list.is_visible() === false ) {
            this.set_tooltip_hint(this._bb_x, this._bb_y, this._bb_w, this._bb_h, this._combo_box_list.get_selected_field(1).toUpperCase());
          }
        }
      }

      // ... find all ids that are terminals ...
      len = this._combo_box_list._model.length;
      for ( i = 0; i < len; ++i ) {
        if ( this._combo_box_list._model[i].is_integrator === 'false' ) {
          this._leaf_ids[this._combo_box_list._model[i].id] = true;
        }
      }
    } else {
      this._search_on  = false;
    }
    this.paint();
  };

  /**
   * @brief Finish the text edition
   */
  EPaperInput.prototype.stop_editor_tree_mode = function () {

    this._leaf_ids = {};
    this._combo_box_list.setVisible(false);
    this.show_tooltip();              // cancels interval
    this._tooltip.set_visible(false); // hides rite away
    this._combo_box_list._click_handler = undefined;
    this.stop_editor();
  };

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is not consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_down_tree_mode = function (a_key) {

    this.hide_tooltip();

    // ... pass focus to server if are still in initial selection
    if ( this._initial_selection === true ) {

      if ( a_key === 'left' || a_key === 'right' || a_key === 'up' || a_key === 'down' ) {

        this._epaper.send_command('set key "focus_' + a_key + '";');
        return true; //consume key

      } else if ( a_key === 'enter' || a_key === 'F2' ) {

        this._initial_selection = false;
        this.reset_selection();
        this._cursor_pos = this._display_value.length;
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
        this.cursor_on();
        return true;  // consume the key
      }
    }

    if ( a_key === 'up' || a_key === 'down') {

      if ( this._combo_box_list.get_size() ) {
        this._combo_box_list.on_key_down(a_key);
        if ( this._combo_box_list.is_visible() === false ) {

          var selected_id = this._combo_box_list.get_selected_id();
          if ( selected_id != undefined ) {
            this._value = this._display_value = selected_id;
            this.set_selection(this._selection_chr_start, this._display_value);
            this.set_tooltip_hint(this._bb_x, this._bb_y, this._bb_w, this._bb_h, this._combo_box_list.get_selected_field(1).toUpperCase());
          }
        }
        // ... update ui state ...
        this._value = this._display_value = this._combo_box_list.get_selected_id();
        if ( this._value.length ) {
          this.cursor_on();
        } else {
          this.paint();
        }
      }

      return true; // consume key

    } else if ( a_key === ' ') {

      return true; // consume key

    } else if ( a_key === 'right' ) {

      if ( this._selection_chr_start !== 0 || this._selection_chr_end !== 0 || this._leaf_ids[this._value] != undefined) {
        this.reset_selection();
        this._cursor_pos = this._value.length;
        this.set_or_update_account();
        return true; // consume key
      }

    } else if ( a_key === 'delete' || a_key === 'backspace' ) {

      if ( this._search_str.length ) {
        this._search_str = this._search_str.substring(0, this._search_str.length - 1);
        this._combo_box_list.filter_model(this._search_str);
        this.layout_combo_list();
        return true;
      }
      if ( this._selection_chr_start !== 0 || this._selection_chr_end !== 0 ) {
        this._value = this._value.substring(0, this._selection_chr_start);
        this.reset_selection();
      }
      this.on_key_down(a_key);
      this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
      this.paint();
      return true; // consume key

    } else if ( a_key === 'enter' ) {

      this.set_value_from_list_tree_mode();
      return true; // consume key

    } else if ( a_key === 'left' ) {

      // TODO Will try to go up in ledger
      return true; // consume key

    } else if ( a_key === 'alt' || a_key === 'shift+down' ) {

      if ( this._combo_box_list.is_visible() === false ) {
        this.toggle_combo_list()
      }

    } else if ( a_key === 'esc' ) {

      if ( this._combo_box_list.is_visible() ) {
        this.toggle_combo_list()
      }

    }
    return this.on_key_down(a_key);
  };

  /**
   * @brief Handler for normal keys
   *
   * @param a_character The key pressed
   *
   * @return @li true if key is not consumed
   *         @li false if the key is not consumed
   */
  EPaperInput.prototype.on_key_press_tree_mode = function (a_character) {

    this._initial_selection = false;
    if ( '0123456789'.indexOf(a_character) != -1 ) {
      this.write_text(a_character);
      this._cursor_pos = this._value.length;
      this.restart_cursor();
      this._hint      = '';
      this.paint();
      this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
      this.hide_tooltip();
    } else {

      if ( this._search_on ) {
        this._combo_box_list.filter_model(this._search_str + a_character);
        if ( this._combo_box_list._lines.length === 0 ) {
          this._combo_box_list.filter_model(this._search_str);
        } else {
          this._search_str += a_character;
          this._value = this._display_value = this._combo_box_list.get_selected_id();
        }
        if ( this._combo_box_list.is_visible() == false ) {
         this._combo_box_list.set_visible(true);
         this._tooltip.set_visible(false);
        }
        this.layout_combo_list();
        if ( this._value.length ) {
          this.cursor_on();
        } else {
          this.paint();
        }
      }
       // TODO open search component

    }
    return true; // Consume key
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
  EPaperInput.prototype.on_mouse_down_handler_tree_mode = function (a_x, a_y) {

    if ( a_x < this._bb_x || a_x > (this._bb_x + this._bb_w) || a_y < this._bb_y || a_y > (this._bb_y + this._bb_h) ) {
      return false;
    } else {
      this._epaper.set_cursor(this._cursor_type);
      if ( this._initial_selection === true ) {
        this._initial_selection = false;
        this.reset_selection();
        this._cursor_pos = this._value.length;
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
        this.cursor_on();
        return true;
      } else {
        return false;
      }
    }
  };

  /**
   * @brief Called when a right or enter key pressed, if the id is a known leaf set the value
   * otherwise just update
   *
   * Uses the map of leaf id's collected in the last update editor
   */
  EPaperInput.prototype.set_or_update_account = function () {

    if ( this._leaf_ids[this._value] !== undefined ) {
      this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true; set key "enter";');
    } else {
      this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
      this.paint();
    }
  };

}