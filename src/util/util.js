var jwtDecode = require('jwt-decode');

// to get FHIR properties of the form answer{whatever}
function findValueByPrefix(object, prefix) {
    for (var property in object) {
        if (object.hasOwnProperty(property) &&
            property.toString().startsWith(prefix)) {
            return object[property];
        }
    }
}

function getListOfChoices(props, setChoice) {
    // parse out the list of choices from 'option'
    let returnAnswer = null;
    const answerOptionsReference = (props.item.options || {}).reference
    if (typeof answerOptionsReference === "string") {
        // answerValueSet
        if (answerOptionsReference.startsWith("#")) {
            // contained resource reference
            const resource = props.containedResources[answerOptionsReference.substr(1, answerOptionsReference.length)];
            const values = resource.compose.include;
            values.forEach((element) => {
                element.concept.forEach((concept) => {
                    const pair = {
                        "code": concept.code,
                        "display": concept.display,
                    }
                    setChoice(pair);
                });
            })
        }

    } else {
        const answerOption = props.item.option // in r4 this is item.answerOption, but we support stu3 only
        // list of answerOption options
        answerOption.forEach((concept) => {
            // TODO: The value could be a code/date/time/reference, need to account for that.
            const value = findValueByPrefix(concept, "value");
            const pair = {
            };
            // "code": value.code,
            // "display": value.display,
            // "system": value.system,
            // "version": value.version,
            Object.keys(value).forEach((e) => {
                pair[e] = value[e]
            });

            if (pair.display === undefined && pair.code) {
                pair.display = pair.code;
            }
            setChoice(pair);

            returnAnswer = concept.initialSelected ? pair : returnAnswer;
        });
    }
    return returnAnswer;
}

function hasTokenExpired() {
    const token = sessionStorage.getItem("token");
    if (sessionStorage.getItem("serviceUri").search('mettles.com') > 0) {
        return false;
    }
    console.log("in token expired---", jwtDecode(token).exp, "<", Date.now() / 1000)
    try {
        if (jwtDecode(token).exp < Date.now() / 1000) {
            sessionStorage.clear();
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};
function getResourceFromBundle(bundle, resourceType, id = false) {
    var filtered_entry = bundle.entry.find(function (entry) {
        if (entry.resource !== undefined) {
            if (id !== false) {
                return entry.resource.id === id;
            }
            return entry.resource.resourceType === resourceType;
        }
    });
    if (filtered_entry !== undefined) {
        return filtered_entry.resource;
    }
    return null
}
function getDocumentReferences() {
    const Http = new XMLHttpRequest();
    let url = sessionStorage.getItem("serviceUri") + "/DocumentReference?patient=" + sessionStorage.getItem('auth_patient_id');
    Http.open("GET", url);
    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Accept", "application/json");
    Http.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem("token"));
    Http.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
            let references = [];
            console.log("Doc reference ---", JSON.parse(this.responseText));
            let response = JSON.parse(this.responseText);
            if (response.hasOwnProperty("total") && response.total > 0) {
                response.entry.map((doc) => {
                    references.push({ key: doc.id, text: doc.id, value: doc.id });
                })
                return references;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    Http.send();
}
async function postResource(url, resource_type, body, token = '') {
    if (resource_type !== '') {
        url = url + "/" + resource_type;
    }
    let headers = {
        "Content-Type": "application/json",
    }
    if (token !== '') {
        headers['Authorization'] = token;
    }
    let resources = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    }).then(response => {
        return response.json();
    }).then((response) => {
        return response;
    }).catch(reason => {
        return false;
    });
    return resources;
}
async function fetchFhirResource(url, resource_type, query, token = '') {
    let connector = "?";
    if (resource_type !== '') {
        url = url + "/" + resource_type;
    }
    console.log("query----", query);
    let i = 0;
    Object.keys(query).map(key => {
        if (query[key].length > 0) {
            console.log("In each query--", key, query[key]);
            if (i > 0) {
                connector = "&"
            }
            url += connector + "" + key + "=" + query[key];
            i++;
        }
    })
    let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json+fhir',
        'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'en-US,en;q=0.8'
    }
    if (token !== '') {
        headers['Authorization'] = token;
    }
    let resources = await fetch(url, {
        method: "GET",
        headers: headers
    }).then(response => {
        return response.json();
    }).then((response) => {
        return response;
    }).catch(reason => {
        return false;
    });
    return resources;
}
function randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ-";
    var string_length = 8;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring
}

var dateFormat = require('dateformat');

function convertDate(date, format = "mm/dd/yyyy") {
    if (date !== "") {
        return dateFormat(date, format);
    } else {
        return false;
    }
}
export {
    findValueByPrefix,
    getListOfChoices,
    hasTokenExpired,
    getDocumentReferences,
    getResourceFromBundle,
    fetchFhirResource,
    randomString,
    postResource,
    convertDate
}