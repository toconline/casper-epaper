/**
 *
 * MIT X11 license
 * Copyright © 2014–2015 Miëtek Bak.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the
 * “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * The Software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of
 * merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for
 * any  *claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with
 * the  *software or the use or other dealings in the software.
 *
 * Except as contained in this notice, the names of the above copyright holders shall not be used in advertising or otherwise to promote the
 * sale, use or other dealings in the Software without prior written authorization.
 */

(function(root) {

  /**
   * @brief An exponential approximation of the default CSS transition timing function.
   *
   * @param a_t parametic t between 0 and 1
   */
  root.EPaper.prototype.ease = function (a_t) {

    return (
        a_t <= 0 ? 0 :
        a_t >= 1 ? 1 :
        1.0042954579734844 * Math.exp(
          -6.4041738958415664 * Math.exp(
            -7.2908241330981340 * a_t))
    );
  };

})(this);