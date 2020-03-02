function doSearch(smart, type, q, callback) {
  // const q = {};

  // If this is for Epic, there are some specific modifications needed for the queries to work properly
  if (
    process.env.REACT_APP_EPIC_SUPPORTED_QUERIES &&
    process.env.REACT_APP_EPIC_SUPPORTED_QUERIES.toLowerCase() === "true"
  ) {
    switch (type) {
      case "Observation":
        // Epic requires you to specify a category or code search parameter, so search on all categories
        q.category = [
          "social-history",
          "vital-signs",
          "imaging",
          "laboratory",
          "procedure",
          "survey",
          "exam",
          "therapy"
        ].join(",");
        break;
      case "MedicationOrder":
        // Epic returns only active meds by default, so we need to specifically ask for other types
        q.status = ["active", "completed", "stopped", "on-hold", "draft", "entered-in-error"].join(
          ","
        );
        break;
      case "MedicationStatement":
        // Epic returns only active meds by default, so we need to specifically ask for other types
        q.status = ["active", "completed", "intended", "entered-in-error"].join(",");
        break;
      default:
      //nothing
    }
  }
  if (type === "Encounter") {
    smart.api
      .search({ type: type, query: q })
      .then(processSuccess(smart, [], callback), processError(smart, callback));
  } else {
    console.log("Search calls else: ", type, q);
    smart.patient.api
      .search({ type: type, query: q })
      .then(processSuccess(smart, [], callback), processError(smart, callback));
  }
}

function processSuccess(smart, resources, callback) {
  return response => {
    if (response.data && response.data.resourceType === "Bundle") {
      if (response.data.entry) {
        response.data.entry.forEach(function (e) {
          resources.push(e.resource);
        });
      }
      if (
        response.data.link &&
        response.data.link.some(l => l.relation === "next" && l.url != null)
      ) {
        // There is a next page, so recursively process that before we do the callback
        smart.patient.api
          .nextPage({ bundle: response.data })
          .then(processSuccess(smart, resources, callback), processError(smart, callback));
      } else {
        callback(resources);
      }
    } else {
      callback(null, new Error("Failed to parse response", response));
    }
  };
}

function processError(smart, callback) {
  return error => {
    callback(null, error);
  };
}

function randomString() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
  var string_length = 16;
  var randomstring = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring
}

