import urlUtils from "./util/url";

var serviceUri = urlUtils.getUrlParameter("iss");
var clientId = urlUtils.getUrlParameter("client_id");
if (serviceUri.indexOf("epic") !== -1 && clientId === undefined) {
  clientId = "7c47a01b-b7d8-41cf-a290-8ed607108e70"; // epic
} else if (serviceUri.indexOf("cerner") !== -1  && clientId === undefined) {
  clientId = "f7883dd8-5c7e-44de-be4b-c93c683bb8c7"; //cerner
  // clientId = "1602539f-194e-4d22-b82f-a0835725f384";  //local
} else if (serviceUri.indexOf("mettles")!== -1 && clientId === undefined) {
  clientId = "app-login";
}

var secret = null; // set me, if confidential

var launchContextId = urlUtils.getUrlParameter("launch");
if (serviceUri.indexOf("epic") !== -1 && launchContextId === undefined) {
  launchContextId = "" // epic
} else if (serviceUri.indexOf("cerner") !== -1 && launchContextId === undefined) {
  launchContextId = "cbaec2fb-6428-4182-a976-10cd3354af6c"; //cerner
}
//var launchContextId = "cbaec2fb-6428-4182-a976-10cd3354af6c"; //cerner
//var launchContextId = "3OVyU5YcVCHZUDAeMQaia3Cw4kzALBblPY7BPV9Jjk5S083PusHli0A_UCiVNJywGiE57fx_KpynO3esOeQL9dOcQXMIGPd6HYMlSyqiZ30fxcd754kfN2jPoP-Tis9a";
// var launchContextId = "10e2e686-a719-42ed-a52a-8332b77a48d6"; //local
// The scopes that the app will request from the authorization server
// encoded in a space-separated string:
//      1. permission to read all of the patient's record
//      2. permission to launch the app in the specific context
var scope = ["launch", "user/Patient.read", "user/Patient.write", "user/Procedure.read",
  "user/Practitioner.read", "patient/Condition.read","user/Condition.read", "patient/Coverage.read",
  "patient/Organization.read", "patient/Organization.write",
  "user/Organization.read", "user/Organization.write","patient/Observation.read",
  "user/Observation.read",].join(" ");

var app_context = urlUtils.getUrlParameter("app_context");
if (serviceUri.indexOf("epic") !== -1 && app_context === undefined) {
  app_context = Math.round(Math.random() * 100000000).toString(); // epic
} else if (serviceUri.indexOf("cerner") !== -1 && launchContextId === undefined) {
  app_context = urlUtils.getUrlParameter("cerner_appcontext"); //cerner
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
var redirectUri = launchUri.replace("launch", "index");

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
  }
  // retain a couple parameters in the session for later use
    sessionStorage.setItem(state,JSON.stringify({
    clientId: clientId,
    secret: secret,
    serviceUri: serviceUri,
    redirectUri: redirectUri,
    tokenUri: tokenUri,
    launchContextId: launchContextId
    }));
  // finally, redirect the browser to the authorizatin server and pass the needed
  // parameters for the authorization request in the URL
  // //alert("redirecting to: "+authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state)
  window.location.href = authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state;

}
