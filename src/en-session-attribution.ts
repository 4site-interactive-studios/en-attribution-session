import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    additionalCommentsTag: string;
  }
}

function getCookie(cookie: string) {
  const cookies = document.cookie;
  const cookiesArr = cookies.split("; ");
  const cookieNames: Array<string> = [];
  const cookieVals: Array<string> = [];

  cookiesArr.forEach((element) => {
    const elementArr = element.split("=");

    cookieNames.push(elementArr[0]);
    cookieVals.push(elementArr[1]);
  });

  if (cookieNames.includes(cookie)) {
    return cookieVals[cookieNames.indexOf(cookie)];
  }

  return "";
}

function setCookie(
  cookieName: string,
  cookieVal: string,
  expiration = getScriptData("expiration", "3600")
) {
  const now = new Date();
  const expirationTime = parseInt(expiration) * 1000 + now.getTime();
  now.setTime(expirationTime);
  const newCookie = `${cookieName}=${cookieVal};expires=${now.toUTCString()};path=/`;
  document.cookie = newCookie;
  return newCookie;
}

function getScriptData(attribute: string, defaultValue = "") {
  const scriptTag = document.querySelector("script[src*='attribution.js']");
  if (scriptTag) {
    const data = scriptTag.getAttribute("session-" + attribute);
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
    referralURL = document.referrer === "" ? "direct" : document.referrer;
    if (referralURL !== "direct") {
      const tempURL = new URL(referralURL);
      referralURL = tempURL.hostname;
    }
  }

  currentURL.searchParams.delete("engrid_session");

  sessionParams.push(uuidv4()); // Generate UUID
  sessionParams.push(getCurrentTime().toString()); // First seen
  sessionParams.push(getCurrentTime().toString()); // Last seen
  sessionParams.push("1"); // Session page counter
  sessionParams.push(referralURL); // First referral URL
  if (currentURL.search.length > 0) {
    sessionParams.push(currentURL.search.slice(1)); // First referral parameters
  } else {
    sessionParams.push("");
  }

  return sessionParams.join("|");
}

function updateSession(currentSession: string, updatepage = true) {
  const sessionParams = getSessionObj(currentSession);
  sessionParams["last_seen"] = getCurrentTime().toString(); // Update last-seen
  const currentURL = new URL(document.location.href);
  let referralURL;
  if (window.location !== window.parent.location) {
    referralURL = document.location.href;
  } else {
    referralURL = document.referrer === "" ? "direct" : document.referrer;
    if (referralURL !== "direct") {
      const tempURL = new URL(referralURL);
      referralURL = tempURL.hostname;
    }
  }

  if (updatepage) {
    sessionParams["page_count"] = (
      parseInt(sessionParams["page_count"]) + 1
    ).toString(); // Update session page counter
  }

  currentURL.searchParams.delete("engrid_session");
  // Update current referral URL
  sessionParams["current_referral"] = referralURL;

  sessionParams["current_referral_params"] =
    currentURL.search.length > 0 ? currentURL.search.slice(1) : "";

  return Object.values(sessionParams).join("|");
}

function checkSessionLength(session: string) {
  let decodedSession = window.atob(session);

  if (session.length > 1500 && decodedSession.split("|").length > 6) {
    //const sessionParams = decodedSession.split("|");
    const sessionParams = getSessionObj(decodedSession);
    delete sessionParams["current_referral"];
    delete sessionParams["current_referral_params"];

    decodedSession = Object.values(sessionParams).join("|");
    session = window.btoa(decodedSession);
  }

  // Check session length after removing latest referral URL info
  if (session.length > 1500) {
    return "";
  }

  return session;
}

function getCurrentTime() {
  return Math.round(Date.now() / 1000);
}

