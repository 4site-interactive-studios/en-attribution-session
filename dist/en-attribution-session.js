/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/CrossDomainStorage.ts":
/*!***********************************!*\
  !*** ./src/CrossDomainStorage.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "CrossDomainStorage": () => (/* binding */ CrossDomainStorage)
/* harmony export */ });
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class CrossDomainStorage {
    constructor(origin, path) {
        this.origin = origin;
        this.path = path;
        this.iframe = null;
        this.iframeReady = false;
        this.queue = [];
        this.requests = {};
        this.id = 0;
    }
    init() {
        if (!this.iframe) {
            if (window.JSON && window.localStorage) {
                this.iframe = document.createElement('iframe');
                this.iframe.style.cssText =
                    'position:absolute;width:1px;height:1px;left:-9999px;';
                document.body.appendChild(this.iframe);
                if (window.addEventListener) {
                    this.iframe.addEventListener('load', () => {
                        this._iframeLoaded();
                    }, false);
                    window.addEventListener('message', (event) => {
                        this._handleMessage(event);
                    }, false);
                }
            }
            else {
                throw new Error('Unsupported browser.');
            }
        }
        this.iframe.src = this.origin + this.path;
    }
    storeValue(key, value, callback) {
        this.callURL(this.origin + this.path).then((result) => {
            if (result != 200) {
                // Cancel cross-domain cookie processing if iframe doesn't load
                callback({ message: 'invalid iframe' });
            }
            else {
                this._processRequest({
                    key: key,
                    value: value,
                    id: ++this.id,
                    operation: 'write',
                }, callback);
            }
        });
    }
    requestValue(key, callback) {
        this.callURL(this.origin + this.path).then((result) => {
            if (result != 200) {
                // Cancel cross-domain cookie processing if iframe doesn't load
                callback({ message: 'invalid iframe' });
            }
            else {
                this._processRequest({ key: key, id: ++this.id, operation: 'read' }, callback);
            }
        });
    }
    _processRequest(request, callback) {
        const data = {
            request: request,
            callback: callback,
        };
        if (this.iframeReady) {
            this._sendRequest(data);
        }
        else {
            this.queue.push(data);
        }
        if (!this.iframe) {
            this.init();
        }
    }
    _sendRequest(data) {
        this.requests[data.request.id] = data;
        this.iframe.contentWindow.postMessage(JSON.stringify(data.request), this.origin);
    }
    _iframeLoaded() {
        this.iframeReady = true;
        if (this.queue.length) {
            for (let i = 0, len = this.queue.length; i < len; i++) {
                this._sendRequest(this.queue[i]);
            }
            this.queue = [];
        }
    }
    _handleMessage(event) {
        if (event.origin === this.origin) {
            const d = JSON.parse(event.data);
            if (this.requests[d.id]) {
                if (typeof this.requests[d.id].callback === 'function') {
                    this.requests[d.id].callback(d);
                }
            }
            delete this.requests[d.id];
        }
    }
    callURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url);
            return response.status;
        });
    }
}


/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/regex.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/rng.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/rng.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ rng)
/* harmony export */ });
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/stringify.js":
/*!*********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/stringify.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./validate.js */ "./node_modules/uuid/dist/esm-browser/validate.js");

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stringify);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v4.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v4.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/esm-browser/rng.js");
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./stringify.js */ "./node_modules/uuid/dist/esm-browser/stringify.js");



function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || _rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__["default"])(rnds);
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v4);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/validate.js":
/*!********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/validate.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _regex_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./regex.js */ "./node_modules/uuid/dist/esm-browser/regex.js");


function validate(uuid) {
  return typeof uuid === 'string' && _regex_js__WEBPACK_IMPORTED_MODULE_0__["default"].test(uuid);
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (validate);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***************************************!*\
  !*** ./src/en-session-attribution.ts ***!
  \***************************************/
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var _CrossDomainStorage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CrossDomainStorage */ "./src/CrossDomainStorage.ts");


