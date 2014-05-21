goog.provide('fontloader.FontFace');

goog.require('fontloader.FontFaceLoadStatus');

goog.scope(function () {
  /**
   * @constructor
   * @param {string} family
   * @param {string|fontloader.BinaryData} source
   * @param {fontloader.FontFaceDescriptors} descriptors
   */
  fontloader.FontFace = function (family, source, descriptors) {
    if (arguments.length !== 3) {
      throw new TypeError("Failed to constructor 'FontFace': 3 arguments required, but only " + arguments.length + " present.");
    }

    var fontface = this;

    /**
     * @type {!fontloader.FontFaceLoadStatus}
     */
    this.status = fontloader.FontFaceLoadStatus.UNLOADED;

    /**
     * @type {?string}
     */
    this.family = null;

    /**
     * @type {?string}
     */
    this.style = null;

    /**
     * @type {?string}
     */
    this.weight = null;

    /**
     * @type {?string}
     */
    this.stretch = null;

    /**
     * @type {?string}
     */
    this.unicodeRange = null;

    /**
     * @type {?string}
     */
    this.variant = null;

    /**
     * @type {?string}
     */
    this.featureSettings = null;

    /**
     * @type {?string}
     */
    this.src = null;

    /**
     * @type {Promise}
     */
    this.promise = new Promise(function (resolve, reject) {
      fontface.family = family;
      fontface.style = fontface.validate(descriptors['style'], FontFace.DescriptorValidator.STYLE) || "normal";
      fontface.weight = fontface.validate(descriptors['weight'], FontFace.DescriptorValidator.WEIGHT) || "normal";
      fontface.stretch = fontface.validate(descriptors['stretch'], FontFace.DescriptorValidator.STRETCH) || "normal";
      fontface.unicodeRange = fontface.validate(descriptors['unicodeRange'], FontFace.DescriptorValidator.UNICODE_RANGE) || "u+0-10FFFF";
      fontface.variant = fontface.validate(descriptors['variant'], FontFace.DescriptorValidator.VARIANT) || "normal";
      fontface.featureSettings = fontface.validate(descriptors['featureSettings'], FontFace.DescriptorValidator.FEATURE_SETTINGS) || "normal";

      if (typeof source === 'string') {
        var srcRegExp = /\burl\((\'|\"|)([^\'\"]+?)\1\)( format\((\'|\"|)([^\'\"]+?)\4\))?/g,
            match = null,
            valid = false;

        while ((match = srcRegExp.exec(source))) {
          if (match[2]) {
            valid = true;
          }
        }

        if (!valid) {
          reject(new SyntaxError("Failed to construct 'FontFace': The source provided ('" + source + "') could not be parsed as a value list."));
        } else {
          fontface.src = source;
        }
      } else {
        var bytes = new Uint8Array(source),
            buffer = '';

        for (var i = 0, l = bytes.length; i < l; i++) {
          buffer += String.fromCharCode(bytes[i]);
        }

        // TODO: We could detect the format here and set the correct mime type
        fontface.src = 'url(data:font/opentype;base64,' + window.btoa(buffer) + ')';
      }

      if (fontface.data) {
        fontface.status = fontloader.FontFaceLoadStatus.LOADING;
      }
    });
  };

  var FontFace = fontloader.FontFace;

  /**
   * @private
   * @type {Object.<string, RegExp>}
   */
  FontFace.DescriptorValidator = {
    STYLE: /^(italic|oblique|normal)$/,
    WEIGHT: /^(bold(er)?|lighter|[1-9]00|normal)$/,
    STRETCH: /^(((ultra|extra|semi)-)?(condensed|expanded)|normal)$/,
    UNICODE_RANGE: /^(u\+[0-9a-f?]{1,6}(-[0-9a-f]{1,6})?)$/i,
    VARIANT: /^(small-caps|normal)$/,
    FEATURE_SETTINGS: /^normal$/ // TODO: Fix this and variant
  };

  /**
   * Validates and returns a descriptor. Throws a SyntaxError
   * if the descriptor does not validate and returns null if
   * the descriptor is not present.
   *
   * @private
   * @param {string?} descriptor
   * @param {RegExp} validator
   *
   * @return {string?}
   */
  FontFace.prototype.validate = function (descriptor, validator) {
    if (descriptor) {
      if (validator.test(descriptor)) {
        return descriptor;
      } else {
        throw new SyntaxError("Failed to construct 'FontFace': Failed to set '" + descriptor + "' as a property value.");
      }
    } else {
      return null;
    }
  };

  /**
   * @return {Promise}
   */
  FontFace.prototype.load = function () {
    return this.promise;
  };

  /**
   * @private
   *
   * Returns a CSS representation of this FontFace.
   *
   * @return {string}
   */
  FontFace.prototype.toCSS = function () {
    return '@font-face{' +
        'font-family:' + this.family + ';' +
        'font-style:' + this.style + ';' +
        'font-weight:' + this.weight + ';' +
        'font-stretch:' + this.stretch + ';' +
        'unicode-range:' + this.unicodeRange + ';' +
        'font-variant:' + this.variant + ';' +
        'font-feature-settings:' + this.featureSettings + ';' +
        'src:' + this.src + ';' +
      '}';
  };
});
