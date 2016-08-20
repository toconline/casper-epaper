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

// http://www.w3schools.com/html/html_form_input_types.asp
// http://marijnhaverbeke.nl/blog/browser-input-reading.html - very complex project ...
// https://disqus.com/home/discussion/goldfire/canvasinput_html5_canvas_text_input/

function EPaperInput_Initialize (a_root) {

  /**
   * @brief Input box constructor
   *
   * @param e_epaper Parent EPaper object
   */
  a_root.EPaperInput = function (a_epaper) {

    this._epaper      = a_epaper;
    this._ctx         = a_epaper._ctx;

    // ... one off initialization of attributes not reset by init() ...
    this._options     = 0x0000;
    this._is_focused  = false;
    this._mode        = EPaperInput.NORMAL_MODE;
    this._background  = undefined;
    this._font        = undefined;

    // ... initialize the handler pointers (handler changed when the editor mode is set) ...
    this._paint_handler         = undefined;
    this._start_editor_handler  = undefined;
    this._update_editor_handler = undefined;
    this._stop_editor_handler   = undefined;
    this._on_key_down_handler   = undefined;
    this._on_mouse_down_handler = undefined;
    this._on_mouse_over_handler = undefined;
    this._on_mouse_up_handler   = undefined;
    this._tooltip_handler       = undefined;
    this._on_focus_handler      = function () { };
    this._on_blur_handler       = function () { };
    this._prevent_event_default = false;

    // ... init cursor ...
    this._cursor_period  = 1.0;
    this._cursor_width   = 1.5;

    // ... color defaults ...
    this._highlight_background = "rgb(200,200,230)";
    this._selection_background = "rgb(200,230,200)";
    this._cursor_color         = "#009BB5";
    this.init();

    // ... init font metrics ...
    this._f_flags               = 0;
    this._f_top                 = 0.0;
    this._f_ascent              = 0.0;
    this._f_descent             = 0.0;
    this._f_bottom              = 0.0;
    this._f_leading             = 0.0;
    this._f_avg_char_width      = 0.0;
    this._f_max_char_width      = 0.0;
    this._f_underline_thickness = 0.0;
    this._f_underline_position  = 0.0;

    // ... create widgets ...
    this._tooltip                 = new EPaperTooltip(this._epaper);
    this._combo_box_list          = new EPaperComboBoxList(this._epaper);
    this._tooltip_helper          = new EPaperServertipHelper(this._epaper, this);
    this._open_combo_button       = new EPaperOverlayButton(this._epaper, EPaperOverlayButton.COMBO_OPEN,
                                                            function (a_src) { a_src._epaper._input_box.toggle_combo_list(); });
    this._clear_combo_button      = new EPaperOverlayButton(this._epaper, EPaperOverlayButton.COMBO_DELETE,
                                                            function (a_src) { a_src._epaper._input_box.clear_list_item(); });
    this._edit_subdocument_button = new EPaperOverlayButton(this._epaper, EPaperOverlayButton.COMBO_EDIT,
                                                            function (a_src) { a_src._epaper.on_edit_subdocument(a_src); });

    this._tooltip_helper.set_visible(false);

    // ... size the buttons ...
    var size = EPaper.BTN_SIZE * this._epaper._ratio;

    this._open_combo_button.set_size(size, size);
    this._clear_combo_button.set_size(size, size);
    this._edit_subdocument_button.set_size(size, size);

    // ... just in case clear the editor timer ...
    if ( window._epaper_cursor_timer !== undefined ) {
      window.clearTimeout(window._epaper_cursor_timer);
    }
  }

  // Static data
  EPaperInput.NORMAL_MODE          = 0x0000;
  /* TDB                           = 0x0001*/
  EPaperInput.COMBO_MODE           = 0x0002;
  EPaperInput.TREE_MODE            = 0x0003;
  EPaperInput.CLIENT_COMBO_MODE    = 0x0004;
  EPaperInput.MULTI_LINE           = 0x0010;
  EPaperInput.HIDE_CURSOR          = 0x0020;
  EPaperInput.NO_SCROLL            = 0x0040;
  EPaperInput.NO_CURSOR            = 0x0080;
  EPaperInput.DRAW_BOUNDS          = 0x0100;
  EPaperInput.SUB_DOCUMENT_VISIBLE = 0x0200;
  EPaperInput.OPEN_COMBO_VISIBLE   = 0x0400;
  EPaperInput.NULLABLE_LIST        = 0x0800;

  EPaperInput.prototype = {
    constructor: EPaperInput,

    /**
     * @brief Reset attributes to safe defaults, used by constructor and stop_editor
     */
    init: function () {
      // ... initialize bounding box ...
      this._bb_x = 0.0;
      this._bb_y = 0.0;
      this._bb_w = 0.0;
      this._bb_h = 0.0;
      this._bg_x = 0.0;
      this._bg_y = 0.0;
      this._bg_w = 0.0;
      this._bg_h = 0.0;

      // ... initialize selection and highlights vars to sane defaults ....
      this._value                = '';     //!< The current value being edited
      this._highlights           = [];     //!< Array of texts that are highlighted
      this._highlight_starts     = [];     //!< Array of pixel start of each highlight
      this._highlight_lenghts    = [];     //!< Length in pixel of the highlight backgrounds
      this._selection_chr_start  = 0;      //!< First selected character
      this._selection_chr_end    = 0;      //!< Last selected character
      this._selection_px_start   = 0;      //!< Where the selection background starts in pixels
      this._selection_px_length  = 0;      //!< Length of the selection background in pixels
      this._initial_selection    = false;  //!< True when the text was automatically highlighted when editing started

      this._highlight_cursor  = 0;
      this._hint              = '';
      this._enabled           = false;

      // ... text and backgrounds deserve tender care ...
      this._draw_string  = undefined;
      this._left_x       = 0;
      this._baseline     = 0;
      this._text_x       = 0;
      this._max_width    = 0;

      this._cursor_pos     = 0.0;
      this._cursor_enabled = true;
      this._cursor_visible = false;
      this._cursor_type    = '';
    },

    paint: function () {

      if ( this._enabled === false ) {
        this._epaper.repaint_widgets();
        return;
      }
      this._epaper.save_paint_context();
      this._ctx.save();
      this._epaper.apply_translation();
      this._epaper.hide_widgets();

      this.paint_input();

      this._epaper.update_widgets_background();
      this._epaper.repaint_widgets();

      this._ctx.restore();
      this._epaper.restore_paint_context();
    },

    /**
     * @brief Paints the text, selection and highlight area and the good old cursor
     */
    paint_input: function () {

      this._ctx.putImageData(this._background, this._bg_x, this._bg_y + this._epaper._translate_y);
      this._epaper.paint_string(this._draw_string);

      // ... debug only draw editor bounds ...
      if ( this._options & EPaperInput.DRAW_BOUNDS ) {
        this._ctx.strokeStyle = '#324889';
        this._ctx.lineWidth   = 0.5;
        this._ctx.beginPath();
        this._ctx.rect(this._bb_x, this._bb_y, this._bb_w, this._bb_h);
        this._ctx.closePath();
        this._ctx.stroke();
      }

      this._text_line_top = this._baseline - this._f_top;
      this._paint_handler();

      // ... Draw the default cursor, a single vertical line ...
      if ( this._epaper.is_focused() ) {
        if ( this._cursor_enabled === true && this._cursor_visible === true && (this._options & EPaperInput.HIDE_CURSOR) === 0 ) {
          this._ctx.lineWidth   = this._cursor_width;
          this._ctx.strokeStyle = this._cursor_color;
          this._ctx.beginPath();
          this._ctx.moveTo(this._cursor_x, this._baseline + this._f_bottom);
          this._ctx.lineTo(this._cursor_x, this._baseline + this._f_top);
          this._ctx.stroke();
        }
      }

    },

    /**
     * @brief Measure the text using the editor font
     *
     * Preserves the current context, this is intended to be called from outside the paint() function
     *
     * @param a_text the text to measure
     * @return length of text in px
     */
    measure_text: function (a_text) {
      var font = this._ctx.font;

      this._ctx.font = this._font;
      var len = this._ctx.measureText(a_text).width;

      this._ctx.font = font;
      return len;
    },

    /**
     * @brief Configure the editor
     *
     * @param a_mode The editor mode
     * @param a_sub_document_jrxml URL of the sub-document or undefined
     * @param a_nullable_list The combo box list can be nulled
     */
    configure_editor: function (a_mode, a_sub_document_jrxml, a_nullable_list) {
      this._options = 0;
      switch ( a_mode ) {
        case 'c':

          this._mode                  = EPaperInput.CLIENT_COMBO_MODE;
          if ( a_sub_document_jrxml !== undefined ) {
            this._options |= EPaperInput.SUB_DOCUMENT_VISIBLE;
          }
          this._start_editor_handler  = this.start_editor_client_combo_mode;
          this._paint_handler         = this.paint_client_combo_mode;
          this._update_editor_handler = this.update_editor_client_combo_mode;
          this._stop_editor_handler   = this.stop_editor_client_combo_mode;
          this._on_key_down_handler   = this.on_key_down_client_combo_mode;
          this._on_key_press_handler  = this.on_key_press_client_combo_mode;
          this._on_mouse_down_handler = this.on_mouse_down_handler_client_combo_mode;
          this._on_mouse_up_handler   = this.on_mouse_up_handler_normal_mode;
          this._on_mouse_over_handler = this.on_mouse_over_handler_normal_mode;;
          this._tooltip_handler       = this.tooltip_handler_normal_mode;
          this._cursor_type           = 'pointer';
          this._valid_chars           = undefined;
          this._options |= EPaperInput.NO_CURSOR | EPaperInput.OPEN_COMBO_VISIBLE | EPaperInput.NO_SCROLL;
          if ( a_nullable_list ) {
            this._options |= EPaperInput.NULLABLE_LIST;
          }
          break;

        case 'l':

          this._mode                  = EPaperInput.TREE_MODE;
          this._paint_handler         = this.paint_normal_mode;
          this._start_editor_handler  = this.start_editor_tree_mode;
          this._update_editor_handler = this.update_editor_tree_mode;
          this._stop_editor_handler   = this.stop_editor_tree_mode;
          this._on_key_down_handler   = this.on_key_down_tree_mode;
          this._on_key_press_handler  = this.on_key_press_tree_mode;
          this._on_mouse_down_handler = this.on_mouse_down_handler_tree_mode;
          this._on_mouse_up_handler   = this.on_mouse_up_handler_normal_mode;
          this._on_mouse_over_handler = this.on_mouse_over_handler_normal_mode;;
          this._tooltip_handler       = this.tooltip_handler_normal_mode;
          this._cursor_type           = 'text';
          this._valid_chars           = '0123456789';
          this._options |= EPaperInput.NO_CURSOR | EPaperInput.OPEN_COMBO_VISIBLE;
          break;

        case 'd':

          this._mode                  = EPaperInput.NORMAL_MODE;
          this._paint_handler         = this.paint_normal_mode;
          this._start_editor_handler  = this.start_editor_html_mode;
          this._update_editor_handler = function () { };
          this._stop_editor_handler   = this.stop_editor_html_mode;
          this._on_key_down_handler   = this.on_key_down_html_mode;
          this._on_key_press_handler  = this.on_key_press_html_mode;
          this._on_mouse_down_handler = this.on_mouse_down_handler_html_mode;
          this._on_mouse_up_handler   = this.on_mouse_up_handler_normal_mode;
          this._on_mouse_over_handler = this.on_mouse_over_handler_normal_mode;;
          this._tooltip_handler       = this.tooltip_handler_normal_mode;
          this._cursor_type           = 'text';
          this._valid_chars           = '0123456789-/';
          break;

        case 'R':

          this._mode                  = EPaperInput.NORMAL_MODE;
          this._paint_handler         = this.paint_radio_button_mode;
          this._start_editor_handler  = this.start_editor_html_mode;
          this._update_editor_handler = function () { };
          this._stop_editor_handler   = this.stop_editor_html_mode;
          this._on_key_down_handler   = this.on_key_down_radio_button_mode;
          this._on_key_press_handler  = this.on_key_press_radio_button_mode;
          this._on_mouse_down_handler = this.on_mouse_down_handler_radio_button_mode;
          this._on_mouse_up_handler   = this.on_mouse_up_handler_radio_button_mode;
          this._on_mouse_over_handler = this.on_mouse_over_handler_radio_button_mode;;
          this._tooltip_handler       = this.tooltip_handler_normal_mode;
          this._cursor_type           = 'pointer';
          this._valid_chars           = undefined;
          break;

        case 't':
        default:

          this._mode                  = EPaperInput.NORMAL_MODE;
          this._paint_handler         = this.paint_normal_mode;
          this._start_editor_handler  = this.start_editor_html_mode;
          this._update_editor_handler = function () { };
          this._stop_editor_handler   = this.stop_editor_html_mode;
          this._on_key_down_handler   = this.on_key_down_html_mode;
          this._on_key_press_handler  = this.on_key_press_html_mode;
          this._on_mouse_down_handler = this.on_mouse_down_handler_html_mode;
          this._on_mouse_up_handler   = this.on_mouse_up_handler_normal_mode;
          this._on_mouse_over_handler = this.on_mouse_over_handler_normal_mode;;
          this._tooltip_handler       = this.tooltip_handler_normal_mode;
          this._cursor_type           = 'text';
          this._valid_chars           = undefined;
          break;
      }
      console.log(" Editor mode=" + a_mode + " subdoc=" + a_sub_document_jrxml + ' vc=' + this._valid_chars);
    },

    /**
     * @brief Prepare the editor
     *
     * Defines the background area that is saved / restore and the paint commands
     * that will be used to paint the element with "Edit Style" decorations
     *
     * @param a_x Upper left corner (x)
     * @param a_y Upper left corner (y)
     * @param a_width box width in px
     * @param a_height box height on px
     * @param a_draw_string the instructions used to paint the input box
     */
    prepare_editor: function (a_x, a_y, a_width, a_height, a_draw_string) {

      // ... save the editor bounding box ...
      this._bb_x        = a_x;
      this._bb_y        = a_y;
      this._bb_w        = a_width;
      this._bb_h        = a_height;
      this._bg_x        = a_x - 5 * this._epaper._ratio;
      this._bg_y        = a_y - 5 * this._epaper._ratio;
      this._bg_w        = a_width  + 10 * this._epaper._ratio;
      this._bg_h        = a_height + 10 * this._epaper._ratio;
      this._draw_string = a_draw_string;
      this._combo_box_list.set_visible(false);
      this._combo_box_list.clear_model();
    },

    /**
     * @brief Start the text editor
     *
     * @param a_text_left  Starting point of left aligned text
     * @param a_baseline   Vertical baseline of the first text line
     * @param a_max_width  Maximum width of the text
     * @param a_text       Initial text to display
     *
     * @note This must be preceded by a prepare_editor to define the bounding box
     */
    start_editor: function (a_text_left, a_baseline, a_max_width, a_text, a_suppress) {

      // ... and take a snapshot the background without any text drawn ...
      this._epaper.hide_widgets();
      this.update_background();

      // ... initialize the editor state ...
      this._left_x        = a_text_left;
      this._text_x        = a_text_left;
      this._baseline      = a_baseline;
      this._display_value = a_text;
      this._enabled       = true;
      this._max_width     = a_max_width;
      this._highlights    = null;

      // ... mode specific set-up ...
      if ( this._mode === EPaperInput.COMBO_MODE || this._mode === EPaperInput.CLIENT_COMBO_MODE ) {
        this._value = '';
      } else {
        this._value = a_text;
      }
      this._cursor_pos    = this._value.length;

      this.activate_combo_buttons();

      // ... initialize the editor selection ...
      if ( (this._mode === EPaperInput.NORMAL_MODE ||
            this._mode === EPaperInput.TREE_MODE )  && this._display_value !== undefined ) {
        this.set_selection(0, this._display_value.length);
        this._initial_selection = true;
      } else {
        this.reset_selection();
      }

      if ( a_suppress === true ) {
        return;
      }

      this._epaper.set_cursor(this._cursor_type);
      this.paint();
    },

    /**
     * @brief Update the text displayed by the editor
     *
     * @param a_text the text to display
     * @param a_highlight an array of words to highlight
     * @param a_hint the text hint to display
     */
    update_editor: function (a_text, a_highlight, a_hint) {

      this._display_value = a_text;

      if ( this._mode != EPaperInput.COMBO_MODE || this._mode === EPaperInput.CLIENT_COMBO_MODE ) {
        this._value = this._display_value;
      } else {
        this._value = a_highlight;
      }
      this._cursor_pos = this._value.length;
      this.set_highlight(a_highlight);
      this._hint = a_hint;
      this.paint();
    },

    /**
     * @brief Finish the text edition
     */
    stop_editor: function () {

      this._open_combo_button.set_visible(false);
      this._clear_combo_button.set_visible(false);
      this._edit_subdocument_button.set_visible(false);
      this._tooltip.set_visible(false);
      this.cursor_off();
      this._enabled = false;
      this.init();
    },

    /**
     * @brief Defines the portion of the display_value that is selected
     *
     * Calculates the start and width of the selection background
     *
     * @param a_start The first character of the selection
     * @param a_end The last character of the selection
     */
    set_selection: function (a_start, a_end) {

      if ( ( a_end - a_start ) <= 0 ) {
        this.reset_selection();
      } else {
        var font = this._ctx.font;

        this._ctx.font = this._font;

        this._selection_chr_start = a_start;
        this._selection_chr_end   = a_end;
        this._selection_px_start  = this._ctx.measureText(this._display_value.substring(0, a_start)).width;
        this._selection_px_length = this._ctx.measureText(this._display_value.substring(a_start, a_end)).width;
        this._ctx.font = font;
      }

    },

    /**
     * @brief Reset  the portion of the display_value that is selected.
     */
    reset_selection: function () {
      this._selection_chr_start = 0;
      this._selection_chr_end   = 0;
      this._selection_px_start  = 0;
      this._selection_px_length = 0;
    },

    /**
     * @brief Calculates the background rectangles for text highlighting
     *
     * @param Space separated words to highlight
     */
    set_highlight: function (a_highlight) {

      var x1, x2, index;
      var hls  = a_highlight.split(' ');
      var len  = hls.length;
      var font = this._ctx.font;

      this._highlights = [];
      this._highlight_cursor = 0;

      // ... filter out empty spans and convert each one to lower case ...
      for ( var i = 0; i < len; i++ ) {
        if ( hls[i].length !== 0 ) {
          this._highlights.push(EPaperWidget.collate(hls[i]));
        }
      }
      this._ctx.font = this._font;
      this._highlight_starts  = [];
      this._highlight_lenghts = [];
      var str = EPaperWidget.collate(this._display_value);

      // ... find the first match of each highlight in the display value, store start and witdh ...
      for ( var i = 0; i < len; i++ ) {
        if ((index = str.indexOf(this._highlights[i])) > -1) {

          this._highlight_cursor = index + this._highlights[i].length;
          x1 = this._ctx.measureText(this._display_value.substring(0, index)).width;
          x2 = this._ctx.measureText(this._display_value.substring(0, this._highlight_cursor)).width;
          this._highlight_starts.push(x1);
          this._highlight_lenghts.push(x2 - x1);
        }
      }

      this._ctx.font = font;
    },

    /**
     * @brief append text at the current cursor location
     *
     * @param a_text the text to append
     */
    write_text: function (a_text) {
      if ( this._selection_chr_end !== 0 || this._selection_chr_start !== 0 ) {
        this._value = this._value.substring(0, this._selection_chr_start)
                    + a_text
                    + this._value.substring(this._selection_chr_end + 1);
        this.reset_selection();
      } else {
        this._value = this._value.substring(0, this._cursor_pos) + a_text + this._value.substring(this._cursor_pos, this._value.length);
      }
      if ( this._mode !== EPaperInput.COMBO_MODE && this._mode !== EPaperInput.CLIENT_COMBO_MODE) {
        this._display_value = this._value;
      }
    },

    /**
     * @brief erase a part of text
     *
     * @param a_from Index of first character to delete
     * @param a_to   Index of last character to delete
     */
    erase_text: function (a_from, a_to) {
      if ( this._selection_chr_end !== 0 || this._selection_chr_start !== 0 ) {
        this._value = this._value.substring(0, this._selection_chr_start) + this._value.substring(this._selection_chr_end + 1);
        this.reset_selection();
      } else {
        this._value = this._value.slice(0, a_from) + this._value.slice(a_to + 1, this._value.length);
      }
      if ( this._mode != EPaperInput.COMBO_MODE ) {
        this._display_value = this._value;
      }
    },

    /**
     * @brief Handler for control keys
     *
     * @param a_key The key pressed, text enumeration with optional modifiers
     *
     * @return @li true if key is consumed
     *         @li false if the key is not consumed
     */
    on_key_down: function (a_key) {

      if ( this._enabled === false ) {
        return false; // key is not consumed
      }

      // ... cursor keys ....
      if ( (this._options & EPaperInput.NO_CURSOR) == 0) {

        if ( a_key === 'left' ) {

          if ( this._cursor_pos >= 1 ) {
            this._cursor_pos -= 1;
            this.restart_cursor();
            this.paint();
          }
          return true; // consume key

        } else if ( a_key === 'right' ) {

          if ( this._cursor_pos < this._value.length ) {
            this._cursor_pos += 1;
            this.restart_cursor();
            this.paint();
          }
          return true; // consume key

        } else if ( a_key === 'end' || a_key === 'ctrl+e' ) {

          this._cursor_pos = this._display_value.length;
          this.restart_cursor();
          this.paint();
          return true; // consume key

        } else if ( a_key === 'home' || a_key === 'ctrl+a' ) {

          this._cursor_pos = 0;
          this.restart_cursor();
          this.paint();
          return true; // consume key

        }
      }

      // ... delete keys ...
      if ( a_key === 'delete') {

        if ( this._cursor_pos < this._value.length ) {
          this.erase_text(this._cursor_pos, this._cursor_pos);
          this.restart_cursor();
          this.paint();
          if ( this._mode === EPaperInput.COMBO_MODE ) {
            this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
          }
        }
        return true; // consume key

      } else if ( a_key === 'backspace') {

        if ( this._cursor_pos >= 1 ) {
          this.erase_text(this._cursor_pos - 1, this._cursor_pos - 1);
          this._cursor_pos -= 1;
          this.restart_cursor();
          this.paint();
          if ( this._mode === EPaperInput.COMBO_MODE ) {
            this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
          }
        }
        return true; // consume key

      } else if ( a_key === 'ctrl+k' ) {

        this.erase_text(this._cursor_pos, this._display_value.length);
        this.restart_cursor();
        this.paint();

      } else if ( a_key === 'enter' || a_key === 'tab' || a_key === 'shift+tab' ) {

        this.commit_value_to_server();
        return false; // send enter to server side anyway

      } else if ( a_key === 'down' || a_key === 'up') {

        if ( this._mode !== EPaperInput.COMBO_MODE && this._mode !== EPaperInput.TREE_MODE ) {
          this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true;');
        }
        this._epaper.send_command('set key "focus_' + a_key + '";');
        return true; //consume key

      } else if ( a_key === 'down' || a_key === 'left' ) {

        this._epaper.send_command('set key "focus_' + a_key + '";');
        return true; //consume key
      }
      // ... key was not consumed by editor ...
      return false;
    },

    on_key_press: function (a_character) {

      if ( this._enabled === false ) {
        return false; // key is not consumed key
      }

      // ... check if the string length must be limited ...
      if ( (this._mode & EPaperInput.NO_SCROLL) !== 0 ) {
        if (this.measure_text(this._value + a_character) < this._bb_w - (this._left_x - this._bb_x) - 2 ) {
          return true; // key not used but consumed anyway
        }
      }

      // ... if we got this far we can insert the character ...
      this.write_text(a_character);
      this._cursor_pos += a_character.length;
      this.restart_cursor();
      this.paint();

      if ( this._mode === EPaperInput.COMBO_MODE || this._mode === EPaperInput.TREE_MODE ) {
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" false;');
      }
      return true; // consume key
    },

    create_cursor_handler: function (a_input) {
      return function () {
        a_input.toggle_cursor_handler();
      }
    },

    cursor_on: function () {
      this._cursor_enabled = true;
      this.restart_cursor();
      this.paint();
    },

    cursor_off: function () {
      this._cursor_enabled = false;
      if ( window._epaper_cursor_timer !== undefined ) {
        window.clearTimeout(window._epaper_cursor_timer);
      }
      this.paint();
    },

    /**
     * Cancel the periodic cursor timer
     */
    freeze_cursor: function () {
      if ( window._epaper_cursor_timer !== undefined ) {
        window.clearTimeout(window._epaper_cursor_timer);
      }
    },

    /**
     * @brief Make the cursor immediately visible and restart the timer
     *
     * Do nothing if the cursor is disabled
     */
    restart_cursor: function () {
      if ( this._cursor_enabled === true ) {
        this._cursor_visible = true;
        if ( window._epaper_cursor_timer !== undefined ) {
          window.clearTimeout(window._epaper_cursor_timer);
        }
        window._epaper_cursor_timer = window.setInterval(this.create_cursor_handler(this), this._cursor_period * 1000 / 2.0 );
      }
    },

    toggle_cursor_handler: function () {
      if ( this._cursor_enabled === false ) {
        window.clearTimeout(window._epaper_cursor_timer);
      } else {
        this._cursor_visible = ! this._cursor_visible;
        this.paint();
      }
    },

    update_background: function () {
      if ( this._bb_w != 0 ) {
        this._background = this._ctx.getImageData(this._bg_x, this._bg_y + this._epaper._translate_y, this._bg_w, this._bg_h);
      }
    },

    commit_value_to_server: function () {
      if ( this._enabled === false ) {
        return;
      }

      if ( this._mode === EPaperInput.CLIENT_COMBO_MODE ) {
        return;
      }

      if ( this._mode === EPaperInput.COMBO_MODE || this._mode === EPaperInput.TREE_MODE ) {
        if ( this._value.length !== 0 ) {
          this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true;');
        }
      } else {
        this._epaper.send_command('set text "' + EPaperInput.escape_for_server(this._value) + '" true;');
      }
    },

  }; // endof prototype

  /*****************************************************************************************/
  /*                                                                                       */
  /*                            ~~~ Tooltip management ~~~                                 */
  /*                                                                                       */
  /*****************************************************************************************/

  /**
   * @brief Defines the tooltip text and location
   *
   * The bounding box of the "controlling" area is used to position the tooltip below. The arrow
   * is centered along the lower edge of the controller and body of the tooltip is adjusted to
   * fit inside the central 90% of the page.
   *
   * @param a_x      Upper left corner of the component that controls the tooltip
   * @param a_y      Upper left corner of the component that controls the tooltip
   * @param a_width  Width of the component that controls the tooltip
   * @param a_height Height of the component that controls the tooltip
   * @param a_hint   The tooltip message to show
   */
  EPaperInput.prototype.set_tooltip_hint = function (a_x, a_y, a_width, a_height, a_hint) {
    var ttip_width, ttip_arrow_x, ttip_x, page_width, arrow_loc;

    page_width = this._epaper._canvas.width;

    // ... set text and size the tooltip, max width up to 90% of page width ...
    this._tooltip.set_text(a_hint)
                 .auto_width(50 * this._epaper._ratio, page_width * 0.9);

    // ... layout the tooltip so that it's stays inside the page (90% central column) ...
    ttip_width   = this._tooltip._bb_w;
    ttip_arrow_x = a_x + a_width / 2;
    ttip_x       = ttip_arrow_x - ttip_width / 2;
    arrow_loc    = 0.5;

    if ( ttip_x < page_width * 0.05 ) {
      ttip_x    = page_width * 0.05;
      arrow_loc = (ttip_arrow_x - ttip_x) / ttip_width;
    } else if ( ttip_x + ttip_width > page_width * 0.95 ) {
      ttip_x    = page_width * 0.95 - ttip_width;
      arrow_loc = (ttip_arrow_x - ttip_x) / ttip_width;
    }

    // ... place and show the tooltip ...
    this._tooltip.set_tip_location(arrow_loc);
    this._tooltip.set_location(ttip_x, a_y + a_height + 0 * this._epaper._ratio);
    this.show_tooltip();
  };

  /**
   * @brief Starts the timer that will eventually hide the tooltip
   */
  EPaperInput.prototype.hide_tooltip = function () {
    if ( window._epaper_hide_tooltip_timer !== undefined ) {
      clearTimeout(window._epaper_hide_tooltip_timer);
    }
    window._epaper_hide_tooltip_timer = setInterval(this.create_hide_tooltip_handler(this), 350);
  };

  /**
   * @brief Make the tooltip visible
   */
  EPaperInput.prototype.show_tooltip = function () {
    if ( window._epaper_hide_tooltip_timer !== undefined ) {
      clearTimeout(window._epaper_hide_tooltip_timer);
      window._epaper_hide_tooltip_timer = undefined;
    }
    this._tooltip.set_visible(true);
  };

  /**
   * @brief Creates the handler that hides the tooltip when it's timer expires
   *
   * @param a_input The input box instance
   */
  EPaperInput.prototype.create_hide_tooltip_handler = function (a_input) {
      return function () {
        if ( window._epaper_hide_tooltip_timer !== undefined ) {
          clearTimeout(window._epaper_hide_tooltip_timer);
          window._epaper_hide_tooltip_timer = undefined;
        }
        a_input._tooltip.set_visible(false);
        a_input.paint();
      }
  };

  EPaperInput.prototype.enable_toolip = function () {
    return ! this._combo_box_list.is_visible();
  }

  /**
   * @param a_x upper left corner of bounding box
   * @param a_y
   */
  EPaperInput.prototype.tooltip_handler_normal_mode = function (a_x, a_y, a_width, a_height, a_tooltip_text) {
    var mid_x, mid_y;

    mid_x = a_x + a_width  / 2;
    mid_y = a_y + a_height / 2;

    // ... if the mid point of the tooltip hint is outside the editor bounding box discard it ...
    if ( mid_x < this._bb_x || mid_x > (this._bb_x + this._bb_w) || mid_y < this._bb_y || mid_y > (this._bb_y + this._bb_h) ) {
      return;
    }
    if ( a_tooltip_text.length ) {
      this.set_tooltip_hint(this._bb_x, this._bb_y, this._bb_w, this._bb_h, a_tooltip_text.toUpperCase());
    } else {
      this.hide_tooltip();
    }
    this.paint();
  };

  /*****************************************************************************************/
  /*                                                                                       */
  /*                              ~~~ Combo box layout ~~~                                 */
  /*                                                                                       */
  /*****************************************************************************************/

  /**
   * @brief Called to allow the input to layout and activate the auxiliary open combo buttons
   */
  EPaperInput.prototype.activate_combo_buttons = function () {

    this._open_combo_button.set_location(this._bb_x + this._bb_w - this._open_combo_button._bb_w * 0.8, this._bb_y + (this._bb_h - this._open_combo_button._bb_h) / 2.0);
    this._open_combo_button.set_visible(this._options & EPaperInput.OPEN_COMBO_VISIBLE);

    this._clear_combo_button.set_location(this._bb_x + this._bb_w - this._clear_combo_button._bb_w * 0.9, this._bb_y + (this._bb_h - this._clear_combo_button._bb_h) / 2.0);
    this._clear_combo_button.set_visible(false);

    this._edit_subdocument_button.set_location(this._bb_x + this._bb_w,
                                               this._bb_y + (this._bb_h - this._edit_subdocument_button._bb_h) / 2.0);
    this._edit_subdocument_button.set_visible(this._options & EPaperInput.SUB_DOCUMENT_VISIBLE);
  };

  /**
   * @brief Show / hide the combo box list
   */
  EPaperInput.prototype.toggle_combo_list = function () {

    if ( this._combo_box_list.is_visible() ) {
      this._combo_box_list.set_visible(false);
    } else {
      this.layout_combo_list();
      this._tooltip.set_visible(false);
      this._combo_box_list.set_visible(true);
    }
  };

  EPaperInput.prototype.layout_combo_list = function () {
    var list_x, list_y, max_width, max_height, page_margin;

    page_margin = 40 * this._epaper._ratio;

    if ( (this._bb_x / this._epaper._sx) > this._epaper._page_width / 2 ) {
      max_width = this._bg_x + this._bb_w + this._open_combo_button._bb_w - page_margin;
    } else {
      max_width = this._epaper._page_width * this._epaper._sx - page_margin - this._bg_x;
    }

    if ( (this._bb_y / this._epaper._sy) > this._epaper._page_height / 2 ) {
      max_height = this._bb_y - page_margin;
    } else {
      max_height = this._epaper._page_height * this._epaper._sx - page_margin - this._bb_y -  this._bb_h;
    }

    this._combo_box_list.auto_size(this._bb_w, max_width, max_height);

    if ( (this._bb_x / this._epaper._sx) > this._epaper._page_width / 2 ) {
      list_x = this._bb_x + this._bb_w + this._open_combo_button._bb_w - this._combo_box_list._bb_w;
    } else {
      list_x = this._bb_x;
    }

    this._combo_box_list.adjust_height();
    if ( (this._bb_y + this._bb_h ) / this._epaper._sy > this._epaper._page_height / 2 ) {
      list_y = this._bb_y - 2 * this._epaper._ratio - this._combo_box_list._bb_h;
    } else {
      list_y = this._bb_y + this._bb_h + 2 * this._epaper._ratio;
    }
    this._combo_box_list.set_location(list_x, list_y);
  };

  EPaperInput.prototype.update_combo_list = function (a_combo_id, a_json) {
    this._combo_box_list.set_model(a_combo_id, a_json);
    this._combo_box_list.auto_size(this._bb_w);
  };

  EPaperInput.prototype.clear_list_item = function () {
    this._epaper.send_command('set list item "";');
    this._epaper.send_command('set key "save";');
  };

  EPaperInput.prototype.prevent_mouse_default = function () {
    if ( this._prevent_event_default ) {
      this._prevent_event_default = false;
      return true;
    } else {
      return false;
    }
  };

  EPaperInput.escape_for_server = function (a_text) {
    return a_text.split('"').join('""');
  };

}