function getCookie(cookie) {
    const cookies = document.cookie;
    const cookiesArr = cookies.split('; ');
    const cookieNames = [];
    const cookieVals = [];
    cookiesArr.forEach((element) => {
        const elementArr = element.split('=');
        cookieNames.push(elementArr[0]);
        cookieVals.push(elementArr[1]);
    });
    if (cookieNames.includes(cookie)) {
        return cookieVals[cookieNames.indexOf(cookie)];
    }
    return '';
}
function setCookie(cookieName, cookieVal, expiration = getScriptData('expiration', '3600')) {
    const now = new Date();
    const expirationTime = parseInt(expiration) * 1000 + now.getTime();
    now.setTime(expirationTime);
    const newCookie = `${cookieName}=${cookieVal};expires=${now.toUTCString()};path=/`;
    document.cookie = newCookie;
    return cookieName;
}
function getScriptData(attribute, defaultValue = '') {
    const scriptTag = document.querySelector('script[src*="en-attribution-session.js"]');
    if (scriptTag) {
        const data = scriptTag.getAttribute('session-' + attribute);
        return data !== null && data !== void 0 ? data : defaultValue;
    }
    return defaultValue;
}
function createNewSession() {
    const sessionParams = [];
    const currentURL = new URL(document.location.href);
    let referralURL;
    if (window.location !== window.parent.location) {
        referralURL = document.referrer;
    }
    else {
        referralURL = document.referrer === '' ? 'direct' : document.referrer;
        if (referralURL !== 'direct') {
            const tempURL = new URL(referralURL);
            referralURL = tempURL.protocol + '//' + tempURL.hostname;
        }
    }
    currentURL.searchParams.delete('engrid_session');
    sessionParams.push((0,uuid__WEBPACK_IMPORTED_MODULE_1__["default"])()); // Generate UUID
    sessionParams.push(getCurrentTime().toString()); // First seen
    sessionParams.push(getCurrentTime().toString()); // Last seen
    sessionParams.push('1'); // Session page counter
    sessionParams.push(referralURL); // First referral URL
    if (currentURL.search.length > 0) {
        let referralParamString = currentURL.search.slice(1);
        // Remove hanging '=' symbols
        referralParamString =
            referralParamString[referralParamString.length - 1] == '='
                ? referralParamString.slice(0, referralParamString.length - 1)
                : referralParamString;
        referralParamString = referralParamString.replace(/=&/g, '&');
        sessionParams.push(referralParamString); // First referral parameters
    }
    else {
        sessionParams.push('');
    }
    return sessionParams.join('|');
}
function updateSession(currentSession, updatepage = true) {
    const sessionParams = getSessionObj(currentSession);
    sessionParams['last_seen'] = getCurrentTime().toString(); // Update last-seen
    const currentURL = new URL(document.location.href);
    let referralURL;
    if (window.location !== window.parent.location) {
        referralURL = document.location.href;
    }
    else {
        referralURL = document.referrer === '' ? 'direct' : document.referrer;
        if (referralURL !== 'direct') {
            const tempURL = new URL(referralURL);
            referralURL = tempURL.protocol + '//' + tempURL.hostname;
        }
    }
    if (updatepage) {
        sessionParams['page_count'] = (parseInt(sessionParams['page_count']) + 1).toString(); // Update session page counter
    }
    currentURL.searchParams.delete('engrid_session');
    // Update current referral URL
    sessionParams['current_referral'] = referralURL;
    let referralParamString = currentURL.search.length > 0 ? currentURL.search.slice(1) : '';
    // Remove hanging '=' symbols
    referralParamString =
        referralParamString[referralParamString.length - 1] == '='
            ? referralParamString.slice(0, referralParamString.length - 1)
            : referralParamString;
    referralParamString = referralParamString.replace(/=&/g, '&');
    sessionParams['current_referral_params'] = referralParamString;
    return Object.values(sessionParams).join('|');
}
function checkSessionLength(session) {
    let decodedSession = window.atob(session);
    if (session.length > 1500 && decodedSession.split('|').length > 6) {
        //const sessionParams = decodedSession.split("|");
        const sessionParams = getSessionObj(decodedSession);
        delete sessionParams['current_referral'];
        delete sessionParams['current_referral_params'];
        decodedSession = Object.values(sessionParams).join('|');
        session = window.btoa(decodedSession);
    }
    // Check session length after removing latest referral URL info
    if (session.length > 1500) {
        return '';
    }
    return session;
}
function getCurrentTime() {
    return Math.round(Date.now() / 1000);
}
function getSessionObj(session) {
    if (session.indexOf('Parameter') === -1) {
        const sessionArr = session.split('|');
        const sessionObj = {};
        sessionObj['uuid'] = sessionArr[0];
        sessionObj['first_seen'] = sessionArr[1];
        sessionObj['last_seen'] = sessionArr[2];
        sessionObj['page_count'] = sessionArr[3];
        sessionObj['first_referral'] = sessionArr[4];
        sessionObj['first_referral_params'] = sessionArr[5];
        if (sessionArr[6]) {
            sessionObj['current_referral'] = sessionArr[6];
        }
        if (sessionArr[7]) {
            sessionObj['current_referral_params'] = sessionArr[7];
        }
        return sessionObj;
    }
    else {
        const JSONstring = session.slice(session.indexOf('{'));
        const sessionObj = JSON.parse(JSONstring);
        return sessionObj;
    }
}
function debugSession(session) {
    const currentSesh = document.querySelector('.currentSession');
    if (currentSesh) {
        currentSesh.innerHTML = 'Current session: ' + session;
    }
    const sessionObj = getSessionObj(session);
    if (window.location !== window.parent.location) {
        console.log('[iframe session]', sessionObj);
    }
    else {
        console.log('[page session]', sessionObj);
    }
    const commentsField = document.querySelector("[name='transaction.comments']");
    if (commentsField) {
        //prettier-ignore
        console.log("[Additional Comments Field]\n", commentsField.value);
    }
}
function handleSessionData(data, updatepage = true, mirroredSession = '', crossDomainCookie = false) {
    if (data.message && data.message == 'invalid iframe') {
        // Restart function using local cookie if iframe doesn't load
        console.log('Invalid link for session-iframe attribute. Using local cookies instead...');
        window.invalidSessionIframe = true;
        sessionAttribution(updatepage, true, mirroredSession);
        return;
    }
    const iframeURL = getScriptData('iframe');
    const iframeURLObj = new URL(iframeURL);
    const crossDomain = new _CrossDomainStorage__WEBPACK_IMPORTED_MODULE_0__.CrossDomainStorage(iframeURLObj.origin, iframeURLObj.pathname);
    // Don't run iframe session until parent session data is mirrored
    const queryStr = window.location.search;
    const urlParams = new URLSearchParams(queryStr);
    let currentSession = '';
    let enMergeTag = '';
    const allowSession = urlParams.get('session-attribution');
    // Fetch and decode session attribution data
    const encodedSessionParam = urlParams.get('engrid_session');
    let enSessionParam;
    if (encodedSessionParam) {
        enSessionParam = window.atob(encodedSessionParam);
    }
    let enCookie;
    if (crossDomainCookie && data.value && data.value != '') {
        enCookie = data.value;
        enCookie = enCookie.replace(/["]+/g, '');
        enCookie = window.atob(enCookie);
    }
    else if (getCookie('engrid_attribution_memory_cookie') != '') {
        enCookie = window.atob(getCookie('engrid_attribution_memory_cookie'));
    }
    const supporterTag = getScriptData('additional_comments');
    const additionalCommentsField = document.querySelector(`[name='${supporterTag}']`);
    const memAttribute = window.additionalCommentsTag;
    if (memAttribute) {
        enMergeTag = memAttribute;
    }
    if (enMergeTag == undefined &&
        enCookie == '' &&
        enSessionParam == undefined) {
        currentSession = '';
    }
    else {
        // Get the most recent session info
        const tempArr = [];
        let latestTime = 0;
        let mostRecentIndex = -1;
        if (enCookie && enCookie.includes('|')) {
            tempArr.push(enCookie);
        }
        if (enMergeTag && enMergeTag.includes('|')) {
            tempArr.push(enMergeTag);
        }
        if (enSessionParam && enSessionParam.includes('|')) {
            tempArr.push(enSessionParam);
        }
        for (let i = 0; i < tempArr.length; ++i) {
            if (parseInt(getSessionObj(tempArr[i])['last_seen']) > latestTime) {
                latestTime = parseInt(getSessionObj(tempArr[i])['last_seen']);
                mostRecentIndex = i;
            }
        }
        currentSession = mostRecentIndex > -1 ? tempArr[mostRecentIndex] : '';
    }
    // Determine whether session should be continued or not
    const sessionLength = getScriptData('expiration', '900');
    let newSession;
    const oldSessionObj = getSessionObj(currentSession);
    if (currentSession === '' ||
        currentSession == '{user_data~Additional Comments Stand In}' ||
        getCurrentTime() - parseInt(oldSessionObj['last_seen']) >=
            parseInt(sessionLength)) {
        newSession = true;
    }
    else {
        newSession = false;
    }
    // Check if script is running outside Engaging Networks
    if (!('pageJson' in window)) {
        if (newSession) {
            currentSession = createNewSession();
        }
        else {
            currentSession = updateSession(currentSession, updatepage);
        }
        let encodedSession = window.btoa(currentSession);
        encodedSession = checkSessionLength(encodedSession);
        setCookie('engrid_attribution_memory_cookie', encodedSession);
        if (crossDomainCookie) {
            crossDomain.storeValue('engrid_attribution_memory_cookie', encodedSession, () => {
                return;
            });
        }
        document.addEventListener('click', (event) => {
            const eventTarget = event.target;
            if (eventTarget && eventTarget.tagName === 'A') {
                if (/\/page\/[0-9]{5,6}\//.test(eventTarget.href)) {
                    event.preventDefault();
                    const clickedURL = new URL(eventTarget.href);
                    if (encodedSession === '') {
                        window.location.href = clickedURL.href;
                    }
                    else {
                        clickedURL.searchParams.set('engrid_session', encodedSession);
                        window.location.href = clickedURL.href;
                    }
                }
            }
        });
    }
    else {
        const submitBtn = document.querySelector('.en__submit');
        const enForm = document.querySelector('form.en__component');
        const standInField = document.createElement('input');
        const standInExists = document.querySelector(`[name='${supporterTag}']`);
        standInField.setAttribute('name', supporterTag);
        standInField.classList.add('en__field__input');
        standInField.setAttribute('type', 'hidden');
        if (!standInExists) {
            enForm === null || enForm === void 0 ? void 0 : enForm.appendChild(standInField);
        }
        if (newSession) {
            currentSession = createNewSession();
        }
        else {
            currentSession = updateSession(currentSession, updatepage);
        }
        if (window.location !== window.parent.location && mirroredSession !== '') {
            currentSession = mirroredSession;
        }
        let encodedSession = window.btoa(currentSession);
        encodedSession = checkSessionLength(encodedSession);
        if (allowSession != 'false') {
            if (!additionalCommentsField) {
                standInField.value = JSON.stringify(getSessionObj(currentSession)).replace(/"/g, "'");
            }
            else {
                additionalCommentsField.value = JSON.stringify(getSessionObj(currentSession)).replace(/"/g, "'");
            }
        }
        if (encodedSession === '') {
            return;
        }
        else {
            setCookie('engrid_attribution_memory_cookie', encodedSession);
            if (window.location == window.parent.location) {
                if (crossDomainCookie) {
                    crossDomain.storeValue('engrid_attribution_memory_cookie', encodedSession, () => {
                        return;
                    });
                }
                if (additionalCommentsField && allowSession != 'false') {
                    additionalCommentsField.value = JSON.stringify(getSessionObj(currentSession));
                }
            }
        }
        // Populate "Additional Comments" field
        const additionalComments = document.querySelector("[name='transaction.comments']");
        if (!additionalComments) {
            // Create Additional Comments field
            const newField = document.createElement('input');
            newField.classList.add('en__field__input');
            newField.classList.add('en__field__input--hidden');
            newField.setAttribute('type', 'hidden');
            newField.setAttribute('name', 'transaction.comments');
            const sessionObjStr = 'Parameter tracking: ' +
                //prettier-ignore
                JSON.stringify(getSessionObj(currentSession), null, "\n").replace(/"/g, "'");
            newField.value = allowSession != 'false' ? sessionObjStr : '';
            if (enForm) {
                enForm.appendChild(newField);
            }
        }
    }
    const parentURL = new URL(document.location.href);
    if (window.location === window.parent.location &&
        parentURL.searchParams.get('debug') === 'true') {
        debugSession(currentSession);
    }
    window.attributionSession = getSessionObj(currentSession);
    window.parentSession = currentSession;
    return;
}
function sessionAttribution(updatepage = true, invalidIframe = false, mirroredSession = '') {
    const iframeURL = getScriptData('iframe');
    const iframeURLObj = new URL(iframeURL);
    const crossDomain = new _CrossDomainStorage__WEBPACK_IMPORTED_MODULE_0__.CrossDomainStorage(iframeURLObj.origin, iframeURLObj.pathname);
    // Remove duplicate iframes
    const cookieIframe = document.querySelectorAll('iframe');
    cookieIframe.forEach((item) => {
        var _a;
        if (item.src.includes(iframeURL)) {
            (_a = item.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(item);
        }
    });
    // Use cross-domain cookies if iframe works and use local cookies if not
    if (!invalidIframe) {
        crossDomain.requestValue('engrid_attribution_memory_cookie', (data) => {
            handleSessionData(data, updatepage, mirroredSession, true);
        });
    }
    else {
        handleSessionData({ value: '' }, updatepage, mirroredSession, false);
    }
}
let updateTime;
let parentSession;
// Save session data on page load
window.addEventListener('load', () => {
    const invalidIframe = window.invalidSessionIframe != undefined
        ? window.invalidSessionIframe
        : false;
    if (window.location === window.parent.location) {
        sessionAttribution(true, invalidIframe);
        parentSession = window.parentSession;
        updateTime = setInterval(() => {
            sessionAttribution(false, invalidIframe);
            parentSession = window.parentSession;
        }, 60000);
    }
    else {
        setTimeout(() => {
            window.parent.postMessage('Mirror session', '*');
        }, 1000);
    }
});
// Save session data when tab is in focus
window.addEventListener('visibilitychange', () => {
    const invalidIframe = window.invalidSessionIframe != undefined
        ? window.invalidSessionIframe
        : false;
    if (window.location === window.parent.location &&
        document.visibilityState === 'visible') {
        const SAMEPAGE = false;
        sessionAttribution(SAMEPAGE, invalidIframe);
        updateTime = setInterval(() => {
            sessionAttribution(SAMEPAGE, invalidIframe);
        }, 60000);
    }
    else {
        clearInterval(updateTime);
    }
});
// Pass messages between iframe and parent window
window.addEventListener('message', function (event) {
    const invalidIframe = window.invalidSessionIframe != undefined
        ? window.invalidSessionIframe
        : false;
    if (window.location !== window.parent.location &&
        event.data !== 'Mirror session') {
        sessionAttribution(false, invalidIframe, event.data);
    }
    else if (window.location === window.parent.location &&
        event.data === 'Mirror session') {
        const SAMEPAGE = false;
        sessionAttribution(SAMEPAGE, invalidIframe);
        parentSession = window.parentSession;
        this.document.querySelectorAll('iframe').forEach((item) => {
            var _a;
            if (getComputedStyle(item).height == '1px' &&
                this.getComputedStyle(item).width == '1px' &&
                getComputedStyle(item).left == '-9999px') {
                return;
            }
            else {
                if (parentSession) {
                    (_a = item === null || item === void 0 ? void 0 : item.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(parentSession, '*');
                }
            }
        });
    }
});
document.addEventListener('click', () => {
    if (window.location !== window.parent.location) {
        window.parent.postMessage('Mirror session', '*');
    }
});

})();

/******/ })()
;