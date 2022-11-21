/*
	Place this script in the page to be used by the cross-domain cookie storage library as its remote target
*/
(function () {
  //allowed domains
  var whitelist = [];

  function verifyOrigin(origin) {
    var domain = origin.replace(/^https?:\/\/|:\d{1,4}$/g, '').toLowerCase(),
      i = 0,
      len = whitelist.length;

    while (i < len) {
      if (whitelist[i] == domain) {
        return true;
      }
      i++;
    }

    return true;
  }

  function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0)
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  function writeCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie =
      name +
      '=' +
      JSON.stringify(value) +
      ';expires=' +
      d.toUTCString() +
      ';SameSite=none;Secure;';
  }

  function handleRequest(event) {
    if (verifyOrigin(event.origin) && event.data != null) {
      var data =
        typeof event.data !== 'object' ? JSON.parse(event.data) : event.data;
      if (data.hasOwnProperty('operation') && data.hasOwnProperty('key')) {
        var retVal = { id: data.id, key: data.key, value: null };
        if (data.operation == 'write' && data.hasOwnProperty('value')) {
          writeCookie(data.key, data.value, 60);
        } else if (data.operation == 'read') {
          retVal.value = readCookie(data.key);
        }
      }
      event.source.postMessage(JSON.stringify(retVal), event.origin);
    }
  }

  if (window.addEventListener) {
    window.addEventListener('message', handleRequest, false);
  } else if (window.attachEvent) {
    window.attachEvent('onmessage', handleRequest);
  }
})();
