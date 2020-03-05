import "fhirclient"; // sets window.FHIR
import urlUtils from "./util/url";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import { stat } from "fs";
import ProviderRequest from "./ProviderRequest";
import UiFactory from "./UiFactory.js";

//alert("Loaded imports");

var serviceUri = urlUtils.getUrlParameter("iss");
if (serviceUri !== undefined) {
console.log("service---",serviceUri);
var clientId = urlUtils.getUrlParameter("client_id");
if (serviceUri.indexOf("epic") !== -1 && clientId === undefined) {
  clientId = "7c47a01b-b7d8-41cf-a290-8ed607108e70"; // epic
} else if (serviceUri.indexOf("cerner") !== -1  && clientId === undefined) {

  // clientId = "f7883dd8-5c7e-44de-be4b-c93c683bb8c7"; //cerner
  clientId = "0bf0e406-79e9-43bc-85b1-886a2fc21bcb";  //local
} else if (serviceUri.indexOf("mettles")!== -1 && clientId === undefined) {
  clientId = "app-login";
}
sessionStorage['UI_TYPE'] = "cerner_ui";
var secret = null; // set me, if confidential

var launchContextId = urlUtils.getUrlParameter("launch");
if (serviceUri.indexOf("epic") !== -1 && launchContextId === undefined) {
  launchContextId = "" // epic
} else if (serviceUri.indexOf("cerner") !== -1 && launchContextId === undefined) {
  sessionStorage['UI_TYPE'] = "cerner_ui"
  launchContextId = "cbaec2fb-6428-4182-a976-10cd3354af6c"; //cerner
  sessionStorage.setItem("currentEHR","Cerner");
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
  "user/Observation.read","patient/Encounter.read","user/Encounter.read",].join(" ");

var app_context = urlUtils.getUrlParameter("app_context");
if (serviceUri.indexOf("epic") !== -1 && app_context === undefined) {
  app_context = Math.round(Math.random() * 100000000).toString(); // epic
} else if (serviceUri.indexOf("cerner") !== -1 && app_context === undefined) {
  app_context = urlUtils.getUrlParameter("cerner_appcontext"); //cerner
  // if(app_context === undefined){
  //   app_context = Math.round(Math.random() * 100000000).toString();
  // }
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
  //alert("redirecting to: "+authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state)
  window.location.href = authUri + "?" + "response_type=code&" + "client_id=" + encodeURIComponent(clientId) + "&" + "scope=" + encodeURIComponent(scope) + "&" + "redirect_uri=" + encodeURIComponent(redirectUri) + "&" + "aud=" + encodeURIComponent(serviceUri) + "&" + "launch=" + encodeURIComponent(launchContextId) + "&" + "state=" + state;

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
const tokenUri = params.tokenUri;
const clientId = params.clientId;
const secret = params.secret;
const serviceUri = params.serviceUri;
const redirectUri = params.redirectUri;

// This endpoint available when deployed in CRD server, for development we have
// the proxy set up in webpack.config.dev.js so the CRD server needs to be running
const FHIR_URI_PREFIX = "../../fetchFhirUri/";
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
  }
  else {
    return ""
  }

}


function createOrganization(auth_response) {
  let orgRes = {

    "resourceType": "Organization",
    "identifier": [
      {
        "system": "http://hl7.org/fhir/sid/us-npi",
        "value": "john",
        "type": {
          "coding": [
            {
              "system": "http://hl7.org/fhir/v2/0203",
              "code": "NIIP",
              "display": "National Insurance Payor Identifier (Payor)	"
            }
          ]
        }
      },
      {
        "system": "http://hl7.org/fhir/sid/us-npi",
        "value": "john123",
        "type": {
          "coding": [
            {
              "system": "http://hl7.org/fhir/v2/0203",
              "code": "NIIP",
              "display": "National Insurance Payor Identifier (Payor)	"
            }
          ]
        }
      }
    ],
    "name": "Beryllium CRD Service",
    "type": [
      {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "code": "pay",
            "display": "Payer"
          }
        ]
      }
    ]
  };
  console.log(orgRes);
  var tempURL = params.serviceUri + "/Organization";
  fetch(tempURL, {
    method: 'POST',
    body: JSON.stringify(orgRes),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': 'Bearer ' + auth_response.access_token
    }
  }).then((response) => {
    return response.json()
  }).then((response) => {
    console.log("Organization Create response", response);
  }).catch(err => err);
}

