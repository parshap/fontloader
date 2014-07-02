goog.provide('fontloader.CSSFontFaceRule');

goog.scope(function () {
  /**
   * Convenience wrapper around CSSFontFaceRule's. Firefox
   * and IE9 do not support setting properties on the style
   * attribute of a CSSRule, so we work around it by rewriting
   * the rule each time a property is updated.
   *
   * Hopefully we'll be able to remove this wrapper in the
   * future. In the meantime this lets us use the correct API
   * for making these changes.
   *
   * @constructor
   * @param {CSSRule} cssRule
   */
  fontloader.CSSFontFaceRule = function (cssRule) {
    /**
     * @type {CSSRule}
     */
    this.cssRule = cssRule;

    /**
     * @dict
     */
    var style = {};

    /**
     * @type {fontloader.CSSFontFaceRule}
     */
    var that = this;

    ['font-family',
      'font-style',
      'font-variant',
      'font-weight',
      'font-stretch',
      'unicode-range',
      'font-feature-settings',
      '-moz-font-feature-settings',
      '-webkit-font-feature-settings'
    ].forEach(function (key) {
      Object.defineProperty(style, key, {
        get: function () {
          return that.getPropertyValue(key);
        },
        set: function (value) {
          that.setProperty(key, value);
        }
      });
    });

    Object.defineProperties(this, {
      'style': {
        get: function () {
          return style;
        }
      },
      'cssText': {
        get: function () {
          var cssText = '';

          for (var i = 0; i < this.cssRule.style.length; i++) {
            cssText += this.cssRule.style[i] + ':' + this.getPropertyValue(this.cssRule.style[i]) + ';';
          }

          return '@font-face{' + cssText + '}';
        },
        set: function (value) {
          this.update(value);
        }
      },
      'parentStyleSheet': {
        get: function () {
          return this.cssRule.parentStyleSheet;
        }
      }
    });
  };

  var CSSFontFaceRule = fontloader.CSSFontFaceRule;

  /**
   * @type {null|boolean}
   */
  CSSFontFaceRule.SUPPORTS_PROPERTIES = null;

  /**
   * @private
   * @return {number}
   */
  CSSFontFaceRule.prototype.indexOf = function () {
    var styleSheet = this['parentStyleSheet'];

    for (var i = 0; i < styleSheet.cssRules.length; i++) {
      if (styleSheet.cssRules[i] === this.cssRule) {
        return i;
      }
    }

    return -1;
  };

  /**
   * @private
   * @param {string} name
   * @return {string}
   */
  CSSFontFaceRule.prototype.getPropertyValue = function (name) {
    return this.cssRule.style.getPropertyValue(name);
  };

  /**
   * @private
   * @param {string} name
   * @param {string} value
   */
  CSSFontFaceRule.prototype.setProperty = function (name, value) {
    if (CSSFontFaceRule.SUPPORTS_PROPERTIES === null) {
      try {
        // Firefox throws an exception when attempting to set a property.
        // We catch this and set a global flag so we don't need to check
        // on subsequent property retrieval.
        this.cssRule.style.setProperty(name, value);
        CSSFontFaceRule.SUPPORTS_PROPERTIES = true;
      } catch (e) {
        CSSFontFaceRule.SUPPORTS_PROPERTIES = false;
      }
    }

    if (CSSFontFaceRule.SUPPORTS_PROPERTIES) {
      this.cssRule.style.setProperty(name, value);
    } else {
      var cssText = '';

      for (var i = 0; i < this.cssRule.style.length; i++) {
        cssText += this.cssRule.style[i] + ':' + this.getPropertyValue(this.cssRule.style[i]) + ';';
      }

      cssText += name + ':' + value;

      this.update('@font-face{' + cssText + '}');
    }
  };

  /**
   * @private
   */
  CSSFontFaceRule.prototype.delete = function () {
    var index = this.indexOf();

    if (index !== -1) {
      this['parentStyleSheet'].deleteRule(index);
    }
  };

  /**
   * @private
   * @param {string} cssText
   */
  CSSFontFaceRule.prototype.update = function (cssText) {
    var index = this.indexOf();

    if (index !== -1) {
      var parentStyleSheet = this['parentStyleSheet'];

      parentStyleSheet.deleteRule(index);
      parentStyleSheet.insertRule(cssText, index);
      this.cssRule = parentStyleSheet.cssRules[index];
    }
  };
});
