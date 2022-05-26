import { v4 as uuidv4 } from 'uuid';

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

    if(cookieNames.includes(cookie)) {
        return cookieVals[cookieNames.indexOf(cookie)];
    }

    return false;
}

function setCookie(cookieName: string, cookieVal: string) {
    const newCookie = `${cookieName}=${cookieVal}`;
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
    if(window.location !== window.parent.location) {
        referralURL = document.location.href;
    } else {
        referralURL = (document.referrer === "") ? "direct" : document.referrer;
        if(referralURL !== "direct") {
            const tempURL = new URL(referralURL);
            referralURL = tempURL.hostname;
        }
    }

    sessionParams.push(uuidv4()); // Generate UUID
    sessionParams.push(getCurrentTime()); // First seen
    sessionParams.push(getCurrentTime()); // Last seen
    sessionParams.push("1"); // Session page counter
    sessionParams.push(referralURL); // First referral URL
    sessionParams.push(currentURL.search.slice(1)); // First referral parameters

    const sessionInfo = sessionParams.join("|");
    return sessionInfo;
}

function updateSession(currentSession: string, updatepage = true) {
    const sessionParams = currentSession.split("|");
    sessionParams[2] = getCurrentTime() as string; // Update last-seen
    const currentURL = new URL(document.location.href);
    let referralURL;
    if(window.location !== window.parent.location) {
        referralURL = document.location.href;
    } else {
        referralURL = (document.referrer === "") ? "direct" : document.referrer;
        if(referralURL !== "direct") {
            const tempURL = new URL(referralURL);
            referralURL = tempURL.hostname;
        }
    }
    
    if(updatepage) {
        sessionParams[3] = (parseInt(sessionParams[3]) + 1).toString(); // Update session page counter
    }

    // Update current referral URL
    if(sessionParams.length === 6) {
        sessionParams.push(referralURL);
        sessionParams.push(currentURL.search.slice(1));
    } else {
        sessionParams[6] = referralURL;
        sessionParams[7] = currentURL.search.slice(1);
    }

    return sessionParams.join("|");
}

function checkSessionLength(session: string) {
    let decodedSession = window.atob(session);

    if(session.length > 1500 && decodedSession.split("|").length > 6) {
        const sessionParams = decodedSession.split("|");

        while(sessionParams.length > 6) {
            sessionParams.pop();
        }

        decodedSession = sessionParams.join("|");
        session = window.btoa(decodedSession);
    }

    // Check session length after removing latest referral URL info
    if(session.length > 1500) {
        return "";
    }

    return session;
}

function getCurrentTime(string = true) {
    if(string) {
        return (Math.round(Date.now()/1000)).toString();
    } else {
        return (Math.round(Date.now()/1000));
    }
}

function getLastSeen(session: string) {
    return session.split("|")[2];
}

const sessionAttribution = function(updatepage = true) {
    const queryStr = window.location.search;
    const urlParams = new URLSearchParams(queryStr);
    let currentSession = "";
    let enMergeTag = "";

    // Fetch and decode session attribution data
    let enSessionParam = urlParams.get("engrid_session");
    if(enSessionParam) {
        enSessionParam = window.atob(enSessionParam);
    } else {
        enSessionParam = "";
    }

    let enCookie = getCookie("engrid_attribution_memory_cookie");
    if(enCookie) {
        enCookie = window.atob(enCookie);
    } else {
        enCookie = "";
    }

    const supporterTag = getScriptData("mem_attribution");
    const memAttribute: HTMLInputElement | null = document.querySelector(`input[name="${supporterTag}"]`);

    if(memAttribute) {
        enMergeTag = memAttribute.value;
    } else {
        enMergeTag = "";
    }

    if(enMergeTag !== "") {
        enMergeTag = window.atob(enMergeTag);
    }

    if(enMergeTag === "" && enCookie === "" && enSessionParam === "") {
        currentSession = "";
    } else {
        // Get the most recent session info
        const cookieLastSeen = isNaN(parseInt(getLastSeen(enCookie))) ? 0 : parseInt(getLastSeen(enCookie));
        const mergeTagLastSeen = isNaN(parseInt(getLastSeen(enMergeTag))) ? 0 : parseInt(getLastSeen(enMergeTag));
        const paramLastSeen = isNaN(parseInt(getLastSeen(enSessionParam))) ? 0 : parseInt(getLastSeen(enSessionParam));

        currentSession = (mergeTagLastSeen <= cookieLastSeen) ? enCookie : enMergeTag;
        
        const currentSessionLastSeen = parseInt(getLastSeen(currentSession)) ?? 0;
        currentSession = (currentSessionLastSeen <= paramLastSeen) ? enSessionParam : currentSession;
    }

    // Determine whether session should be continued or not
    const sessionLength = getScriptData("length", "3600");
    let newSession: boolean;
    const NUMBER = false;

    if(currentSession === "" || getCurrentTime(NUMBER) as number - parseInt(getLastSeen(currentSession)) >= parseInt(sessionLength)) {
        newSession = true;
    } else {
        newSession = false;
    }

    // Check if script is running outside Engaging Networks
    if(!("pageJson" in window)) {
        document.querySelectorAll("a").forEach(item => {
            item.addEventListener("click", event => {
                if(/\/page\/[0-9]{5,6}\//.test(item.href)) {
                    event.preventDefault();
                    const clickedURL = new URL(item.href);

                    if(newSession) {
                        currentSession = createNewSession();
                    } else {
                        currentSession = updateSession(currentSession, updatepage);
                    }

                    let encodedSession = window.btoa(currentSession);
                    encodedSession = checkSessionLength(encodedSession);
                    
                    if(encodedSession === "") {
                        window.location.href = clickedURL.href;
                    } else {
                        setCookie("engrid_attribution_memory_cookie", encodedSession);
                        clickedURL.searchParams.set("engrid_session", encodedSession);
                        window.location.href = clickedURL.href;
                    }
                }
            });
        });
    } else {
        if(newSession) {
            currentSession = createNewSession();
        } else {
            currentSession = updateSession(currentSession, updatepage);
        }

        let encodedSession = window.btoa(currentSession);
        encodedSession = checkSessionLength(encodedSession);

        if(encodedSession === "") {
            return;
        } else {
            setCookie("engrid_attribution_memory_cookie", encodedSession);
            if(memAttribute) {
                memAttribute.value = encodedSession;
            }
        }
    }
}

// Save session data on page load
window.addEventListener("load", () => {
    sessionAttribution();
});

// Save session data when tab is in focus
window.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") {
        const UPDATEPAGE = false;
        sessionAttribution(UPDATEPAGE);
    }
});