function createPatient(auth_response) {
  patientRes = {
    "resourceType": "Patient",
    "extension": [
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        "valueCode": "M"
      },
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        "extension": [
          {
            "url": "ombCategory",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2028-9",
              "display": "Asian"
            }
          },
          {
            "url": "detailed",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2039-6",
              "display": "Japanese"
            }
          }
        ]
      },
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
        "extension": [
          {
            "url": "ombCategory",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2186-5",
              "display": "Non Hispanic or Latino"
            }
          }
        ]
      }
    ],
    "identifier": [
      {
        "assigner": {
          "reference": "Organization/619848"
        }
      }
    ],
    "active": true,
    "name": [
      {
        "use": "official",
        "family": "Wolf",
        "given": [
          "Person",
          "Name"
        ],
        "period": {
          "start": "2010-05-17T14:54:31.000Z"
        }
      },
      {
        "use": "usual",
        "given": [
          "Bigby"
        ],
        "period": {
          "start": "2012-05-22T15:45:50.000Z"
        }
      }
    ],
    "telecom": [
      {
        "system": "phone",
        "value": "8168229121",
        "use": "home",
        "period": {
          "start": "2012-05-17T15:33:18.000Z"
        }
      }
    ],
    "gender": "male",
    "birthDate": "1990-09-15",
    "address": [
      {
        "use": "home",
        "line": [
          "121212 Metcalf Drive",
          "Apartment 403"
        ],
        "city": "Kansas City",
        "district": "Jackson",
        "state": "KS",
        "postalCode": "64199",
        "country": "United States of America",
        "period": {
          "start": "2012-05-17T15:33:18.000Z"
        }
      }
    ],
    "maritalStatus": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-NullFlavor",
          "code": "UNK",
          "display": "Unknown"
        }
      ],
      "text": "Unknown"
    },
    "communication": [
      {
        "language": {
          "coding": [
            {
              "system": "urn:ietf:bcp:47",
              "code": "en",
              "display": "English"
            }
          ],
          "text": "English"
        },
        "preferred": true
      }
    ],
    "generalPractitioner": [
      {
        "reference": "Practitioner/605926"
      }
    ]
  }
  console.log(patientRes);
  var tempURL = params.serviceUri + "/Patient";
  fetch(tempURL, {
    method: 'POST',
    body: JSON.stringify(patientRes),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': 'Bearer ' + auth_response.access_token
    }
  }).then((response) => {
    return response.json()
  }).then((response) => {
    console.log("Patient Create response", response);
  }).catch(err => err);
}

function updatePatient(auth_response, patientRes) {
  patientRes.gender = "female";
  console.log(patientRes);
  var tempURL = params.serviceUri + "/Patient/" + auth_response.patient;
  fetch(tempURL, {
    method: 'PUT',
    body: JSON.stringify(patientRes),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': 'Bearer ' + auth_response.access_token
    }
  }).then((response) => {
    return response.json()
  }).then((response) => {
    console.log("Patient Update response", response);
  }).catch(err => err);
}

function handleFetchErrors(response) {
  if (!response.ok) {
    const errorMsg = "Invalid app context. Unable to fetch resources !!";
    document.body.innerText = errorMsg;
    console.error(errorMsg,response);
    return {"error":errorMsg};
  }
  return response;
  
}

function searchPatient(auth_response) {
  var tempURL = params.serviceUri + "/Patient?family=SMART";
  fetch(tempURL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': 'Bearer ' + auth_response.access_token
    }
  }).then((response) => {
    return response.json()
  }).then((response) => {
    console.log("Patient Search response", response);
  }).catch(err => err);
}