function getSessionObj(session: string) {
  if (session.indexOf("Parameter") === -1) {
    const sessionArr = session.split("|");
    const sessionObj: { [key: string]: string } = {};

    sessionObj["uuid"] = sessionArr[0];
    sessionObj["first_seen"] = sessionArr[1];
    sessionObj["last_seen"] = sessionArr[2];
    sessionObj["page_count"] = sessionArr[3];
    sessionObj["first_referral"] = sessionArr[4];
    sessionObj["first_referral_params"] = sessionArr[5];

    if (sessionArr[6]) {
      sessionObj["current_referral"] = sessionArr[6];
    }

    if (sessionArr[7]) {
      sessionObj["current_referral_params"] = sessionArr[7];
    }

    return sessionObj;
  } else {
    const JSONstring = session.slice(session.indexOf("{"));
    const sessionObj = JSON.parse(JSONstring);
    return sessionObj;
  }
}

function debugSession(session: string) {
  const currentSesh = document.querySelector(".currentSession");
  if (currentSesh) {
    currentSesh.innerHTML = "Current session: " + session;
  }

  const sessionObj = getSessionObj(session);

  if (window.location !== window.parent.location) {
    console.log("[iframe session]", sessionObj);
  } else {
    console.log("[page session]", sessionObj);
  }

  const commentsField = document.querySelector(
    "[name='transaction.comments']"
  ) as HTMLInputElement | HTMLTextAreaElement | null;

  if (commentsField) {
    console.log("[Additional Comments Field]\n", commentsField.value);
  }
}

function sessionAttribution(updatepage = true, mirroredSession = "") {
  // Don't run iframe session until parent session data is mirrored
  const queryStr = window.location.search;
  const urlParams = new URLSearchParams(queryStr);
  let currentSession = "";
  let enMergeTag = "";

  // Fetch and decode session attribution data
  const encodedSessionParam = urlParams.get("engrid_session");
  let enSessionParam;
  if (encodedSessionParam) {
    enSessionParam = window.atob(encodedSessionParam);
  }

  let enCookie = getCookie("engrid_attribution_memory_cookie");
  if (enCookie) {
    enCookie = window.atob(enCookie);
  }

  const supporterTag = getScriptData("additional_comments");
  const additionalCommentsField: HTMLInputElement | HTMLTextAreaElement | null =
    document.querySelector(`[name='${supporterTag}']`);
  const memAttribute: string | null = window.additionalCommentsTag;

  if (memAttribute) {
    enMergeTag = memAttribute;
  }

  if (
    enMergeTag == undefined &&
    enCookie == undefined &&
    enSessionParam == undefined
  ) {
    currentSession = "";
  } else {
    // Get the most recent session info
    const cookieLastSeen =
      enCookie === "" ? 0 : parseInt(getSessionObj(enCookie)["last_seen"]);
    const mergeTagLastSeen =
      enSessionParam === undefined
        ? 0
        : parseInt(getSessionObj(enMergeTag)["last_seen"]);
    const paramLastSeen =
      enSessionParam === undefined
        ? 0
        : parseInt(getSessionObj(enSessionParam)["last_seen"]);

    currentSession = mergeTagLastSeen <= cookieLastSeen ? enCookie : enMergeTag;

    const currentSessionLastSeen =
      parseInt(getSessionObj(currentSession)["last_seen"]) ?? 0;
    currentSession =
      enSessionParam === undefined || paramLastSeen <= currentSessionLastSeen
        ? currentSession
        : enSessionParam;
  }

  if (enSessionParam !== undefined) {
    currentSession = enSessionParam;
  }

  // Determine whether session should be continued or not
  const sessionLength = getScriptData("expiration", "3600");
  let newSession: boolean;
  const NUMBER = false;
  const oldSessionObj = getSessionObj(currentSession);

  if (
    currentSession === "" ||
    (getCurrentTime() as number) - parseInt(oldSessionObj["last_seen"]) >=
      parseInt(sessionLength)
  ) {
    newSession = true;
  } else {
    newSession = false;
  }

  // Check if script is running outside Engaging Networks
  if (!("pageJson" in window)) {
    if (newSession) {
      currentSession = createNewSession();
    } else {
      currentSession = updateSession(currentSession, updatepage);
    }

    let encodedSession = window.btoa(currentSession);
    encodedSession = checkSessionLength(encodedSession);

    setCookie("engrid_attribution_memory_cookie", encodedSession);

    document.addEventListener("click", (event) => {
      const eventTarget = event.target as HTMLAnchorElement;
      if (eventTarget && eventTarget.tagName === "A") {
        if (/\/page\/[0-9]{5,6}\//.test(eventTarget.href)) {
          event.preventDefault();
          const clickedURL = new URL(eventTarget.href);

          if (encodedSession === "") {
            window.location.href = clickedURL.href;
          } else {
            clickedURL.searchParams.set("engrid_session", encodedSession);
            window.location.href = clickedURL.href;
          }
        }
      }
    });
  } else {
    if (newSession) {
      currentSession = createNewSession();
    } else {
      currentSession = updateSession(currentSession, updatepage);
    }

    if (window.location !== window.parent.location && mirroredSession !== "") {
      currentSession = mirroredSession;
    }

    let encodedSession = window.btoa(currentSession);
    encodedSession = checkSessionLength(encodedSession);

    if (encodedSession === "") {
      return;
    } else {
      setCookie("engrid_attribution_memory_cookie", encodedSession);
      if (additionalCommentsField) {
        additionalCommentsField.value = JSON.stringify(
          getSessionObj(currentSession)
        );
      }
    }

    // Populate "Additional Comments" field
    const additionalComments: HTMLTextAreaElement | null =
      document.querySelector("[name='transaction.comments]'");

    if (!additionalComments) {
      // Create Additional Comments field
      const newField = document.createElement("input");
      newField.classList.add("en__field__input");
      newField.classList.add("en__field__input--hidden");
      newField.setAttribute("type", "hidden");
      newField.setAttribute("name", "transaction.comments");

      const sessionObjStr =
        "Parameter tracking: " +
        JSON.stringify(getSessionObj(currentSession), null, "\n");
      newField.value = sessionObjStr;

      document.querySelector("form.en__component")?.appendChild(newField);
    }
  }

  const parentURL = new URL(document.location.href);

  if (
    window.location === window.parent.location &&
    parentURL.searchParams.get("debug") === "true"
  ) {
    debugSession(currentSession);
  }

  return currentSession;
}

