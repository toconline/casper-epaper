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

var EPaperWidget_Initialize = function(a_root) {

  console.log("Loading EPaperWidget_Initialize");

  /**
   * @brief Constructor for widget base class
   *
   * @param a_epaper parent EPaper object
   * @param a_background color for widget body
   * @param a_foreground Typically defines text and decoration colors
   */
  a_root.EPaperWidget = function (a_epaper, a_background, a_foreground) {
    this._epaper        = a_epaper;
    this._ctx           = a_epaper._ctx;
    this._bg_color      = a_background;
    this._fg_color      = a_foreground;
    this._state         = EPaperWidget.IS_ENABLED;
    this._background    = undefined;
    this._cursor        = undefined;
    this._bb_x          = 0.0;
    this._bb_y          = 0.0;
    this._bb_w          = 0.0;
    this._bb_h          = 0.0;
    this._bg_x          = 0.0;
    this._bg_y          = 0.0;

    this._epaper._widgets.push(this);
  };

  /*
   * This is the base class
   */
  EPaperWidget.prototype.constructor = EPaperWidget;

  /*
   * Enumeration for state flags
   */
  EPaperWidget.IS_VISIBLE    = 0x0001;
  EPaperWidget.IS_ENABLED    = 0x0002;
  EPaperWidget.IS_CLICKED    = 0x0004;
  EPaperWidget.IS_MOUSE_OVER = 0x0008;
  EPaperWidget.HAS_LOCATION  = 0x0010;
  EPaperWidget.HAS_SIZE      = 0x0020;
  EPaperWidget.IS_FG_DIRTY   = 0x0040;
  EPaperWidget.IS_BG_DIRTY   = 0x0080;
  EPaperWidget.DRAW_SHADOW   = 0x0100;

  EPaperWidget.SHADOW_BLUR   = 3;
  EPaperWidget.SHADOW_OFFSET = 3;

  /**
   * @brief Set the location of widget in the screen
   *
   * @param a_x Horizontal position
   * @param a_y Vertical position
   */
  EPaperWidget.prototype.set_location = function (a_x, a_y) {

    if ( Math.round(a_x) != this._bb_x || Math.round(a_y) != this._bb_y ) {
      this._bb_x   = Math.round(a_x);
      this._bb_y   = Math.round(a_y);
      this._state |= (EPaperWidget.IS_BG_DIRTY | EPaperWidget.IS_FG_DIRTY | EPaperWidget.HAS_LOCATION);
      this.update_graphic();
    }
    return this;
  };

  /**
   * @brief Set the size of of the widget in the screen
   *
   * @param a_width width in pixels
   * @param a_height height in pixels
   */
  EPaperWidget.prototype.set_size = function (a_width, a_height) {

    if ( Math.round(a_width) != this._bb_w || Math.round(a_height) != this._bb_h ) {
      this._bb_w   = Math.round(a_width);
      this._bb_h   = Math.round(a_height);
      this._state |= (EPaperWidget.IS_BG_DIRTY | EPaperWidget.IS_FG_DIRTY | EPaperWidget.HAS_SIZE);
      this.update_graphic();
    }
    return this;
  };

  /**
   * @brief Show or hide the widget
   *
   * @param a_visible true to make visible, false to hide this widget
   * @return "das" widget
   */
  EPaperWidget.prototype.set_visible = function (a_visible) {

    if ( a_visible !== ((this._state & EPaperWidget.IS_VISIBLE) !== 0) ) {
      if ( a_visible ) {
        this._state |=  EPaperWidget.IS_VISIBLE;
        this._state |= (EPaperWidget.IS_BG_DIRTY | EPaperWidget.IS_FG_DIRTY);
      } else {
        this._state &= ~EPaperWidget.IS_VISIBLE;
        this._state |=  EPaperWidget.IS_BG_DIRTY;
      }
    }
    return this;
  };

  /**
   * @brief Returns true if the widget is visible
   *
   * @return true if visible, false if the widget is hidden
   */
  EPaperWidget.prototype.is_visible = function () {
    return (this._state & EPaperWidget.IS_VISIBLE) !== 0;
  };

  /**
   * @brief Enable or disable the widget
   *
   * @param a_enabled true to enable, false to disable
   * @return the widget instance
   */
  EPaperWidget.prototype.set_enabled = function (a_enabled) {

    if ( a_enabled !== ((this._state & EPaperWidget.IS_ENABLED) !== 0 ) ) {
      if ( a_enabled ) {
        this._state |=  EPaperWidget.IS_ENABLED;
      } else {
        this._state &= ~EPaperWidget.IS_ENABLED;
      }
      this._update_graphic();
      this._state |= EPaperWidget.IS_FG_DIRTY;
    }
    return this;
  };

  EPaperWidget.prototype.send_to_front = function () {
    var len = this._epaper._widgets.length;

    for ( var i = 0; i < len; i++ ) {
      if ( this._epaper._widgets[i] == this ) {
        this._epaper._widgets.splice(i,1);
        this._epaper._widgets.push(this);
        break;
      }
    }
  };

  /**
   * @brief Handle mouse over event
   *
   * @param a_x X coordinate of the mouse event (relative to canvas)
   * @param a_y Y coordinate of the mouse event (relative to canvas)
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperWidget.prototype.mouse_over = function (a_x, a_y) {

    var mouse_over = false;

    if ( this._state & EPaperWidget.IS_VISIBLE ) {
      if ( a_x > this._bb_x && a_x < this._bb_x + this._bb_w &&
           a_y > this._bb_y && a_y < this._bb_y + this._bb_h ) {
        mouse_over = true;
      }
      if ( mouse_over !== ((this._state & EPaperWidget.IS_MOUSE_OVER) !== 0) ) {
        if ( mouse_over ) {
          this._state |=  EPaperWidget.IS_MOUSE_OVER;
          if ( this._cursor !== undefined ) {
            this._epaper.set_cursor(this._cursor);
          }
          if ( this._epaper._widget_under_mice !== undefined &&  this._epaper._widget_under_mice != this ) {
            this._epaper._widget_under_mice._state &= ~(EPaperWidget.IS_MOUSE_OVER | EPaperWidget.IS_CLICKED);
            this._epaper._widget_under_mice.update_graphic();
            this._epaper._widget_under_mice._state |=  EPaperWidget.IS_FG_DIRTY;
          }
          this._epaper._widget_under_mice = this;
        } else {
          this._state &= ~(EPaperWidget.IS_MOUSE_OVER | EPaperWidget.IS_CLICKED);
        }
        this.update_graphic();
        this._state |= EPaperWidget.IS_FG_DIRTY;
      }
    }
    return mouse_over;
  };

  /**
   * @brief Handle mouse click event
   *
   * @param a_x horizontal coordinate of the mouse event (relative to canvas)
   * @param a_y vertical coordinate of the mouse event (relative to canvas)
   * @param a_down true for mouse down, false for mouse up
   *
   * @return true if the widget consumes the mouse event, false if the click is ignored
   */
  EPaperWidget.prototype.mouse_click = function (a_x, a_y, a_down) {
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
          this.update_graphic();
          this._state |= EPaperWidget.IS_FG_DIRTY;

          if ( inside === true ) {
            if ( this._click_handler !== undefined ) {
              this._click_handler(this);
            }
          }
          rv = true;
        }
      } else {
        if ( a_down === true && inside === true ) {
          this._state |= (EPaperWidget.IS_CLICKED | EPaperWidget.IS_FG_DIRTY);
          this.update_graphic();
          rv = true;
        }
      }
    }
    return rv;
  };

  /**
   * @brief Pure virtual :-) does nothing
   */
  EPaperWidget.prototype.update_graphic = function () {
    /* empty */
  };

  /**
   * @brief Update widget's background
   */
  EPaperWidget.prototype.update_background = function () {

    if ( (this._state & (EPaperWidget.HAS_LOCATION | EPaperWidget.HAS_SIZE)) === (EPaperWidget.HAS_LOCATION | EPaperWidget.HAS_SIZE) ) {
      if ( this._state & EPaperWidget.DRAW_SHADOW ) {
        this._background = this._epaper._ctx.getImageData(this._bb_x - 2 *  this._epaper._ratio,
                                                          this._bb_y + this._epaper._translate_y,
                                                          this._bb_w + 4 * EPaperWidget.SHADOW_OFFSET * this._epaper._ratio,
                                                          this._bb_h + 4 * EPaperWidget.SHADOW_OFFSET * this._epaper._ratio);
        this._bg_x       = this._bb_x - 2 * this._epaper._ratio;
        this._bg_y       = this._bb_y;
      } else {
        try {
          this._background = this._epaper._ctx.getImageData(this._bb_x, this._bb_y + this._epaper._translate_y, this._bb_w, this._bb_h);
        } catch (e) {
          console.log(e);
        }
        this._bg_x       = this._bb_x;
        this._bg_y       = this._bb_y;
      }
      this._state &= ~EPaperWidget.IS_BG_DIRTY;
      this._state |=  EPaperWidget.IS_FG_DIRTY;
    }
  };

  /**
   * @brief Temporarily hides the widget by restoring the widget's background
   */
  EPaperWidget.prototype.hide = function () {

    if ( this._background !== undefined ) {
      this._epaper._ctx.putImageData(this._background, this._bg_x, this._bg_y + this._epaper._translate_y);
      this._background = undefined;
    }
  };

  /**
   * @brief Updates the widget background
   *
   * Restores the current backgound using the old bounding box, then captures the new backgound and aligns background
   * with the new bounding box
   */
  EPaperWidget.prototype.paint = function () {

    if ( this._state & EPaperWidget.IS_BG_DIRTY ) {
      if ( this._background !== undefined ) {
        this._epaper._ctx.putImageData(this._background, this._bg_x, this._bg_y + this._epaper._translate_y);
      }
      if ( (this._state & (EPaperWidget.HAS_LOCATION | EPaperWidget.HAS_SIZE)) === (EPaperWidget.HAS_LOCATION | EPaperWidget.HAS_SIZE) ) {
        this.update_background();
      }
      this._state &= ~EPaperWidget.IS_BG_DIRTY;
    }
  };

  /**
   * @brief Prepares a rounded rect path, does not paint or stroke it
   *
   * @param a_x upper left corner
   * @param a_y upper left corner
   * @param a_w width of the round rectangle
   * @param a_h height of the round rectangle
   * @param a_r corner radius
   */
  EPaperWidget.prototype.make_round_rect_path = function (a_x, a_y, a_w, a_h, a_r) {

    this._ctx.moveTo( a_x + a_r , a_y );
    this._ctx.arcTo(  a_x + a_w , a_y       , a_x + a_w       , a_y + a_r       , a_r);
    this._ctx.arcTo(  a_x + a_w , a_y + a_h , a_x + a_w - a_r , a_y + a_h       , a_r);
    this._ctx.arcTo(  a_x       , a_y + a_h , a_x             , a_y + a_h - a_r , a_r);
    this._ctx.arcTo(  a_x       , a_y       , a_x + a_r       , a_y             , a_r);
  };

  /**
   * @brief Enables the widget shadow
   * @note This is not a "public" method
   */
  EPaperWidget.prototype.shadow_on = function () {
    this._ctx.shadowColor   = "rgba(0,0,0,0.15)";
    this._ctx.shadowBlur    = EPaperWidget.SHADOW_BLUR;
    this._ctx.shadowOffsetX = EPaperWidget.SHADOW_OFFSET * this._epaper._ratio;
    this._ctx.shadowOffsetY = EPaperWidget.SHADOW_OFFSET * this._epaper._ratio;
  };

  /**
   * @brief Disable the widget shadow
   * @note This is not a "public" method
   */
  EPaperWidget.prototype.shadow_off = function () {
    this._ctx.shadowBlur    = 0;
    this._ctx.shadowOffsetX = 0;
    this._ctx.shadowOffsetY = 0;
  };

  /**
   * @brief Lighten or Darken a hex color
   *
   * @param a_color a color spec in #RRGGBB hex notation
   * @param a_percent Positive or negative increment
   * @return the modified color
   *
   * @note http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
   * @note STATIC
   */
  EPaperWidget.shadeColor = function (a_color, a_percent) {
    var num = parseInt(a_color.slice(1),16);
    var amt = Math.round(2.55 * a_percent);
    var R = (num >> 16) + amt;
    var G = (num >> 8 & 0x00FF) + amt;
    var B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
  };

  /**
   * @brief Simple collation function.
   *
   * Currently limited to Portuguese only, tough it can be easily extended to other latin script and
   * MIGHT work even without explicit locale tests.
   *
   * @param a_text The text to collate
   * @return the collated text
   *
   * @note STATIC
   */
  EPaperWidget.collate = function (a_text) {

    var len   = a_text.length;
    var chars = [];

    for ( var i = 0; i < len; ++ i) {
      switch ( a_text.charCodeAt(i) ) {
        case 65:  /* 'A' */ chars.push('a'); break;
        case 66:  /* 'B' */ chars.push('b'); break;
        case 67:  /* 'C' */ chars.push('c'); break;
        case 68:  /* 'D' */ chars.push('d'); break;
        case 69:  /* 'E' */ chars.push('e'); break;
        case 70:  /* 'F' */ chars.push('f'); break;
        case 71:  /* 'G' */ chars.push('g'); break;
        case 72:  /* 'H' */ chars.push('h'); break;
        case 73:  /* 'I' */ chars.push('i'); break;
        case 74:  /* 'J' */ chars.push('j'); break;
        case 75:  /* 'K' */ chars.push('k'); break;
        case 76:  /* 'L' */ chars.push('l'); break;
        case 77:  /* 'M' */ chars.push('m'); break;
        case 78:  /* 'N' */ chars.push('n'); break;
        case 79:  /* 'O' */ chars.push('o'); break;
        case 80:  /* 'P' */ chars.push('p'); break;
        case 81:  /* 'Q' */ chars.push('q'); break;
        case 82:  /* 'R' */ chars.push('r'); break;
        case 83:  /* 'S' */ chars.push('s'); break;
        case 84:  /* 'T' */ chars.push('t'); break;
        case 85:  /* 'U' */ chars.push('u'); break;
        case 86:  /* 'V' */ chars.push('v'); break;
        case 87:  /* 'W' */ chars.push('w'); break;
        case 88:  /* 'X' */ chars.push('x'); break;
        case 89:  /* 'Y' */ chars.push('y'); break;
        case 90:  /* 'Z' */ chars.push('z'); break;
        case 231: /* 'ç' */ chars.push('c'); break;
        case 227: /* 'ã' */ chars.push('a'); break;
        case 225: /* 'á' */ chars.push('a'); break;
        case 224: /* 'à' */ chars.push('a'); break;
        case 226: /* 'â' */ chars.push('a'); break;
        case 245: /* 'õ' */ chars.push('o'); break;
        case 243: /* 'ó' */ chars.push('o'); break;
        case 242: /* 'ò' */ chars.push('o'); break;
        case 244: /* 'ô' */ chars.push('o'); break;
        case 233: /* 'é' */ chars.push('e'); break;
        case 232: /* 'è' */ chars.push('e'); break;
        case 234: /* 'ê' */ chars.push('e'); break;
        case 237: /* 'í' */ chars.push('i'); break;
        case 238: /* 'î' */ chars.push('i'); break;
        case 250: /* 'ú' */ chars.push('u'); break;
        case 249: /* 'ù' */ chars.push('u'); break;
        case 251: /* 'û' */ chars.push('u'); break;
        case 199: /* 'Ç' */ chars.push('c'); break;
        case 195: /* 'Ã' */ chars.push('a'); break;
        case 193: /* 'Á' */ chars.push('a'); break;
        case 192: /* 'À' */ chars.push('a'); break;
        case 194: /* 'Â' */ chars.push('a'); break;
        case 213: /* 'Õ' */ chars.push('o'); break;
        case 211: /* 'Ó' */ chars.push('o'); break;
        case 210: /* 'Ò' */ chars.push('o'); break;
        case 212: /* 'Ô' */ chars.push('o'); break;
        case 201: /* 'É' */ chars.push('e'); break;
        case 200: /* 'È' */ chars.push('e'); break;
        case 202: /* 'Ê' */ chars.push('e'); break;
        case 205: /* 'Í' */ chars.push('i'); break;
        case 206: /* 'Î' */ chars.push('i'); break;
        case 218: /* 'Ú' */ chars.push('u'); break;
        case 217: /* 'Ù' */ chars.push('u'); break;
        case 219: /* 'Û' */ chars.push('u'); break;
        default:
          chars.push(a_text.charAt(i));
      }
    }
    return chars.join('');
  };

}
