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

var EPaperTooltip_Initialize = function(a_root) {

  /**
   * @brief Input box constructor
   *
   * @param a_epaper     Parent EPaper object
   */
  a_root.EPaperTooltip = function (a_epaper, a_background, a_foreground) {

    EPaperWidget.call(this, a_epaper, a_background || "#000000", a_foreground || "#FFFFFF");

    this._font     = 10 * this._epaper._ratio + 'px DejaVu Sans Condensed';
    this._text     = '';

    this.set_size(200 * this._epaper._ratio, 30 * this._epaper._ratio);

    this._tip_height   = EPaperTooltip.TIP_HEIGHT * this._epaper._ratio;
    this._tip_base     = EPaperTooltip.TIP_BASE   * this._epaper._ratio;
    this._radius       = EPaperTooltip.RADIUS     * this._epaper._ratio;
    this._hpadding     = EPaperTooltip.HPAD       * this._epaper._ratio;
    this._tip_location = 0.5;
    this._tip_edge     = EPaperTooltip.NORTH;
    this._alpha        = 0.75;
  };

  /**
   * @brief Prototype inherits from Widget
   */
  EPaperTooltip.prototype = Object.create(EPaperWidget.prototype, {
    constructor: {
      configurable: true,
      enumarable: true,
      value: EPaperTooltip.prototype,
      writable: true
    }
  });

  /*
   * Static constants
   */
  EPaperTooltip.NORTH      = 1;  // Tooltip arrow points up
  EPaperTooltip.EAST       = 2;  // Tooltip arrow points right
  EPaperTooltip.SOUTH      = 3;  // Tooltip arrow points down
  EPaperTooltip.WEST       = 4;  // Tooltip arrow points left
  EPaperTooltip.TIP_HEIGHT = 5;  // Default arrow height in px
  EPaperTooltip.TIP_BASE   = 10; // Default arrow base in px
  EPaperTooltip.RADIUS     = 5;  // Default rounded rectangle radius in px
  EPaperTooltip.HPAD       = 5;  // Default horizontal padding

  /**
   * @brief Setter to change font
   *
   * @param a_font the font to use
   * @return daz widget
   */
  EPaperTooltip.prototype.set_font = function (a_font) {
    this._font = a_font;
    this._state |= EPaperWidget.IS_FG_DIRTY;
    return this;
  };

  /**
   * @brief Setter to change text
   *
   * @param a_text the new text
   * @return daz widget
   */
  EPaperTooltip.prototype.set_text = function (a_text) {
    this._text   = a_text;
    this._state |= EPaperWidget.IS_FG_DIRTY;
    return this;
  };

  /**
   * @brief Setter to change the location of the tip arrow along the edge
   *
   * @param a_percent 0 to the left/upwards 1.0 to the right downwards
   * @return daz widget
   */
  EPaperTooltip.prototype.set_tip_location = function (a_percent) {
    this._tip_location = a_percent;
    this._state |= EPaperWidget.IS_FG_DIRTY;
    return this;
  };

  /**
   * @brief Adjust width to the Tooltip text taking into account the specified constraints
   *
   * Horizontal size determined by the maximum text width, vertical size is determined by the number of rows
   *
   * @param a_min_width minimum width
   * @param a_max_width maximum width
   */
  EPaperTooltip.prototype.auto_width = function (a_min_width, a_max_width) {

    var font, width;

    font = this._ctx.font;

    this._ctx.font = this._font;
    width = this._ctx.measureText(this._text).width;

    switch (this._tip_edge) {
    case EPaperTooltip.EAST:
    case EPaperTooltip.WEST:
      width += this._tip_height;
      break;
    }
    width += 2 * this._hpadding;

    if ( a_min_width !== undefined && width < a_min_width) {
      width = a_min_width;
    }
    if ( a_max_width !==  undefined && width > a_max_width ) {
      width = a_min_width;
    }
    this.set_size(width, this._bb_h);
    this._ctx.font = font;
    return this;
  };

  /**
   * @brief Draw the Tooltip balloon
   */
  EPaperTooltip.prototype.draw_tooltip_shape = function () {
    var tip_location;

    this._ctx.beginPath();

    switch (this._tip_edge) {
    case EPaperTooltip.NORTH:
    default:

      this.make_round_rect_path(this._bb_x, this._bb_y + this._tip_height, this._bb_w, this._bb_h - this._tip_height, this._radius);
      tip_location = Math.round(this._bb_x + this._bb_w * this._tip_location);
      this._ctx.moveTo(tip_location, this._bb_y);
      this._ctx.lineTo(tip_location + Math.round(this._tip_base / 2), this._bb_y + this._tip_height);
      this._ctx.lineTo(tip_location - Math.round(this._tip_base / 2), this._bb_y + this._tip_height);
      this._ctx.lineTo(tip_location, this._bb_y);
      break;

    case EPaperTooltip.EAST:

      this.make_round_rect_path(this._bb_x, this._bb_y, this._bb_w - this._tip_height, this._bb_h, this._radius);
      tip_location = Math.round(this._bb_y + this._bb_h * this._tip_location);
      this._ctx.moveTo(this._bb_x + this._bb_w, tip_location);
      this._ctx.lineTo(this._bb_x + this._bb_w - this._tip_height, Math.round(tip_location - this._tip_base/ 2));
      this._ctx.lineTo(this._bb_x + this._bb_w - this._tip_height, Math.round(tip_location + this._tip_base/ 2));
      this._ctx.lineTo(this._bb_x + this._bb_w, tip_location);
      break;

    case EPaperTooltip.SOUTH:

      this.make_round_rect_path(this._bb_x, this._bb_y, this._bb_w, this._bb_h - this._tip_height, this._radius);
      tip_location = Math.round(this._bb_x + this._bb_w * this._tip_location);
      this._ctx.moveTo(tip_location, this._bb_y + this._bb_h);
      this._ctx.lineTo(tip_location + Math.round(this._tip_base / 2), this._bb_y + this._bb_h - this._tip_height);
      this._ctx.lineTo(tip_location - Math.round(this._tip_base / 2), this._bb_y + this._bb_h - this._tip_height);
      this._ctx.lineTo(tip_location, this._bb_y + this._bb_h);
      break;

    case EPaperTooltip.WEST:

      this.make_round_rect_path(this._bb_x + this._tip_height, this._bb_y, this._bb_w - this._tip_height, this._bb_h, this._radius);
      tip_location = Math.round(this._bb_y + this._bb_h * this._tip_location);
      this._ctx.moveTo(this._bb_x, tip_location);
      this._ctx.lineTo(this._bb_x + this._tip_height, Math.round(tip_location - this._tip_base/ 2));
      this._ctx.lineTo(this._bb_x + this._tip_height, Math.round(tip_location + this._tip_base/ 2));
      this._ctx.lineTo(this._bb_x, tip_location);
      break;
    }

    this._ctx.closePath();
    this._ctx.fill();
  };

  /**
   * @brief Draw text adjusting location and clipping according to the tip edge
   */
  EPaperTooltip.prototype.draw_text = function () {
    var text_center_line, text_center_point;

    this._ctx.beginPath(); // Begin clipping path

    switch (this._tip_edge) {
    case EPaperTooltip.NORTH:
    default:

      text_center_line  = Math.round(this._bb_y + this._tip_height + ((this._bb_h - this._tip_height) / 2));
      text_center_point = Math.round(this._bb_x + this._bb_w / 2);
      this._ctx.rect(this._bb_x + this._hpadding, this._bb_y + this._tip_height, this._bb_w - (2 * this._hpadding), this._bb_h - this._tip_height);
      break;

    case EPaperTooltip.EAST:

      text_center_line = Math.round(this._bb_y + this._bb_h / 2);
      text_center_point = Math.round(this._bb_x + (this._bb_w - this._tip_height) / 2);
      this._ctx.rect(this._bb_x + this._hpadding, this._bb_y, this._bb_w - (2 * this._hpadding) - this._tip_height, this._bb_h);
      break;

    case EPaperTooltip.WEST:

      text_center_line = Math.round(this._bb_y + this._bb_h / 2);
      text_center_point = Math.round(this._bb_x + (this._bb_w - this._tip_height) / 2 + this._tip_height);
      this._ctx.rect(this._bb_x + this._hpadding + this._tip_height, this._bb_y, this._bb_w - 2 * this._hpadding - this._tip_height, this._bb_h);
      break;

    case EPaperTooltip.SOUTH:

      text_center_line = Math.round(this._bb_y + (this._bb_h - this._tip_height) / 2);
      text_center_point = Math.round(this._bb_x + this._bb_w / 2);
      this._ctx.rect(this._bb_x + this._hpadding, this._bb_y, this._bb_w - 2 * this._hpadding, this._bb_h - this._tip_height);
      break;
    }

    this._ctx.clip();
    this._ctx.textBaseline = 'middle';
    this._ctx.textAlign    = 'center';
    this._ctx.fillText(this._text, text_center_point, text_center_line);
  };

  /**
   * @brief Paint method for the Tooltip
   */
  EPaperTooltip.prototype.paint = function () {

    EPaperWidget.prototype.paint.call(this);

    if ( (this._state & (EPaperWidget.IS_VISIBLE | EPaperWidget.IS_FG_DIRTY)) === (EPaperWidget.IS_VISIBLE | EPaperWidget.IS_FG_DIRTY) ) {
      if ( this._background !== undefined ) {
        this._epaper._ctx.putImageData(this._background, this._bb_x, this._bb_y + this._epaper._translate_y);

        this._ctx.save();

        this._ctx.globalAlpha = this._alpha;
        this._ctx.fillStyle   = this._bg_color;
        this.draw_tooltip_shape();

        this._ctx.globalAlpha  = 1.0;
        this._ctx.fillStyle    = this._fg_color;
        this._ctx.font         = this._font;
        this.draw_text();

        this._ctx.restore();
        this._state &= ~EPaperWidget.IS_FG_DIRTY;
      }
    }
  };

}