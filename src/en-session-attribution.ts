import { v4 as uuidv4 } from 'uuid';
import { CrossDomainStorage } from './CrossDomainStorage';

declare global {
  interface Window {
    additionalCommentsTag: string;
    parentSession: string;
    attributionSession: string;
    invalidSessionIframe: boolean;
  }
}

function getCookie(cookie: string) {
  const cookies = document.cookie;
  const cookiesArr = cookies.split('; ');
  const cookieNames: Array<string> = [];
  const cookieVals: Array<string> = [];

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

function setCookie(
  cookieName: string,
  cookieVal: string,
  expiration = getScriptData('expiration', '3600')
) {
  const now = new Date();
  const expirationTime = parseInt(expiration) * 1000 + now.getTime();
  now.setTime(expirationTime);
  const newCookie = `${cookieName}=${cookieVal};expires=${now.toUTCString()};path=/`;
  document.cookie = newCookie;

  return cookieName;
}

function getScriptData(attribute: string, defaultValue = '') {
  const scriptTag = document.querySelector(
    'script[src*="en-attribution-session.js"]'
  );
  if (scriptTag) {
    const data = scriptTag.getAttribute('session-' + attribute);
    return data ?? defaultValue;
  }

  return defaultValue;
}

function createNewSession() {
  const sessionParams = [];
  const currentURL = new URL(document.location.href);
  let referralURL;
  if (window.location !== window.parent.location) {
    referralURL = document.referrer;
  } else {
    referralURL = document.referrer === '' ? 'direct' : document.referrer;
    if (referralURL !== 'direct') {
      const tempURL = new URL(referralURL);
      referralURL = tempURL.protocol + '//' + tempURL.hostname;
    }
  }

  currentURL.searchParams.delete('engrid_session');

  sessionParams.push(uuidv4()); // Generate UUID
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
  } else {
    sessionParams.push('');
  }

  return sessionParams.join('|');
}

function updateSession(currentSession: string, updatepage = true) {
  const sessionParams = getSessionObj(currentSession);
  sessionParams['last_seen'] = getCurrentTime().toString(); // Update last-seen
  const currentURL = new URL(document.location.href);
  let referralURL;
  if (window.location !== window.parent.location) {
    referralURL = document.location.href;
  } else {
    referralURL = document.referrer === '' ? 'direct' : document.referrer;
    if (referralURL !== 'direct') {
      const tempURL = new URL(referralURL);
      referralURL = tempURL.protocol + '//' + tempURL.hostname;
    }
  }

  if (updatepage) {
    sessionParams['page_count'] = (
      parseInt(sessionParams['page_count']) + 1
    ).toString(); // Update session page counter
  }

  currentURL.searchParams.delete('engrid_session');
  // Update current referral URL
  sessionParams['current_referral'] = referralURL;

  let referralParamString =
    currentURL.search.length > 0 ? currentURL.search.slice(1) : '';

  // Remove hanging '=' symbols
  referralParamString =
    referralParamString[referralParamString.length - 1] == '='
      ? referralParamString.slice(0, referralParamString.length - 1)
      : referralParamString;
  referralParamString = referralParamString.replace(/=&/g, '&');

  sessionParams['current_referral_params'] = referralParamString;

  return Object.values(sessionParams).join('|');
}

