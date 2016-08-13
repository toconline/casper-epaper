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

// http://fortuito.us/diveintohtml5/canvas.html#divingin info about precison cancas with half pixels
// http://www.html5rocks.com/en/tutorials/canvas/hidpi/

// https://medium.com/the-javascript-collection/lets-write-fast-javascript-2b03c5575d9e
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations

// http://www.w3schools.com/html/html_form_input_types.asp
// http://javascript.info/tutorial/keyboard-events
// Make a web font loader for real to avoid FOUT for real
// https://github.com/typekit/webfontloader#custom
// http://webdesign.tutsplus.com/articles/quick-tip-avoid-fout-by-adding-a-web-font-preloader--webdesign-8287
// http://www.html5canvastutorials.com/tutorials/html5-canvas-image-crop/
// http://www.html5tutorial.info/html5-canvas-text.php base line info!
// Performance JS ! https://developers.google.com/web/fundamentals/performance/rendering/optimize-javascript-execution?hl=en#know-your-javascripts-frame-tax

(function(root) {

  root.EPaper = function (a_url, a_port, a_uri, a_canvas, a_scroll_container, a_asset_url, a_asset_digest) {

    this._socket            = new EPaperSocket(this, a_url, a_port, a_uri);
    this._listener          = undefined;
    this._canvas            = a_canvas;
    this._canvas_width      = a_canvas.width;
    this._canvas_height     = a_canvas.height;
    this._scroll_container_ = a_scroll_container;
    this._ctx               = this._canvas.getContext('2d', {alpha: false});
    this._initial_pointer   = this._canvas.style.cursor;
    this._ctx.globalCompositeOperation = 'copy';
    this._page_count        = 0;
    this._page_number       = 1;
    this._message           = '';
    this._r_idx             = 0.0;
    this._bands             = undefined;
    this._document_id       = undefined;
    this._widgets           = [];
    this._images            = {};
    this._widget_under_mice = undefined;
    this._is_focused        = false;
    this._focused_band_id   = undefined;
    this._redraw_timer_key  = '_epaper_redraw_timer_key';
    this.reset_render_state();

    this._page_width  = 595.0;
    this._page_height = 842.0;
    this._grid_major  = 0.0;
    this._grid_minor  = 0.0;

    this._is_socket_open = false;

    // Variables to save the object context
    this._saved_idx         = 0.0;
    this._saved_draw_string = '';

    var devicePixelRatio  = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1.6) {
      devicePixelRatio = 2;
    } else {
      devicePixelRatio = 1;
    }
    var backingStoreRatio = this._ctx.webkitBackingStorePixelRatio ||
                            this._ctx.mozBackingStorePixelRatio ||
                            this._ctx.msBackingStorePixelRatio ||
                            this._ctx.oBackingStorePixelRatio ||
                            this._ctx.backingStorePixelRatio || 1;
    this._ratio = devicePixelRatio / backingStoreRatio;
    console.log("=== devicePixelRatio: " + devicePixelRatio + " backingStoreRatio: " + backingStoreRatio + " ratio: " + this._ratio);

    // ... config assets url and then load the assets ...
    this.load_assets(a_asset_url, a_asset_digest);

    this._edition   = false;
    this._input_box = new EPaperInput(this);

    // ... Install handlers ...
    this._canvas.addEventListener('mousemove', this.create_move_handler(this));
    this._canvas.addEventListener('mousedown', this.create_mouse_down_handler(this));
    this._canvas.addEventListener('mouseup'  , this.create_mouse_up_handler(this));
    this._canvas.addEventListener('focus'    , this.create_focus_handler(this));
    this._canvas.addEventListener('blur'     , this.create_blur_handler(this));
    this._canvas.addEventListener('focusout' , this.create_blur_handler(this));
    this._canvas.addEventListener('paste'    , this.create_html_onpaste_handler(this));
    this._canvas.onkeydown  = this.create_onkeydown_handler(this);
    this._canvas.onkeypress = this.create_onkeypress_handler(this);
    this._canvas.contentEditable = false;

    this._canvas.addEventListener ("textInput", function(a_event) {  }, true );

    // ... clear band tearing control variables ...
    this.reset_band_tearing();

    // ... clear the page before we start ...
    this.setup_scale();

    // ... FOUT Mitigation @TODO proper FOUT mitigation ...
    var styles    = ['', 'bold ', 'italic ', 'italic bold '];
    var y = 175;
    this._ctx.save();
    this._ctx.fillStyle = "#F0F0F0"
    this._ctx.textAlign="center";
    this._font_spec[this.SIZE_INDEX] = 20;
    for ( var i = 0; i < styles.length; i++ ) {
      this._font_spec[this.BOLD_INDEX] = styles[i];
      this._ctx.font = this._font_spec.join('');
      this._ctx.fillText("Powered by Skunk e-Paper", this._canvas.width / 2, y);
      y += 35;
    }
    this._ctx.restore();

    // ... create the overlay widgetery ...
    this.create_line_context_menu();
    this.create_tear_buttons();
    this._input_box._open_combo_button.send_to_front();
    this._input_box._edit_subdocument_button.send_to_front();
  };

  root.EPaper.BTN_SIZE = 24;  // Size is in pixels not pt

  root.EPaper.prototype = {
    constructor: root.Epaper,

    /*
     * Constants
     */
    KAPPA:           .5522848,
    BOLD_MASK:       0x01,
    ITALIC_MASK:     0x02,
    UNDERLINE_MASK:  0x04,
    STRIKEOUT_MASK:  0x08,
    BOLD_INDEX:      0,
    ITALIC_INDEX:    1,
    SIZE_INDEX:      2,
    FONT_NAME_INDEX: 4,
    PUNCTURE_HEIGHT: 16,

    /**
     * @brief Band inner class holds info about each document band
     */
    Band: function () {
      /* empty ctor */
    },


    //--------------------------------------------------------------------------//

    call_rpc: function (a_invoke_id, a_command, a_success_handler, a_failure_handler) {

      a_failure_handler = a_failure_handler || function (a_epaper, a_message) {
        if ( a_epaper._listener !== undefined ) {
          a_epaper._listener.on_error(a_message);
        } else {
          alert(a_message);
        }
      }

      this.send_command(a_command, function (a_message) {

        if ( a_message.indexOf('S:error:') === 0 || a_message.indexOf('S:exception:') === 0 ) {
          a_failure_handler(this, a_message);
          return;
        }

        if ( a_message.indexOf('S:ok:' + a_invoke_id) === 0 ) {
          a_success_handler(this, a_message);
        }

      });

    },

    call_rpc_promise: function (a_invoke_id, a_command, a_success_handler, a_failure_handler) {
      var deferred = Q.defer();
      var match = undefined;

      this.send_command(a_command, function (a_message) {

        if ( match = a_message.match(/^S:failure:.*?:(.*)/) ) {
          deferred.reject(JSON.parse(match[1]));
        }
        else if ( a_message.indexOf('S:error:') === 0 || a_message.indexOf('S:exception:') === 0 ) {
          deferred.reject(a_message);
        }
        else if (a_message.indexOf('S:ok:' + a_invoke_id) === 0 ) {
          deferred.resolve(a_message);
        }
      });

      return deferred.promise;
    },

    /**
     * @brief Initialize the context with the same defaults used by the server
     *
     * After server and client align the render contexts the server uses diferential updates
     */
    reset_render_state: function () {

      this._fill_color      = '#FFFFFF';
      this._text_color      = '#000000';
      this._font_spec       = ['', '', 10, 'px ', 'DejaVu Sans Condensed'];
      this._font_mask       = 0;
      this._ctx.strokeStyle = '#000000';
      this._ctx.lineWidth   = 1.0;
      this._ctx.font        = this._font_spec.join('');
    },

    /**
     * @brief Called at startup to start the deferred loading of the auxiliary graphic assets
     *
     * @param a_asset_url URL of the static asset server
     * @param a_digest    Hash generated by asset pipeline
     */
    load_assets: function (a_asset_url, a_digest) {
      var asset_debug = false;

      this._puncture_static_img  = this.load_asset(asset_debug, a_asset_url , 'puncture_static' + a_digest + '.png');
      this._top_puncture_img     = this.load_asset(asset_debug, a_asset_url , 'top_puncture'    + a_digest + '.png');
      this._bottom_puncture_img  = this.load_asset(asset_debug, a_asset_url , 'bottom_puncture' + a_digest + '.png');

      root.EPaperOverlayButton.load_assets(this, asset_debug, a_asset_url, a_digest);
    },

    /**
     * @brief Loads an auxiliary image resource
     *
     * @param a_asset_debug when true loading errors cause a pesky alert box to appear
     * @param a_asset_url URL of the static asset server
     * @param a_image_path file name relative to the asset URL
     *
     * @return  a_image the variable that will hold the image object
     */
    load_asset: function (a_asset_debug, a_asset_url, a_image_path) {
      var image = new Image();

      image.onload = function () {
        if ( a_asset_debug ) {
          console.log("Loaded " + a_image_path + " " + this.width + "x" + this.height);
        }
      };
      image.onerror = function () {
        alert("Missing resource " + this.src);
      }
      image.src = a_asset_url + a_image_path;
      return image;
    },

    paint_grid: function (a_major, a_minor) {
      var width  = this._canvas.width;
      var height = this._canvas.height;
      var x      = 0;
      var y      = 0;

      this._ctx.beginPath();
      this._ctx.strokeStyle = "#C0C0C0";
      this._ctx.lineWidth   = 0.15;
      for ( x = 0; x < width; x += a_minor ) {
        if ( (x % a_major) != 0 ) {
          this._ctx.moveTo(x,0);
          this._ctx.lineTo(x,height);
        }
      }
      for ( y = 0; y < height; y += a_minor ) {
        if ( (y % a_major) != 0 ) {
          this._ctx.moveTo(0,y);
          this._ctx.lineTo(width, y);
        }
      }
      this._ctx.stroke();

      this._ctx.beginPath();
      this._ctx.strokeStyle = "#C0C0C0";
      this._ctx.lineWidth   = 0.5;
      for ( x = 0; x < width; x += a_minor ) {
        if ( (x % a_major) == 0 ) {
          this._ctx.moveTo(x,0);
          this._ctx.lineTo(x,height);
        }
      }
      for ( y = 0; y < height; y += a_minor ) {
        if ( (y % a_major) == 0 ) {
          this._ctx.moveTo(0,y);
          this._ctx.lineTo(width, y);
        }
      }
      this._ctx.stroke();
      this._ctx.strokeStyle = "#000000";
    },

    get_double: function() {

      var fractional    = 0.0;
      var whole         = 0.0;
      var negative      = false;
      var parsing_whole = true;
      var divider       = 1.0;
      var current_c     = "";

      if (this._message[this._r_idx] == '-') {
        negative = true;
        this._r_idx++;
      }

      while ( true ) {
        current_c = this._message[this._r_idx++];
        switch (current_c) {
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            if (parsing_whole) {
              whole *= 10.0;
              whole += current_c - '0';
            } else {
              fractional *= 10.0;
              fractional += current_c - '0';
              divider    *= 10.0;
            }
            break;
          case '.':
            parsing_whole = false;
            break;
          case ',':
          case ';':
            if ( negative == false ) {
              return (whole + fractional / divider);
            } else {
              return -(whole + fractional / divider);
            }
            break;  // Not reached
          default:
            return NaN;
        }
      }
    },

    on_paint_message: function (a_message) {

      this._r_idx   = 1;
      this._message = a_message;
      this.paint_band();
    },

    apply_translation: function () {
      if ( this._translate_y !== 0 ) {
        this._ctx.setTransform(1, 0, 0, 1, 0, this._translate_y);
        this._ctx.rect(0,0,this._canvas.width, this._band_tear_gap);
        this._ctx.clip();
      }
    },

    clear_page: function () {
      var saved_fill = this._ctx.fillStyle;

      this.apply_translation();
      this._ctx.fillStyle = this._background_color;
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
      if ( this._grid_major !== 0.0 ) {
        this.paint_grid(this._grid_major, this._grid_minor);
      }
      this._ctx.fillStyle = saved_fill;
    },

    /**
     * @brief Repaints the whole page using the saved bands array
     *
     * Bands are painted top to down to preserve the overlaps between bands, Z level of uppermost band is
     * always bellow the next band
     *
     * @note This function must keep the object context and canvas context unmodified
     */
    repaint_page: function () {
      var band;

      this.reset_redraw_timer();

      // ... prevent page updated when the tear animation is closing ...
      if ( this._band_tearing === false && this._band_tear_max_gap !== 0 ) {
        return;
      }

      //console.time("repaint_page");

      // ... save context clear the complete canvas ...
      this.save_paint_context();
      this._ctx.save();
      this.clear_page();

      // ... repaint the bands top to down to respect the painter's algorithm ...
      if ( this._bands !== undefined ) {
        for ( var i = 0; i < this._bands.length; i++ ) {

          band = this._bands[i];
          this._r_idx       = band._idx;
          this._message     = band._draw_string;
          this.paint_band();
        }
      }

      // ... now that whole page was redrawn recapture the input box background and repaint ...
      if ( this._input_box._enabled ) {
        this._input_box.update_background();
        this._input_box.paint_input();
      }

      // ... at last refresh the widgets backgrounds forcing a repaint of all visible widgets ...
      this.update_widgets_background();
      this.repaint_widgets_martelado();

      this._ctx.restore();
      this.restore_paint_context();

      //console.timeEnd("repaint_page");
    },

    save_paint_context: function () {
      this._saved_idx         = this._r_idx;
      this._saved_draw_string = this._message;
    },

    restore_paint_context: function () {
      this._r_idx           = this._saved_idx;
      this._message         = this._saved_draw_string;
    },

    paint_string: function (a_draw_string) {

      this._message = a_draw_string;
      this._r_idx   = 0;
      this.paint_band();
    },

    paint_band: function () {

      var do_paint   = true;
      var option     = '';
      var option_num = 0.0;
      var x          = 0.0;
      var y          = 0.0;
      var x2         = 0.0;
      var y2         = 0.0;
      var r          = 0.0;
      var w          = 0.0;
      var h          = 0.0;
      var sx         = 0.0;
      var sy         = 0.0;
      var sh         = 0.0;
      var sw         = 0.0;
      var t1,t2,t3;

      this.reset_render_state();
      while (this._r_idx < this._message.length) {

        switch ( this._message[this._r_idx++] ) {

          /*
           * === 'Z' [d] Zap clear the screen Z, Zd clear the band array but keeps screen content;
           */
          case 'Z':

            if ( this._message[this._r_idx] === 'd' ) {
              this.reset_render_state();
              this._r_idx++;
            } else {
              this.clear_page();
            }
            this._r_idx++;
            this._bands = undefined;
            this._bands = [];
            break;

          /*
           * === 'B' Store and paint Band B<len>,<type>,<id>,<height>,<tx>,<ty>;
           * === 'b' Store Band B<len>,<type>,<id>,<height>,<tx>,<ty>;
           */
          case 'B':
          case 'b':

            option = this._message[this._r_idx - 1];
            w      = this.get_double();
            t1     = this._message.substring(this._r_idx, this._r_idx + w); // Band type
            this._r_idx += w + 1;
            w = this.get_double();                                          // Band ID
            t2     = this._message[this._r_idx];                           // Editable - 't' or 'f'
            this._r_idx += 2;
            h = this.get_double();                                          // Band height
            x = this.get_double();
            y = this.get_double();

            // ... search for a band with same id on the stored band array ...
            var band = null;
            sx = this.binary_find_band_by_id(w);
            if ( sx !== -1 ) {
              band = this._bands[sx];
            } else {
              band = null;
            }

            // ... if the id is not found then it's a new band  ...
            if ( band === null ) {
              band = new this.Band();
              this._bands.push(band);
            }

            // ... store the current paint context on the band object
            band._type        = t1;
            band._id          = w;
            band.editable_    = 't' == t2 ? true : false;
            band._height      = h;
            band._tx          = x;
            band._ty          = y;
            band._idx         = this._r_idx;
            band._draw_string = this._message;

            if ( option === 'b' ) { // ... deferred painting leave the crayons in peace ...

              do_paint = false;

            } else { // ... deferred painting leave the crayons in peace ...

              do_paint = true;
              this._ctx.clearRect(0, 0, this._page_width, h);

            }
            break;

          /*
           * === 'U' Update page, repaint with bands stored on client side;
           */
          case 'U':

            if ( this._bands !== undefined && this._bands.length ) {
              this.repaint_page();
            }
            return;

          /*
           * === 'L' Simple line L<x1>,<y1>,<x2>,<y2>;
           */
          case 'L':

            if ( do_paint ) {

              x  = this.get_double();
              y  = this.get_double();
              x2 = this.get_double();
              y2 = this.get_double();

              this._ctx.beginPath();

              if ( x === x2 && this._ratio == 1 ) {

                w = Math.round(this._ctx.lineWidth) & 0x1 ? -0.5 : 0;
                this._ctx.moveTo(x  + w, y  + w);
                this._ctx.lineTo(x2 + w, y2 + w);

              } else if ( y === y2 && this._ratio == 1 ) {

                w = Math.round(this._ctx.lineWidth) & 0x1 ? -0.5 : 0;
                this._ctx.moveTo(x  + w, y  + w)
                this._ctx.lineTo(x2 + w, y2 + w);

              } else {

                this._ctx.moveTo(x , y);
                this._ctx.lineTo(x2, y2);

              }

              this._ctx.stroke();

            } else {
              this.get_double(); this.get_double(); this.get_double(); this.get_double();
            }
            break;

          /*
           * === 'R' Rectangle R[S|F|P|C]<x>,<y>,<w>,<h>
           */
          case 'R':

            switch (this._message[this._r_idx] ) {
              case 'S':
                this._r_idx++;
              // fall trough
              default:
                if ( do_paint ) {
                  this._ctx.strokeRect(this.get_double(), this.get_double(), this.get_double(), this.get_double());
                } else {
                  this.get_double(); this.get_double(); this.get_double(); this.get_double()
                }
                break;

              case 'F':
                this._r_idx++;
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.fillRect(this.get_double(), this.get_double(), this.get_double(), this.get_double());
                } else {
                  this.get_double(); this.get_double(); this.get_double(); this.get_double();
                }
                break;

              case 'P':
                this._r_idx++;
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.beginPath();
                  this._ctx.rect(this.get_double(), this.get_double(), this.get_double(), this.get_double());
                  this._ctx.fill();
                  this._ctx.stroke();
                } else {
                  this.get_double(); this.get_double(); this.get_double(); this.get_double();
                }
                break;

              case 'C':
                this._r_idx++;
                if ( do_paint ) {
                  this._ctx.clearRect(this.get_double(), this.get_double(), this.get_double(), this.get_double());
                } else {
                  this.get_double(); this.get_double(); this.get_double(); this.get_double();
                }
                break;
            }
            break;

          /*
           * === 'r'  Rounded rectangle
           *  |- 'rS' Stroke round rect          - rS<r>,<x>,<y>,<w>,<h>;
           *  |- 'rF' Fill round rect            - rF<r>,<x>,<y>,<w>,<h>;
           *  |- 'rP' Fill and stroke round rect - rP<r>,<x>,<y>,<w>,<h>;
           */
          case 'r':

            option = this._message[this._r_idx];
            switch (option) {
              case 'S':
              case 'F':
              case 'P':
                this._r_idx++;
                break;
              default:
                option = 'S';
                break;
            }
            r = this.get_double();
            x = this.get_double();
            y = this.get_double();
            w = this.get_double();
            h = this.get_double();
            if ( do_paint ) {
              this._ctx.beginPath();
              this._ctx.moveTo( x + r, y );
              this._ctx.arcTo(  x + w , y     , x + w     , y + r     , r);
              this._ctx.arcTo(  x + w , y + h , x + w - r , y + h     , r);
              this._ctx.arcTo(  x     , y + h , x         , y + h - r , r);
              this._ctx.arcTo(  x     , y     , x + r     , y         , r);
              this._ctx.closePath();
            }
            switch(option) {
              case 'S':
                if ( do_paint ) {
                  this._ctx.stroke();
                }
                break;

              case 'F':
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.fill();
                }
                break;

              case 'P':
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.fill();
                  this._ctx.stroke();
                }
                break;
            }
            break;

          /*
           * === 'e' Prepare   editor ep<x>,<y>,<w>,<h>;
           *  |- 'e' Start     editor es<options>,<text_x>,<text_y>,<max_width>,<length>,<text>;
           *  |- 'e' Update    editor eu<length>,<text>,<highlight_len>,<highlight>;
           *  |- 'e' Finish    editor ef<length>,<text>,<highlight_len>,<highlight>;
           *  |- 'e' Configure editor ec TODO
           *  |- 'e' Tooltip hint   eh<x>,<y>,<w>,<h>,<length>,<tooltip text>
           */
          case 'e':

            option = this._message[this._r_idx];
            this._r_idx++;
            this._ctx.save();
            if ( option === 'c') {  // Configure editor

              // ... clear the sub document variables ...
              this._sub_document_uri   = undefined;
              this._sub_document_jrxml = undefined;

              var edit_mode = this._message[this._r_idx++];
              switch ( edit_mode ) {

              case 'r': // 'r' Text, but read only
                if ( ',' === this._message[this._r_idx] ) {
                  this._r_idx++;
                  w = this.get_double();
                  this._sub_document_uri = this._message.substring(this._r_idx, this._r_idx + w);
                  this._r_idx += w + 1; // +1 -> ','
                  console.log("Open URI: " + this._sub_document_uri)
                  w = this.get_double();
                  this._sub_document_jrxml = this._message.substring(this._r_idx, this._r_idx + w);
                  this._r_idx += w;
                  console.log("Open JRXML: " + this._sub_document_jrxml)
                }
                this._input_box.configure_editor(edit_mode, this._sub_document_jrxml);
                this._r_idx += 1; // 't'
                break;

              case 't':  // Text ( default )

                this._input_box.configure_editor(edit_mode);
                this._r_idx += 1; // 't'
                break;

              case 'd': // ... [,<length>,<pattern>] ...

                if ( ',' === this._message[this._r_idx] ) {
                  this._r_idx++;
                  w = this.get_double();
                  this._input_box.configure_editor(edit_mode, this._message.substring(this._r_idx, this._r_idx + w));
                  this._r_idx += w;
                } else {
                  this._input_box.configure_editor(edit_mode);
                }
                this._r_idx++;
                break;

              case 'n':  // ... Number [,<length>,<pattern>] ...

                if ( ',' === this._message[this._r_idx] ) {
                    this._r_idx++;
                    w = this.get_double();
                    this._input_box.configure_editor(edit_mode, this._message.substring(this._r_idx, this._r_idx + w));
                    this._r_idx += w;
                } else {
                  this._input_box.configure_editor(edit_mode);
                }
                this._r_idx++;
                break;

              case 'c':  // 'c' <empty_line><length>,<field_id>,<length>,<display_field>{,<length>,<field>}[,<length>,<list json>] Simple combo client side

                // empty_line: 0 or 1
                // console.log("Combo Empty Line: " + this.get_double());
                var nullable_list = this.get_double();
                // fields '}'
                var fields = [];
                w = this.get_double();
                if ( w > 2 ) {
                  var tmp = this._message.substring(this._r_idx + 1, this._r_idx + w - 1);
                  fields = tmp.split(',');
                  //console.log("Combo FIELDS: " + fields);
                }
                this._r_idx += w + 1;

                // list id
                w  = this.get_double();
                t2 = this._message.substring(this._r_idx, this._r_idx + w);
                //console.log("Combo list id: " + t2);
                this._r_idx += w + 1;

                // sub document params <length>,<uri>,<length>,<jrxml>
                w = this.get_double();
                if ( w == 0 ) {
                  this._sub_document_uri = undefined;
                } else {
                  this._sub_document_uri = this._message.substring(this._r_idx, this._r_idx + w);
                }
                this._r_idx += w + 1;
                w = this.get_double();
                if ( w == 0 ) {
                  this._sub_document_jrxml = undefined;
                } else {
                  this._sub_document_jrxml = this._message.substring(this._r_idx, this._r_idx + w);
                }
                this._r_idx += w;

                // list [optional]
                if ( ',' === this._message[this._r_idx] ) {
                  this._r_idx++;
                  w  = this.get_double();
                  t3 = this._message.substring(this._r_idx, this._r_idx + w);
                  //console.log("Combo JSON: " + t3);
                  this._r_idx += w;
                } else {
                  t3 = undefined;
                }

                this._input_box.configure_editor(edit_mode, this._sub_document_jrxml, nullable_list);
                this._input_box._combo_box_list.set_display_fields(fields);
                this._input_box._combo_box_list.set_model(t2,t3);
                this._r_idx++;
                break;

              case 'R': // 'R'<idx>,<length>,<variable>,<lenght>,<value_array>

                x  = this.get_double();                                      // -1 for parameters, row index for fields
                w  = this.get_double();
                t1 =this._message.substring(this._r_idx, this._r_idx + w);   // variable name, parameter ou field
                this._r_idx += w + 1; // + 1 -> ','
                w  = this.get_double();
                t2 =this._message.substring(this._r_idx, this._r_idx + w);   // Array with current and possible values
                this._r_idx += w + 1; // +1 -> ';''
                console.log(' Prepare radio button: idx=' + x + ', var=' + t1 + ', values=' + JSON.parse(t2));
                this._input_box.configure_editor(edit_mode);
                break;

              case 'C': // 'C'[,<length>,<uri>,<length>,<jrxml>] Combos server side, IVAS, Rubricas, Centros de Custo

                if ( ',' === this._message[this._r_idx] ) {
                  this._r_idx++;
                  w = this.get_double();
                  this._sub_document_uri = this._message.substring(this._r_idx, this._r_idx + w);
                  this._r_idx += w;
                  this._r_idx++; // ','
                  w = this.get_double();
                  this._sub_document_jrxml = this._message.substring(this._r_idx, this._r_idx + w);
                  this._r_idx += w;
                }
                this._input_box.configure_editor(edit_mode, this._sub_document_jrxml);
                this._r_idx += 1;
                break;

              case 'l':  // 'l' Combo that searches on a ledger tree

                this._input_box.configure_editor(edit_mode);

                var fields = [];
                w = this.get_double();
                if ( w > 2 ) {
                  var tmp = this._message.substring(this._r_idx + 1, this._r_idx + w - 1);
                  fields = tmp.split(',');

                  //console.log("Combo FIELDS: " + fields);
                }
                this._input_box._combo_box_list.set_display_fields(fields);
                this._r_idx += w + 1;
                break;

              default:
                break;
              }

            } else if ( option === 'p' ) { // Prepare editor

              x = this.get_double();
              y = this.get_double();
              w = this.get_double();
              h = this.get_double();
              this._input_box.prepare_editor(x, y, w, h, this._message.substring(this._r_idx));
              this.update_context_menu(y + h / 2);

              return; // The rest of the draw string is just stored it will be painted by the editor

            } else if ( option === 's' ) { // ... start editor ...

              x = this.get_double();
              y = this.get_double();
              h = this.get_double();
              this._focused_band_id = this.get_double();

              if ( '{' === this._message[this._r_idx] ) {
                this._r_idx += 1; // '{'

                w = this.get_double();
                var id = this._message.substring(this._r_idx, this._r_idx + w);
                this._r_idx += w + 1;

                w = this.get_double();
                var value = this._message.substring(this._r_idx, this._r_idx + w);
                this._r_idx += w + 1; // +1 -> '}'

                //console.log("Start Combo: " + id + ", " + value);

                this._input_box._start_editor_handler(x, y, h, id);

              } else {
                w = this.get_double();
                this._input_box._start_editor_handler(x, y, h, this._message.substring(this._r_idx, this._r_idx + w));
                this._r_idx += w;
              }
              this._r_idx += 1;

              if ( false == this._band_tearing ) {
                this.adjust_scroll();
              }

            } else if ( option === 'u' ) {  // ... update editor ...

              w  = this.get_double();
              t1 = this._message.substring(this._r_idx, this._r_idx + w);
              this._r_idx += w;
              if ( this._message[this._r_idx] !== ';' ) {
                this._r_idx += 1;
                w  = this.get_double();
                t2 = this._message.substring(this._r_idx, this._r_idx + w);
                this._r_idx += w;

                if ( this._message[this._r_idx] !== ';' ) {
                  this._r_idx += 1;
                  w  = this.get_double();
                  t3 = this._message.substring(this._r_idx, this._r_idx + w);
                  this._r_idx += w + 1;
                } else {
                  this._r_idx += 1;
                  t3 = '';
                }
              } else {
                this._r_idx += 1;
                t2 = '';
                t3 = '';
              }
              console.log("=== update: t1='" + t1 + "' t2='" + t2 + "' t3='" + t3 + "'");

              if ( ';' !== this._message[this._r_idx - 1] ) {
                w = this.get_double();

                var json = this._message.substring(this._r_idx, this._r_idx + w);

                this._input_box.update_combo_list(undefined, json);

                //console.log("JSON: " + json);

                this._r_idx += w + 1;
              } else {
                this._input_box.update_combo_list(undefined, '[]');
              }

              if ( this._input_box._enabled ) {
                this._input_box._update_editor_handler(t1, t2, t3);
              }

            } else if ( option === 'f' ) { // ... finish or stop the editor ...

              if ( this._input_box._enabled ) {
                this._input_box._stop_editor_handler();
              }
              this._r_idx += 1;

              // ... clear the sub document variables ...
              this._sub_document_uri   = undefined;
              this._sub_document_jrxml = undefined;
            } else if ( option == 'b' ) {

              this._r_idx += 1;

              /*this.get_double();
              this.get_double();
              this.get_double();
              this.get_double();
              */
              var tmp_stroke_style = this._ctx.strokeStyle;
              this._ctx.strokeStyle = "#FF0000";
              this._ctx.strokeRect(this.get_double(), this.get_double(), this.get_double(), this.get_double());
              this._ctx.strokeStyle = tmp_stroke_style;

            } else if ( option === 'h' ) { // ... tootip hint ...

              x  = this.get_double();
              y  = this.get_double();
              w  = this.get_double();
              h  = this.get_double();
              w  = this.get_double();
              t1 = this._message.substring(this._r_idx, this._r_idx + w);
              this._input_box._tooltip_handler(x, y, w, h, t1);
              this._r_idx += w + 1;
            }

            this._ctx.restore();
            break;

          /*
           * === 'T' Draw text
           */
          case 'T':

            option = this._message[this._r_idx];
            if ( option === 'S' || option === 'F' || option === 'P' ) {
              this._r_idx++;
            } else {
              option = 'F';
            }
            x = this.get_double();
            y = this.get_double();
            w = this.get_double();
            this._t = this._message.substring(this._r_idx, this._r_idx + w);
            this._r_idx += w;
            if ( this._message[this._r_idx] == ',') {
              this._r_idx++;
              option_num = this.get_double();

              switch (option) {
                case 'F':
                  this._ctx.fillStyle = this._text_color;
                  if ( do_paint ) {
                    this._ctx.fillText(this._t, x, y, option_num);
                  }
                  break;

                case 'S':
                  if ( do_paint ) {
                    this._ctx.strokeText(this._t, x, y, option_num);
                  }
                  break;

                case 'P':
                  this._ctx.fillStyle = this._text_color;
                  if ( do_paint ) {
                    this._ctx.fillText(this._t, x, y, option_num);
                    this._ctx.strokeText(this._t, x, y, option_num);
                  }
                  break;
              }

            } else {
              this._r_idx++;
              switch (option) {
                case 'F':
                  this._ctx.fillStyle = this._text_color;
                  if ( do_paint ) {
                    this._ctx.fillText(this._t, x, y);
                  }
                  break;

                case 'S':
                  if ( do_paint ) {
                    this._ctx.strokeText(this._t, x, y);
                  }
                  break;

                case 'P':
                  this._ctx.fillStyle = this._text_color;
                  if ( do_paint ) {
                    this._ctx.fillText(this._t, x, y);
                    this._ctx.strokeText(this._t, x, y);
                  }
                  break;
              }
            }
            this._ctx.fillStyle = this._fill_color;
            break;

          /*
           * === 'P' Path TODO
           */
          case 'P':
            break;

          /*
           * === 'C' Fill color
           */
          case 'C':

            this._fill_color = "#" + this._message.substring(this._r_idx, this._r_idx + 6);
            this._r_idx += 7;
            break;

          /*
           * === 'c' Text fill color
           */
          case 'c':

            this._text_color = "#" + this._message.substring(this._r_idx, this._r_idx + 6);
            this._r_idx += 7;
            break;

          /*
           * === 'w' Stroke Width w<width>;
           */
          case 'w':

            w = this.get_double();
            if ( w <= 1 ) {
              w = this._ratio;
            }
            this._ctx.lineWidth = w;
            break;

          /*
           * === 's' Stroke Color TODO alfa support ??
           */
          case 's':

            this._ctx.strokeStyle = "#" + this._message.substring(this._r_idx, this._r_idx + 6);
            this._r_idx += 7;
            break;

          /*
           * === 'p' Line pattern TODO
           */
          case 'p':
            break;

          /*
           * === 'E' Ellipse
           */
          case 'E':

            option = this._message[this._r_idx];
            if ( option == 'S' || option == 'F' || option == 'P' ) {
              this._r_idx++;
            } else {
              option = 'F';
            }
            x = this.get_double();
            y = this.get_double();
            w = this.get_double();
            h = this.get_double();
            var ox = (w / 2) * this.KAPPA,
                oy = (h / 2) * this.KAPPA,
                xe = x + w,
                ye = y + h,
                xm = x + w / 2,
                ym = y + h / 2;

            if ( do_paint ) {
              this._ctx.beginPath();
              this._ctx.moveTo(x, ym);
              this._ctx.bezierCurveTo(x       , ym - oy , xm - ox , y       , xm, y);
              this._ctx.bezierCurveTo(xm + ox , y       , xe      , ym - oy , xe, ym);
              this._ctx.bezierCurveTo(xe      , ym + oy , xm + ox , ye      , xm, ye);
              this._ctx.bezierCurveTo(xm - ox , ye      , x       , ym + oy , x , ym);
            }
            switch (option) {
              case 'F':
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.fill();
                }
                break;

              case 'S':
                if ( do_paint ) {
                  this._ctx.stroke();
                }
                break;

              case 'P':
                this._ctx.fillStyle = this._fill_color;
                if ( do_paint ) {
                  this._ctx.fill();
                  this._ctx.stroke();
                }
                break;
            }

            break;

          /*
           * === 'I' Image : I<url_chars_count>,<url>,<x>,<y>,<w>,<h>
           * === 'I' Image : I<url_chars_count>,<url>,<x>,<y>,<w>,<h>,<sx>,<sy>,<sw>,<sh>
           */
          case 'I':

            w = this.get_double();
            this._t = this._message.substring(this._r_idx, this._r_idx + w);
            this._r_idx += w + 1;

            x = this.get_double();
            y = this.get_double();
            w = this.get_double();
            h = this.get_double();
            if ( this._message[this._r_idx - 1] != ';' ) {
              sx = this.get_double();
              sy = this.get_double();
              sw = this.get_double();
              sh = this.get_double();
            } else {
              sx = -1.0;
            }
            var img = this._images[this._t];
            if ( img === undefined ) {
              var self = this;
              img = new Image();
              img.onload = function() {
                self.restart_redraw_timer();
              }
              img.onerror = function() {
                self._images[this.src] = undefined;
              }
              img.src = this._t;
              this._images[this._t] = img;
            }
            if ( img.complete && typeof img.naturalWidth !== undefined && img.naturalWidth !== 0 ) {
              try {
                if ( sx !== -1.0 ) {
                  this._ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
                } else {
                  this._ctx.drawImage(img, x, y, w, h);
                  //console.log("=== Draw image @" + x + "," + y + " " + w + "x" + h);
                  //this._ctx.drawImage(this.step_down(img, w,h), x, y, w, h);
                }
              } catch (a_err) {
                // Keep the faulty image in the cache to avoid bombarding the server with broken requests
              }
            }
            break;

          /*
           * === 'F' Set font name F<len>,<font name>;
           */
          case 'F':

            w = this.get_double();
            this._t = this._message.substring(this._r_idx, this._r_idx + w);
            this._r_idx += w + 1;
            this._font_spec[this.FONT_NAME_INDEX] = this._t;
            this._ctx.font = this._font_spec.join('');
            break;

          /*
           * === 'f'  Set font flag <size>, font mask <flag_mask>,f<size>
           *  |  'fm' Set font metrics <flag_mask>,f<size>,<fFlags>, <fTop>, <fAscent>, <fDescent>, <fBottom>, <fLeading>, <fAvgCharWidth>, <fMaxCharWidth>, <fUnderlineThickness>, fUnderlinePosition>;
           */
          case 'f':
            if ( 'm' == this._message[this._r_idx] ) {
                this._r_idx++;
                this._input_box._f_flags               = this.get_double();
                this._input_box._f_top                 = this.get_double();
                this._input_box._f_ascent              = this.get_double();
                this._input_box._f_descent             = this.get_double();
                this._input_box._f_bottom              = this.get_double();
                this._input_box._f_leading             = this.get_double();
                this._input_box._f_avg_char_width      = this.get_double();
                this._input_box._f_max_char_width      = this.get_double();
                this._input_box._f_underline_thickness = this.get_double();
                this._input_box._f_underline_position  = this.get_double();
            } else {
                this._font_mask = this.get_double();
                this._font_spec[this.SIZE_INDEX]   = Math.round(this.get_double());
                this._font_spec[this.BOLD_INDEX]   = (this._font_mask & this.BOLD_MASK)   ? 'bold '   : '';
                this._font_spec[this.ITALIC_INDEX] = (this._font_mask & this.ITALIC_MASK) ? 'italic ' : '';
                this._ctx.font = this._font_spec.join('');
            }
            break;

          /*
           * === 'X' Set translation X<x>,<y>;
           */
          case 'X': //===

            this._translate_x = this.get_double();
            this._translate_y = this.get_double();
            break;

          /*
           * === 't' Apply transform
           */
          case 't':

            switch (this._message[this._r_idx++]) {
              case 'r':
                this._ctx.translate(this.get_double(), this.get_double());
                this._ctx.rotate(this.get_double());
                break;
              case 'c':
                this._ctx.setTransform(1, 0, 0, 1, 0, 0);
                this._r_idx++;
                break;
            }
            break;

          /*
           * === 'k'  Set Kanvas properties
           *  |- 'kp' Set page params - kp<width>,<height>,<page_number>,<page_count>;
           *  |- 'kg' Set grid params - kg<major>,<minor>; (use kg0,0; to disable grid)
           */
          case 'k': //===

            option = this._message[this._r_idx++];
            if ( 'g' === option ) {
              this._grid_major = this.get_double();
              this._grid_minor = this.get_double();
            } else if ( 'p' === option ) {
              var new_page_number = this.get_double();
              var new_page_count = this.get_double();

              if ( this._page_number != new_page_number || this._page_count != new_page_count ) {
                if ( this.on_page_properties_changed != undefined ) {
                  this.on_page_properties_changed(this._page_width, this._page_height, new_page_number, new_page_count);
                }
                this._page_count  = new_page_count;
                this._page_number = new_page_number;
              }
            }
            break;
        }
        if ( this._message[this._r_idx - 1] != ';' ) {
          console.log("command is not terminated ...");
        }
      }
    },

    setup_scale: function () {

      this._canvas.width  = this._canvas_width  * this._ratio;
      this._canvas.height = this._canvas_height * this._ratio;
      this._canvas.style.width  = this._canvas_width  + 'px';
      this._canvas.style.height = this._canvas_height + 'px';
      this._sx = this._canvas.width  / this._page_width;
      this._sy = this._canvas.height / this._page_height;
      this.clear_page();
    },

    /*****************************************************************************************/
    /*                                                                                       */
    /*                            ~~~ Widget management ~~~                                  */
    /*                                                                                       */
    /*****************************************************************************************/

    /**
     * @brief Permanently hide all widgets
     */
    make_widgets_invisble: function () {

      for ( var i = 0; i < this._widgets.length; i++ ) {
        this._widgets[i].set_visible(false);
      }
    },

    mouse_over_widgets: function (a_x, a_y) {

      for ( var i = this._widgets.length - 1; i ; i-- ) {
        var widget = this._widgets[i];

        if ( widget.mouse_over(a_x, a_y) ) {
          return true;
        }
      }
      return false;
    },

    mouse_click_widgets: function (a_x, a_y, a_down) {

      for ( var i = this._widgets.length - 1; i ; i-- ) {
        if ( this._widgets[i].mouse_click(a_x, a_y, a_down) ) {
          return true;
        }
      }
      return false;
    },

    /**
     * @brief Update all widgets that overlap the supplied bbox
     */
    update_widgets_background: function () {

      for ( var i = 0; i < this._widgets.length; i++ ) {
        this._widgets[i].update_background();
      }
    },

    /**
     * @brief Hide all widgets
     */
    hide_widgets: function () {

      for ( var i = 0; i < this._widgets.length; i++ ) {
        this._widgets[i].hide();
      }
    },

    /**
     * @brief Paints all (dirty) widgets
     */
    repaint_widgets_martelado: function () {

      this._ctx.save();
      for ( var i = 0; i < this._widgets.length; i++ ) {
        this._widgets[i].paint();
      }
      this._ctx.restore();
    },

    // TODO MARTELADA PARA ESCONDER ERROS DE PINTURA NAO FUNCIONA
    repaint_widgets: function () {
      this.repaint_widgets_martelado();
    },


    adjust_scroll: function () {

      var v_l  = undefined;
      var v_t  = undefined;
      var v_w  = undefined;
      var v_h  = undefined;
      var sb_w = 0;
      var sb_h = 0;

      if ( undefined !== this._scroll_container_ ) {
        v_l  = this._scroll_container_.scrollLeft;
        v_t  = this._scroll_container_.scrollTop;
        v_w  = this._scroll_container_.offsetWidth;
        v_h  = this._scroll_container_.offsetHeight;
        sb_w = this._scroll_container_.offsetWidth - this._scroll_container_.clientWidth;
        sb_h = this._scroll_container_.offsetHeight - this._scroll_container_.clientHeight;
      } else {
        v_l  = ( (window.pageXOffset || document.scrollLeft) - ( document.clientLeft || 0.0 ) ) || 0.0;
        v_t  = ( (window.pageYOffset || document.scrollTop)  - ( document.clientTop  || 0.0 ) ) || 0.0;
        v_w  = window.innerWidth;
        v_h  = window.innerHeight;
        sb_w = ( window.innerWidth - document.documentElement.clientWidth ) || 0;
        sb_h = ( window.innerHeight - document.documentElement.clientHeight ) || 0
      }

      var i_w  = ( this._input_box._bb_w / this._ratio );
      var i_h  = ( this._input_box._bb_h / this._ratio );
      var i_l  = ( this._input_box._bb_x / this._ratio );
      var i_t  = ( this._input_box._bb_y / this._ratio );

      // horizontal
      var s_x  = undefined
      if ( i_w < ( v_w - sb_w ) ) {
        var x_t  = 4.0;
        var i_r  = i_l + i_w;
        var v_ll = v_l;
        if ( undefined === this._scroll_container_ ) {
           v_ll -= this._canvas.offsetLeft;
        }
        var v_rl = v_l + v_w - sb_w;
        if ( undefined === this._scroll_container_ ) {
           v_rl -= this._canvas.offsetLeft;
        }
        if ( i_l < v_ll ) {
          s_x = v_l - ( v_ll - i_l ) - x_t;
        } else if ( i_r > v_rl ) {
          s_x = v_l + ( i_r - v_rl ) + x_t;
        }
      }

      // vertical
      var s_y  = undefined
      if ( ( v_h - sb_h ) > i_h ) {
        var y_t  = 4.0;
        var i_b  = i_t + i_h;
        var v_bl = v_t + v_h - sb_h;
        if ( undefined === this._scroll_container_ ) {
          v_bl -= this._canvas.offsetTop;
        }
        var v_tl = v_t;
        if ( undefined === this._scroll_container_ ) {
          v_tl -= - this._canvas.offsetTop;
        }
        if ( i_t < v_tl ) {
          s_y = v_t - ( v_tl - i_t ) - y_t;
        } else if ( i_b > v_bl ) {
          s_y = v_t + ( i_b - v_bl ) + y_t;
        }
      }

      // adjust scroll?
      if ( undefined !== s_x || undefined !== s_y ) {
        if ( undefined !== this._scroll_container_ ) {
          this._scroll_container_.scrollLeft = s_x || v_l;
          this._scroll_container_.scrollTop  = s_y || v_t;
        } else {
          window.scrollTo(s_x || v_l, s_y || v_t);
        }
      }

      // adjust input 'helper'?
      if ( undefined !== this._input_box._html_input ) {
        this._input_box._html_input.style.left   = "0px";
        this._input_box._html_input.style.top    = "0px";
        this._input_box._html_input.style.width  = i_w + "px";
        this._input_box._html_input.style.height = i_h + "px";
      }

    },

    /*****************************************************************************************/
    /*                                                                                       */
    /*                               ~~~ Websocket handlers ~~~                              */
    /*                                                                                       */
    /*****************************************************************************************/

    send_command: function (a_message, a_callback) {
      this._request_callback = a_callback || this.default_ws_handler;
      this._socket.send_command(a_message, this._request_callback);
    },

    disconnect: function () {
      this._socket.disconnect();
    },

    // default websocket handler
    default_ws_handler: function (a_msg) {

    },

    on_socket_message: function (a_message) {
      switch (a_message.data[0]) {
        case 'S':
          this._request_callback(a_message.data);
          break;

        case 'N':
          if ( this._listener !== undefined ) {
            this._listener.on_notification_received(a_message.data.substring(2));
          }
          break;

        case 'E':

          this._r_idx   = 1;
          this._message = a_message.data;

          var w = this.get_double();
          var k = this._message.substring(this._r_idx, this._r_idx + w);
          this._r_idx += w + 1; // +1 -> ','

              w = this.get_double();
          var t = this._message.substring(this._r_idx, this._r_idx + w);
          this._r_idx += w + 1; // +1 -> ','

              w = this.get_double();
          var m = this._message.substring(this._r_idx, this._r_idx + w);
          this._r_idx += w + 1; // +1 -> ','

          if ( this._message[this._r_idx - 1] != ';' ) {
            console.log("command is not terminated ...");
          }

          if ( undefined !== this._listener && undefined !== this._listener.on_error_received ) {
              this._listener.on_error_received(t, m);
          }
          break;

        case 'D':
          this.on_paint_message(a_message.data);
          break;

        default:
          // ignore
          break;
      }
    },

    on_socket_open: function (a_message) {
      this._is_socket_open = true;

      if ( this._listener !== undefined ) {
        this._listener.on_socket_open();
      }
    },

    on_socket_close: function (a_message) {
      this._is_socket_open = false;

      if ( this._listener !== undefined ) {
        this._listener.on_socket_close();
      }
    },

    is_socket_open: function() {
      return this._is_socket_open;
    },

    /*****************************************************************************************/
    /*                                                                                       */
    /*                           ~~~ Context menu handling ~~~                               */
    /*                                                                                       */
    /*****************************************************************************************/

    create_line_context_menu: function () {
      var size = EPaper.BTN_SIZE * this._ratio;

      this._line_add_button = new EPaperOverlayButton(this,
                                                      EPaperOverlayButton.MENU_ADD,
                                                      function (a_src) { a_src._epaper.add_document_line(a_src); });
      this._line_del_button = new EPaperOverlayButton(this,
                                                      EPaperOverlayButton.MENU_DELETE,
                                                      function (a_src) { a_src._epaper.remove_document_line(a_src); });
      this._line_add_button.set_size(size, size);
      this._line_del_button.set_size(size, size);
    },

    add_document_line: function (a_src_widget) {
      if ( this._context_menu_idx !== - 1) {
        this.send_command('document add band "' + this._bands[this._context_menu_idx]._type +
                                  '" ' + this._bands[this._context_menu_idx]._id + ';',
                          function (a_msg) {
                            if ( a_msg === 'S:ok:parser' ) {
                              // Start animation
                            } else if ( a_msg.indexOf('S:ok:band add') === 0 ) {
                              // All done
                            } else {
                              // error
                              console.log('=== add_line failed: a_msg');
                            }
                          });
      }
    },

    remove_document_line: function (a_src_widget) {
      if ( this._context_menu_idx !== - 1) {
        this.send_command('document remove band "' + this._bands[this._context_menu_idx]._type +
                                  '" ' + this._bands[this._context_menu_idx]._id + ';',
                          function (a_msg) {
                            if ( a_msg === 'S:ok:parser' ) {
                              // Start animation
                            } else if ( a_msg.indexOf('S:ok:band remove') === 0 ) {
                              // All done
                            } else {
                              // error
                              console.log('=== remove_line failed: a_msg');
                            }
                          });
      }
    },

    binary_find_band_by_y: function (a_y) {

      if ( this._bands !== undefined && this._bands.length > 0 ) {
        var mid;
        var min = 0.0;
        var max = this._bands.length - 1;

        while ( min <= max ) {
          mid = Math.floor((min + max) / 2.0);

          if (   this._bands[mid]._type != 'Background'
              && a_y >= this._bands[mid]._ty
              && a_y <= (this._bands[mid]._ty + this._bands[mid]._height) ) {

            return mid; // found!

          } else if ( this._bands[mid]._ty < a_y ) {
            min = mid + 1;
          } else {
            max = mid - 1;
          }
        }
      }
      return -1; // Not found!
    },

    update_context_menu: function (a_y) {

      if ( this._edition === false ) {
        this.deactivate_line_context_menu();
        return;
      } else {
        var idx = this.binary_find_band_by_y(a_y);

        if ( idx != -1 ) {
          if ( this._bands[idx]._type === 'DT' && this._bands[idx].editable_ == true ) {
            if ( this._context_menu_idx == idx ) {
              return;
            }
            if ( this._context_menu_idx !== -1 ) {
              this.deactivate_line_context_menu(this._bands[this._context_menu_idx]);
              this._context_menu_idx = -1;
            }
            this._context_menu_idx = idx;
            this.activate_line_context_menu(this._bands[this._context_menu_idx]);

          } else {
            if ( this._context_menu_idx !== -1 ) {
              this.deactivate_line_context_menu(this._bands[this._context_menu_idx]);
              this._context_menu_idx = -1;
            }
          }
        } else {
          if ( this._context_menu_idx !== -1 ) {
            if ( this._bands !== undefined ) {
              this.deactivate_line_context_menu(this._bands[this._context_menu_idx]);
            }
            this._context_menu_idx = -1;
          }
        }
      }
    },

    activate_line_context_menu: function (a_band) {

      var button_y = a_band._ty + a_band._height / 2 - (EPaper.BTN_SIZE * this._ratio) / 2;
      var button_x = (this._page_width - this._right_margin) * this._sx;

      this._line_add_button.set_location(button_x, button_y);
      button_x += EPaper.BTN_SIZE * this._ratio * 0.9;
      this._line_del_button.set_location(button_x, button_y);

      if ( this._edition && this.is_focused() ) {
        this._line_add_button.set_visible(true);
        this._line_del_button.set_visible(true);
      }
    },

    deactivate_line_context_menu: function (a_band) {

      this._line_add_button.set_visible(false);
      this._line_del_button.set_visible(false);
    },

    /*****************************************************************************************/
    /*                                                                                       */
    /*                                ~~~ Band tearing ~~~                                   */
    /*                                                                                       */
    /*****************************************************************************************/

    create_tear_buttons: function () {
      var size = EPaper.BTN_SIZE * this._ratio;

      this._close_tear_button = new EPaperOverlayButton(this, EPaperOverlayButton.MENU_CLOSE,
                                                        function (a_src) { a_src._epaper.on_close_subdocument(a_src); });
      this._add_entity_button = new EPaperOverlayButton(this, EPaperOverlayButton.MENU_ADD,
                                                        function (a_src) { a_src._epaper.on_add_entity(a_src); });
      this._close_tear_button.set_size(size, size);
      this._add_entity_button.set_size(size, size);
    },

    on_edit_subdocument: function (a_src_widget) {

      this.tear_paper(a_src_widget._bb_y + a_src_widget._bb_h + 5, 200 * this._ratio, 1000);
      this.open_document(this._sub_document_jrxml,
                         this._locale,
                         this._json_api_prefix,
                         this._schema,
                         this._table_prefix,
                         true,
                         true,
                         function (a_epaper, a_page_width, a_page_height) {
                            a_epaper.load_document(a_epaper._sub_document_uri, undefined, true, true, function(a_epaper) {
                              console.log("=== Sub document loaded YUPPIIII!!!!");
                          });
                        });
    },

    on_close_subdocument: function () {
      this.close_document();
      this.glue_paper();
    },

    on_add_entity: function (a_src_widget) {
      console.log("*** ADD entity");
    },

    create_tear_paper_animation_handler: function (a_epaper) {
      return function (a_timestamp) {
        a_epaper.tear_paper_animation_handler(a_timestamp);
      };
    },

    tear_paper_animation_handler: function (a_timestamp) {
      var ty, t;

      if (this._abort_animations === true) {
        return;
      }
      console.time("tear_band");

      if ( this._band_animation_start === undefined ) {
        this._band_animation_start = a_timestamp;
      }

      t = (a_timestamp - this._band_animation_start) / this._band_tear_interval;
      if ( this._band_tearing === false ) {
        t = 1 - t;
      }
      t = this.ease(t);

      ty = 0;

      this._band_tear_gap = this._band_tear_max_gap * t;
      if ( this._band_tear_gap > this._band_tear_max_gap    ) {
        this._band_tear_gap = this._band_tear_max_gap   ;
      } else if ( this._band_tear_gap < 0 ) {
        this._band_tear_gap = 0;
      }

      this._ctx.putImageData(this._upper_image, 0, ty); //TODO upper / lower animation
      if ( this._band_tearing === true ) {
        this._ctx.putImageData(this._lower_image, 0, this._translate_y + this._band_tear_gap);
        this.repaint_page();
      } else {
        this._ctx.putImageData(this._lower_image, 0, this._translate_y + this._band_tear_gap);
      }

      if ( this._band_tearing === true ) {
        if ( this._band_tear_gap < this._band_tear_max_gap) {
          window.requestAnimationFrame(this.create_tear_paper_animation_handler(this));
        }
      } else {
        if ( this._band_tear_gap > 0  ) {
          window.requestAnimationFrame(this.create_tear_paper_animation_handler(this));
        } else {
          this._translate_y       = 0;
          this._background_color  = this._normal_background;
          this._band_tearing      = false;
          this._band_tear_max_gap = 0;
          this.repaint_page();
          this._input_box.update_background();
        }
      }

      console.timeEnd("tear_band");
    },

    /**
     * @brief Start the tear paper animation
     *
     * @param a_from_y  start of paper gap in px
     * @param a_height  heigth of the paper gap in px
     * @param a_time    animation in milliseconds
     */
    tear_paper: function (a_from_y, a_height, a_time) {

      this.make_widgets_invisble();
      this.repaint_widgets();
      this._input_box.freeze_cursor();
      this._input_box._enabled   = false;
      this._translate_y          = a_from_y;
      this._band_tear_max_gap    = a_height;
      this._band_tear_gap        = 0;
      this._band_tear_interval   = a_time;
      this._band_animation_start = undefined;
      this._band_tearing         = true;

      this.washout_canvas();
      this.paint_puncture();
      this._bands = undefined;
      this._bands = [];
      this._background_color = this._band_tear_background;
      this._close_tear_button.set_location((this._page_width - this._right_margin) * this._sx, 10);
      this._close_tear_button.set_visible(true);
      this._master_doc_right_margin = this._right_margin;

      // ... take two snap shots of the current canvas ...
      this._upper_image = this._ctx.getImageData(0,
                                                 0,
                                                 this._canvas.width,
                                                 a_from_y);
      this._lower_image = this._ctx.getImageData(0,
                                                 a_from_y,
                                                 this._canvas.width,
                                                 this._canvas.height - a_from_y);
      this._abort_animations = false;
      window.requestAnimationFrame(this.create_tear_paper_animation_handler(this));
    },

    glue_paper: function (a_time) {

      this._band_tear_interval   = a_time || 350;
      this._band_animation_start = undefined;
      this._band_tearing         = false;
      this._right_margin         = this._master_doc_right_margin;
      this._abort_animations     = false;
      this._close_tear_button.set_visible(false);
      window.requestAnimationFrame(this.create_tear_paper_animation_handler(this));
    },

    /**
     * @brief Reset band tearing control variables ...
     */
    reset_band_tearing: function () {

      this._abort_animations     = true;
      this._translate_y          = 0.0;
      this._band_tear_max_gap    = 0.0;
      this._band_tearing         = false;
      this._background_color     = '#FFFFFF';
      this._normal_background    = '#FFFFFF';
      this._band_tear_background = '#EFEFEF';
      this._abort_animations     = true;
      if ( this._master_doc_right_margin !== undefined ) {
        this._right_margin = this._master_doc_right_margin;
      }
    },

    /**
     * @brief Cover the whole canvas with a white transparent overlay
     */
    washout_canvas: function () {
      var saved_fill = this._ctx.fillStyle;
      this._ctx.fillStyle = 'rgba(255,255,255,0.5)';
      this._ctx.fillRect(0,0, this._canvas.width, this._canvas.height);
      this._ctx.fillStyle = saved_fill;
    },

    /**
     * @brief Draws an horizontal band of "holes" at _translate_y
     *
     * @param a_static if true the holes will have a full shadow, otherwise the lower half of the hole will not have shadow
     */
    paint_puncture: function (a_static) {

      a_static = a_static || false;

      if ( a_static ) {
        var dst_width  = this._ratio * this._puncture_static_img.width * this.PUNCTURE_HEIGHT / this._puncture_static_img.height;
        var dst_height = this._ratio * this.PUNCTURE_HEIGHT;

        for ( var x = 0; x < this._canvas.width; x += dst_width) {

          this._ctx.drawImage(this._puncture_static_img,
                              x,
                              this._translate_y - dst_height,
                              dst_width,
                              dst_height);
        }

      } else {
        var dst_th = Math.ceil(this.PUNCTURE_HEIGHT/2);
        var dst_bh = this.PUNCTURE_HEIGHT - dst_th;

        dst_th *= this._ratio;
        dst_bh *= this._ratio;

        var dst_width  = this._top_puncture_img.width * dst_th / this._top_puncture_img.height;

        for ( var x = 0; x < this._canvas.width; x += dst_width) {
          this._ctx.drawImage(this._top_puncture_img,
                              x,
                              this._translate_y - dst_th,
                              dst_width,
                              dst_th);
          this._ctx.drawImage(this._bottom_puncture_img,
                              x,
                              this._translate_y,
                              dst_width,
                              dst_bh);
        }
      }
    },

  }; // endof of EPaper.prototype

  EPaper.prototype.binary_find_band_by_id = function (a_id) {

    if ( this._bands !== undefined && this._bands.length > 0 ) {
      var mid;
      var min = 0.0;
      var max = this._bands.length - 1;

      while ( min <= max ) {
        mid = Math.floor((min + max) / 2.0);

        if ( this._bands[mid]._id === a_id ) {

          return mid; // found!

        } else if ( this._bands[mid]._id < a_id ) {
          min = mid + 1;
        } else {
          max = mid - 1;
        }
      }
    }
    return -1; // Not found!
  };

  /*****************************************************************************************/
  /*                                                                                       */
  /*                               ~~~ Keyboard handlers ~~~                               */
  /*                                                                                       */
  /*****************************************************************************************/

  EPaper.prototype.create_onkeydown_handler = function(a_epaper) {
    return function (a_event) {
      var key = EPaper.keycode_to_vkey(a_event);

      if ( a_event.keyCode === 32 ) {

        // ... space  - because default behavior in non-input elements is page scroll ...
        if ( a_epaper._input_box._enabled === true ) {
          a_epaper._input_box._on_key_press_handler(" ");
          a_event.preventDefault();
        }
      } else {
        if ( key != null ) {

          a_event.preventDefault();
          if ( a_epaper._input_box._on_key_down_handler(key) === false ) {
            if ( key == 'shift+tab' ) {
              a_epaper.send_command('set key "shift"+"tab";');
            } else {
              a_epaper.send_command('set key "' + key + '";');
            }
          }
        }
      }
    }
  };

  EPaper.prototype.create_onkeypress_handler = function (a_epaper) {
    return function (a_event) {
      var unicode_char = a_event.which || a_event.keyCode;

      if ( unicode_char > 0 &&  a_epaper._input_box._on_key_press_handler !== undefined ) {
        if ( a_epaper._input_box._on_key_press_handler(String.fromCharCode(unicode_char)) === false ) {
          a_epaper.send_command('set key ' + a_event.keyCode + ';');
        }
      }
    }
  };

  /**
   * @brief Convert keycode to virtual key
   *
   * @param a_event The Keyboard event
   *
   * @return the virtual key name or null if there no mapping
   */
  EPaper.keycode_to_vkey = function (a_event) {

    switch (a_event.keyCode) {
    case  8: // backspace
      return 'backspace';

    case  9: // tab
      if ( a_event.shiftKey === true ) {
        return 'shift+tab';
      } else {
        return 'tab';
      }
      break;

    case 13: // enter
      return 'enter';

    case 27: // escape
      return 'esc';

    case 32: // space
      return ' ';

    case 37: // left
      return 'left';

    case 39: // right
      return 'right';

    case 38: // up
      if ( a_event.shiftKey === true ) {
        return 'shift+up';
      } else {
        return 'up';
      }
      break;

    case 40: // down
      if ( a_event.shiftKey === true ) {
        return 'shift+down';
      } else {
        return 'down';
      }
      break;

    case 46:
      return 'delete';

    case 65:
      if ( a_event.ctrlKey ) {
        return 'ctrl+a';
      }
      break;

    case 69:
      if ( a_event.ctrlKey ) {
        return 'ctrl+e';
      }
      break;

    case 75:
      if ( a_event.ctrlKey ) {
        return 'ctrl+k';
      }
      break;

    case 113:
      return 'F2';

    case 16:
      return 'shift';

    case 17:
      return 'ctrl';

    case 18:
      return 'alt';

    case 91:
      return 'window+left';

    case 92:
      return 'window+right';

    default:
      break;
    }
    return null;
  };

  /*****************************************************************************************/
  /*                                                                                       */
  /*                                ~~~ Focus management ~~~                               */
  /*                                                                                       */
  /*****************************************************************************************/

  EPaper.prototype.create_focus_handler = function (a_epaper) {
    return function(a_event) {
      a_epaper._is_focused = true;
      a_epaper._input_box._on_focus_handler();
      a_epaper.repaint_page();
      console.log('++++ Epaper GOT focus ++++');
    }
  };

  EPaper.prototype.create_blur_handler = function (a_epaper) {
    return function(a_event) {
      a_epaper._is_focused = false;
      a_epaper._input_box._on_blur_handler();
      a_epaper.repaint_page();
      console.log('---- Epaper LOST focus ----');
    }
  };

  EPaper.prototype.is_focused = function () {
    if ( this._is_focused || this._input_box._is_focused ) {
      return true;
    } else {
      return false;
    }
  };

  EPaper.prototype.create_html_onpaste_handler = function (a_epaper) {
    return function (a_event) {
      a_epaper._input_box.paste_from_canvas(a_event);
    };
  };


  /*****************************************************************************************/
  /*                                                                                       */
  /*                               ~~~ Mouse handlers ~~~                                  */
  /*                                                                                       */
  /*****************************************************************************************/

  /**
   * @brief Creates the handler that listens to mouse movements
   */
  EPaper.prototype.create_move_handler = function (a_epaper) {
    return function (a_event) {
      var x = a_event.offsetX * a_epaper._ratio;
      var y = a_event.offsetY * a_epaper._ratio;

      y -= a_epaper._translate_y;
      a_epaper._ctx.save();
      a_epaper.apply_translation();

      if ( a_epaper.mouse_over_widgets(x, y, a_event) === false ) {
        if ( a_epaper._input_box._on_mouse_over_handler !== undefined ) {
          if ( a_epaper._input_box._on_mouse_over_handler(x,y) === false ) {
            a_epaper.reset_cursor();
          }
          if ( a_epaper._edition ) {
            a_epaper.update_context_menu(y);
          }
        }
      }
      a_epaper.repaint_widgets();
      a_epaper._ctx.restore();
    };
  };

  EPaper.prototype.create_mouse_down_handler = function (a_epaper) {
    return function (a_event) {
      var x = a_event.offsetX * a_epaper._ratio;
      var y = a_event.offsetY * a_epaper._ratio;

      y -= a_epaper._translate_y;

      a_epaper._ctx.save();
      a_epaper.apply_translation();
      if ( a_epaper.mouse_click_widgets(x, y, true) === false ) {
        if ( a_epaper._input_box._on_mouse_down_handler !== undefined ) {
           a_epaper._input_box._on_mouse_down_handler(x,y);
        }
      }
      a_epaper.repaint_widgets();
      a_epaper._ctx.restore();
      if ( a_epaper._input_box.prevent_mouse_default() ) {
        a_event.preventDefault();
      }
    }
  };

  EPaper.prototype.create_mouse_up_handler = function (a_epaper) {
    return function (a_event) {
      var x = a_event.offsetX * a_epaper._ratio;
      var y = a_event.offsetY * a_epaper._ratio;

      y -= a_epaper._translate_y;

      a_epaper._ctx.save();
      if ( a_epaper.mouse_click_widgets(x, y, false) === false ) {

        if (    a_epaper._input_box._on_mouse_up_handler === undefined
             || a_epaper._input_box._on_mouse_up_handler(x,y) === false ) {

          x = (  a_event.offsetX  * a_epaper._page_width  / parseInt(a_epaper._canvas.style.width  || a_epaper._canvas.width ) );
          y = ( (a_event.offsetY  - a_epaper._translate_y /  a_epaper._ratio) * a_epaper._page_height / parseInt(a_epaper._canvas.style.height || a_epaper._canvas.height) );
          a_epaper.send_command("set click " + x.toString().replace(',', '.') + ', ' + y.toString().replace(',', '.') + ';');
        }
      }
      a_epaper.apply_translation();
      a_epaper.repaint_widgets();
      a_epaper._ctx.restore();
    }
  };

  EPaper.prototype.set_cursor = function (a_sytle) {
    if ( a_sytle !== this._canvas.style.cursor ) {
      this._canvas.style.cursor = a_sytle;
    }
  };

  EPaper.prototype.reset_cursor = function () {
    if ( this._canvas.style.cursor !== this._initial_pointer ) {
      this._canvas.style.cursor = this._initial_pointer;
    }
  };

  /*****************************************************************************************/
  /*                                                                                       */
  /*                                  ~~~ Public API ~~~                                   */
  /*                                                                                       */
  /*****************************************************************************************/

  EPaper.prototype.reconnect = function () {
    this.clear();
    this._socket.connect();
  };

  EPaper.prototype.set_listener = function (a_listener) {
    this._listener = a_listener;
  };

  /**
   * @param a_jrxml
   * @param a_locale
   * @param a_jsonapi_prefix
   * @param a_schema
   * @param a_table_prefix
   * @param a_edition
   * @param a_is_subdocument
   * @param a_success_handler
   */
  EPaper.prototype.open_document = function (a_jrxml, a_locale, a_jsonapi_prefix, a_schema, a_table_prefix, a_edition, a_is_subdocument, a_success_handler) {
      this.open_document_2('document open "' + a_jrxml + '","' + a_locale + '",' + a_is_subdocument + ',' + a_edition + ';',
                           'open',
                           a_locale, a_jsonapi_prefix, a_schema, a_table_prefix, a_edition, a_is_subdocument, a_success_handler);
  };

  /**
   * @param a_model
   * @param a_locale
   * @param a_jsonapi_prefix
   * @param a_schema
   * @param a_table_prefix
   * @param a_edition
   * @param a_is_subdocument
   * @param a_success_handler
   */
  EPaper.prototype.open_document_2 = function (a_cmd, a_cmd_rsp, a_locale, a_jsonapi_prefix, a_schema, a_table_prefix, a_edition, a_is_subdocument, a_success_handler) {

    a_locale = a_locale || 'pt_PT';

    // ... save API params in case we need to open a subdocument ...
    this._locale          = a_locale;
    this._schema          = a_schema;
    this._table_prefix    = a_table_prefix;
    this._json_api_prefix = a_jsonapi_prefix;
    this._edition         = a_edition;
    this.make_widgets_invisble();
    if ( a_is_subdocument ) {
      this._close_tear_button.set_visible(true);
    }

    this.call_rpc(a_cmd_rsp, a_cmd
      , function (a_epaper, a_message) {

        a_epaper._message      = a_message;
        a_epaper._r_idx        = ( 'S:ok:' + a_cmd_rsp + ':' ).length;
        a_epaper._document_id  = a_epaper.get_double();
        a_epaper._page_width   = a_epaper.get_double();
        a_epaper._page_height  = a_epaper.get_double();
        if ( isNaN(a_epaper._page_height) ) {
          a_epaper._page_height = 4000;
        }
        a_epaper._right_margin = a_epaper.get_double();

        if ( a_epaper._json_api_prefix != null ) {
            var load_msg = 'document config json_api "' + a_jsonapi_prefix + '","' + a_schema + '","' + a_table_prefix + '";';
            a_epaper.call_rpc('json_api', load_msg, function(a_epaper, a_message) {
              if ( undefined !== a_success_handler ) {
                a_success_handler(a_epaper, a_epaper._page_width, a_epaper._page_height);
              }
            }
          );
        } else {
          if ( undefined !== a_success_handler ) {
            a_success_handler(a_epaper, a_epaper._page_width, a_epaper._page_height);
          }
        }

    });

  };

  /**
   * @param a_success_handler
   */
  EPaper.prototype.close_document = function (a_success_handler) {

    this.make_widgets_invisble();
    this.call_rpc('close', 'document close "' + this._document_id + '";', function(a_epaper, a_message) {
        var expected_response = 'S:ok:close:' + a_epaper._document_id;
        if ( a_message.indexOf(expected_response) === 0 ) {
          if ( a_message.length > expected_response.length ) {
            a_epaper._document_id = a_message.substring(expected_response.length + 1).replace('\n', '');
          } else {
            a_epaper._document_id = undefined;
          }
        }
        if ( undefined !== a_success_handler ) {
          a_success_handler();
        }
      }
    );
  };

  /**
   * @param a_base_url
   * @param a_params
   * @param a_is_subdocument
   * @param a_edition
   * @param a_success_handler
   */
  EPaper.prototype.load_document = function (a_base_url, a_params, a_is_subdocument, a_edition, a_success_handler) {

    var cmd = 'document load ' + '"' + a_base_url + '"';
    if ( a_params !== undefined ) {
      cmd += ',"' + a_params + '"';
    }
    cmd += ',' + this._sx.toFixed(4) + ',' + this._sy.toFixed(4) + ',' + a_is_subdocument + ',' + a_edition +  ';'

    if ( a_edition == false ) {
      this._input_box._enabled = false;
    }

    this.load_document_2(cmd, 'load', a_is_subdocument, a_edition, function(a_epaper, a_load_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper);
        }
      }
    );
  };

  /**
   * @param a_success_handler
   */
  EPaper.prototype.reload_document = function (a_success_handler) {
    this.call_rpc('reload', 'document reload;', function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_message.substring('S:ok:reload:'.length));
        }
      }
    );
  }

 /**
  * @param a_index, 0 based.
  * @param a_success_handler
  */
  EPaper.prototype.document_focus_row = function (a_index, a_success_handler) {
    this.call_rpc('focused row', 'document set focused row ' + a_index + ';', function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_message.substring('S:ok:focused row:'.length));
        }
      }
    );
  }

  /**
   * @param a_cmd
   * @param a_cmd_rsp
   * @param a_is_subdocument
   * @param a_edition
   * @param a_success_handler
   */
  EPaper.prototype.load_document_2 = function (a_cmd, a_cmd_rsp, a_is_subdocument, a_edition, a_success_handler) {

    this._edition = a_edition;
    this.make_widgets_invisble();

    if ( a_is_subdocument === false ) {
      this.reset_band_tearing();
      this._close_tear_button.set_visible(false);
    } else {
      this._close_tear_button.set_visible(true);
    }

    // url, params, sx, sy
    this.call_rpc(a_cmd_rsp, a_cmd, function(a_epaper, a_load_message) {
        if ( a_edition === false ) {
          a_epaper._edition = false;
          a_epaper._input_box._tooltip_helper.set_visible(true);
        } else {
          a_epaper._edition = true;
          a_epaper._input_box._tooltip_helper.set_visible(true);
        }
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper, a_load_message);
        }
    });
  };

  //
  // --- DECLARATIONS
  //

  /**
   * @param a_model
   * @param a_jrxml_path
   * @param a_locale
   * @param a_jsonapi_prefix
   * @param a_schema
   * @param a_table_prefix
   * @param a_edition
   * @param a_is_subdocument
   * @param a_success_handler
   */
  EPaper.prototype.open_declaration = function (a_model, a_jrxml_path, a_locale, a_jsonapi_prefix, a_schema, a_table_prefix, a_edition, a_success_handler) {
    var deferred = Q.defer();
    this.open_document_2(
      'declaration open "' + a_model + '","' + a_jrxml_path + '","' + a_locale + '",' + a_edition + ';',
      'declaration open',
      a_locale,
      a_jsonapi_prefix,
      a_schema,
      a_table_prefix,
      a_edition,
      false,
      function(a_epaper, a_page_width, a_page_height) {
        deferred.resolve({
          epaper: a_epaper,
          page_width: a_page_width,
          page_height: a_page_height
        });
      }
    );

    return deferred.promise;
  };

  /**
   */
  EPaper.prototype.close_declaration = function (a_success_handler) {
    var self = this;

    return Q.promise(function(resolve, reject) {
      self.close_document(resolve);
    }).then(a_success_handler);
  };

  /**
   * @param a_base_url
   * @param a_params
   * @param a_edition
   * @param a_success_handler
   */
  EPaper.prototype.load_declaration = function (a_base_url, a_params, a_edition) {
    var deferred = Q.defer();

    var cmd = 'declaration load ' + '"' + a_base_url + '"';
    if ( a_params !== undefined ) {
      cmd += ',"' + a_params + '"';
    }
    cmd += ',' + this._sx.toFixed(4) + ',' + this._sy.toFixed(4) + ',' + a_edition +  ';'

    this.load_document_2(cmd, 'declaration load', false, a_edition, function(a_epaper, a_message) {
      a_epaper._message      = a_message;
      a_epaper._r_idx        = ( 'S:ok:declaration load:' ).length;

      var w                  = a_epaper.get_double();
      var component_id       = a_epaper._message.substring(a_epaper._r_idx, a_epaper._r_idx + w);

      a_epaper.list_declaration_available_components(function(a_epaper, a_available_list) {
        a_epaper.list_declaration_loaded_components(function(a_epaper, a_loaded_list) {
          deferred.resolve({
            component: component_id,
            available_components: a_available_list,
            loaded_components: a_loaded_list
          });
        });
      });
    });

    return deferred.promise;
  };

  /**
   * @param a_success_handler
   */
  EPaper.prototype.reload_declaration = function (a_success_handler) {
    this.call_rpc('declaration reload', 'declaration reload;', function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_message.substring('S:ok:declaration reload:'.length));
        }
      }
    );
  }

  /**
   * @param a_id
   * @param a_success_handler
   */
  EPaper.prototype.save_declaration = function (a_format) {
    var target = 'declaration save';

    return this.call_rpc_promise(target, target + ';')
      .then(function(a_message) {
        var skip_length = ( 'S:ok:' + target + ':' ).length;
        return JSON.parse(a_message.substring(skip_length));
      });
  };

  /**
   * @param a_id
   * @param a_success_handler
   */
  EPaper.prototype.list_declaration_available_components = function (a_success_handler) {

    var target = 'declaration list available components';

    this.call_rpc(target, target + ';'
      , function (a_epaper, a_message) {

        var skip_length = ( 'S:ok:' + target + ':' ).length;

        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper, JSON.parse(a_message.substring(skip_length)));
        }

    });

  };

  /**
   * @param a_id
   * @param a_success_handler
   */
  EPaper.prototype.list_declaration_loaded_components = function (a_success_handler) {

    var target = 'declaration list loaded components';

    this.call_rpc(target, target + ';'
      , function (a_epaper, a_message) {

        var skip_length = ( 'S:ok:' + target + ':' ).length;

        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper, JSON.parse(a_message.substring(skip_length)));
        }

    });

  };

  /**
   * @param a_id
   * @param a_success_handler
   */
  EPaper.prototype.load_declaration_component = function (a_id, a_success_handler) {

    var target = 'declaration load component';

    this.call_rpc(target, target + ' "' + a_id + '";'
      , function (a_epaper, a_message) {

        a_epaper._message      = a_message;
        a_epaper._r_idx        = ( 'S:ok:' + target + ':' ).length;

        var w                  = a_epaper.get_double();
        var component_id       = a_epaper._message.substring(a_epaper._r_idx, a_epaper._r_idx + w);

        a_epaper._r_idx       += w + 1; // +1 -> ,
        a_epaper._page_width   = a_epaper.get_double();
        a_epaper._page_height  = a_epaper.get_double();
        a_epaper._right_margin = a_epaper.get_double();

        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper, component_id, a_epaper._page_width, a_epaper._page_height);
        }

    });

  };

  /**
   * @param a_type
   * @param a_params
   * @param a_success_handler
   */
  EPaper.prototype.add_declaration_component = function (a_type, a_params, a_success_handler) {

    var target = 'declaration add component';

    this.call_rpc(target, target + ' "' + a_type + '", "' + a_params.replace(/[\"]/g, '""') + '";'
      , function (a_epaper, a_message) {

        a_epaper._message      = a_message;
        a_epaper._r_idx        = ( 'S:ok:' + target + ':' ).length;

        var w                  = a_epaper.get_double();
        var new_cpn_id         = a_epaper._message.substring(a_epaper._r_idx, a_epaper._r_idx + w);

        a_epaper._r_idx       += w + 1; // +1 -> ,
        a_epaper._page_width   = a_epaper.get_double();
        a_epaper._page_height  = a_epaper.get_double();
        a_epaper._right_margin = a_epaper.get_double();

        if ( undefined !== a_success_handler ) {
          a_epaper.list_declaration_loaded_components(function(a_epaper, a_list) {
              a_success_handler(a_epaper, new_cpn_id, a_list, a_epaper._page_width, a_epaper._page_height);
            }
          );
        }

    });

  };

  /**
   * @param a_id
   * @param a_params
   * @param a_success_handler
   */
  EPaper.prototype.patch_declaration_component = function (a_id, a_params) {
    var target = 'declaration patch component';
    var a_epaper = this;

    return this.call_rpc_promise(target, target + ' "' + a_id + '", "' + a_params.replace(/[\"]/g, '""') + '";')
      .then(function (a_message) {
        a_epaper._message      = a_message;
        a_epaper._r_idx        = ( 'S:ok:' + target + ':' ).length;

        return a_message;
      })
      .then(function(a_message) {
        var deferred = Q.defer();
        a_epaper.list_declaration_loaded_components(function(a_epaper, a_list) {
          deferred.resolve(a_message);
        });

        return deferred.promise;
      });
  };

  /**
   * @param a_id
   * @param a_success_handler
   */
  EPaper.prototype.remove_declaration_component = function (a_id, a_success_handler) {

    var target = 'declaration remove component';

    this.call_rpc(target, target + ' "' + a_id + '";'
      , function (a_epaper, a_message) {

        a_epaper._message = a_message;
        a_epaper._r_idx   = ( 'S:ok:' + target + ':' ).length;

        var w          = a_epaper.get_double();
        var old_cpn_id = a_epaper._message.substring(a_epaper._r_idx, a_epaper._r_idx + w);
        a_epaper._r_idx       += w + 1; // +1 -> ,

            w          = a_epaper.get_double();
        var new_cpn_id = a_epaper._message.substring(a_epaper._r_idx, a_epaper._r_idx + w);
        a_epaper._r_idx       += w + 1; // +1 -> ,

        a_epaper._page_width   = a_epaper.get_double();
        a_epaper._page_height  = a_epaper.get_double();
        a_epaper._right_margin = a_epaper.get_double();

        if ( undefined !== a_success_handler ) {
          a_epaper.list_declaration_loaded_components(function(a_epaper, a_list) {
              a_success_handler(a_epaper, new_cpn_id, a_list, a_epaper._page_width, a_epaper._page_height);
            }
          );
        }

    });

  };

  /**
   * @param a_id
   * @param a_handler
   */
  EPaper.prototype.open_declaration_error_link = function (a_id, a_success_handler) {

    var target = 'declaration open link';

    this.call_rpc(target, target + ' "' + a_id + '";'
      , function (a_epaper, a_message) {

        a_epaper._message      = a_message;
        a_epaper._r_idx        = ( 'S:ok:' + target + ':' ).length;

        if ( undefined !== a_success_handler ) {
          a_success_handler(a_epaper);
        }

    });

  };

  //
  // --- DECLARATIONS
  //

  /**
   * @param a_jrxml_path
   * @param a_locale
   */
  EPaper.prototype.open_preview = function (a_jrxml_path, a_locale, a_success_handler) {
    var deferred = Q.defer();
    this.open_document_2(
      'preview open "' + a_jrxml_path + '","' + a_locale + '";',
      'preview open',
      a_locale,
      /* a_jsonapi_prefix */ null,
      /* a_schema */ null,
      /* a_table_prefix */ null,
      /* a_edition */ false,
      /* a_is_subdocument */ false,
      function(a_epaper, a_page_width, a_page_height) {
        if (a_success_handler != null) {
          a_success_handler(a_epaper, a_page_width, a_page_height);
        }
        deferred.resolve({
          epaper: a_epaper,
          page_width: a_page_width,
          page_height: a_page_height
        });
      }
    );

    return deferred.promise;
  };

  /**
   */
  EPaper.prototype.close_preview = function (a_success_handler) {
    var self = this;

    return Q.promise(function(resolve, reject) {
      self.close_document(resolve);
    }).then(a_success_handler);
  };

  /**
   * @param a_base_url
   */
  EPaper.prototype.load_preview = function (a_base_url, a_success_handler) {
    var deferred = Q.defer();

    var cmd = 'preview load ' + '"' + a_base_url + '",' + this._sx.toFixed(4) + ',' + this._sy.toFixed(4) + ';'

    this.load_document_2(cmd, 'preview load', /* a_is_subdocument */ false, /* a_edition */ false, function(a_epaper, a_message) {
      a_epaper._message      = a_message;
      a_epaper._r_idx        = ( 'S:ok:preview load:' ).length;
      if ( undefined !== a_success_handler ) {
        a_success_handler(a_epaper);
      }
    });

    return deferred.promise;
  };

  //
  // ---
  //

  /**
   * @param a_edition,
   * @param a_success_handler
   */
  EPaper.prototype.set_edition = function (a_edition, a_success_handler) {

    this.call_rpc('edition', 'document set edition ' + (a_edition ? 'true' : 'false') + ';',  function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_epaper._edition = a_edition;
          a_success_handler();
        }
      }
    );
  };

  /**
   * @param a_sign_document
   * @param a_success_handler
   */
  EPaper.prototype.print_pdf = function (a_sign_document, a_success_handler) {

    this.call_rpc('pdf', 'document pdf print ' + (a_sign_document ? 'true' : 'false') + ';', function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_message.substring('S:ok:pdf:'.length));
        }
      }
    );
  };

  /**
   * @param a_sign_document
   * @param a_success_handler
   */
  EPaper.prototype.download_pdf = function (a_sign_document, a_success_handler) {
    this.call_rpc('pdf', 'document pdf download ' + (a_sign_document ? 'true' : 'false') + ';', function(a_epaper, a_message) {
        if ( undefined !== a_success_handler ) {
          a_success_handler(a_message.substring('S:ok:pdf:'.length));
        }
      }
    );
  };

  /**
   * @brief Retrieve the number of pages in the document
   *
   * @return page count
   */
  EPaper.prototype.get_page_count = function () {
    return this._page_count;
  };

  /**
   * @brief Change the current page
   *
   * @param a_page_number 1 for the first page
   */
  EPaper.prototype.goto_page = function (a_page_number) {
    this.send_command("document set page " + a_page_number + ";");
  };

  /**
   * @brief Change the size of the canvas.
   *
   * @param a_width Canvas height in px
   * @param a_height Canvas Height in px
   */
  EPaper.prototype.set_size = function (a_width, a_height, a_forced) {

    var act;

    if ( a_width !== this._canvas_width || a_height !== this._canvas_height || a_forced ) {
      if (a_forced) {
        this._canvas_height = 100;
        this._canvas_width = 100;
        this.setup_scale();
      }

      this._canvas_width  = a_width;
      this._canvas_height = a_height;
      this.setup_scale();
      this.send_command("document set scale " + this._sx.toFixed(4) + ' ' + this._sy.toFixed(4) + ";");
      act = '(size changed)';
    } else {
      act = '(no change ignored!)';
    }
    console.log('=== set size [width: ' + a_width + ', height: ' + a_height + '] ' + act);

  };

  /**
   * @brief Adds a detail line bellow the currently focused line
   */
  EPaper.prototype.add_line_after_focused_line = function () {

    if ( this._focused_band_id !== undefined ) {
      var idx = this.binary_find_band_by_id(this._focused_band_id);
      if ( idx !== -1 && this._bands[idx]._type === 'DT' && this._bands[idx].editable_ == true ) {
        this.call_rpc('band add', 'document add band "' + this._bands[idx]._type + '" ' + this._focused_band_id + ';',
          function (a_epaper, a_message) {
            a_epaper.send_command('set key "focus_down";');
          }
        );
      }
    }

  };

  /**
   * @brief Deletes the focused line
   */
  EPaper.prototype.remove_focused_line = function () {

    if ( this._focused_band_id !== undefined ) {
      var idx = this.binary_find_band_by_id(this._focused_band_id);
      if ( idx !== -1 && this._bands[idx]._type === 'DT' && this._bands[idx].editable_ == true ) {
        this.call_rpc('band remove', 'document remove band "' +  this._bands[idx]._type + '" ' + this._focused_band_id + ';',
          function (a_epaper, a_message) {
            /* empty */
          }
        );
      }
    }

  };

  /**
   * @brief Clear the local document model
   */
  EPaper.prototype.clear = function () {

    this._bands = undefined;
    this._images = {};
    this._focused_band_id = undefined;
    this._input_box._enabled = false;
    this.make_widgets_invisble();
    this.clear_page();
  };

  /**
   * @start the redraw timer will redraw the page after a timeout
   */
  EPaper.prototype.restart_redraw_timer = function (a_time_in_ms) {
    var timeout = a_time_in_ms !== undefined ? a_time_in_ms : 300;

    if ( window[this._redraw_timer_key] !== undefined ) {
      window.clearTimeout(window[this._redraw_timer_key]);
      window[this._redraw_timer_key] = undefined;
    }
    window[this._redraw_timer_key] = setInterval(this.create_redraw_timer_handler(this), timeout);
  };

  /**
   * @brief Resets the deferred repaint timer
   */
  EPaper.prototype.reset_redraw_timer = function () {

    if ( window[this._redraw_timer_key] !== undefined ) {
      window.clearTimeout(window[this._redraw_timer_key]);
      window[this._redraw_timer_key] = undefined;
    }
  };

  /**
   * @brief Create the handler for the mouse over time-out
   *
   * @param a_self The tooltip helper instance
   * @return the handler function
   */
  EPaper.prototype.create_redraw_timer_handler = function (a_self) {
    return function () {
      a_self.repaint_page();
    }
  };

  /**
   * From http://jsfiddle.net/AbdiasSoftware/M4cTx/
   */

  EPaper.prototype.step_down = function (img, tw, th) {

    var steps,
        oc  = document.createElement('canvas'),
        ctx = oc.getContext('2d'),
        fc  = document.createElement('canvas'),
        w   = img.width  ,
        h   = img.height ;

    var y = 500;

    oc.width  = w;
    oc.height = h;

    fc.width  = tw;
    fc.height = th;

    if ((w / tw) > (h / th)) {
        steps = Math.ceil(Math.log(w / tw) / Math.log(2));
    } else {
        steps = Math.ceil(Math.log(h / th) / Math.log(2));
    }
    if (steps <= 1) {
        ctx = fc.getContext('2d');
        ctx.drawImage(img, 0, 0, tw, th);
        return fc;
    }

    console.log("=== scaling steps:" + steps);

    ctx.drawImage(img, 0, 0);

    steps--;

    //this._ctx.drawImage(oc, 200, y);
    while(steps > 0) {
      //w *= 0.5;
      //h *= 0.5;
      w = Math.round(w * 0.5);
      h = Math.round(h * 0.5);
      ctx.drawImage(oc, 0, 0, w * 2, h * 2,
                        0, 0, w, h);
      steps--;

    ctx.fillStyle="red";
    ctx.clearRect(0, h, w + 20, 20);
    ctx.clearRect(w -1 , 0, 20    , h );
      //this._ctx.drawImage(oc, 200, y);
      //y += 300;
    }
    this._ctx.drawImage(oc, 200, y);

    ctx = fc.getContext('2d'),
    ctx.drawImage(oc, 0, 0, w, h, 0, 0, tw, th);
    return fc;
};

})(this);
