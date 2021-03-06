import cql from "cql-execution";
import cqlfhir from "cql-exec-fhir";
import base64 from "base-64";
// import fhirhelpersElm from "./FHIRHelpers.json";
import extractFhirResourcesThatNeedFetching from "./extractFhirResourcesThatNeedFetching";
import buildPopulatedResourceBundle from "./buildPopulatedResourceBundle";
import "fhirclient";

function getSmartConnection() {

  var smart = FHIR.client({
    serviceUrl: sessionStorage["otherProviderUrl"],
    patientId: sessionStorage["patientId"],
    auth: {
      type: "bearer",
      token: sessionStorage["token"]
    }
  });
  return smart
}

function executeElm(smart, fhirVersion, executionInputs, consoleLog) {
  return new Promise(function (resolve, reject) {
    const patientSource = getPatientSource(fhirVersion)
    console.log("SssnStorage", sessionStorage)
    // alert("Executing Cql ");
    const neededResources = extractFhirResourcesThatNeedFetching(executionInputs.dataRequirement);
    consoleLog("need to fetch resources", "infoClass");
    console.log("We need to fetch these resources:", neededResources);
    sessionStorage['fhir_queries'] = JSON.stringify(neededResources);
    console.log("device request--", executionInputs.parameters.device_request);
    buildPopulatedResourceBundle(smart, neededResources, consoleLog, executionInputs.parameters.device_request)
      .then(function (resourceBundle) {
        console.log("Fetched resources are in this bundle:", resourceBundle);
        console.log(JSON.stringify(resourceBundle));
        resourceBundle.entry.push({ 'resource': executionInputs.parameters.device_request });
        console.log("resource bundle...........", resourceBundle);
        patientSource.loadBundles([resourceBundle]);
        const elmResults = executeElmAgainstPatientSource(executionInputs, patientSource);
        console.log("elm results---", elmResults);
        elmResults.PractitionerNPI = "9585736541"
        elmResults.FacilityNPI = "2359347372"
        const results = {
          bundle: resourceBundle,
          elmResults: elmResults
        }
        console.log("elm results---", results);
        resolve(results);
      })
      .catch(function (err) { reject(err) });


  });
}


function buildResourceBundleFromCommunication(smart, communicationResource) {
  return new Promise(function (resolve, reject) {
    console.log("Communication-- resource", communicationResource);
    const docResources = [];
    let entryResources = [];
    communicationResource.payload.forEach((item) => {
      if (item.extension[0].hasOwnProperty("valueCodeableConcept")) {
        console.log("payload---attachment--- ", item.contentAttachment)
        let docRef = {
          "resourceType": "DocumentReference",
          "identifier": [
            {
              "system": "urn:ietf:rfc:3986",
              "value": "urn:oid:1.3.6.1.4.1.21367.2005.3.7.1234"
            }
          ],
          "status": "current",
          "docStatus": "preliminary",
          "type": item.extension[0].valueCodeableConcept,
          "subject": {
            "reference": "Patient/" + sessionStorage["patientId"]
          },
          "date": "2005-12-24T09:43:41+11:00",
          "description": "Physical",
          "content": [
            {
              "attachment": item.contentAttachment
            }
          ]
        }
        docResources.push(docRef);
      }

      // console.log("ITEMMM", item ,item.extension[0].hasOwnProperty("valueString"));
      if (item.extension[0].hasOwnProperty("valueString")) {
        // console.log("payload---resource--- ",item.contentAttachment.data)
        if (base64.decode(item.contentAttachment.data) !== undefined) {
          let resourceBundle = JSON.parse(base64.decode(item.contentAttachment.data))
          console.log("BUNdle!!!!", resourceBundle)
          if (resourceBundle.total > 0) {
            let entryArray = resourceBundle.entry
            for (var i = entryArray.length - 1; i >= 0; i--) {
              entryResources.push(entryArray[i].resource);
            }
          }
        }
      }
    })
    sessionStorage['docResources'] = JSON.stringify(docResources);
    console.log("entryResources", entryResources)
    resolve(entryResources.map(r => ({ resource: r })));
  })
}

function executeElmAgainstPatientSource(executionInputs, patientSource) {
  // executionInputs.elmDependencies = [ fhirhelpersElm ]
  const repository = new cql.Repository(executionInputs.elmDependencies);
  const lib = new cql.Library(executionInputs.elm, repository);
  const codeService = new cql.CodeService(executionInputs.valueSetDB);
  const executor = new cql.Executor(lib, codeService, executionInputs.parameters);
  try {
    const results = executor.exec(patientSource);
    console.log("execute result---", results)
    // alert("GOT cql results");
    return results.patientResults[Object.keys(results.patientResults)[0]];
  } catch (err) {
    console.log("exec error---", err);
    // alert("Error in CQl execution");
    return {}
  }
}

function getPatientSource(fhirVersion) {
  if (fhirVersion == "dstu2") return cqlfhir.PatientSource.FHIRv102();
  if (fhirVersion == "stu3") return cqlfhir.PatientSource.FHIRv300();
  if (fhirVersion == "r4") return cqlfhir.PatientSource.FHIRv400();
}


export default executeElm;
