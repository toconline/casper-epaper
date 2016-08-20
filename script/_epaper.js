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


  }; // endof of EPaper.prototype




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