function loadDTRApp(auth_response) {
  if (auth_response.hasOwnProperty("patient")) {
    var tempURL = params.serviceUri + "/Patient/" + auth_response.patient;
    var patient = auth_response.patient;
  } else {
    var tempURL = params.serviceUri + "/Patient";
    var patient = "";
  }

  fetch(tempURL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': 'Bearer ' + auth_response.access_token
    }
  }).then((response) => {
    return response.json()
  }).then((response) => {
    //alert("Got Patient---");
    if (auth_response.hasOwnProperty("appContext")) {
      appContextId = auth_response.appContext;
      //alert("Got AppContext---"+appContextId);
    } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
      appContextId = auth_response.cerner_appcontext;
      //alert("Got AppContext---"+appContextId);
    }
    let urn = "urn:hl7:davinci:crd:" + appContextId;
    let launchDataURL = "../fetchFhirUri/" + encodeURIComponent(urn);
    console.log("launchdataurl----", launchDataURL);
    //alert("launchdataurl---"+launchDataURL);
    fetch(launchDataURL).then(handleFetchErrors).then(r => r.json())
      .then(launchContext => {
        //alert("Got launchContext from CRD !!");
        if (!auth_response.hasOwnProperty("patient")) {
          patient = launchContext.patientId;
          // //alert("Got patient from launchContext: "+patient);
        }
        console.log("launch context---", launchContext);
        // //alert("Launch Context "+JSON.stringify(launchContext));
        const appContext = {
          template: launchContext.template,
          request: launchContext.request,
          payerName: launchContext.payerName,
          filepath: null,
          patientId: patient
        }

        console.log("launch context json", appContext);
        sessionStorage["patientId"] = patient;
        sessionStorage["payerName"] = launchContext.payerName;
        var smart = FHIR.client({
          serviceUrl: serviceUri,
          patientId: appContext.patientId,
          auth: {
            type: "bearer",
            token: auth_response.access_token
          }
        });
        //alert("2 before loading app.js")
        ReactDOM.render(
          <App
            FHIR_URI_PREFIX={FHIR_URI_PREFIX}
            questionnaireUri={appContext.template}
            smart={smart}
            serviceRequest={appContext.request}
            filepath={appContext.filepath}
          />,
          document.getElementById("root")
        );

        const patientId = appContext.patientId;
        if (patientId == null) {
          const errorMsg = "Failed to get a patientId from the app params or the authorization response.";
          document.body.innerText = errorMsg;
          console.error(errorMsg);
          return;
        }
        return patientId;
      });
  }).catch(err => err);
}
const tokenPost = new XMLHttpRequest();
var auth_response;
// console.log("CDS HOOk-----",sessionStorage.getItem("showCDSHook"));

if (sessionStorage.getItem("auth_response") === null && sessionStorage.getItem("showCDSHook") === "true") {
  // obtain authorization token from the authorization service using the authorization code
  tokenPost.open("POST", tokenUri);
  tokenPost.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  tokenPost.onload = function () {
    if (tokenPost.status === 200) {
      try {
        auth_response = JSON.parse(tokenPost.responseText);
        sessionStorage["token"] = auth_response.access_token;
        sessionStorage.setItem("auth_response", JSON.stringify(auth_response));
        console.log("auth res---", auth_response);
        if (auth_response.hasOwnProperty("patient")) {
          sessionStorage.setItem("auth_patient_id", auth_response.patient);
        }
        if (auth_response.hasOwnProperty("appContext")) {
          sessionStorage.setItem("showCDSHook",false);
          loadDTRApp(auth_response);
        } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
          sessionStorage.setItem("showCDSHook",false);
          loadDTRApp(auth_response);
        } else {
          ReactDOM.render(
            ui.getProviderRequestUI(),
            document.getElementById("root")
          );
        }
        // createPatient(auth_response);
        // searchPatient(auth_response);
        // createOrganization(auth_response);
        
      } catch (e) {
        const errorMsg = "Failed to parse auth response";
        document.body.innerText = errorMsg;
        console.error(errorMsg);
        return;
      }

    }
  }
  tokenPost.send(data);
} else if (sessionStorage.getItem("auth_response") !== null && sessionStorage.getItem("showCDSHook") === "true") {
  console.log("In pro--")
  auth_response = JSON.parse(sessionStorage.getItem("auth_response"));
  if (auth_response.hasOwnProperty("appContext")) {
    sessionStorage.setItem("showCDSHook",false);
    loadDTRApp(auth_response);
  } else if (auth_response.hasOwnProperty("cerner_appcontext")) {
    sessionStorage.setItem("showCDSHook",false);
    loadDTRApp(auth_response);
  } else {
    ReactDOM.render(
      ui.getProviderRequestUI(),
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
        // //alert("got token response: "+auth_response);
        auth_response = JSON.parse(tokenPost.responseText);
        sessionStorage["token"] = auth_response.access_token;
        console.log("auth res---", auth_response);
        // createPatient(auth_response);
        // searchPatient(auth_response);
        // createOrganization(auth_response);
        loadDTRApp(auth_response);

      } catch (e) {
        const errorMsg = "Failed to parse auth response";
        document.body.innerText = errorMsg;
        console.error(errorMsg);
        return;
      }
    } else {
      const errorMsg = "Token post request failed. Returned status: " + tokenPost.status;
      document.body.innerText = errorMsg;
      console.error(errorMsg);
      return;
    }
  };
  tokenPost.send(data);
}