function getInfoFromPatient(pt, neededResources, entryResources) {
  try {
    if (pt.hasOwnProperty("managingOrganization")) {
      console.log("organization----------", pt.managingOrganization, neededResources);
      sessionStorage.setItem("managingOrganization", pt.managingOrganization.reference);
      var org_id = pt.managingOrganization.reference.split("/");
      neededResources.push({
        "query": {
          "_id": org_id[1]
        },
        "type": "Organization"
      })
    }
    if (pt.hasOwnProperty("generalPractitioner")) {
      console.log("Practitioner---------", pt.generalPractitioner, neededResources);
      sessionStorage.setItem("generalPractitioner", pt.generalPractitioner[0].reference);
      var prac_id = pt.generalPractitioner[0].reference.split("/");
      neededResources.push({
        "query": {
          "_id": prac_id[1]
        },
        "type": "Practitioner"
      })
    } else {
      let practitioner = [{
        "resourceType": "Practitioner",
        "id": "1912007",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2019-06-24T15:22:23.000Z"
        },
        "text": {
          "status": "generated",
          "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><b>Practitioner</b></p><p><b>Name</b>: McCurdy, Michael</p><p><b>Status</b>: Active</p></div>"
        },
        "identifier": [
          {
            "extension": [
              {
                "url": "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
                "valueCode": "unknown"
              }
            ]
          }
        ],
        "active": true,
        "name": [
          {
            "use": "usual",
            "text": "McCurdy, Michael",
            "family": "McCurdy",
            "given": [
              "Michael"
            ],
            "period": {
              "start": "2013-09-27T04:25:59.000Z"
            }
          }
        ]
      }]
      entryResources.push(...practitioner);
    }
  } catch (err) {
    console.log("Unable to fetch Organization / Practitioner from patient");
  }
}
function buildPopulatedResourceBundle(smart, neededResources, consoleLog, request) {
  return new Promise(function (resolve, reject) {
    console.log("waiting for patient");
    consoleLog("waiting for patient", "infoClass");
    consoleLog(smart.patient.id, "infoClass");
    smart.patient.read().then(
      pt => {
        console.log("got pt", pt);
        consoleLog("got pt:" + pt, "infoClass");
        sessionStorage['patientObject'] = JSON.stringify(pt)
        const entryResources = [pt];
        // entryResources = getInfoFromPatient(pt, neededResources, entryResources);
        if (request.hasOwnProperty("encounter")) {
          if (request.encounter.hasOwnProperty("reference")) {
            neededResources.push({
              "query": {
                "_id": request.encounter.reference.split("/")[1]
              },
              "type": "Encounter"
            })
          }
        }
        const readResources = (neededResources, callback) => {
          const rq = neededResources.pop();
          let r = "";
          let q = {};
          if (rq !== undefined) {
            r = rq.type;
            q = rq.query;
          }
          if (r === "") {
            callback();
          } else if (r === "Patient") {
            readResources(neededResources, callback);
          } else {
            if (r === "Coverage") {
              // if (request.hasOwnProperty("insurance")) {
              //   if (request.insurance.length > 0) {
              //     try {
              //       let coverageRef = request.insurance[0].reference;
              //       q = { "_id": coverageRef.split("/")[1] }
              //     } catch{
              //       q = { "patient": sessionStorage.getItem("patientId") }
              //     }
              //   }
              // } else {
                q = { "patient": sessionStorage.getItem("patientId") }
              // }
            }
            doSearch(smart, r, q, (results, error) => {
              if (results) {
                entryResources.push(...results);
                if (q["code"] !== undefined) {
                  consoleLog("got " + r + "?code=" + q["code"], "infoClass");
                } else {
                  consoleLog("got " + r, "infoClass");
                }
                if (r === "Coverage" && results.length > 0 && results[0].hasOwnProperty("payor") && results[0].payor[0].hasOwnProperty("reference")) {
                  sessionStorage.setItem("coverage", JSON.stringify(results[0]));
                  let payor = results[0].payor[0].reference;
                  let org_id = payor.split("/")[1]
                  //Search Payor Organization if exists
                  doSearch(smart, "Organization", { "_id": org_id }, (results, error) => {
                    if (results) {
                      sessionStorage.setItem("coverage", JSON.stringify(results[0]));
                      entryResources.push(...results);
                      if (q["code"] !== undefined) {
                        consoleLog("got Organization?_id=" + org_id, "infoClass");
                      } else {
                        consoleLog("got Organization", "infoClass");
                      }
                    }
                    if (error) {
                      console.error(error);
                      if (q["code"] !== undefined) {
                        consoleLog(error.data.statusText + " for " + r + "?code=" + q["code"], "errorClass");
                      } else {
                        consoleLog(error.data.statusText + " for " + r, "errorClass");
                      }
                    }
                    readResources(neededResources, callback);
                  });
                }
              }
              if (error) {
                console.error(error);
                if (q["code"] !== undefined) {
                  consoleLog(error.data.statusText + " for " + r + "?code=" + q["code"], "errorClass");
                } else {
                  consoleLog(error.data.statusText + " for " + r, "errorClass");
                }

              }
              readResources(neededResources, callback);
            });
          }
        };

        readResources(neededResources.slice(), () => {
          const bundle = {
            resourceType: "Bundle",
            type: "collection",
            identifier:
            {
              "system": "http://identifiers.mettles.com/prior_authorization",
              "value": randomString()
            },
            entry: entryResources.map(r => ({ resource: r }))
          };
          resolve(bundle);
        });
      },
      error => {
        consoleLog("error: " + error, "errorClass");
        console.log(error);
        reject(error);
      }
    );
  });
}

export default buildPopulatedResourceBundle;
