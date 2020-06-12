import { getResourceFromBundle, randomString, randomNumber, convertDate, fetchFhirResource } from '../../util/util.js';
var careTeamRole = ""
function searchParticipantType(participants, type) {
    participants.map((participant) => {
        if (participant.hasOwnProperty("type") && participant.type.length > 0) {
            if (participant.type[0].hasOwnProperty("coding") && participant.type[0].coding.length > 0) {
                participant.type[0].coding.map((participant_type) => {
                    if (participant_type.system === "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"
                        && participant_type.code === type) {
                        return participant.individual
                    }
                })
            }
        }
    });
    return false;
}
function getCareTeamPractitioner(encounter) {
    let encounter_participant = encounter.participant;
    console.log("encounter--", encounter_participant);
    if (encounter_participant.length > 0) {
        encounter_participant.sort(function (a, b) {
            if (b.hasOwnProperty("period") && a.hasOwnProperty("period")) {
                return new Date(b.period.start) - new Date(a.period.start)
            }
        })
        let careTeamPractitioner = searchParticipantType(encounter_participant, "PPRF")
        if (careTeamPractitioner) {
            careTeamRole = "primary";
            return careTeamPractitioner
        } else {
            careTeamPractitioner = searchParticipantType(encounter_participant, "ATND")
            if (careTeamPractitioner) {
                careTeamRole = "assist";
                return careTeamPractitioner
            } else {
                careTeamPractitioner = searchParticipantType(encounter_participant, "ADM")
                if (careTeamPractitioner) {
                    careTeamRole = "assist";
                    return careTeamPractitioner
                } else {
                    careTeamPractitioner = searchParticipantType(encounter_participant, "SPRF")
                    if (careTeamPractitioner) {
                        careTeamRole = "assist";
                        return careTeamPractitioner
                    } else {
                        careTeamRole = "other";
                        return encounter_participant[0].individual
                    }
                }
            }
        }
    }
    return false;
}

