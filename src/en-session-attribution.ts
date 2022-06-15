import { v4 as uuidv4 } from "uuid";

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

  return false;
}

function setCookie(cookieName: string, cookieVal: string) {
  const newCookie = `${cookieName}=${cookieVal};path=/`;
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
  sessionParams.push(getCurrentTime()); // First seen
  sessionParams.push(getCurrentTime()); // Last seen
  sessionParams.push("1"); // Session page counter
  sessionParams.push(referralURL); // First referral URL
  if (currentURL.search.length > 0) {
    sessionParams.push(currentURL.search.slice(1)); // First referral parameters
  } else {
    sessionParams.push("");
  }

  const sessionInfo = sessionParams.join("|");
  return sessionInfo;
}

function updateSession(currentSession: string, updatepage = true) {
  const sessionParams = getSessionObj(currentSession);
  sessionParams["last_seen"] = getCurrentTime() as string; // Update last-seen
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
  sessionParams["current_params"] =
    currentURL.search.length > 0 ? currentURL.search.slice(1) : "";

  return Object.values(sessionParams).join("|");
}

function checkSessionLength(session: string) {
  let decodedSession = window.atob(session);

  if (session.length > 1500 && decodedSession.split("|").length > 6) {
    //const sessionParams = decodedSession.split("|");
    const sessionParams = getSessionObj(decodedSession);
    delete sessionParams["current_referral"];
    delete sessionParams["current_params"];

    decodedSession = Object.values(sessionParams).join("|");
    session = window.btoa(decodedSession);
  }

  // Check session length after removing latest referral URL info
  if (session.length > 1500) {
    return "";
  }

  return session;
}

function getCurrentTime(string = true) {
  if (string) {
    return Math.round(Date.now() / 1000).toString();
  } else {
    return Math.round(Date.now() / 1000);
  }
}

function getSessionObj(session: string) {
  const sessionArr = session.split("|");
  const sessionObj: { [key: string]: string } = {};

  sessionObj["uuid"] = sessionArr[0];
  sessionObj["first_seen"] = sessionArr[1];
  sessionObj["last_seen"] = sessionArr[2];
  sessionObj["page_count"] = sessionArr[3];
  sessionObj["first_referral"] = sessionArr[4];
  sessionObj["first_params"] = sessionArr[5];

  if (sessionArr[6]) {
    sessionObj["current_referral"] = sessionArr[6];
  }

  if (sessionArr[7]) {
    sessionObj["current_params"] = sessionArr[7];
  }

  return sessionObj;
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
}

