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

var EPaperComboBoxList_Initialize = function (a_root) {

  /**
   * @brief Input box constructor
   *
   * @param a_epaper Parent EPaper object
   */
  a_root.EPaperComboBoxList = function (a_epaper) {
    EPaperWidget.call(this, a_epaper, '#FFFFFF', '#000000');
    this._font           = a_epaper._ctx.font;
    this._display_fields = undefined;
    this._model          = undefined;
    this._model_cache    = {};
    this._bg_selection   = '#009BB5';
    this._fg_selection   = '#FFFFFF';
    this._font           = 12 * this._epaper._ratio + 'px DejaVu Sans Condensed';
    this._bold_font      = 'bold ' + 12 * this._epaper._ratio + 'px DejaVu Sans Condensed';
    this._selected_index = 0;
    this._line_height    = 18 * this._epaper._ratio;
    this._v_pad          = 5  * this._epaper._ratio;
    this._h_pad          = 3  * this._epaper._ratio;
    this._lines          = undefined;
    this._visible_ids    = undefined;
    this._filter_matches = undefined;
    this._filter_lenght  = 0;
    this._selected_id    = undefined;
    this._initial_id     = undefined;
    this._cursor         = 'pointer';
    this._fake_select    = false;
    this._max_height     = undefined;
    this._state         |= EPaperWidget.DRAW_SHADOW;
  };

  /**
   * @brief Prototype inherits from Widget
   */
  EPaperComboBoxList.prototype = Object.create(EPaperWidget.prototype, {
    constructor: {
      configurable: true,
      enumarable: true,
      value: EPaperComboBoxList.prototype,
      writable: true
    }
  });

  /**
   * @brief Handler for control keys
   *
   * @param a_key The key pressed, text enumeration with optional modifiers
   *
   * @return @li true if key is consumed
   *         @li false if the key is not consumed
   */
  EPaperComboBoxList.prototype.on_key_down = function (a_key) {

    if ( a_key === 'up' ) {

      if ( this._selected_index > 0 ) {
        this._selected_index -= 1;
      }
      return true;

    } else if ( a_key === 'down' ) {

      if ( this._selected_index === undefined ) {
        this._selected_index = 0;
      }

      if ( this._lines !== undefined && this._selected_index < this._lines.length - 1 ) {
        this._selected_index += 1;
      }
      return true;

    } else {

      return false;

    }
  };

  /**
   * @brief Returns the number of items in the list
   *
   * @return number of records in model
   */
  EPaperComboBoxList.prototype.get_size = function () {
    return this._model !== undefined ? this._model.length :  0;
  };

  /**
   * @brief Returns the ID of the currently selected item
   *
   * @return the item id
   */
  EPaperComboBoxList.prototype.get_selected_id = function () {
    return this._visible_ids[this._selected_index];
  };

  /**
   * @brief Returns the ID of the item that was initially selected
   *
   * @return the initial item id
   */
  EPaperComboBoxList.prototype.get_initial_id = function () {
    return this._initial_id;
  };

  /**
   * @brief Return the text of the current list item
   *
   * @return the text of the list item
   */
  EPaperComboBoxList.prototype.get_selected_text = function () {
    if ( this._selected_index === undefined || this._fake_select === true ) {
      return '';
    } else {
      return this._lines[this._selected_index];
    }
  }

  /**
   * @brief Return a field of the current selected model item
   *
   * @param a_index the display field index
   *
   * @returns the request field or empty string if there's none
   */
  EPaperComboBoxList.prototype.get_selected_field = function (a_index) {
    if ( this._selected_index !== undefined && this._model !== undefined && this._fake_select === false ) {
      var len = this._model.length;
      var selected_id = this.get_selected_id();

      for ( var i = 0; i < len; i++ ) {
        if ( this._model[i].id == selected_id ) {
          return this._model[i][this._display_fields[a_index]];
        }
      }
    }
    return '';
  }

  /**
   * @brief Sets the name of the data model field that contains the item description
   *
   * @param a_display_fields array of fields names
   */
  EPaperComboBoxList.prototype.set_display_fields = function (a_display_fields) {
    this._display_fields = a_display_fields;
  };

  /**
   * @brief Automatically resize the list taking into account the specified constraints
   *
   * Horizontal size determined by the maximum text width, vertical size is determined by the number of rows
   *
   * @param a_min_width minimum width of list box
   * @param a_max_width maximum width of the box
   * @param a_max_height maximum height
   */
  EPaperComboBoxList.prototype.auto_size = function (a_min_width, a_max_width, a_max_height) {
    var i, len, current_font, width, height;

    current_font   = this._ctx.font;
    this._ctx.font = this._font;

    if ( this._model === undefined ) {
      len   = 1;
      width = a_min_width;
    } else {
      len = this._model.length;
      width = 0;
      for ( i = 0; i < len; i++ ) {
        var plen = this._ctx.measureText(this.concat_fields(i)).width;

        if ( plen > width ) {
          width = plen;
        }
      }
    }

    height  = this._line_height * len + 2 * this._v_pad;
    width  += 2 * this._h_pad;

    if ( a_min_width !== undefined && width < a_min_width ) {
      width = Math.round(a_min_width);
    }
    if ( a_max_width !== undefined && width > a_max_width ) {
      width = Math.round(a_max_width);
    }
    if ( a_max_height !== undefined && height > a_max_height ) {
      height = Math.round(a_max_height);
      this._max_height = height;
    } else {
      this._max_height = undefined;
    }
    this.set_size(width, height);
    this._ctx.font = current_font;
  };

  /**
   * @brief Adjust the height to match the number of visible rows
   */
  EPaperComboBoxList.prototype.adjust_height = function () {
    var height, lines;

    if ( this._lines === undefined || this._lines.length === 0 ) {
      lines = 1;
    } else {
      lines = this._lines.length;
    }
    height = this._line_height * lines + 2 * this._v_pad;
    if ( this._max_height !== undefined && height > this._max_height ) {
      height = this._max_height;
    }
    this.set_size(this._bb_w, height);
  };

  /**
   * @brief Builds the display string for the specified row
   *
   * Concatenates the display fields
   *
   * @param a_idx Index of the row in the model
   */
  EPaperComboBoxList.prototype.concat_fields = function (a_idx) {
    var rv = this._model[a_idx][this._display_fields[0]];

    for ( var i = 1; i < this._display_fields.length; i++ ) {
      rv += ' - ' + this._model[a_idx][this._display_fields[i]];
    }
    return rv;
  };

  /**
   * @brief Define the combo list model.
   *
   * Each model is associated with an id, models are kept in a model cache. To set a model the
   * server specified the id and json model, to reuse a cached model just sends the id.
   *
   * @param a_combo_id Unique identifier of the combo list in the document (no caching if it's undefined)
   * @param a_json the data model to associate with the combo it. If this parameter is
   *               undefined the model is retrieved from the _model_cache
   */
  EPaperComboBoxList.prototype.set_model = function (a_combo_id, a_json) {

    if ( a_combo_id === undefined ) {

      this._model = JSON.parse(a_json);

    } else {

      if ( a_json === undefined ) {
        var json = this._model_cache[a_combo_id];
        if ( json !== undefined ) {
          this._model = JSON.parse(json);
        } else {
          this._model = undefined;
        }
      } else {
        this._model_cache[a_combo_id] = a_json;
        this._model = JSON.parse(a_json);
      }

    }
    this.filter_model('');
  };

  /**
   * @brief Find the model index with specified id and makes it the current selection
   *
   * @param a_id The id of row that should become selected
   */
  EPaperComboBoxList.prototype.select_index = function (a_id) {
    var i, len;

    this._selected_index = undefined;
    this._fake_select    = false;
    this._initial_id     = a_id;
    this._selected_id    = a_id;
    if ( this._model !== undefined ) {
      len = this._model.length;
      for ( i = 0; i < len; i++ ) {
        if ( this._model[i].id === a_id ) {
          this._selected_index = i;
        }
      }

      // ... fallback select first entry ...
      if ( this._selected_index === undefined && this._model.length > 0 ) {
        this._selected_index = 0;
        this._initial_id     = a_id;
        this._selected_id    = this._model[0].id;
        this._fake_select    = true;
      }
    }

  };

  /**
   * @brief Apply filter string to the list model
   *
   * Rebuilds the display array _lines with the visible rows
   *
   * @param a_filter filter to apply
   */
  EPaperComboBoxList.prototype.filter_model = function (a_filter) {
    var mi, line;

    this._lines          = [];
    this._visible_ids    = [];
    this._filter_matches = [];
    this._fake_select    = false;
    this._filter_length  = a_filter.length;

    if ( this._model !== undefined ) {
      var len, i, first_index;
      var filter = EPaperWidget.collate(a_filter);

      len = this._model.length;
      for ( i = 0; i < len; i++ ) {
        line = this.concat_fields(i);
        mi   = this.row_is_visible(a_filter, line);
        if ( mi !== -1 ) {
          if ( first_index === undefined ) {
            first_index = i;
          }
          this._lines.push(line);
          this._visible_ids.push(this._model[i].id);
          if ( this._filter_length ) {
            this._filter_matches.push(mi);
          } else {
            this._filter_matches.push(undefined);
          }
        }
      }
    }

    if ( a_filter.length ) {
      if ( first_index != undefined ) {
        this._selected_id    = this._model[first_index].id;
      }
      this._selected_index = 0;
    }
    this.state |= EPaperWidget.IS_FG_DIRTY;
  };

  /**
   * @brief Check if the specified row is visible
   *
   * @param a_filter the filtering criteria
   * @param a_line the line to filter
   *
   * @return the index where the filter matched -1 if there is no match
   */
  EPaperComboBoxList.prototype.row_is_visible = function (a_filter, a_line) {
    var mi;

    if (a_filter.length === 0 ) {
      return 0;
    }
    return EPaperWidget.collate(a_line).indexOf(EPaperWidget.collate(a_filter));
  };

  /**
   * @brief Throw away the data and display models
   */
  EPaperComboBoxList.prototype.clear_model = function () {
    this._model          = undefined;
    this._lines          = undefined;
    this._visible_ids    = undefined;
    this._filter_matches = undefined;
    this._filter_lenght  = 0;
  };

  /**
   * @brief Handle mouse over event
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false to allow cascading to other components
   */
  EPaperComboBoxList.prototype.mouse_over = function (a_x, a_y) {
    var clicked_index;
    var mouse_over = false;

    if ( this._state & EPaperWidget.IS_VISIBLE ) {
      if ( a_x > this._bb_x && a_x < this._bb_x + this._bb_w &&
           a_y > this._bb_y && a_y < this._bb_y + this._bb_h ) {
        mouse_over = true;
      }
      if ( mouse_over ) {
        clicked_index = Math.round((a_y - this._bb_y + this._v_pad) / this._line_height) - 1;
        if ( clicked_index >= 0 && this._lines !== undefined && clicked_index < this._lines.length) {
          if ( this._selected_index !== clicked_index ) {
            this._selected_index = clicked_index;
            this._state |= EPaperWidget.IS_FG_DIRTY;
          }
        }
      } else {
        if ( this._selected_index !== undefined ) {
          this._selected_index = undefined;
          this._state |= EPaperWidget.IS_FG_DIRTY;
        }
      }
      if ( mouse_over !== ((this._state & EPaperWidget.IS_MOUSE_OVER) !== 0) ) {
        if ( mouse_over ) {
          this._state |=  EPaperWidget.IS_MOUSE_OVER;
          this._epaper.set_cursor(this._cursor);
          if ( this._epaper._widget_under_mice !== undefined &&  this._epaper._widget_under_mice != this ) {
            this._epaper._widget_under_mice._state &= ~(EPaperWidget.IS_MOUSE_OVER | EPaperWidget.IS_CLICKED);
            this._epaper._widget_under_mice.update_graphic();
            this._epaper._widget_under_mice._state |=  EPaperWidget.IS_FG_DIRTY;
          }
        } else {
          this._state &= ~(EPaperWidget.IS_MOUSE_OVER | EPaperWidget.IS_CLICKED);
        }
        this._state |= EPaperWidget.IS_FG_DIRTY;
      }
    }
    return mouse_over;
  };

  /**
   * @brief Handle mouse down event
   *
   * @param a_x horizontal coordinate of the mouse event (relative to canvas)
   * @param a_y vertical coordinate of the mouse event (relative to canvas)
   * @param a_down true for mouse down, false for mouse up
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperComboBoxList.prototype.mouse_click = function (a_x, a_y, a_down) {
    var clicked_index;
    var inside = false;
    var rv     = false;

    if ( this._state & EPaperWidget.IS_VISIBLE ) {
      if ( a_x > this._bb_x && a_x < this._bb_x + this._bb_w &&
           a_y > this._bb_y && a_y < this._bb_y + this._bb_h ) {
        inside = true;
      }
      if ( this._state & EPaperWidget.IS_CLICKED ) {
        if ( a_down === false ) {
          this._state &= ~EPaperWidget.IS_CLICKED;
          this._state |= EPaperWidget.IS_FG_DIRTY;

          if ( inside === true ) {

            clicked_index = Math.round((a_y - this._bb_y + this._v_pad) / this._line_height) - 1;

            if ( clicked_index == this._selected_index) {
              if ( this._click_handler !== undefined ) {
                this._click_handler(this);
              }
            }
          }
          rv = true;
        }
      } else {
        if ( a_down === true ) {
          if ( inside === true ) {
            this._state |= EPaperWidget.IS_CLICKED;

            clicked_index = Math.round((a_y - this._bb_y + this._v_pad) / this._line_height) - 1;

            if ( clicked_index >= 0 && clicked_index < this._lines.length) {
              this._selected_index = clicked_index;
              this._state |= EPaperWidget.IS_FG_DIRTY;
            }
          } else {
            this.set_visible(false);
          }
          rv = true;
        }
      }
    }
    return rv;
  };

  /**
   * @brief Paints the box list
   */
  EPaperComboBoxList.prototype.paint = function () {

    EPaperWidget.prototype.paint.call(this);

    if ( (this._state & (EPaperWidget.IS_VISIBLE | EPaperWidget.IS_FG_DIRTY)) === (EPaperWidget.IS_VISIBLE | EPaperWidget.IS_FG_DIRTY) ) {
      if ( this._background !== undefined ) {
        var len, i, y, xpos, sidx, str;

        this._epaper._ctx.putImageData(this._background, this._bg_x, this._bg_y + this._epaper._translate_y);

        this.shadow_on();
        this._ctx.fillStyle = this._bg_color;
        this._ctx.beginPath();
        this.make_round_rect_path(this._bb_x, this._bb_y, this._bb_w, this._bb_h, this._v_pad);
        this._ctx.closePath();
        this._ctx.fill();
        this.shadow_off();

        this._ctx.lineWidth   = 1;
        this._ctx.strokeStyle = this._bg_selection;
        this._ctx.stroke();

        if ( this._lines ) {

          this._ctx.font         = this._font;
          this._ctx.textBaseline = 'middle';

          len = this._lines.length;
          y = this._bb_y + this._v_pad + this._line_height / 2;

          for ( i = 0; i < len; i++ ) { // TODO avoid this loop!!!

            if ( i === this._selected_index ) {
              this._ctx.fillStyle = this._bg_selection;
              this._ctx.fillRect(this._bb_x, y - this._line_height / 2, this._bb_w, this._line_height);
              this._ctx.fillStyle = this._fg_selection;
            }
            y += this._line_height;
            if ( y - this._bb_y > this._bb_h ) {
              break;
            }
          }

          this._ctx.save();
          this._ctx.beginPath();
          this._ctx.rect(this._bb_x + this._h_pad , this._bb_y, this._bb_w - 2 * this._h_pad, this._bb_h);
          this._ctx.clip();
          this._ctx.fillStyle = this._fg_color;

          y = this._bb_y + this._v_pad + this._line_height / 2;
          len = this._lines.length;
          for ( i = 0; i < len; i++ ) {

            if ( i === this._selected_index ) {
              this._ctx.fillStyle = this._fg_selection;
            } else {
              this._ctx.fillStyle = this._fg_color;
            }

            if ( this._filter_matches[i] !== undefined ) {

              xpos = this._bb_x + this._h_pad;
              sidx = this._filter_matches[i];
              str = this._lines[i].substring(0, sidx);
              if ( str.length ) {
                this._ctx.fillText(str, xpos, y);
              }
              xpos += this._ctx.measureText(str).width;

              this._ctx.font = this._bold_font;
              str = this._lines[i].substring(sidx, sidx + this._filter_length);
              if ( str.length ) {
                this._ctx.fillText(str, xpos, y);
              }
              xpos += this._ctx.measureText(str).width;

              this._ctx.font = this._font;
              str = this._lines[i].substring(sidx + this._filter_length);
              if ( str.length ) {
                this._ctx.fillText(str, xpos, y);
              }

            } else {
              this._ctx.fillText(this._lines[i], this._bb_x + this._h_pad, y);
            }
            y += this._line_height;
            if ( y - this._bb_y > this._bb_h ) {
              break;
            }
          }

          this._ctx.restore();
        }

        this._state &= ~EPaperWidget.IS_FG_DIRTY;
      }
    }
  };

}
