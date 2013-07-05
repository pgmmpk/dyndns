/**
 * phantomjs script that logs into dyn.com
 * 
 * Run like this:
 * 
 * phantomjs dyndns.js username password
 * 
 * 
 */
var page = require('webpage').create(), 
	ADDRESS = 'https://account.dyn.com', 
	args = require('system').args, 
	JQUERY = "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js",
	DEBUG = false, 
	
	username, password;

if (args.length !== 3) {
	console.log('Usage: phantomjs dyndns.js <username> <password>');
	phantom.exit();
}

username = args[1];
password = args[2];

page.onConsoleMessage = function(msg, line, source) {
	if (DEBUG)
		console.log('console> ', msg);
};
page.onError = function(msg, trace) {
	if (DEBUG) {
		console.log(msg);
		trace.forEach(function(item) {
			console.log('  ', item.file, ':', item.line);
		});
	}
};

page.open(ADDRESS, function(status) {
	if (status == 'success') {
		console.log('Login page loaded.');

		// Save screenshot for debugging purposes
		if (DEBUG) page.render("login-before.png");

		page.includeJs(JQUERY, function() {
			// use jQuery to read all forms params (we specifically need hidden fields).
			//
			// since form has child input element named 'submit' one can
			// not use input.form.submit() call to submit form using JS. Hence
			// I will collect all form content and then issue a separate POST
			// request.

			var f = JSON.parse(page.evaluate(function() {
				var form = {};

				$('input').each(function(idx, elt) {
					elt = $(elt);
					form[elt.attr('name')] = elt.val();
				});

				return JSON.stringify(form);
			}));

			f['username'] = username;
			f['password'] = password;

			page.open(ADDRESS, 'post', formEncode(f), function() {
				console.log('Login attempt completed.');

				if (DEBUG) page.render("login-after.png");

				page.includeJs(JQUERY, function() {
					var navText = page.evaluate(function() {
						return $('#topnav').text();
					}).trim();

					if (navText.slice(0, 7) == 'Welcome') {
						console.log('\nSUCCESS\n');

					} else {
						page.render('login-failure.png');
						console.log('\nFAILURE\n');
					}

					phantom.exit();
				});
			});
		});

	} else {
		console.log('Failed to load login page:', ADDRESS);
		phantom.exit();
	}
});

function formEncode(f) {
	out = '';

	for ( var key in f) {
		out += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(f[key]);
	}

	// console.log('encoded:', out);
	return out.slice(1);
}