let updateTime: ReturnType<typeof setInterval>;
let parentSession: string | undefined;
// Save session data on page load
window.addEventListener("load", () => {
  if (window.location === window.parent.location) {
    parentSession = sessionAttribution();

    updateTime = setInterval(() => {
      parentSession = sessionAttribution(false);
    }, 60000);
  } else {
    setTimeout(() => {
      window.parent.postMessage("Mirror session", "*");
    }, 1000);
  }
});

// Save session data when tab is in focus
window.addEventListener("visibilitychange", () => {
  if (
    window.location === window.parent.location &&
    document.visibilityState === "visible"
  ) {
    const SAMEPAGE = false;
    sessionAttribution(SAMEPAGE);

    updateTime = setInterval(() => {
      sessionAttribution(SAMEPAGE);
    }, 60000);
  } else {
    clearInterval(updateTime);
  }
});

// Pass messages between iframe and parent window
window.addEventListener("message", function (event) {
  if (
    window.location !== window.parent.location &&
    event.data !== "Mirror session"
  ) {
    sessionAttribution(false, event.data);
  } else if (
    window.location === window.parent.location &&
    event.data === "Mirror session"
  ) {
    const SAMEPAGE = false;
    parentSession = sessionAttribution(SAMEPAGE);
    this.document
      .querySelector("iframe")
      ?.contentWindow?.postMessage(parentSession, "*");
  }
});

document.addEventListener("click", () => {
  if (window.location !== window.parent.location) {
    window.parent.postMessage("Mirror session", "*");
  }
});