/** Below code is for getting appcontext from Message definition form FHIR */
        //   response.description = "template%3Durn%3Ahl7%3Adavinci%3Acrd%3AAmbulatoryTransportService%26request%3D%7B%22requester%22%3A%7B%22reference%22%3A%22Practitioner%3Fidentifier%3D1932102951%22%7D%2C%22identifier%22%3A%5B%7B%22value%22%3A18631431%7D%5D%2C%22subject%22%3A%7B%22reference%22%3A%22Patient%3Fidentifier%3D20198%22%7D%2C%22parameter%22%3A%5B%7B%22code%22%3A%7B%22coding%22%3A%5B%7B%22system%22%3A%22http%3A%2F%2Floinc.org%22%2C%22code%22%3A%22A0428%22%2C%22display%22%3A%22Ambulance%20service%2C%20Basic%20Life%20Support%20(BLS)%2C%20non-emergency%20transport%20The%20mileage%20code%22%7D%5D%2C%22text%22%3A%22Ambulance%20service%2C%20Basic%20Life%20Support%20(BLS)%2C%20non-emergency%20transport%20The%20mileage%20code%22%7D%7D%5D%2C%22priority%22%3A%22routine%22%2C%22intent%22%3A%22instance-order%22%2C%22resourceType%22%3A%22DeviceRequest%22%2C%22status%22%3A%22active%22%7D%26patient%3D20198";
        //   if (appContext != undefined) {
        //     console.log("App Context--", decodeURIComponent(response.description));
        //     let resp = decodeURIComponent(response.description);
        //     var request = getParameterByName('request', resp)
        //     var patient = auth_response.patient
        //     console.log(patient, 'too')
        //     sessionStorage["patientId"] = patient;
        //     const appContext = {
        //       template: resp.split("&")[0].split("=")[1],
        //       request: JSON.parse(request),
        //       filepath: null,
        //       patientId: patient
        //     }
        //     console.log("Appcontext--",appContext);
        //     var smart = FHIR.client({
        //       serviceUrl: serviceUri,
        //       patientId: appContext.patientId,
        //       auth: {
        //         type: "bearer",
        //         token: auth_response.access_token

        //       }
        //     });
        //     ReactDOM.render(
        //       <App
        //         FHIR_URI_PREFIX={FHIR_URI_PREFIX}
        //         questionnaireUri={appContext.template}
        //         smart={smart}
        //         serviceRequest={appContext.request}
        //         filepath={appContext.filepath}
        //       />,
        //       document.getElementById("root")
        //     );
        //     const patientId = appContext.patientId;
        //     if (patientId == null) {
        //       const errorMsg = "Failed to get a patientId from the app params or the authorization response.";
        //       document.body.innerText = errorMsg;
        //       console.error(errorMsg);
        //       return;
        //     }
        //     return patientId;
        // }
}