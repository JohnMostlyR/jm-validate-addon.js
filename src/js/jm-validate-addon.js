'use strict';

/**
 * Creates a new ValidateAddon.
 * @description A HTML5 form validation add on that uses the HTML5 Constraint Validation API and provides the ability to
 *  style the tooltip to your liking. It also does not throw errors at the user when the user did not do anything yet.
 *  Instead a, configurable, message wil be shown when a user moves away from the field and, or, on submitting the form.
 * @author Johan Meester <walter.doodah@gmail.com>
 * @licence MIT - http://opensource.org/licenses/MIT
 * @copyright Johan Meester 2017
 */
(function (root) {
  const DOC = root.document;
  const defaults = {
    autoHide: true,
    language: root.navigator.language.substr(0, 2),
    translationsFolderPath: 'translations',
    useBrowserMessages: false,
  };

  let _translationsFolderPath = '';
  let _messages = {};

  /**
   * @function _getMessages
   * @description Fetches the JSON file with the messages in the requested language.
   *  These files need to be placed in the same folder as this file in a subfolder named 'translations'.
   * @param {!string} language - A 2 letter language code according ISO 639.
   * @returns {boolean} Returns true if we get a valid messages file. False otherwise.
   * @private
   */
  const _getMessages = function (language) {
    const getMessages = new XMLHttpRequest();
    getMessages.timeout = 5000;
    getMessages.ontimeout = () => {
      console.warn('Fetching of feedback _messages timed out.');
      console.warn('Now falling back to the default language.');
      return false;
    };
    getMessages.onreadystatechange = () => {
      if (getMessages.readyState === XMLHttpRequest.DONE) {
        if (getMessages.status === 200) {
          try {
            const fetchedMessages = root.JSON.parse(getMessages.response).messages;

            const requiredProperties = [
              'badInput',
              'patternMismatch',
              'rangeOverflow',
              'rangeUnderflow',
              'stepMismatch',
              'tooLong',
              'typeMismatch',
              'valueMissing'
            ];

            // Check if the file contains the required properties
            let isValid = requiredProperties
              .filter((propertie) => {
                return (!fetchedMessages[propertie]);
              });

            // Two leftover subproperties to check
            if (fetchedMessages.valueMissing && typeof fetchedMessages.valueMissing === 'object') {
              if (!fetchedMessages.valueMissing.beforeSubmit) {
                isValid.push('valueMissing.beforeSubmit');
              }

              if (!fetchedMessages.valueMissing.onSubmit) {
                isValid.push('valueMissing.onSubmit');
              }
            }

            console.log('isValid: ', isValid);

            if (isValid.length > 0) {
              console.warn(`The requested file for language '${language}' is missing one or more required properties`);
              console.warn(`Missing these: ${isValid}`);
              return false;
            }

            // Safely use the requested _messages
            _messages = fetchedMessages;

            return true;
          } catch (err) {
            console.warn(err.message);
          }
        } else {
          console.warn(`Unable to find the feedback messages file for ${language}`);
          console.warn('Now falling back to the default language.');
        }
      }

      return false;
    };

    getMessages.open('GET', `${_translationsFolderPath}/${language}.json`, true);
    getMessages.send();
  };

  /**
   * @function _formByNameOrNode
   * @description When passed a node it just returns it. When passed the form name it finds the node by name in the
   *  forms list.
   * @param {!Object|string} formNameOrNode - A reference to the form or the name of the form.
   * @returns {Object} - A reference to the form.
   * @private
   */
  const _formByNameOrNode = function (formNameOrNode) {
    return (typeof formNameOrNode === 'object') ? formNameOrNode : DOC.forms[formNameOrNode];
  };

  /**
   * @function _getElementLeft
   * @description Gets the element's left position on the screen.
   * @param {Object} element - Reference to the element.
   * @returns {number|Number} - The element's left position on the screen.
   * @private
   */
  const _getElementLeft = function (element) {
    let actualLeft = element.offsetLeft;
    let current = element.offsetParent;
    while (current !== null) {
      actualLeft += current.offsetLeft;
      current = current.offsetParent;
    }
    return actualLeft;
  };

  /**
   * @function _getElementTop
   * @description Gets the element's top position on the screen
   * @param {Object} element - Reference to the element
   * @returns {number|Number} - The element's left position on the screen
   * @private
   */
  const _getElementTop = function (element) {
    let actualTop = element.offsetTop;
    let current = element.offsetParent;
    while (current !== null) {
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }
    return actualTop;
  };

  /**
   * @function _createMessageTooltip
   * @description Creates the tooltip to give the user feedback on any validation issues.
   * @param {!Object|string} message - When passed a string it creates the tooltip above or below the field that is not
   *  valid. When passed an object a tooltip is created shown above or below the form where each field that is not valid is on
   *  one line starting with the field's name and behind it the problem.
   * @param {string} message.validityState.message - The validity state and message.
   * @param {!Object} field - The field to attach the tooltip to.
   * @param {boolean} [autoHide=true] - When true the tooltip will be removed after x seconds. When set to false the
   *  tooltip will stay until a key is pressed or a mouse button is clicked.
   * @private
   */
  const _createMessageTooltip = function (message, field, autoHide) {
    const tooltip = DOC.createElement('div');
    tooltip.id = `jm-validate-addon__tooltip-${field.name}`;
    tooltip.classList.add('jm-validate-addon__tooltip');

    if (typeof message === 'object') {
      tooltip.classList.add('jm-validate-addon__tooltip--with-labels');
      const lines = DOC.createDocumentFragment();
      Object
        .keys(message)
        .forEach(fieldWithError => {
          const line = DOC.createElement('p');
          line.classList.add('jm-validate-addon__line');
          const label = DOC.createElement('span');
          label.classList.add('jm-validate-addon__label');
          label.appendChild(DOC.createTextNode(`${fieldWithError}:`));
          line.appendChild(label);
          line.appendChild(DOC.createTextNode(message[fieldWithError].error));
          lines.appendChild(line);
        });
      tooltip.appendChild(lines);
    } else {
      const line = DOC.createElement('p');
      line.classList.add('jm-validate-addon__line');
      line.appendChild(DOC.createTextNode(message));
      tooltip.appendChild(line);
    }

    field.parentNode.insertBefore(tooltip, field);

    const _showTooltip = function () {
      // Set max-width to be equal to the field's width
      tooltip.style.maxWidth = `${field.offsetWidth}px`;

      const tooltipArrowHeight = 10;
      const tooltipHeight = parseInt(root.getComputedStyle(tooltip).height, 10);
      const tooltipWidth = parseInt(root.getComputedStyle(tooltip).width, 10);
      const fieldOffsetLeft = _getElementLeft(field);
      const fieldOffsetTop = _getElementTop(field);

      let positionLeft = fieldOffsetLeft;
      let positionTop = fieldOffsetTop - tooltipHeight - tooltipArrowHeight;

      if (positionTop < 0) {
        positionTop = fieldOffsetTop + field.offsetHeight + tooltipArrowHeight;
        tooltip.classList.add('jm-validate-addon__top');
      } else {
        tooltip.classList.remove('jm-validate-addon__top');
      }

      tooltip.style.left = `${positionLeft}px`;
      tooltip.style.top = `${positionTop}px`;

      tooltip.classList.add('jm-validate-addon__tooltip--show');
    };

    _showTooltip();

    root.addEventListener('resize', _showTooltip);

    let timerId = 0;

    const _removeTooltip = function () {
      if (timerId) root.clearTimeout(timerId);
      tooltip.addEventListener('transitionend', () => {
        field.parentNode.removeChild(tooltip);
      }, false);
      tooltip.classList.remove('jm-validate-addon__tooltip--show');
    };

    if (autoHide) {
      // Automatically remove tooltip after x seconds
      timerId = root.setTimeout(_removeTooltip, 5000);
    }

    root.addEventListener('click', (ev) => {
      if (ev.target === field) {
        _removeTooltip();
      }
    });
    root.addEventListener('keydown', _removeTooltip);
  };

  /**
   * @function _getValidityState
   * @description Get the validity state on the given element.
   * @param {!Object} element - The form element.
   * @param {!boolean} useBrowserMessage - If set to true, the browser configured message is used.
   * @param {string} [validationMoment='beforeSubmit'] - The moment on where the validation takes place.
   * @returns {object} [fieldName.validityState]
   * @private
   */
  const _getValidityState = function (element, useBrowserMessage, validationMoment = 'beforeSubmit') {
    if (useBrowserMessage) {
      return element.validationMessage;
    }

    const validity = element.validity;
    let message = element.validationMessage;

    if (validity.valueMissing) {
      return _messages.valueMissing[validationMoment];
    } else {
      message = Object
        .keys(_messages)
        .find((state) => {
          return (validity[state]);
        });

      return _messages[message];
    }
  };

  /**
   * ValidationAddon
   * @param {Object|string} formNameOrNode
   * @param {Object} [language=defaults.language] A 2 letter language code according the ISO 639 standard.
   * @param {boolean} [autoHide=defaults.autoHide] When true the tooltip will be removed after x seconds.
   *  When false the tooltip gets removed after the user clicks in the field with the error or presses any key.
   * @param {boolean} [useBrowserMessages=defaults.useBrowserMessages] When true the build in _messages from the browser
   *  will be used.
   *  @param {string} translationsFolderPath
   * @constructor
   */
  function ValidateAddon(
    formNameOrNode,
    {
      language = defaults.language,
      autoHide = defaults.autoHide,
      useBrowserMessages = defaults.useBrowserMessages,
      translationsFolderPath = defaults.translationsFolderPath
    } = {})
  {
    this.autoHide = autoHide;
    this.errors = {};
    this.form = _formByNameOrNode(formNameOrNode) || {};

    // Set the path to the folder where the translation files can be found
    _translationsFolderPath = translationsFolderPath.replace(/\/$/, '');

    // We need to set the novalidate attribute
    if (!this.form.getAttribute('novalidate')) {
      this.form.noValidate = true;
    }

    // Get the required translations
    if (!useBrowserMessages && language && language.length === 2 && _getMessages(language)) {
      this.language = language;
    } else {
      // Fall back to the browser configured _messages
      this.useBrowserMessages = true;
    }

    // Get the fields to validate
    this.fields = [...this.form.elements]
      .filter(element => {
        // Keep only the elements that have the name attribute
        return (element.name);
      })
      .filter(element => {
        // Keep only form elements that are not of type button
        return (element.tagName.toUpperCase() !== 'BUTTON');
      })
      .reduce((fields, element) => {
        if (!fields[element.name]) {
          element.addEventListener('blur', (ev) => {
            // When the user moves away from the field, we check if the field is valid.
            if (!element.validity.valid) {
              const message = _getValidityState(element, this.useBrowserMessages);
              _createMessageTooltip(message, element, this.autoHide);
            }

            ev.preventDefault();
          }, false);

          fields[element.name] = {
            name: element.name,
          };
        }

        return fields;
      }, {});

    // Validate the whole form when the user submits it
    this.form.addEventListener('submit', (ev) => {
      this.errors = {};
      let isValid = true;

      Object.keys(this.fields)
        .forEach(field => {
          if (!this.form.elements[field].validity.valid) {
            isValid = false;
            this.errors[field] = {
              error: _getValidityState(this.form.elements[field], this.useBrowserMessages, 'onSubmit'),
            };
          }
        });

      if (!isValid) {
        _createMessageTooltip(this.errors, this.form, this.autoHide);
        ev.preventDefault();
      }
    }, false);
  }

  ValidateAddon.prototype = {
    constructor: ValidateAddon,

    /**
     * @method setLanguage
     * @description Change the default language.
     * @param {!string} language - A 2 letter language code according the ISO 639 standard.
     */
    setLanguage: function (language) {
      _getMessages(language);
    },
  };

  root.ValidateAddon = ValidateAddon;
})(typeof global !== 'undefined' ? global : window);
