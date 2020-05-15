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
  
  if (type === "Encounter" || type === "SupplyRequest") {
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

function buildPopulatedResourceBundle(smart, neededResources, consoleLog, request) {
  return new Promise(function (resolve, reject) {
    console.log("waiting for patient");
    consoleLog("waiting for patient", "infoClass");
    consoleLog(smart.patient.id, "infoClass");
    smart.patient.read().then(
      pt => {
        console.log("got pt", pt);
        consoleLog("got patient:" + pt.id, "infoClass");
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
          consoleLog("fetching " + r, "infoClass");
          if (r === "") {
            callback();
          } else if (r === "Patient") {
            readResources(neededResources, callback);
          } else {
            if (r === "Coverage") {
              q = { "patient": sessionStorage.getItem("patientId") }
            }
            doSearch(smart, r, q, (results, error) => {
              if (results) {

                if (q["code"] !== undefined) {
                  consoleLog("got " + r + "?code=" + q["code"], "infoClass");
                } else {
                  consoleLog("got " + r, "infoClass");
                }
                //Retrieve Organization Info from  Coverage.Payor
                if (r === "Coverage" && results.length > 0 && results[0].hasOwnProperty("payor") && results[0].payor[0].hasOwnProperty("reference")) {
                  sessionStorage.setItem("coverage", JSON.stringify(results[0]));
                  let payor = results[0].payor[0].reference;
                  let org_id = payor.split("/")[1]
                  //Search for Payor Organization
                  doSearch(smart, "Organization", { "_id": org_id }, (results, error) => {
                    if (results) {
                      entryResources.push(...results);
                      sessionStorage.setItem("insurer", "Organization/" + org_id);
                      consoleLog("got Payor Organization?_id=" + org_id, "infoClass");
                    }
                    if (error) {
                      console.error(error);
                      consoleLog(error.data.statusText + " for " + r, "errorClass");
                    }
                  });
                }
                if (r === "Encounter" && results.length > 0) {
                  sessionStorage.setItem("encounter", "Encounter/" + results[0].id);
                  //Retrieve Practitioner Info from  Encounter.participant
                  if (results[0].hasOwnProperty("participant") && results[0].participant.length > 0) {
                    let participant = results[0].participant;
                    participant.map((p) => {
                      let practitioner_id = p.individual.reference.split("/")[1]
                      //Search Practitioner if exists
                      doSearch(smart, "Practitioner", { "_id": practitioner_id }, (results, error) => {
                        if (results) {
                          entryResources.push(...results);
                          consoleLog("got Practitioner?_id=" + practitioner_id, "infoClass");
                        }
                        if (error) {
                          console.error(error);
                          consoleLog(error.data.statusText + " for " + r, "errorClass");
                        }
                      });
                    })
                  }
                  //Retrieve Provider Organization Info from  Encounter.serviceProvider
                  if (results[0].hasOwnProperty("serviceProvider") && results[0].serviceProvider.hasOwnProperty("reference")) {
                    // Search for Provider Organization
                    let org_id = results[0].serviceProvider.reference.split("/")[1];
                    doSearch(smart, "Organization", { "_id": org_id }, (results, error) => {
                      if (results) {
                        entryResources.push(...results);
                        consoleLog("got Provider Organization?_id=" + org_id, "infoClass");
                        sessionStorage.setItem("provider", "Organization/" + org_id);
                      }
                      if (error) {
                        console.error(error);
                        consoleLog(error.data.statusText + " for Provider Organization", "errorClass");
                      }
                    });
                  }
                }
                if (r === "Condition" && results.length > 0 && q.hasOwnProperty("code")) {
                  var filteredConditions = [];
                  var codes = q.code.split(",");
                  results.map((cond) => {
                    if (cond.hasOwnProperty("code") && cond.code.hasOwnProperty("coding")) {
                      var found = false;
                      cond.code.coding.map((codeObj) => {
                        if (codes.indexOf(codeObj.code) >= 0) {
                          found = true;
                        }
                      })
                      if (found) {
                        filteredConditions.push(cond)
                      }
                    }

                  })
                  entryResources.push(...filteredConditions);
                } else {
                  entryResources.push(...results);
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
              "system": "http://identifiers.mettles.com ",
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
