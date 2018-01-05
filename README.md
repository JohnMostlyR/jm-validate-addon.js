# jm-validate-addon

[![Greenkeeper badge](https://badges.greenkeeper.io/Mensae/jm-validate-addon.js.svg)](https://greenkeeper.io/)
A HTML5 form validation add on with 0 dependencies

# Description
A HTML5 form validation add on that uses the HTML5 Constraint Validation API and provides you with the ability to
 * style the tooltip to your liking.
 * use your own feedback messages in any language you provide.

This also means that it requires a browser that supports the HTML5 Constraint Validation API. No polyfill or shim is included.

# Usage
Include both the stylesheet and the script in your page, as shown here in the prevered way, and create a new ValidateAddon object as soon as the DOM is ready.
```
<head>
	...
	<link rel="stylesheet" href="jm-validate-addon.css">
</head>
<body>
	...
    <form name="the-form" action="/" novalidate>
    	<fieldset>
        	<legend>Signup</legend>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="your@email.com" required>
            <br>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" minlength="8">
            <br>
            <input type="checkbox" name="terms-and-conditions" id="terms-and-conditions">
            <label for="terms-and-conditions">I agree to the terms and conditions</label>
            <br>
            <button type="submit">Submit</button>
        </fieldset>
    </form>
    ...
    <script src="jm-validate-addon.js"></script>
    <script>
    	window.addEventListener('load', function (ev) {
        	var validate = new ValidateAddon(
            	'the-form', // The name of the form or a reference to the form to validate
            	{
            		language: 'en', // Get messages in this language. Defaults to the browser's language setting, when available
                	autoHide: true, // Automatically hide the tooltip after x seconds. Defaults to true
                	useBrowserMessages: false, // Use my own styling but use the messages as provided by the browser. Defaults to false
                	translationsFolderPath: 'translations', // Use this folder to find the messages. Defaults to 'translations'
                    setCustomValidity: { // Add a custom validation
                    	"terms-and-conditions": {
                        	customFunction: function (element) {
                            	return !!(element.checked);
                            },
                            message: 'Sorry, but we need you to accept the terms and conditions.'
                        },
                    },
            	}
        	);

            // Change or set the language at any time later on
            validate.setLanguage('nl');
        });
	</script>
</body>
```

# Features
* Does not throw errors to the user for required fields as soon as the user is shown the form. Instead it shows the problem when the user moves away from the field.
* When the user submits the form it does not just show the problem for the field that comes first. Instead a tooltip is shown with all fields and the problem there is with it.
* The tooltip can be styled to fit your theme.
* Provide your own feedback messages.
* Override the browser its language setting.
