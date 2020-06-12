import "@babel/polyfill";
import "fhirclient"; // sets window.FHIR
import urlUtils from "./util/url";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import UiFactory from "./ui/UiFactory.js";
import ShowError from './components/ShowError';
import { randomString } from "./util/util";
//alert("Loaded imports");

var serviceUri = urlUtils.getUrlParameter("iss");
if (serviceUri !== undefined) {
    console.log("service---", serviceUri);
    var clientId = urlUtils.getUrlParameter("client_id");
    if (serviceUri.indexOf("epic") !== -1 && clientId === undefined) {
        clientId = "7c47a01b-b7d8-41cf-a290-8ed607108e70"; // epic
    } else if (serviceUri.indexOf("logica") !== -1 && clientId === undefined) {
        clientId = "a57ccba8-c7da-4eee-b04e-70a8f93776bb";
    }else if (serviceUri.indexOf("cerner") !== -1 && clientId === undefined) {
        // clientId = "f7883dd8-5c7e-44de-be4b-c93c683bb8c7"; //cerner
        // clientId = "1602539f-194e-4d22-b82f-a0835725f384";  //local
        // clientId = "6ef181e4-a7d8-4493-b94b-8b66d466900a"; // Prod
        clientId = "6bdae3cc-09a0-450b-83fe-f181918bcc54" //CF Prod
    } else if (serviceUri.indexOf("mettles") !== -1 && clientId === undefined) {
        clientId = "app-login";
    }
    sessionStorage['UI_TYPE'] = "generic_ui";
    var secret = null; // set me, if confidential

    var launchContextId = urlUtils.getUrlParameter("launch");
    if (serviceUri.indexOf("epic") !== -1 && launchContextId === undefined) {
        launchContextId = "" // epic
    } else if (serviceUri.indexOf("cerner") !== -1 && launchContextId === undefined) {
        // sessionStorage['UI_TYPE'] = "cerner_ui"
        launchContextId = "cbaec2fb-6428-4182-a976-10cd3354af6c"; //cerner
        sessionStorage.setItem("currentEHR", "Cerner");
    }
    //var launchContextId = "cbaec2fb-6428-4182-a976-10cd3354af6c"; //cerner
    //var launchContextId = "3OVyU5YcVCHZUDAeMQaia3Cw4kzALBblPY7BPV9Jjk5S083PusHli0A_UCiVNJywGiE57fx_KpynO3esOeQL9dOcQXMIGPd6HYMlSyqiZ30fxcd754kfN2jPoP-Tis9a";
    // var launchContextId = "10e2e686-a719-42ed-a52a-8332b77a48d6"; //local
    // The scopes that the app will request from the authorization server
    // encoded in a space-separated string:
    //      1. permission to read all of the patient's record
    //      2. permission to launch the app in the specific context
    var scope = ["launch", "user/Patient.read", "user/Patient.write", "user/Procedure.read",
        "user/Practitioner.read", "patient/Condition.read", "user/Condition.read", "patient/Coverage.read",
        "patient/Organization.read", "patient/Organization.write",
        "user/Organization.read", "user/Organization.write", "patient/Observation.read",
        "user/Observation.read", "patient/Encounter.read", "user/Encounter.read",
        "user/Documentreference.read", "patient/Documentreference.read"
    ].join(" ");

    var app_context = urlUtils.getUrlParameter("app_context");
    if (serviceUri.indexOf("epic") !== -1 && app_context === undefined) {
        app_context = Math.round(Math.random() * 100000000).toString(); // epic
    } else if (serviceUri.indexOf("cerner") !== -1 && app_context === undefined) {
        app_context = urlUtils.getUrlParameter("cerner_appcontext"); //cerner
        // if(app_context === undefined){
        //   app_context = Math.round(Math.random() * 100000000).toString();
        // }
    } else {
        var patientId = urlUtils.getUrlParameter("patientId");
        var request = urlUtils.getUrlParameter("request");
        var template = urlUtils.getUrlParameter("template");
        if (patientId !== undefined && request !== undefined && template !== undefined) {
            let appContextId = randomString();
            sessionStorage.setItem("appContextId", appContextId);
            let context = {"patientId":patientId,"request":request,"template":template}
            sessionStorage.setItem(appContextId, JSON.stringify(context));
            app_context = Math.round(Math.random() * 100000000).toString();
        }
    }

    var state = app_context;
    if (state === undefined) {
        sessionStorage.setItem("showCDSHook", true);
        // Generate a unique session key string (here we just generate a random number
        // for simplicity, but this is not 100% collision-proof)
        state = Math.round(Math.random() * 100000000).toString();
    }
    sessionStorage.setItem("state", state);

    // var state = "IIZ3UT1T2CVN";//epic
    // To keep things flexible, let's construct the launch URL by taking the base of the
    // current URL and replace "launch.html" with "index.html".
    var launchUri = window.location.protocol + "//" + window.location.host + window.location.pathname;
    // var redirectUri = launchUri.replace("launch", "index");
    var redirectUri = launchUri;

    console.log("redirectURI", redirectUri);
    // FHIR Service Conformance Statement URL
    var conformanceUri = serviceUri + "/metadata";

    sessionStorage.setItem("serviceUri", serviceUri)
    sessionStorage.setItem("launchContextId", launchContextId)
    sessionStorage.setItem("launchUri", launchUri)
    // Let's request the conformance statement from the SMART on FHIR API server and
    // find out the endpoint URLs for the authorization server
    let conformanceStatement;
    const conformanceGet = new XMLHttpRequest();
    conformanceGet.open("GET", conformanceUri);
    conformanceGet.setRequestHeader("Content-Type", "application/json");
    conformanceGet.setRequestHeader("Accept", "application/json");

    conformanceGet.onload = function () {
        if (conformanceGet.status === 200) {
            try {
                // //alert("Got Metadata from "+conformanceUri);
                conformanceStatement = JSON.parse(conformanceGet.responseText);
            } catch (e) {
                // //alert("Error in retrieving metadata from "+conformanceUri);
                const errorMsg = "Unable to parse conformance statement.";
                document.body.innerText = errorMsg;
                console.error(errorMsg);
                return;
            }
            redirect(conformanceStatement);
        } else {

            const errorMsg = "Conformance statement request failed. Returned status: " + conformanceGet.status;
            // //alert(errorMsg);
            document.body.innerText = errorMsg;
            console.error(errorMsg);
            return;
        }
    };
    conformanceGet.send();

    function redirect(conformanceStatement) {

        var authUri, tokenUri;
        if (serviceUri.search('mettles.com') > 0) {
            authUri = "https://auth.mettles.com/auth/realms/ProviderCredentials/protocol/openid-connect/auth";
            tokenUri = "https://auth.mettles.com/auth/realms/ProviderCredentials/protocol/openid-connect/token"
            // retain a couple parameters in the session for later use
            sessionStorage.setItem(state, JSON.stringify({
                clientId: clientId,
                secret: secret,
                serviceUri: serviceUri,
                redirectUri: redirectUri,
                tokenUri: tokenUri,
                launchContextId: launchContextId
            }));
            window.location.href = redirectUri + "?state=" + state + "&code=eyJhbGciOiJkaXIiLKc5hE1G5xr";
        } else {
            var smartExtension = conformanceStatement.rest[0].security.extension.filter(function (e) {
                return e.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris";
            });

            smartExtension[0].extension.forEach(function (arg) {
                if (arg.url === "authorize") {
                    authUri = arg.valueUri;
                } else if (arg.url === "token") {
                    tokenUri = arg.valueUri;
                }
            });
            // retain a couple parameters in the session for later use
            sessionStorage.setItem(state, JSON.stringify({
                clientId: clientId,
                secret: secret,
                serviceUri: serviceUri,
                redirectUri: redirectUri,
                tokenUri: tokenUri,
                launchContextId: launchContextId
            }));
            // finally, redirect the browser to the authorizatin server and pass the needed
            // parameters for the authorization request in the URL
            //alert("redirecting to: "+authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state)

            window.location.href = authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state;

        }

    }
} else {
    // get the URL parameters received from the authorization server
    var state = urlUtils.getUrlParameter("state"); // session key
    const code = urlUtils.getUrlParameter("code"); // authorization code
    var appContextId = urlUtils.getUrlParameter("appContextId") // when internal provider request
    let ui = new UiFactory().getUi();
    //alert("Got url params - "+state);
    if (appContextId !== undefined) {
        state = sessionStorage.getItem("state");
    } else {
        appContextId = state;
    }
    console.log("state" + state);
    //alert("App context id"+ appContextId);
    // load the app parameters stored in the session
    const s = sessionStorage.getItem("state")
    console.log("state---" + sessionStorage.getItem(s));
    const params = JSON.parse(sessionStorage.getItem(s)); // load app session

    if (params === null || params === undefined) {
        ReactDOM.render(<
            ShowError type="invalidContext" />,
            document.getElementById("root")
        )
    }
    const tokenUri = params.tokenUri;
    const clientId = params.clientId;
    const secret = params.secret;
    const serviceUri = params.serviceUri;
    const redirectUri = params.redirectUri;
    // This endpoint available when deployed in CRD server, for development we have
    // the proxy set up in webpack.config.dev.js so the CRD server needs to be running
    console.log("Mode----", process.env.NODE_ENV);
    var FHIR_URI_PREFIX = "../../fetchFhirUri/";

    if (process.env.NODE_ENV === "production") {
        FHIR_URI_PREFIX = "https://sm.mettles.com/crd/fetchFhirUri/";
    }
    var data = `code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`
    if (!secret) data += "&client_id=" + clientId;

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    };

    if (secret) headers["Authorization"] = "Basic " + btoa(clientId + ":" + secret);

    function getParameterByName(name, url) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"),
            results = regex.exec(url);
        if (results != null) {
            return decodeURIComponent(results[1].replace(/\+/g, " "))
        } else {
            return ""
        }

    }

    function handleFetchErrors(response) {
        if (!response.ok) {
            ReactDOM.render(<ShowError type="invalidContext" />,
                document.getElementById("root")
            )
            return { "error": "Invalid App Context!!" };
        }
        return response;
    }

    function loadDTRApp(auth_response) {
        console.log("Auth Response---", auth_response)
        if (auth_response.hasOwnProperty("patient")) {
            var patient = auth_response.patient;
        } else {
            var patient = "";
        }
        if (auth_response.hasOwnProperty("appContext")) {
            appContextId = auth_response.appContext;
            // alert("From auth response Got AppContext---" + appContextId);
        } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
            appContextId = auth_response.cerner_appcontext;
            // alert("cerner appcontext Got AppContext---" + appContextId);
        } else if(sessionStorage.getItem("appContextId") !== undefined){
            appContextId = sessionStorage.getItem("appContextId")
        }

        try {
            console.log("appcontext ID--", JSON.parse(sessionStorage.getItem(appContextId)));
            var launchContext = JSON.parse(sessionStorage.getItem(appContextId));
            if (!auth_response.hasOwnProperty("patient")) {
                patient = launchContext.patientId;
                // alert("Got patient from launchContext: " + patient);
            }
            console.log("launch context---", launchContext);
            if (patient == null) {
                const errorMsg = "Failed to get a patientId from the app params or the authorization response.";
                document.body.innerText = errorMsg;
                console.error(errorMsg);
                return;
            } else {
                const appContext = {
                    template: launchContext.template,
                    request: launchContext.request,
                    filepath: null,
                    patientId: patient
                }

                console.log("launch context json", appContext);
                sessionStorage["patientId"] = patient;
                var smart = FHIR.client({
                    serviceUrl: serviceUri,
                    patientId: appContext.patientId,
                    auth: {
                        type: "bearer",
                        token: auth_response.access_token
                    }
                });
                //alert("2 before loading app.js")
                ReactDOM.render(<App FHIR_URI_PREFIX={FHIR_URI_PREFIX}
                    questionnaireUri={appContext.template}
                    smart={smart}
                    requestId={appContext.request}
                    filepath={appContext.filepath}
                />,
                    document.getElementById("root")
                );
            }
        } catch (error) {
            ReactDOM.render(<ShowError type="invalidContext" />,
                document.getElementById("root")
            )
        }

        /*let urn = "urn:hl7:davinci:crd:" + appContextId;
        let launchDataURL = FHIR_URI_PREFIX + encodeURIComponent(urn);
        console.log("launchdataurl----", launchDataURL);
        alert("launchdataurl---"+launchDataURL);
        fetch(launchDataURL).then(handleFetchErrors).then(r => r.json())
            .then(launchContext => {
                //alert("Got launchContext from CRD !!");
                if (!auth_response.hasOwnProperty("patient")) {
                    patient = launchContext.patientId;
                    // //alert("Got patient from launchContext: "+patient);
                }
                console.log("launch context---", launchContext);
                // //alert("Launch Context "+JSON.stringify(launchContext));
                if (patient == null) {
                    const errorMsg = "Failed to get a patientId from the app params or the authorization response.";
                    document.body.innerText = errorMsg;
                    console.error(errorMsg);
                    return;
                } else {
                    const appContext = {
                        template: launchContext.template,
                        request: launchContext.request,
                        filepath: null,
                        patientId: patient
                    }

                    console.log("launch context json", appContext);
                    sessionStorage["patientId"] = patient;
                    var smart = FHIR.client({
                        serviceUrl: serviceUri,
                        patientId: appContext.patientId,
                        auth: {
                            type: "bearer",
                            token: auth_response.access_token
                        }
                    });
                    //alert("2 before loading app.js")
                    ReactDOM.render(<App FHIR_URI_PREFIX={FHIR_URI_PREFIX}
                        questionnaireUri={appContext.template}
                        smart={smart}
                        serviceRequest={appContext.request}
                        filepath={appContext.filepath}
                    />,
                        document.getElementById("root")
                    );
                }
            });*/
    }
    const tokenPost = new XMLHttpRequest();
    var auth_response;
    if (serviceUri.search('mettles.com') > 0) {
        auth_response = { "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1X3RfUnQwaUJTaFZMUEpxc2xYdWVodmRwN0FadDN0a3l4TzFWb0lYSG9FIn0.eyJqdGkiOiI3NGE5MzY2My1iN2YwLTRmZjItOGVkZC0xMWYxMjU0MjExMzEiLCJleHAiOjE1ODgwODI3NDcsIm5iZiI6MCwiaWF0IjoxNTg4MDc5MTQ3LCJpc3MiOiJodHRwczovL2F1dGgubWV0dGxlcy5jb206ODQ0My9hdXRoL3JlYWxtcy9Qcm92aWRlckNyZWRlbnRpYWxzIiwic3ViIjoiYzcxYzU2MWUtZjI4MC00ODRmLWJlM2YtOWZiNTFhNjhmYWQyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXBwLWxvZ2luIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiNDAxMjMyNjMtNzVjMC00ZGI0LTg1NTYtMDMwMGY5YzM4YWY4IiwiYWNyIjoiMSIsInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwibmFtZSI6IkpvaG4gRG9lIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiam9obiIsImdpdmVuX25hbWUiOiJKb2huIiwiZmFtaWx5X25hbWUiOiJEb2UifQ.Zw6lcoP3AdmPeNURT1m7vUFcWx0AEJXgX8dgbAlGX-27tLwBu_IlQbhaPQvFr4ISCSTYLfcz3i7YS39aBf0NnRyusli9XXJGKhyix10lgonRn2D--7T32CMiFjzRzGY1QxbUSN1Vv8S6D_EkwbEH2zGXgfgFWfO6xcXSlAyRHhQkqUatO-h6Zh0341xMtweJa3uwLSv8PAxBAjMSMkyyPKdpAncMS7E6PmgcY431LEB-YAgBlH8Iw_bVAIJLYvINxij-K3MZ1-nFQAVF5Jmt8i8Zx81WigD21xKQGS1Ms5rcgGDZDgMDc-j2f1IidoacnlJ_cxLIGetch5GKKxkCZA", "expires_in": 3600, "refresh_expires_in": 1800, "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5YTA5ZGY3Yy1mM2JhLTRlMmQtYTg0NC01ZmMwYjljMGE1M2EifQ.eyJqdGkiOiJjYzVjMmI2Ni1hMjYwLTRkNmUtOThkMi04ZTYxMTcyM2Y0NWMiLCJleHAiOjE1ODgwODA5NDcsIm5iZiI6MCwiaWF0IjoxNTg4MDc5MTQ3LCJpc3MiOiJodHRwczovL2F1dGgubWV0dGxlcy5jb206ODQ0My9hdXRoL3JlYWxtcy9Qcm92aWRlckNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLm1ldHRsZXMuY29tOjg0NDMvYXV0aC9yZWFsbXMvUHJvdmlkZXJDcmVkZW50aWFscyIsInN1YiI6ImM3MWM1NjFlLWYyODAtNDg0Zi1iZTNmLTlmYjUxYTY4ZmFkMiIsInR5cCI6IlJlZnJlc2giLCJhenAiOiJhcHAtbG9naW4iLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI0MDEyMzI2My03NWMwLTRkYjQtODU1Ni0wMzAwZjljMzhhZjgiLCJzY29wZSI6InByb2ZpbGUgZW1haWwifQ.8PGhyznrydVQ-Mmtmd9why0J9etJW4oFuoSIderXEDs", "token_type": "bearer", "not-before-policy": 0, "session_state": "40123263-75c0-4db4-8556-0300f9c38af8", "scope": "profile email" }
        sessionStorage["token"] = auth_response.access_token;
        if (sessionStorage.getItem("showCDSHook") === "true") {
            ReactDOM.render(
                ui.getCRDRequestUI(),
                document.getElementById("root")
            );
        } else {
            sessionStorage.setItem("showCDSHook", false);
            loadDTRApp(auth_response);
        }
    } else if (sessionStorage.getItem("auth_response") === null && sessionStorage.getItem("showCDSHook") === "true") {
        // obtain authorization token from the authorization service using the authorization code
        tokenPost.open("POST", tokenUri);
        tokenPost.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        tokenPost.onload = function () {
            if (tokenPost.status === 200) {
                try {
                    auth_response = JSON.parse(tokenPost.responseText);
                    sessionStorage["token"] = auth_response.access_token;
                    sessionStorage.setItem("auth_response", JSON.stringify(auth_response));
                    if (auth_response.hasOwnProperty("patient")) {
                        sessionStorage.setItem("auth_patient_id", auth_response.patient);
                    }
                    if (auth_response.hasOwnProperty("appContext")) {
                        sessionStorage.setItem("showCDSHook", false);
                        loadDTRApp(auth_response);
                    } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
                        sessionStorage.setItem("showCDSHook", false);
                        loadDTRApp(auth_response);
                    } else {
                        ReactDOM.render(
                            ui.getCRDRequestUI(),
                            document.getElementById("root")
                        );
                    }
                } catch (e) {
                    ReactDOM.render(<ShowError type="invalidAuth" />,
                        document.getElementById("root")
                    )
                }
            }
        }
        tokenPost.send(data);
    } else if (sessionStorage.getItem("auth_response") !== null && sessionStorage.getItem("showCDSHook") === "true") {
        auth_response = JSON.parse(sessionStorage.getItem("auth_response"));
        if (auth_response.hasOwnProperty("appContext")) {
            sessionStorage.setItem("showCDSHook", false);
            loadDTRApp(auth_response);
        } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
            sessionStorage.setItem("showCDSHook", false);
            loadDTRApp(auth_response);
        } else {
            ReactDOM.render(
                ui.getCRDRequestUI(),
                document.getElementById("root")
            );
        }
    } else if (sessionStorage.getItem("auth_response") !== null && sessionStorage.getItem("showCDSHook") === "false") {
        auth_response = JSON.parse(sessionStorage.getItem("auth_response"));
        loadDTRApp(auth_response);
    } else if (sessionStorage.getItem("showCDSHook") === null || sessionStorage.getItem("showCDSHook") === "false") {
        // obtain authorization token from the authorization service using the authorization code
        tokenPost.open("POST", tokenUri);
        tokenPost.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        tokenPost.onload = function () {
            if (tokenPost.status === 200) {
                try {
                    //alert("got token response: "+auth_response);
                    auth_response = JSON.parse(tokenPost.responseText);
                    sessionStorage["token"] = auth_response.access_token;
                    loadDTRApp(auth_response);
                } catch (e) {
                    ReactDOM.render(<
                        ShowError type="invalidAuth" />,
                        document.getElementById("root")
                    )
                }
            } else {
                ReactDOM.render(<
                    ShowError type="token" />,
                    document.getElementById("root")
                )
            }
        };
        tokenPost.send(data);
    }
}