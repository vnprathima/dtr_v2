import "isomorphic-fetch";
import Config from "../globalConfiguration.json";

function fetchArtifacts(fhirUriPrefix, questionnaireUri, smart, filepath, consoleLog) {
  return new Promise(function (resolve, reject) {
    function handleFetchErrors(response) {
      if (!response.ok) {
        consoleLog("failed to get resource", "errorClass");
        reject("Failure when fetching resource.");
      }
      return response;
    }

    const fetchedUris = new Set();
    let pendingFetches = 0;

    const retVal = {
      questionnaire: null,
      mainLibraryElm: null,
      dependentElms: [],
      dataRequirement: []
    }

    function resolveIfDone() {
      if (pendingFetches != 0) return;
      if (retVal.questionnaire && retVal.mainLibraryElm) resolve(retVal)
      else reject("Failed to fetch all artifacts.")
    }

    var fhirResources = false;
    if (filepath == null || filepath == "" || filepath == "_") {
      console.log("fhir resources mode");
      fhirResources = true;
    }

    //fetch questionnaire and all elms
    // var questionnaireUrl = fhirUriPrefix+encodeURIComponent(questionnaireUri);
    // if (!fhirResources) {
    //   questionnaireUrl = filepath + "/" + stripFilenameFromURI(questionnaireUri) + ".json";
    // }
    var questionnaireUrl = Config.questionnaire_fhir_url + "/Questionnaire/" + questionnaireUri;

    pendingFetches += 1;
    consoleLog("fetching questionairre and elms", "infoClass");
    consoleLog(questionnaireUrl, "infoClass");
    fetch(questionnaireUrl, {
      method: "GET",
      headers: {
        'Content-Type': 'application/fhir+json',
        "Cache-Control": "no-cache,no-store"
      }
    }).then(handleFetchErrors).then(r => r.json())
      .then(questionnaire => {
        consoleLog("fetched questionnaire successfully", "infoClass");
        retVal.questionnaire = questionnaire;
        fetchedUris.add(questionnaireUri)
        const mainElmUri = questionnaire.extension.filter(ext => ext.url == "http://hl7.org/fhir/StructureDefinition/cqif-library")[0].valueReference.reference;
        fetchElm(mainElmUri, true)
        pendingFetches -= 1;
        consoleLog("fetched elms", "infoClass");
      })
      .catch(err => reject(err));

    function fetchElm(libraryUri, isMain = false) {
      if (libraryUri in fetchedUris) return;
      // let libraryUrl = fhirUriPrefix+encodeURIComponent(libraryUri);
      // if (!fhirResources) {
      //   libraryUrl = filepath + "/" + stripFilenameFromURI(libraryUri) + ".json";
      // }
      var libraryUrl = Config.questionnaire_fhir_url + "/" + libraryUri;

      pendingFetches += 1;
      fetch(libraryUrl, {
        method: "GET",
        headers: {
          'Content-Type': 'application/fhir+json',
          "Cache-Control": "no-cache,no-store"
        }
      }).then(handleFetchErrors).then(r => r.json())
        .then(libraryResource => {
          fetchedUris.add(libraryUri);
          fetchRelatedElms(libraryResource);
          fetchElmFile(libraryResource, isMain);
          fetchDataRequirements(libraryResource);
          consoleLog("fetched related libraries Library/" + libraryResource.id, "infoClass");
          pendingFetches -= 1;
          resolveIfDone();
        })
        .catch(err => reject(err));
    }

    function fetchDataRequirements(libraryResource) {
      if (libraryResource.dataRequirement == null) return
      console.log("In data requirement--",libraryResource.dataRequirement);
      retVal.dataRequirement = libraryResource.dataRequirement
    }

    function fetchRelatedElms(libraryResource) {
      if (libraryResource.relatedArtifact == null) return
      const libUris = libraryResource.relatedArtifact.filter(a => a.type == "depends-on").map(a => a.resource);
      libUris.forEach(libUri => fetchElm(libUri));
    }

    function fetchElmFile(libraryResource, isMain) {
      try {
        const elmData = libraryResource.content.filter(c => c.contentType == "application/elm+json")[0].data;
        const elm = atob(elmData);
        if (isMain) retVal.mainLibraryElm = JSON.parse(elm);
        else retVal.dependentElms.push(JSON.parse(elm));
      } catch (err) {
        consoleLog("failed to get Library/"+libraryResource.id, "errorClass");
        reject("Failure when fetching resource.");
      }
      // if (elmUri in fetchedUris) return;
      // let elmUrl = fhirUriPrefix+encodeURIComponent(elmUri);
      // if (!fhirResources) {
      //   elmUrl = filepath + "/" + stripFilenameFromURI(elmUri);
      // }
      // pendingFetches += 1;
      // fetch(elmUrl).then(handleFetchErrors).then(r => r.json())
      // .then(elm => {
      //   pendingFetches -= 1;
      //   fetchedUris.add(elmUri);
      //   if (isMain) retVal.mainLibraryElm = elm;
      //   else retVal.dependentElms.push(elm);
      //   resolveIfDone();
      // })
      // .catch(err => reject(err));
    }
  });
}

function stripFilenameFromURI(uri) {
  console.log("stripFilenameFromURI (for fetching): " + uri);
  return uri.substr(uri.lastIndexOf(":") + 1);
}

export default fetchArtifacts;