function sessionAttribution(updatepage = true, mirroredSession = "") {
  // Don't run iframe session until parent session data is mirrored
  const queryStr = window.location.search;
  const urlParams = new URLSearchParams(queryStr);
  let currentSession = "";
  let enMergeTag = "";

  // Fetch and decode session attribution data
  let enSessionParam = urlParams.get("engrid_session");
  if (enSessionParam) {
    enSessionParam = window.atob(enSessionParam);
  } else {
    enSessionParam = "";
  }

  let enCookie = getCookie("engrid_attribution_memory_cookie");
  if (enCookie) {
    enCookie = window.atob(enCookie);
  } else {
    enCookie = "";
  }

  const supporterTag = getScriptData("mem_attribution");
  const memAttribute: HTMLInputElement | null = document.querySelector(
    `input[name="${supporterTag}"]`
  );

  if (memAttribute) {
    enMergeTag = memAttribute.value;
  } else {
    enMergeTag = "";
  }

  if (enMergeTag !== "") {
    enMergeTag = window.atob(enMergeTag);
  }

  if (enMergeTag === "" && enCookie === "" && enSessionParam === "") {
    currentSession = "";
  } else {
    // Get the most recent session info
    const cookieLastSeen = isNaN(parseInt(getSessionObj(enCookie)["last_seen"]))
      ? 0
      : parseInt(getSessionObj(enCookie)["last_seen"]);
    const mergeTagLastSeen = isNaN(
      parseInt(getSessionObj(enMergeTag)["last_seen"])
    )
      ? 0
      : parseInt(getSessionObj(enMergeTag)["last_seen"]);
    const paramLastSeen = isNaN(
      parseInt(getSessionObj(enSessionParam)["last_seen"])
    )
      ? 0
      : parseInt(getSessionObj(enSessionParam)["last_seen"]);

    currentSession = mergeTagLastSeen <= cookieLastSeen ? enCookie : enMergeTag;

    const currentSessionLastSeen =
      parseInt(getSessionObj(currentSession)["last_seen"]) ?? 0;
    currentSession =
      currentSessionLastSeen <= paramLastSeen ? enSessionParam : currentSession;
  }

  if (mirroredSession !== "") {
    currentSession = mirroredSession;
  }

  // Determine whether session should be continued or not
  const sessionLength = getScriptData("expiration", "3600");
  let newSession: boolean;
  const NUMBER = false;
  const oldSessionObj = getSessionObj(currentSession);

  if (
    currentSession === "" ||
    (getCurrentTime(NUMBER) as number) - parseInt(oldSessionObj["last_seen"]) >=
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

    document.querySelectorAll("a").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (/\/page\/[0-9]{5,6}\//.test(item.href)) {
          event.preventDefault();
          const clickedURL = new URL(item.href);

          if (encodedSession === "") {
            window.location.href = clickedURL.href;
          } else {
            clickedURL.searchParams.set("engrid_session", encodedSession);
            window.location.href = clickedURL.href;
          }
        }
      });
    });
  } else {
    if (newSession) {
      currentSession = createNewSession();
    } else {
      currentSession = updateSession(currentSession, updatepage);
    }

    let encodedSession = window.btoa(currentSession);
    encodedSession = checkSessionLength(encodedSession);

    if (encodedSession === "") {
      return;
    } else {
      setCookie("engrid_attribution_memory_cookie", encodedSession);
      if (memAttribute) {
        memAttribute.value = encodedSession;
      }
    }

    // Populate "Additional Comments" field
    const additionalComments: HTMLTextAreaElement | null =
      document.querySelector("[name='transaction.comments'");

    if (!additionalComments) {
      // Create Additional Comments field
      const newField = document.createElement("input");
      newField.classList.add("en__field__input");
      newField.classList.add("en__field__input--hidden");
      newField.setAttribute("type", "hidden");
      newField.setAttribute("name", "transaction.comments");

      const sessionObjStr = JSON.stringify(getSessionObj(currentSession));
      newField.value = sessionObjStr;

      document.querySelector("body")?.appendChild(newField);
    }
  }

  debugSession(currentSession);

  // Mirror current session to Engaging Networks iframe
  if (
    window.location === window.parent.location &&
    document.querySelector("iframe")
  ) {
    focus();
    const listener = function () {
      if (
        document.activeElement === document.querySelector("iframe") &&
        /\/page\/[0-9]{5,6}\//.test(
          document.activeElement?.getAttribute("src") as string
        )
      ) {
        const iframe = document.querySelector("iframe") as HTMLIFrameElement;
        iframe.contentWindow?.postMessage(currentSession, "*");
      }
      window.removeEventListener("blur", listener);
    };

    window.addEventListener("blur", listener);
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
    window.parent.postMessage("Mirror session", "*");
  }
});

// Save session data when tab is in focus
window.addEventListener("visibilitychange", () => {
  if (
    window.location === window.parent.location &&
    document.visibilityState === "visible"
  ) {
    const UPDATEPAGE = false;
    sessionAttribution(UPDATEPAGE);

    updateTime = setInterval(() => {
      sessionAttribution(UPDATEPAGE);
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
    parentSession &&
    event.data === "Mirror session"
  ) {
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
