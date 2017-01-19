# jm-validate-addon
A HTML5 form validation add on with 0 dependencies

# Description
A HTML5 form validation add on that uses the HTML5 Constraint Validation API and provides you with the ability to
 * style the tooltip to your liking.
 * use your own feedback messages in any language you provide.

This also means that it requires a browser that supports the HTML5 Constraint Validation API. No polyfill or shim is included.

Tested with Chrome v55, Firefox v50.1 and Edge v38.

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
    	...
    </form>
    ...
    <script src="jm-validate-addon.js"></script>
    <script>
    	window.addEventListener('load', function (ev) {
        	var validate = new ValidateAddon(
            	'the-form', // The name of the form or a reference to the form to validate
            	{
            		language: 'nl', // Defaults to the browser's language setting, if that language is available
                	autoHide: true, // Defaults to true
            	}
        	);
        });
	</script>
</body>
```

# Features
