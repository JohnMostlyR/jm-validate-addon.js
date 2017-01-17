'use strict';

(function (root) {
  const DOC = root.document;
  const defaults = {
    messages: {
      badInput: '',
      patternMismatch: 'Please provide input according the required pattern',
      rangeOverflow: 'Please enter a value equal to or lower than the required maximum',
      rangeUnderflow: 'Please enter a value equal to or higher than the required minimum',
      stepMismatch: 'Please enter a value that fits any possible step',
      tooLong: 'Please try to shorten your input',
      typeMismatch: 'Please provide input according to the correct syntax',
      valueMissing: {
        beforeSubmit: 'Please do not forget to fill this in',
        onSubmit: 'Sorry but we really need this information from you',
      },
    },
    callback: (errors) => {
    }
  };

  const messages = defaults.messages;

  const _formByNameOrNode = function (formNameOrNode) {
    return (typeof formNameOrNode === 'object') ? formNameOrNode : DOC.forms[formNameOrNode];
  };

  const _getElementLeft = function (element) {
    let actualLeft = element.offsetLeft;
    let current = element.offsetParent;
    while (current !== null) {
      actualLeft += current.offsetLeft;
      current = current.offsetParent;
    }
    return actualLeft;
  };

  const _getElementTop = function (element) {
    let actualTop = element.offsetTop;
    let current = element.offsetParent;
    while (current !== null) {
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }
    return actualTop;
  };

  const _createMessageTooltip = function (message, field, autoHide = false) {
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

    root.addEventListener('click', _removeTooltip);
    root.addEventListener('keydown', _removeTooltip);
  };

  const _provideFeedback = function (element, validationMoment = 'beforeSubmit') {
    const validity = element.validity;
    let message = element.validationMessage;

    if (validity.valueMissing) {
      return messages.valueMissing[validationMoment];
    } else {
      message = Object
        .keys(messages)
        .find((state) => {
          return (validity[state]);
        });

      return messages[message];
    }
  };

  function ValidateAddon(formNameOrNode, callback = defaults.callback) {
    this.callback = callback;
    this.errors = {};
    this.form = _formByNameOrNode(formNameOrNode) || {};

    this.fields = [...this.form.elements]
      .filter(element => {
        return (element.name);
      })
      .filter(element => {
        return (element.tagName.toUpperCase() !== 'BUTTON');
      })
      .reduce((fields, element) => {
        if (!fields[element.name]) {
          element.addEventListener('blur', (ev) => {
            // When the user moves away from the field, we check if the field is valid.
            if (element.validity.valid) {
              // In case there is an error message visible, if the field
              // is valid, we remove the error message.
            } else {
              const message = _provideFeedback(element);
              _createMessageTooltip(message, element);
            }

            ev.preventDefault();
          }, false);

          fields[element.name] = {
            name: element.name,
          };
        }

        return fields;
      }, {});

    this.form.addEventListener('submit', (ev) => {
      this.errors = {};
      let isValid = true;

      Object.keys(this.fields)
        .forEach(field => {
          if (!this.form.elements[field].validity.valid) {
            isValid = false;
            this.errors[field] = {
              error: _provideFeedback(this.form.elements[field], 'onSubmit'),
            };
          }
        });

      if (!isValid) {
        _createMessageTooltip(this.errors, this.form);
        ev.preventDefault();
      }
    }, false);
  }

  ValidateAddon.prototype = {
    constructor: ValidateAddon,
  };

  root.ValidateAddon = ValidateAddon;
})(typeof global !== 'undefined' ? global : window);