var paBundle = {
    resourceType: "Bundle",
    type: "collection",
    identifier:
    {
        "system": "http://identifiers.mettles.com",
        "value": randomString()
    },
    entry: []
};
const priorAuthClaim = {
    resourceType: "Claim",
    id: randomNumber(),
    identifier: [{
        "system": "http://identifiers.mettles.com/prior_auth",
        "value": randomNumber(10)
    }],
    status: "active",
    use: "preauthorization",
    type: {
        coding: [{
            system: "http://terminology.hl7.org/CodeSystem/claim-type",
            code: "professional",
            display: "Professional"
        }]
    },
    patient: {},
    created: convertDate(Date.now(), "isoDateTime"),
    provider: {},
    enterer: {},
    insurer: {},
    facility: {},
    priority: { coding: [{ "code": "normal" }] },
    supportingInfo: [],
    item: [],
    careTeam: [],
    diagnosis: [],
    procedure: [],
}
function makeReference(bundle, resourceType) {
    var entry = bundle.entry.find(function (entry) {
        if (entry.resource !== undefined) {
            return (entry.resource.resourceType === resourceType);
        }
    });
    if (entry.resource.hasOwnProperty("id")) {
        return resourceType + "/" + entry.resource.id;
    }
    return null
}
function addBundleEntry(bundle, url, resource) {
    if (resource.hasOwnProperty("id"), resource.hasOwnProperty("resourceType")) {
        bundle.entry.push({
            fullUrl: url + "/" + resource.resourceType + "/" + resource.id,
            resource: resource
        })
        return bundle
    }
    return false
}
function prepareClaimBundle(serviceUri, questionnaireResponse, resourceBundle, request, additionalDocuments, referenceDocs) {
    return new Promise(function (resolve, reject) {
        try {
            console.log("In prepare method ", priorAuthClaim, paBundle);

            //Add Claim
            paBundle = addBundleEntry(paBundle, serviceUri, priorAuthClaim)
            if (!paBundle) {
                reject("Invalid Claim!!")
            }
            //Add Beneficiary Patient
            let patient = getResourceFromBundle(resourceBundle, "Patient")
            priorAuthClaim.patient = {
                reference: "Patient/" + patient.id
            }
            paBundle = addBundleEntry(paBundle, serviceUri, patient)
            if (!paBundle) {
                reject("Invalid Patient !!")
            }

            //Add Provider
            if (request.hasOwnProperty("requester")) {
                if (request.requester.hasOwnProperty("reference")) {
                    var requesterRef = request.requester.reference;
                    if (requesterRef.split("/")[0] === "Organization") {
                        fetchFhirResource(serviceUri, requesterRef, {}, sessionStorage.getItem("token")).then((res) => {
                            if (res.resourceType !== "OperationOutcome") {
                                priorAuthClaim.provider = {
                                    reference: requesterRef
                                }
                                paBundle = addBundleEntry(paBundle, serviceUri, res)
                                if (!paBundle) {
                                    reject("Invalid Requester !!")
                                }
                            } else {
                                reject("Invalid requester !! Fetch failed !!")
                            }
                        }).catch(() => {
                            reject("Invalid requester !! Fetch failed !!")
                        })
                    } else {
                        reject("Invalid Requester !!")
                    }
                }
            } else {
                reject("Requester info missing in request !!")
            }

            //Add Enterer
            if (request.hasOwnProperty("performer")) {
                if (request.performer.hasOwnProperty("reference")) {
                    var performerRef = request.performer.reference;
                    if (performerRef.split("/")[0] === "PractitionerRole" || performerRef.split("/")[0] === "Practitioner") {
                        fetchFhirResource(serviceUri, performerRef, {}, sessionStorage.getItem("token")).then((res) => {
                            if (res.resourceType !== "OperationOutcome") {
                                priorAuthClaim.enterer = {
                                    reference: performerRef
                                }
                                paBundle = addBundleEntry(paBundle, serviceUri, res)
                                if (!paBundle) {
                                    reject("Invalid performer !!")
                                }
                            } else {
                                reject("Invalid performer !! Fetch failed !!")
                            }
                        }).catch(() => {
                            reject("Invalid performer !! Fetch failed !!")
                        })
                    } else {
                        reject("Invalid performer !!")
                    }
                }
            } else {
                reject("Performer info missing in request !!")
            }

            //Add insurer
            if (request.hasOwnProperty("insurance")) {
                if (request.insurance.hasOwnProperty("reference")) {
                    var coverageRef = request.insurance[0].reference
                    if (coverageRef.split("/")[0] === "Coverage") {
                        fetchFhirResource(serviceUri, coverageRef, {}, sessionStorage.getItem("token")).then((res) => {
                            if (res.resourceType !== "OperationOutcome") {
                                if (res.hasOwnProperty("payor")) {
                                    let payorRef = res.payor.map((p) => {
                                        if (p.reference.split("/")[0] === "Organization") {
                                            return p.reference
                                        }
                                    })
                                    fetchFhirResource(serviceUri, payorRef, {}, sessionStorage.getItem("token")).then((org_res) => {
                                        if (res.resourceType !== "OperationOutcome") {
                                            priorAuthClaim.insurer = {
                                                reference: payorRef
                                            }
                                            paBundle = addBundleEntry(paBundle, serviceUri, org_res)
                                            if (!paBundle) {
                                                reject("Invalid payor organization !!")
                                            }
                                        } else {
                                            reject("Invalid payor !! Fetch failed !!")
                                        }
                                    }).catch(() => {
                                        reject("Invalid payor !! Fetch failed !!")
                                    })

                                } else {
                                    reject("Payor info missing in coverage !!")
                                }
                            } else {
                                reject("Invalid coverage !! Fetch failed !!")
                            }
                        }).catch(() => {
                            reject("Invalid coverage !! Fetch failed !!")
                        })
                    } else {
                        reject("Invalid coverage !!")
                    }
                } else {
                    reject("Invalid insurance !!")
                }
            } else {
                reject("Insurance information missing in request")
            }

            //Add Care Team
            try {
                var providerRef = getCareTeamPractitioner(getResourceFromBundle(resourceBundle, "Encounter"))
                if (providerRef) {
                    let practitioner = getResourceFromBundle(resourceBundle, "Practitioner", providerRef.split("/")[1])
                    priorAuthClaim.careTeam.push({
                        sequence: 1,
                        provider: providerRef,
                        role: {
                            coding: [
                                {
                                    system: "http://terminology.hl7.org/CodeSystem/claimcareteamrole",
                                    code: self.state.careTeamRole
                                }
                            ]
                        }
                    })
                    paBundle = addBundleEntry(paBundle, serviceUri, practitioner)
                    if (!paBundle) {
                        reject("Invalid CareTeam Practitioner !!")
                    }
                } else {
                    reject("Missing Participant info in encounter !!")
                }
            } catch (error) {
                reject("Missing Participant info in encounter !!")
            }


            let service = {
                sequence: 1,
                procedureSequence: [],
                diagnosisSequence: [],
                careTeamSequence: [1],
                locationCodeableConcept: {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                            "code": "PTRES",
                            "display": "Patient's Residence"
                        }
                    ]
                }
            };
            console.log("servicerequest-----------", request);
            if (request.hasOwnProperty("resourceType") &&
                request.resourceType === "ServiceRequest" &&
                request.hasOwnProperty("code")) {
                service["productOrService"] = request.code;
                if (request.hasOwnProperty("quantityQuantity")) {
                    service["quantity"] = {
                        "value": request.quantityQuantity.value
                    };
                }
                if (request.hasOwnProperty("category")) {
                    service["category"] = request.category[0];
                }
                priorAuthClaim["referral"] = { reference: makeReference(resourceBundle, "ServiceRequest") }
            }
            if (request.hasOwnProperty("resourceType") &&
                request.resourceType === "DeviceRequest" &&
                request.hasOwnProperty("codeCodeableConcept")) {
                service["productOrService"] = request.codeCodeableConcept;
                if (request.hasOwnProperty("parameter") &&
                    request.parameter.length > 0) {
                    service["quantity"] = {
                        "value": request.parameter[0].valueQuantity.value
                    };
                    service["category"] = request.parameter[0].code;
                }
                priorAuthClaim["prescription"] = { reference: makeReference(resourceBundle, "DeviceRequest") }
            }
            console.log("service----------", service);
            priorAuthClaim.item.push(service);

            var sequence = 1;
            resourceBundle.entry.forEach(function (entry, index) {
                if (entry.resource !== undefined) {
                    if (entry.resource.resourceType == "Condition") {
                        priorAuthClaim.diagnosis.push({
                            sequence: sequence,
                            diagnosisReference: { reference: "Condition/" + entry.resource.id }
                        });
                        priorAuthClaim.item[0].diagnosisSequence.push(sequence);
                        sequence++;
                    }

                }
            })

            var psequence = 1;
            resourceBundle.entry.forEach(function (entry, index) {
                if (entry.resource !== undefined) {
                    if (entry.resource.resourceType == "Procedure") {
                        priorAuthClaim.procedure.push({
                            sequence: psequence,
                            procedureReference: { reference: "Procedure/" + entry.resource.id }
                        });
                        priorAuthClaim.item[0].procedureSequence.push(psequence);
                        psequence++;
                    }

                }
            })
            // console.log(priorAuthClaim, 'HEREEE', tokenUri);
            console.log(JSON.stringify(priorAuthClaim));
            if (sessionStorage.hasOwnProperty("docResources")) {
                if (sessionStorage["docResources"]) {
                    JSON.parse(sessionStorage["docResources"]).forEach((doc) => {
                        resourceBundle.entry.push({ "resource": doc })
                    })
                }
            }
            resourceBundle.entry.unshift({ resource: priorAuthClaim })

            // Add documents in claim
            if (Object.keys(additionalDocuments).length > 0) {
                if (additionalDocuments.hasOwnProperty("content") && additionalDocuments.content.length > 0) {
                    resourceBundle.entry.push({ resource: additionalDocuments })
                }
            }
            console.log("reference  docs---", referenceDocs);
            // Add referenced Docs in claim
            if (referenceDocs.length > 0) {
                referenceDocs.map((doc) => {
                    if (doc.hasOwnProperty("content") && doc.content.length > 0) {
                        resourceBundle.entry.push({ resource: doc })
                    }
                })
            }
            resolve(paBundle)
        } catch (error) {
            reject(error);
        }
    });
}

export default prepareClaimBundle
