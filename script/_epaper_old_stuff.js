
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

    //--------------------------------------------------------------------------//




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
+