function checkSessionLength(session: string) {
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

function getSessionObj(session: string) {
  if (session.indexOf('Parameter') === -1) {
    const sessionArr = session.split('|');
    const sessionObj: { [key: string]: string } = {};

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
  } else {
    const JSONstring = session.slice(session.indexOf('{'));
    const sessionObj = JSON.parse(JSONstring);
    return sessionObj;
  }
}

function debugSession(session: string) {
  const currentSesh = document.querySelector('.currentSession');
  if (currentSesh) {
    currentSesh.innerHTML = 'Current session: ' + session;
  }

  const sessionObj = getSessionObj(session);

  if (window.location !== window.parent.location) {
    console.log('[iframe session]', sessionObj);
  } else {
    console.log('[page session]', sessionObj);
  }

  const commentsField = document.querySelector(
    "[name='transaction.comments']"
  ) as HTMLInputElement | HTMLTextAreaElement | null;

  if (commentsField) {
    //prettier-ignore
    console.log("[Additional Comments Field]\n", commentsField.value);
  }
}

function handleSessionData(
  data: { [key: string]: any },
  updatepage = true,
  mirroredSession = '',
  crossDomainCookie = false
) {
  if (data.message && data.message == 'invalid iframe') {
    // Restart function using local cookie if iframe doesn't load
    console.log(
      'Invalid link for session-iframe attribute. Using local cookies instead...'
    );
    window.invalidSessionIframe = true;
    sessionAttribution(updatepage, true, mirroredSession);
    return;
  }

  const iframeURL = getScriptData('iframe');
  const iframeURLObj = new URL(iframeURL);

  const crossDomain = new CrossDomainStorage(
    iframeURLObj.origin,
    iframeURLObj.pathname
  );

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
  } else if (getCookie('engrid_attribution_memory_cookie') != '') {
    enCookie = window.atob(getCookie('engrid_attribution_memory_cookie'));
  }

  const supporterTag = getScriptData('additional_comments');
  const additionalCommentsField: HTMLInputElement | HTMLTextAreaElement | null =
    document.querySelector(`[name='${supporterTag}']`);
  const memAttribute: string | null = window.additionalCommentsTag;

  if (memAttribute) {
    enMergeTag = memAttribute;
  }

  if (
    enMergeTag == undefined &&
    enCookie == '' &&
    enSessionParam == undefined
  ) {
    currentSession = '';
  } else {
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
  let newSession: boolean;
  const oldSessionObj = getSessionObj(currentSession);

  if (
    currentSession === '' ||
    currentSession == '{user_data~Additional Comments Stand In}' ||
    (getCurrentTime() as number) - parseInt(oldSessionObj['last_seen']) >=
      parseInt(sessionLength)
  ) {
    newSession = true;
  } else {
    newSession = false;
  }

  // Check if script is running outside Engaging Networks
  if (!('pageJson' in window)) {
    if (newSession) {
      currentSession = createNewSession();
    } else {
      currentSession = updateSession(currentSession, updatepage);
    }

    let encodedSession = window.btoa(currentSession);
    encodedSession = checkSessionLength(encodedSession);

    setCookie('engrid_attribution_memory_cookie', encodedSession);
    if (crossDomainCookie) {
      crossDomain.storeValue(
        'engrid_attribution_memory_cookie',
        encodedSession,
        () => {
          return;
        }
      );
    }

    document.addEventListener('click', (event) => {
      const eventTarget = event.target as HTMLAnchorElement;
      if (eventTarget && eventTarget.tagName === 'A') {
        if (/\/page\/[0-9]{5,6}\//.test(eventTarget.href)) {
          event.preventDefault();
          const clickedURL = new URL(eventTarget.href);

          if (encodedSession === '') {
            window.location.href = clickedURL.href;
          } else {
            clickedURL.searchParams.set('engrid_session', encodedSession);
            window.location.href = clickedURL.href;
          }
        }
      }
    });
  } else {
    const submitBtn = document.querySelector('.en__submit');
    const enForm: HTMLFormElement | null =
      document.querySelector('form.en__component');

    const standInField = document.createElement('input');
    const standInExists = document.querySelector(`[name='${supporterTag}']`);
    standInField.setAttribute('name', supporterTag);
    standInField.classList.add('en__field__input');
    standInField.setAttribute('type', 'hidden');

    if (!standInExists) {
      enForm?.appendChild(standInField);
    }

    if (newSession) {
      currentSession = createNewSession();
    } else {
      currentSession = updateSession(currentSession, updatepage);
    }

    if (window.location !== window.parent.location && mirroredSession !== '') {
      currentSession = mirroredSession;
    }

    let encodedSession = window.btoa(currentSession);
    encodedSession = checkSessionLength(encodedSession);

    if (allowSession != 'false') {
      if (!additionalCommentsField) {
        standInField.value = JSON.stringify(
          getSessionObj(currentSession)
        ).replace(/"/g, "'");
      } else {
        additionalCommentsField.value = JSON.stringify(
          getSessionObj(currentSession)
        ).replace(/"/g, "'");
      }
    }

    if (encodedSession === '') {
      return;
    } else {
      setCookie('engrid_attribution_memory_cookie', encodedSession);
      if (window.location == window.parent.location) {
        if (crossDomainCookie) {
          crossDomain.storeValue(
            'engrid_attribution_memory_cookie',
            encodedSession,
            () => {
              return;
            }
          );
        }

        if (additionalCommentsField && allowSession != 'false') {
          additionalCommentsField.value = JSON.stringify(
            getSessionObj(currentSession)
          );
        }
      }
    }

    // Populate "Additional Comments" field
    const additionalComments: HTMLTextAreaElement | null =
      document.querySelector("[name='transaction.comments']");

    if (!additionalComments) {
      // Create Additional Comments field
      const newField = document.createElement('input');
      newField.classList.add('en__field__input');
      newField.classList.add('en__field__input--hidden');
      newField.setAttribute('type', 'hidden');
      newField.setAttribute('name', 'transaction.comments');

      const sessionObjStr =
        'Parameter tracking: ' +
        //prettier-ignore
        JSON.stringify(getSessionObj(currentSession), null, "\n").replace(
            /"/g,
            "'"
          );

      newField.value = allowSession != 'false' ? sessionObjStr : '';

      if (enForm) {
        enForm.appendChild(newField);
      }
    }
  }

  const parentURL = new URL(document.location.href);

  if (
    window.location === window.parent.location &&
    parentURL.searchParams.get('debug') === 'true'
  ) {
    debugSession(currentSession);
  }

  window.attributionSession = getSessionObj(currentSession);
  window.parentSession = currentSession;
  return;
}

function sessionAttribution(
  updatepage = true,
  invalidIframe = false,
  mirroredSession = ''
) {
  const iframeURL = getScriptData('iframe');
  const iframeURLObj = new URL(iframeURL);

  const crossDomain = new CrossDomainStorage(
    iframeURLObj.origin,
    iframeURLObj.pathname
  );

  // Remove duplicate iframes
  const cookieIframe = document.querySelectorAll('iframe');

  cookieIframe.forEach((item) => {
    if (item.src.includes(iframeURL)) {
      item.parentElement?.removeChild(item);
    }
  });

  // Use cross-domain cookies if iframe works and use local cookies if not
  if (!invalidIframe) {
    crossDomain.requestValue('engrid_attribution_memory_cookie', (data) => {
      handleSessionData(data, updatepage, mirroredSession, true);
    });
  } else {
    handleSessionData({ value: '' }, updatepage, mirroredSession, false);
  }
}

let updateTime: ReturnType<typeof setInterval>;
let parentSession: string | undefined;
// Save session data on page load
window.addEventListener('load', () => {
  const invalidIframe =
    window.invalidSessionIframe != undefined
      ? window.invalidSessionIframe
      : false;
  if (window.location === window.parent.location) {
    sessionAttribution(true, invalidIframe);
    parentSession = window.parentSession;

    updateTime = setInterval(() => {
      sessionAttribution(false, invalidIframe);
      parentSession = window.parentSession;
    }, 60000);
  } else {
    setTimeout(() => {
      window.parent.postMessage('Mirror session', '*');
    }, 1000);
  }
});

// Save session data when tab is in focus
window.addEventListener('visibilitychange', () => {
  const invalidIframe =
    window.invalidSessionIframe != undefined
      ? window.invalidSessionIframe
      : false;

  if (
    window.location === window.parent.location &&
    document.visibilityState === 'visible'
  ) {
    const SAMEPAGE = false;
    sessionAttribution(SAMEPAGE, invalidIframe);

    updateTime = setInterval(() => {
      sessionAttribution(SAMEPAGE, invalidIframe);
    }, 60000);
  } else {
    clearInterval(updateTime);
  }
});

// Pass messages between iframe and parent window
window.addEventListener('message', function (event) {
  const invalidIframe =
    window.invalidSessionIframe != undefined
      ? window.invalidSessionIframe
      : false;

  if (
    window.location !== window.parent.location &&
    event.data !== 'Mirror session'
  ) {
    sessionAttribution(false, invalidIframe, event.data);
  } else if (
    window.location === window.parent.location &&
    event.data === 'Mirror session'
  ) {
    const SAMEPAGE = false;
    sessionAttribution(SAMEPAGE, invalidIframe);
    parentSession = window.parentSession;
    this.document.querySelectorAll('iframe').forEach((item) => {
      if (
        getComputedStyle(item).height == '1px' &&
        this.getComputedStyle(item).width == '1px' &&
        getComputedStyle(item).left == '-9999px'
      ) {
        return;
      } else {
        if (parentSession) {
          item?.contentWindow?.postMessage(parentSession, '*');
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
