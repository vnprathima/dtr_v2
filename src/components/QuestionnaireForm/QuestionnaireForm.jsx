import React, { Component } from 'react';
import { findValueByPrefix, postResource, randomString, convertDate, getResourceFromBundle, fetchFhirResource } from '../../util/util.js';
import UiFactory from "../../ui/UiFactory.js";
import globalConfig from '../../globalConfiguration.json';


const tokenUri = "https://auth.mettles.com/auth/realms/ProviderCredentials/protocol/openid-connect/token";
export default class QuestionnaireForm extends Component {
    constructor(props) {
        super(props);
        if (!sessionStorage.hasOwnProperty("providerSource")) {
            sessionStorage["providerSource"] = 1
        }
        this.ui = new UiFactory().getUi();
        this.state = {
            containedResources: null,
            patientId: sessionStorage.getItem('auth_patient_id') !== undefined ? sessionStorage.getItem('auth_patient_id') : '',
            items: null,
            itemTypes: {},
            values: {},
            orderedLinks: [],
            sectionLinks: {},
            fullView: true,
            turnOffValues: [],
            files: [],
            communicationJson: {},
            displayQuestionnaire: true,
            claimResponse: {},
            claimResponseBundle: {},
            claimMessage: "",
            otherProvider: false,
            otherProviderName: "",
            providerQueries: [],
            communicationRequestId: '',
            providerSource: sessionStorage["providerSource"],
            loading: false,
            resloading: false,
            showBundle: false,
            priorAuthBundle: {},
            showPreview: false,
            previewloading: false,
            documentReference: {},
            saved: false,
            validationError: "",
            validated: true,
            showError: false,
            errorType: '',
            referenceDocs: [],
            order_pa: (sessionStorage.getItem('order_pa') !== undefined && sessionStorage.getItem('order_pa') !== null) ? sessionStorage.getItem('order_pa') : 'PA',
            orderTo: '',
            careTeamRole: 'primary',
            priorAuthUrl:''
        };

        this.updateQuestionValue = this.updateQuestionValue.bind(this);
        this.updateNestedQuestionValue = this.updateNestedQuestionValue.bind(this);
        this.updateDocuments = this.updateDocuments.bind(this);
        this.renderComponent = this.renderComponent.bind(this);
        this.retrieveValue = this.retrieveValue.bind(this);
        this.outputResponse = this.outputResponse.bind(this);
        this.previewBundle = this.previewBundle.bind(this);
        this.generateBundle = this.generateBundle.bind(this);
        this.reloadClaimResponse = this.reloadClaimResponse.bind(this);
        this.renderQueries = this.renderQueries.bind(this);
        this.submitCommunication = this.submitCommunication.bind(this);
        this.submitPA = this.submitPA.bind(this);
        this.relaunch = this.relaunch.bind(this);
        this.handleShowBundle = this.handleShowBundle.bind(this);
        this.saveQuestionnaireData = this.saveQuestionnaireData.bind(this);
        this.createSubmittedRequest = this.createSubmittedRequest.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getCareTeamPractitioner = this.getCareTeamPractitioner.bind(this);
        this.searchParticipantType = this.searchParticipantType.bind(this);
        this.getCodesString = this.getCodesString.bind(this);
        this.fetchClaimEndPoint = this.fetchClaimEndPoint.bind(this);
    }

    relaunch() {
        let serviceUri = sessionStorage["serviceUri"]
        let launchContextId = sessionStorage["launchContextId"]
        let launchUri = sessionStorage["launchUri"]
        console.log(launchUri + "?launch=" + launchContextId + "&iss=" + serviceUri);
        window.location.href = launchUri + "?launch=" + launchContextId + "&iss=" + serviceUri;
        // this.props.history.push();
    }
    async componentWillMount() {
        // setup
        // get all contained resources
        if (this.props.qform.contained) {
            this.distributeContained(this.props.qform.contained)
        }
        const items = this.props.qform.item;
        this.setState({ items });
        const links = await this.prepopulate(items, []);
        this.setState({ orderedLinks: links });
        // console.log(this.state.orderedLinks, "links--", links);
        if (this.state.turnOffValues.length === 0) {
            const returnArray = [];
            links.forEach((e) => {
                if (this.isNotEmpty(this.state.values[e]) && this.state.itemTypes[e] && this.state.itemTypes[e].enabled) {
                    returnArray.push(e);
                }
            });
            this.setState({ turnOffValues: returnArray });
        } else {
            this.setState({ turnOffValues: [] });
        }
        // console.log(this.state.turnOffValues);
        // this.getProviderQueries(items);
    }

    handleShowBundle() {
        var showBundle = this.state.showBundle;
        this.setState({ showBundle: !showBundle });
    }


    componentDidMount() {
        this.getCodesString();
    }

    handleChange(e, { name, value }) {
        this.setState({ [name]: value })
        sessionStorage.setItem("order_pa", value);
    }

    updateStateElement = (elementName, text) => {
        this.setState({ [elementName]: text });
    }
    reloadClaimResponse() {
        var self = this
        this.setState({ resloading: true });
        const Http = new XMLHttpRequest();
        // const priorAuthUrl = "http://cmsfhir.mettles.com:8080/drfp/fhir/ClaimResponse/" + this.state.claimResponse.id;
        const priorAuthUrl = this.state.priorAuthUrl+"/ClaimResponse/" + this.state.claimResponse.id;
        Http.open("GET", priorAuthUrl);
        Http.setRequestHeader("Content-Type", "application/fhir+json");
        Http.send();
        Http.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                var message = "";
                self.setState({ displayQuestionnaire: false })
                if (this.status === 200) {
                    var claimResponse = JSON.parse(this.responseText);
                    self.setState({ claimResponse: claimResponse })
                    self.setState({ claimMessage: "Prior Authorization has been submitted successfully" })
                    message = "Prior Authorization " + claimResponse.disposition + "\n";
                    message += "Prior Authorization Number: " + claimResponse.preAuthRef;
                } else {
                    this.setState({ "claimMessage": "Prior Authorization Request Failed." })
                    message = "Prior Authorization Request Failed."
                }
                self.setState({ resloading: false });
                console.log(message);
                //alert(message);
                console.log(this.responseText);
            }
        }



    }

    evaluateOperator(operator, questionValue, answerValue) {

        switch (operator) {
            case "exists":
                return (answerValue) === (questionValue !== undefined);
            case "=":
                return questionValue === answerValue;
            case "!=":
                return questionValue !== answerValue;
            case "<":
                return questionValue < answerValue;
            case ">":
                return questionValue > answerValue;
            case "<=":
                return questionValue <= answerValue;
            case ">=":
                return questionValue >= answerValue;
            default:
                return questionValue === answerValue;
        }
    }

    retrieveValue(elementName) {
        // console.log("elementname--", elementName, this.state.values[elementName]);
        return this.state.values[elementName];
    }

    updateQuestionValue(elementName, object, type) {
        // callback function for children to update
        // parent state containing the linkIds
        this.setState(prevState => ({
            [type]: {
                ...prevState[type],
                [elementName]: object
            }
        }))
        // console.log("elemne,value--", elementName, object, type);
    }

    updateNestedQuestionValue(linkId, elementName, object) {
        this.setState(prevState => ({
            values: {
                ...prevState.values,
                [linkId]: {
                    ...prevState.values[linkId],
                    [elementName]: object
                }
            }
        }))
    }

    updateDocuments(elementName, object) {
        console.log(elementName, object, 'is it workinggg document')
        this.setState({ [elementName]: object })

        if (this.state.files != null) {
            var fileInputData = {
                "resourceType": "DocumentReference",
                "id": randomString(),
                "status": "current",
                "content": [],
            }
            for (var i = 0; i < this.state.files.length; i++) {
                (function (file) {
                    let content_type = file.type;
                    let file_name = file.name;
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        // get file content  
                        fileInputData.content.push({
                            "attachment": {
                                "data": reader.result,
                                "contentType": content_type,
                                "title": file_name,
                                "language": "en"
                            }
                        })
                    }
                    reader.readAsBinaryString(file);
                })(this.state.files[i])
            }
            console.log("Document JSon--", fileInputData);
            // this.props.saveDocuments(this.props.files,fileInputData)
            this.setState({ documentReference: fileInputData })
        }

    }

    distributeContained(contained) {
        // make a key:value map for the contained
        // resources with their id so they can be 
        // referenced by #{id}
        const containedResources = {};
        contained.forEach((resource) => {
            containedResources[resource.id] = resource;
        });
        this.setState({ containedResources })
    }

    checkEnable(item) {
        if (item.hasOwnProperty("enableWhen")) {
            const enableCriteria = item.enableWhen;
            const results = [];
            // false if we need all behaviorType to be "all"
            const checkAny = enableCriteria.length > 1 ? item.enableBehavior === 'any' : false
            enableCriteria.forEach((rule) => {
                const question = this.state.values[rule.question]
                // console.log("type of ques---", typeof question);
                const answer = findValueByPrefix(rule, "answer");
                if (typeof question === 'object' && typeof answer === 'object') {
                    if (rule.answerQuantity) {
                        console.log("in answerquantity---", rule, question, answer);
                        // at the very least the unit and value need to be the same
                        results.push(this.evaluateOperator(rule.operator, question.value, answer.value.toString())
                            && this.evaluateOperator(rule.operator, question.unit, answer.unit));
                    } else if (rule.answerCoding) {
                        let result = false;
                        if (Array.isArray(question)) {
                            question.forEach((e) => {
                                result = result || (e.code === answer.code && e.system === answer.system);
                            })
                        }
                        results.push(result);
                    }
                } else if (typeof question === "boolean") {
                    if (rule.answerBoolean) {
                        results.push(this.evaluateOperator(rule.operator, question, answer));
                    }
                } else {
                    results.push(this.evaluateOperator(rule.operator, question, answer));
                }
            });
            return checkAny ? results.some((i) => { return i }) : results.every((i) => { return i });
        } else {
            // default to showing the item
            return true;
        }
    }

    prepopulate(items, links) {
        items.map((item) => {
            if (item.item) {
                // its a section/group
                links.push(item.linkId);
                this.prepopulate(item.item, links);
            } else {
                // autofill fields
                links.push(item.linkId);
                if (item.enableWhen) {
                    // console.log(item.enableWhen);
                }
                if (item.extension) {
                    item.extension.forEach((e) => {
                        if (e.url === "http://hl7.org/fhir/StructureDefinition/cqif-calculatedValue") {
                            // stu3 
                            const value = findValueByPrefix(e, "value");
                            // console.log("In prepopulate---",this.props.cqlPrepoulationResults);
                            if (this.props.cqlPrepoulationResults) {
                                this.updateQuestionValue(item.linkId, this.props.cqlPrepoulationResults[value], 'values')
                            }
                        }
                    })
                }
            }
        })
        return links;
    }

    isNotEmpty(value) {
        return (value !== undefined && value !== null && value !== "" && (Array.isArray(value) ? value.length > 0 : true));
    }

    renderQueries(item, key) {
        return (<div>
            <div key={key} style={{ padding: "15px", paddingBottom: "0px" }}>
                <label>
                    <input type="checkbox" name={item.id} value={this.state.providerQueries[key].checked}
                        onChange={this.onChangeProviderQuery} />
                </label>

                <span style={{ lineHeight: "0.1px" }}>{item.name} &nbsp; {item.type === "attachment" &&
                    <span>
                        (LONIC Code - {item.code.coding[0].code})
                        </span>
                }{item.type === "query" && item.code !== "" &&
                    <span>
                        (With Query - {item.code})
                    </span>
                    }
                </span>
            </div>
        </div>
        )
    }


    renderComponent(item, level) {
        const enable = this.checkEnable(item);
        if (enable && (this.state.turnOffValues.indexOf(item.linkId) < 0)) {
            // item.type="open-choice"
            // console.log("--------------------",item.type,item)
            switch (item.type) {
                case "group":
                    return this.ui.getSection(item.linkId, this.renderComponent, this.updateQuestionValue,
                        item, level)
                case "string":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "text", "string", "valueString");

                case "text":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "textArea", "text", "valueString");

                case "choice":
                    return this.ui.getChoiceInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, this.state.containedResources, "valueCoding");

                case "boolean":
                    return this.ui.getBooleanInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "valueBoolean");

                case "decimal":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "number", "decimal", "valueDecimal");

                case "url":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "url", "url", "valueUri");

                case "date":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "date", "date", "valueDate");

                case "time":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "time", "time", "valueTime");

                case "dateTime":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "datetime-local", "datetime", "valueDateTime");

                case "attachment":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "file", "attachment", "valueAttachment");

                case "integer":
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "number", "valueInteger", "integer");

                case "quantity":
                    return this.ui.getQuantityInput(item.linkId, item, this.updateNestedQuestionValue,
                        this.updateQuestionValue, this.retrieveValue, "quantity", "valueQuantity");

                case "open-choice":
                    return this.ui.getOpenChoice(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, this.state.containedResources, ["valueCoding", "valueString"]);

                case "reference":
                    console.log("in reference", item);
                    return this.ui.getReferences(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "valueReference");

                default:
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "text", "string", "valueString");

            }
        }
    }

    searchParticipantType(participants, type) {
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
    getCareTeamPractitioner(encounter) {
        let encounter_participant = encounter.participant;
        console.log("encounter--", encounter_participant);
        if (encounter_participant.length > 0) {
            encounter_participant.sort(function (a, b) {
                if (b.hasOwnProperty("period") && a.hasOwnProperty("period")) {
                    return new Date(b.period.start) - new Date(a.period.start)
                }
            })
            let careTeamPractitioner = this.searchParticipantType(encounter_participant, "PPRF")
            if (careTeamPractitioner) {
                this.setState({ careTeamRole: "primary" });
                return careTeamPractitioner
            } else {
                careTeamPractitioner = this.searchParticipantType(encounter_participant, "ATND")
                if (careTeamPractitioner) {
                    this.setState({ careTeamRole: "assist" });
                    return careTeamPractitioner
                } else {
                    careTeamPractitioner = this.searchParticipantType(encounter_participant, "ADM")
                    if (careTeamPractitioner) {
                        this.setState({ careTeamRole: "assist" });
                        return careTeamPractitioner
                    } else {
                        careTeamPractitioner = this.searchParticipantType(encounter_participant, "SPRF")
                        if (careTeamPractitioner) {
                            this.setState({ careTeamRole: "assist" });
                            return careTeamPractitioner
                        } else {
                            this.setState({ careTeamRole: "other" });
                            return encounter_participant[0].individual
                        }
                    }
                }
            }
        }
        return false;
    }

    generateBundle() {
        var self = this;
        return new Promise(function (resolve, reject) {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            const yyyy = today.getFullYear();
            const authored = `${yyyy}-${mm}-${dd}`
            const response = {
                resourceType: "QuestionnaireResponse",
                id: "response1",
                authored: authored,
                status: "completed", //TODO: Get status from somewhere
                item: []
            }

            let currentItem = response.item;
            let currentLevel = 0;
            let currentValues = [];
            const chain = { 0: { currentItem, currentValues } };
            self.state.orderedLinks.map((item) => {
                const itemType = self.state.itemTypes[item];

                if (Object.keys(self.state.sectionLinks).indexOf(item) >= 0) {
                    currentValues = currentValues.filter((e) => { return e !== item });
                    if (chain[currentLevel + 1]) {
                        chain[currentLevel + 1].currentValues = currentValues;
                    }
                    const section = self.state.sectionLinks[item];
                    currentValues = section.values;
                    // new section
                    currentItem = chain[section.level].currentItem
                    const newItem = {
                        "linkId": item,
                        "text": section.text,
                        item: []
                    };
                    currentItem.push(newItem);
                    currentItem = newItem.item;
                    currentLevel = section.level;

                    // filter out this section
                    chain[section.level + 1] = { currentItem, currentValues };
                } else {
                    // not a new section, so it's an item
                    if (currentValues.indexOf(item) < 0 && itemType && itemType.enabled) {
                        // item not in this section, drop a level
                        const tempLevel = currentLevel;

                        while (chain[currentLevel].currentValues.length === 0 && currentLevel > 0) {
                            // keep dropping levels until we find an unfinished section
                            currentLevel--;
                        }

                        // check off current item
                        chain[tempLevel].currentValues = currentValues.filter((e) => { return e !== item });

                        currentValues = chain[currentLevel].currentValues;
                        currentItem = chain[currentLevel].currentItem;
                    } else {
                        // item is in this section, check it off

                        currentValues = currentValues.filter((e) => { return e !== item });
                        chain[currentLevel + 1].currentValues = currentValues;
                    }
                }
                if (itemType && (itemType.enabled || self.state.turnOffValues.indexOf(item) >= 0)) {
                    const answerItem = {
                        "linkId": item,
                        "text": itemType.text,
                        "answer": []
                    }
                    switch (itemType.valueType) {
                        case "valueAttachment":
                            console.log("In attachment", self.state.values[item])
                            const attachment = self.state.values[item]
                            answerItem.answer.push({ [itemType.valueType]: attachment })
                            break;
                        case "valueQuantity":
                            const quantity = self.state.values[item];
                            if (quantity && quantity.comparator === "=") {
                                delete quantity.comparator;
                            }
                            answerItem.answer.push({ [itemType.valueType]: quantity })
                            break;
                        case "valueDateTime":
                        case "valueDate":
                            const date = self.state.values[item];
                            console.log("date---", date);
                            if (date != undefined) {
                                answerItem.answer.push({ [itemType.valueType]: date.toString() });
                            } else {
                                answerItem.answer.push({ [itemType.valueType]: "" });
                            }
                            break;
                        case "valueReference":
                            console.log("In reference", self.state.values[item])
                            const attac = self.state.values[item]
                            // This is a temporary fix as cerner is not allowing to read Document reference
                            let id = randomString();
                            let docRef = {
                                "resourceType": "DocumentReference",
                                "id": id,
                                "status": "current",
                                "content": [{ "attachment": attac }]
                            }
                            self.setState({ referenceDocs: [docRef] })
                            answerItem.answer.push({
                                [itemType.valueType]: {
                                    "reference": "DocumentReference/" + id
                                }
                            })
                            break;
                        default:
                            const answer = self.state.values[item];
                            if (Array.isArray(answer)) {
                                answer.forEach((e) => {
                                    // possible for an array to contain multiple types
                                    let finalType;
                                    if (e.valueTypeFinal) {
                                        finalType = e.valueTypeFinal;
                                        delete e.valueTypeFinal;
                                    } else {
                                        finalType = itemType.valueType;
                                    }
                                    answerItem.answer.push({ [finalType]: e });
                                })
                            } else {
                                answerItem.answer.push({ [itemType.valueType]: answer });
                            }
                    }
                    // FHIR fields are not allowed to be empty or null, so we must prune
                    if (self.isEmptyAnswer(answerItem.answer)) {
                        // console.log("Removing empty answer: ", answerItem);
                        delete answerItem.answer;
                    }
                    currentItem.push(answerItem);
                }
            });
            console.log(response);
            const priorAuthBundle = JSON.parse(JSON.stringify(self.props.bundle));
            priorAuthBundle.entry.unshift({ resource: response })

            const locationResource = {
                "resourceType": "Location",
                "id": "29955",
                "meta": {
                    "versionId": "1",
                    "lastUpdated": "2019-07-11T06:20:39.485+00:00",
                    "profile": [
                        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-location"
                    ]
                },
                "type": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
                                "code": "PTRES",
                                "display": "Patient's Residence"
                            }
                        ]
                    }
                ],
                "managingOrganization": {
                    "reference": sessionStorage.getItem("provider")
                },
                "name": "South Wing, second floor",
                "address": {
                    "line": [
                        "102 Heritage Dr."
                    ],
                    "city": "Somerset",
                    "state": "NJ",
                    "postalCode": "08873",
                    "country": "USA"
                }
            }
            priorAuthBundle.entry.unshift({ resource: locationResource })

            let careTeamProvider = ''
            try {
                careTeamProvider = self.getCareTeamPractitioner(getResourceFromBundle(priorAuthBundle, "Encounter"))
                if (!careTeamProvider) {
                    careTeamProvider = self.makeReference(priorAuthBundle, "Practitioner");
                }
            } catch (error) {
                console.log("Care Team Issue--", error);
                careTeamProvider = self.makeReference(priorAuthBundle, "Practitioner");
            }
            const priorAuthClaim = {
                resourceType: "Claim",
                status: "active",
                type: {
                    coding: [{
                        system: "http://terminology.hl7.org/CodeSystem/claim-type",
                        code: "professional",
                        display: "Professional"
                    }]
                },
                use: "preauthorization",
                patient: { reference: self.makeReference(priorAuthBundle, "Patient") },
                created: authored,
                provider: { reference: sessionStorage.getItem("provider") },
                enterer: { reference: self.makeReference(priorAuthBundle, "Practitioner") },
                insurer: { reference: sessionStorage.getItem("insurer") },
                facility: { reference: self.makeReference(priorAuthBundle, "Location") },
                priority: { coding: [{ "code": "normal" }] },
                supportingInfo: [{
                    sequence: 1,
                    category: {
                        coding: [
                            {
                                "system": "http://hl7.org/us/davinci-pas/CodeSystem/PASSupportingInfoType",
                                "code": "patientEvent"
                            }
                        ]
                    },
                    timingPeriod: {
                        start: "2019-01-05T00:00:00-07:00",
                        end: "2019-03-05T00:00:00-07:00"
                    }
                },
                {
                    sequence: 2,
                    category: {
                        coding: [{
                            system: "http://terminology.hl7.org/CodeSystem/claiminformationcategory",
                            code: "info",
                            display: "Information"
                        }]
                    },
                    valueReference: {
                        reference: self.makeReference(priorAuthBundle, "QuestionnaireResponse")
                    }
                }],
                item: [

                ],
                careTeam: [
                    {
                        sequence: 1,
                        provider: careTeamProvider,
                        extension: [
                            {
                                url: "http://terminology.hl7.org/ValueSet/v2-0912",
                                valueCode: "OP"
                            }
                        ],
                        role: {
                            coding: [
                                {
                                    system: "http://terminology.hl7.org/CodeSystem/claimcareteamrole",
                                    code: self.state.careTeamRole
                                }
                            ]
                        }
                    }
                ],
                diagnosis: [],
                procedure: [],
                insurance: [{
                    sequence: 1,
                    focal: true,
                    coverage: { reference: self.makeReference(priorAuthBundle, "Coverage") }
                }]
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
            console.log("servicerequest-----------", self.props.serviceRequest);
            if (self.props.serviceRequest.hasOwnProperty("resourceType") &&
                self.props.serviceRequest.resourceType === "ServiceRequest" &&
                self.props.serviceRequest.hasOwnProperty("code")) {
                service["productOrService"] = self.props.serviceRequest.code;
                if (self.props.serviceRequest.hasOwnProperty("quantityQuantity")) {
                    service["quantity"] = {
                        "value": self.props.serviceRequest.quantityQuantity.value
                    };
                }
                if (self.props.serviceRequest.hasOwnProperty("category")) {
                    service["category"] = self.props.serviceRequest.category[0];
                }
                priorAuthClaim["referral"] = { reference: self.makeReference(priorAuthBundle, "ServiceRequest") }
            }
            if (self.props.serviceRequest.hasOwnProperty("resourceType") &&
                self.props.serviceRequest.resourceType === "DeviceRequest" &&
                self.props.serviceRequest.hasOwnProperty("codeCodeableConcept")) {
                service["productOrService"] = self.props.serviceRequest.codeCodeableConcept;
                if (self.props.serviceRequest.hasOwnProperty("parameter") &&
                    self.props.serviceRequest.parameter.length > 0) {
                    service["quantity"] = {
                        "value": self.props.serviceRequest.parameter[0].valueQuantity.value
                    };
                    service["category"] = self.props.serviceRequest.parameter[0].code;
                }
                priorAuthClaim["presciption"] = { reference: self.makeReference(priorAuthBundle, "DeviceRequest") }
            }
            console.log("service----------", service);
            priorAuthClaim.item.push(service);

            var sequence = 1;
            priorAuthBundle.entry.forEach(function (entry, index) {
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
            priorAuthBundle.entry.forEach(function (entry, index) {
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
                        priorAuthBundle.entry.push({ "resource": doc })
                    })
                }
            }
            priorAuthBundle.entry.unshift({ resource: priorAuthClaim })

            // Add documents in claim
            if (Object.keys(self.state.documentReference).length > 0) {
                if (self.state.documentReference.hasOwnProperty("content") && self.state.documentReference.content.length > 0) {
                    priorAuthBundle.entry.push({ resource: self.state.documentReference })
                }
            }
            console.log("reference  docs---", self.state.referenceDocs);
            // Add referenced Docs in claim
            if (self.state.referenceDocs.length > 0) {
                self.state.referenceDocs.map((doc) => {
                    if (doc.hasOwnProperty("content") && doc.content.length > 0) {
                        priorAuthBundle.entry.push({ resource: doc })
                    }
                })
            }
            resolve(priorAuthBundle);
        });

    }
    previewBundle() {
        this.setState({ previewloading: true });
        this.generateBundle().then((priorAuthBundle) => {
            this.setState({ priorAuthBundle });
            console.log("Prior auth bundle---", JSON.stringify(this.state.priorAuthBundle));
            let showPreview = this.state.showPreview;
            this.setState({ showPreview: !showPreview });
            this.setState({ previewloading: false });
        });
    }
    validateQuestitionnarie() {
        var self = this;
        return new Promise(function (resolve, reject) {
            // console.log("Ordered links--", self.state.orderedLinks);
            // console.log("Section links--", self.state.sectionLinks);
            // console.log("Values--", self.state.values);
            // console.log("items--", self.state.items);
            self.state.items.map((section) => {
                section.item.map((item) => {
                    if (item.hasOwnProperty('required') && item.required) {
                        // console.log("In required true--", item.linkId);
                        if (!self.state.values.hasOwnProperty(item.linkId) || self.state.values[item.linkId] === "") {
                            console.log("In false condition--", item.linkId);
                            resolve(false);
                        }
                    }
                })
            })
            resolve(true);
        });
    }
    // create the questionnaire response based on the current state
    outputResponse(status) {
        this.validateQuestitionnarie().then((validated) => {
            console.log("Validated----", validated);
            this.setState({ validated: validated });
            if (validated || this.state.order_pa === 'Order') {
                this.setState({ loading: true });
                this.generateBundle().then((priorAuthBundle) => {
                    this.setState({ priorAuthBundle });
                    if (this.state.order_pa === "PA") {
                        this.submitPA(priorAuthBundle);
                    } else if (this.state.order_pa === "Order") {
                        this.submitCommunication(priorAuthBundle);
                    }
                }).catch((error) => {
                    console.log("unable to generate bundle", error);
                })
            } else {
                this.setState({ validationError: "Please fill all the required questions with (*) !!" });
            }
        });
    }

    fetchClaimEndPoint(priorAuthBundle) {
        if (sessionStorage.getItem("insurer") !== undefined) {
            var org_id = sessionStorage.getItem("insurer").split("/")[1];
            var payerOrganization = getResourceFromBundle(priorAuthBundle, "Organization", org_id);
            let patient = getResourceFromBundle(priorAuthBundle, "Patient")
            if (payerOrganization == null) {
                payerOrganization = {}
            }
            let payer_identifier = "";
            if (payerOrganization.hasOwnProperty("identifier")) {
                payer_identifier = payerOrganization.identifier[0].value
            }
            if (payerOrganization.hasOwnProperty("name") && payerOrganization.hasOwnProperty("id")) {
                let org_name = payerOrganization.name.toLowerCase();
                let org_id = payerOrganization.id;
                console.log("Payer identifier1 ", payerOrganization.id)
                if (org_name.includes("medicare") || org_id.includes("medicare")) {
                    payer_identifier = "c1a2e3bb-1fdd-3adf-3224-32ccc1a2e3bb"
                } else if (org_name.includes("united") || org_id.includes("united")) {
                    payer_identifier = "b1ddf812-1fdd-3adf-b1d5-32cc8bd07ebb"
                } else if (org_name.includes("cigna") || org_id.includes("cigna")) {
                    payer_identifier = "b123a232-3142-5412-32e4-42ec2d132c23"
                }
                if (patient != undefined) {
                    if (patient.hasOwnProperty("name")) {
                        if (patient.name[0].given[0] == "JOE") {
                            payer_identifier = "b123a232-3142-5412-32e4-42ec2d132c23"

                        }
                        else if (patient.name[0].given[0] == "RISKLD") {
                            payer_identifier = "b1ddf812-1fdd-3adf-b1d5-32cc8bd07ebb"
                        }
                    }
                }
            }
            if (payer_identifier === "" || payer_identifier === undefined || payer_identifier === null || payer_identifier === "unknown") {
                return false
            } else {
                // console.log("for search--",JSON.stringify({ "payer_identifier": payer_identifier }));
                let endpoint = postResource("http://localhost:4200/searchPayer", "", { "payer_identifier": payer_identifier }).then((payers) => {
                    if (payers) {
                        return payers[0].payer_end_point;
                    }
                    return false
                }).catch((err) => {
                    return false;
                })
                return endpoint;
            }
        }
        return false;
    }
    submitPA(priorAuthBundle) {
        /** creating cliam  */
        const Http = new XMLHttpRequest();
        var priorAuthUrl = "";
        this.fetchClaimEndPoint(priorAuthBundle).then((endpoint) => {
            if (endpoint) {
                console.log("In end point found--", endpoint);
                priorAuthUrl = endpoint+"/Claim/$submit";
            } else {
                endpoint = "https://sm.mettles.com/other_payerfhir/hapi-fhir-jpaserver/fhir";
                priorAuthUrl = "https://sm.mettles.com/other_payerfhir/hapi-fhir-jpaserver/fhir/Claim/$submit"
            }
            this.setState({priorAuthUrl})
            let self = this;
            console.log("claim final--", JSON.stringify(priorAuthBundle));
            Http.open("POST", priorAuthUrl);
            Http.setRequestHeader("Content-Type", "application/fhir+json");
            // Http.setRequestHeader("Authorization", "Bearer " + auth_response.access_token);
            // Http.send(JSON.stringify(pBundle));
            Http.send(JSON.stringify(priorAuthBundle));
            Http.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    var message = "";
                    self.setState({ displayQuestionnaire: false })
                    if (this.status === 200) {
                        var claimResponseBundle = JSON.parse(this.responseText);
                        var claimResponse = self.state.claimResponse;
                        if (claimResponseBundle.hasOwnProperty('entry')) {
                            claimResponseBundle.entry.forEach((res) => {
                                if (res.resource.resourceType === "ClaimResponse") {
                                    claimResponse = res.resource;
                                }
                            })
                        }
                        self.setState({ claimResponseBundle })
                        self.setState({ claimResponse })
                        console.log(self.state.claimResponseBundle, self.state.claimResponse);
                        self.setState({ claimMessage: "Prior Authorization has been submitted successfully" })
                        message = "Prior Authorization " + claimResponse.disposition + "\n";
                        message += "Prior Authorization Number: " + claimResponse.preAuthRef;
                        self.createSubmittedRequest(claimResponse,endpoint);
                    } else {
                        self.setState({ "claimMessage": "Prior Authorization Request Failed." })
                        message = "Prior Authorization Request Failed."
                    }
                    self.setState({ loading: false });
                    console.log(message);
                    console.log(this.responseText);
                }
            }
        })
    }
    // submitPA(priorAuthBundle) {
    //     /*creating token */
    //     const tokenPost = new XMLHttpRequest();
    //     var auth_response;
    //     var self = this;
    //     tokenPost.open("POST", tokenUri);
    //     tokenPost.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    //     var data = `client_id=app-login&grant_type=password&username=john&password=john123`
    //     tokenPost.send(data);
    //     tokenPost.onload = function () {
    //         if (tokenPost.status === 200) {
    //             try {
    //                 auth_response = JSON.parse(tokenPost.responseText);
    //                 console.log("auth res--1243-", auth_response);
    //             } catch (e) {
    //                 const errorMsg = "Failed to parse auth response";
    //                 document.body.innerText = errorMsg;
    //                 console.error(errorMsg);
    //                 return;
    //             }
    //             /** creating cliam  */
    //             const Http = new XMLHttpRequest();
    //             // const priorAuthUrl = "https://davinci-prior-auth.logicahealth.org/fhir/Claim/$submit";
    //             // const priorAuthUrl = "http://cmsfhir.mettles.com:8080/drfp/fhir/Claim/$submit";
    //             // const priorAuthUrl = "http://stdrfp.mettles.com:8080/drfp/fhir/Claim/$submit";
    //             var priorAuthUrl = "https://sm.mettles.com/payerfhir/hapi-fhir-jpaserver/fhir/Claim/$submit";
    //             if (self.props.hasOwnProperty("claimEndpoint") && self.props.claimEndpoint !== null) {
    //                 priorAuthUrl = self.props.claimEndpoint;
    //             }
    //             console.log("claim final--", JSON.stringify(priorAuthBundle));
    //             Http.open("POST", priorAuthUrl);
    //             Http.setRequestHeader("Content-Type", "application/fhir+json");
    //             // Http.setRequestHeader("Authorization", "Bearer " + auth_response.access_token);
    //             // Http.send(JSON.stringify(pBundle));
    //             Http.send(JSON.stringify(priorAuthBundle));
    //             Http.onreadystatechange = function () {
    //                 if (this.readyState === XMLHttpRequest.DONE) {
    //                     var message = "";
    //                     self.setState({ displayQuestionnaire: false })
    //                     if (this.status === 200) {
    //                         var claimResponseBundle = JSON.parse(this.responseText);
    //                         var claimResponse = self.state.claimResponse;
    //                         if (claimResponseBundle.hasOwnProperty('entry')) {
    //                             claimResponseBundle.entry.forEach((res) => {
    //                                 if (res.resource.resourceType === "ClaimResponse") {
    //                                     claimResponse = res.resource;
    //                                 }
    //                             })
    //                         }
    //                         self.setState({ claimResponseBundle })
    //                         self.setState({ claimResponse })
    //                         console.log(self.state.claimResponseBundle, self.state.claimResponse);
    //                         self.setState({ claimMessage: "Prior Authorization has been submitted successfully" })
    //                         message = "Prior Authorization " + claimResponse.disposition + "\n";
    //                         message += "Prior Authorization Number: " + claimResponse.preAuthRef;
    //                         self.createSubmittedRequest(claimResponse);
    //                     } else {
    //                         self.setState({ "claimMessage": "Prior Authorization Request Failed." })
    //                         message = "Prior Authorization Request Failed."
    //                     }
    //                     self.setState({ loading: false });
    //                     console.log(message);
    //                     console.log(this.responseText);
    //                 }
    //             }
    //         } else {
    //             this.setState({ "showError": true });
    //             this.setState({ "errorType": "token" });
    //             console.error(errorMsg);
    //             return;
    //         }
    //     };
    // }
    getCodesString() {
        let codesString = ""
        console.log(this.props.serviceRequest);
        if (this.props.serviceRequest.hasOwnProperty("resourceType") &&
            this.props.serviceRequest.resourceType === "ServiceRequest" &&
            this.props.serviceRequest.hasOwnProperty("code")) {
            if (this.props.serviceRequest.code.hasOwnProperty("coding")) {
                this.props.serviceRequest.code.coding.map((coding) => {
                    if (codesString == "") {
                        codesString = coding.code
                    }
                    else {
                        codesString = codesString + "," + coding.code
                    }
                })
            }
        }
        else if (this.props.serviceRequest.hasOwnProperty("resourceType") &&
            this.props.serviceRequest.resourceType === "DeviceRequest" &&
            this.props.serviceRequest.hasOwnProperty("codeCodeableConcept")) {
            if (this.props.serviceRequest.codeCodeableConcept.hasOwnProperty("coding")) {
                this.props.serviceRequest.codeCodeableConcept.coding.map((coding) => {
                    if (codesString == "") {
                        codesString = coding.code
                    }
                    else {
                        codesString = codesString + "," + coding.code
                    }
                })
            }

        }
        return codesString
    }

    async createSubmittedRequest(claimResponse,endpoint) {
        await this.deleteReqByRequestId()
        let today = new Date();
        let appContextId = sessionStorage.getItem("appContextId")
        let appContext = sessionStorage.getItem(appContextId)
        claimResponse.res_url = endpoint+"/ClaimResponse/"+claimResponse.id
        let body = {
            "type": "submitted",
            "date": today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate(),
            "patient_id": this.state.patientId,
            "app_context": appContext,
            "claim_response_id": claimResponse.id,
            "claim_response": JSON.stringify(claimResponse),
            "codes": this.getCodesString(),
            "prior_auth_ref": claimResponse.preAuthRef
        }
        await this.createRequest(body)
    }

    async createRequest(body) {
        this.setState({ saved: false })
        let headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "Access-Control-Allow-Origin": "*",
            'Authorization': "Basic " + btoa(globalConfig.odoo_username + ":" + globalConfig.odoo_password)
        }
        let url = globalConfig.restURL + "/api/pa_info"
        let today = new Date();
        //        if (self.props.serviceRequest.hasOwnProperty("resourceType") &&
        //                self.props.serviceRequest.resourceType === "ServiceRequest" &&
        //                self.props.serviceRequest.hasOwnProperty("code")) {
        //                service["productOrService"] = self.props.serviceRequest.code;
        // if (self.props.serviceRequest.hasOwnProperty("resourceType") && 
        //                self.props.serviceRequest.resourceType === "DeviceRequest" &&
        //                self.props.serviceRequest.hasOwnProperty("codeCodeableConcept")) {
        //                service["productOrService"] = self.props.serviceRequest.codeCodeableConcept;

        let res = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        }).then((response) => {
            return response.json();
        }).then((response) => {
            console.log("Questionnaires Saved: ", response);
            this.setState({ saved: true })
            return response
        })
        return res;
    }

    async deleteReqByRequestId() {
        console.log("Save questionnaire", sessionStorage.getItem("appContextId"));
        let appContextId = sessionStorage.getItem("appContextId")
        let appContext = JSON.parse(sessionStorage.getItem(appContextId))

        let headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            "Access-Control-Allow-Origin": "*",
            'Authorization': "Basic " + btoa(globalConfig.odoo_username + ":" + globalConfig.odoo_password)
        }
        let url = globalConfig.restURL + "/api/pa_info/" + this.state.patientId + "/" + appContext.request;
        try {
            let deleteReq = await fetch(url, {
                method: "DELETE",
                headers: headers,
            }).then((response) => {
                return response.json();
            }).then((response) => {
                console.log("!!Record deleted", response);
                return response
            })
        }
        catch (e) {
            console.log(e)
        }
    }

    async saveQuestionnaireData() {
        await this.deleteReqByRequestId();
        // let appContext = sessionStorage.getItem("appContext")
        let appContextId = sessionStorage.getItem("appContextId")
        let appContext = JSON.parse(sessionStorage.getItem(appContextId))

        try {
            let today = new Date();
            let body = {
                "type": "draft",
                "date": today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate(),
                "patient_id": this.state.patientId,
                "codes": this.getCodesString(),
                "app_context": appContext
            }
            await this.createRequest(body)
        }
        catch (e) {
            console.log(e)
        }

    }

    isEmptyAnswer(answer) {
        return ((answer.length < 1) ||
            (JSON.stringify(answer[0]) == "{}") ||
            (answer[0].hasOwnProperty("valueString") && (answer[0].valueString == null || answer[0].valueString == "")) ||
            (answer[0].hasOwnProperty("valueDateTime") && (answer[0].valueDateTime == null || answer[0].valueDateTime == "")) ||
            (answer[0].hasOwnProperty("valueDate") && (answer[0].valueDate == null || answer[0].valueDate == "")) ||
            (answer[0].hasOwnProperty("valueBoolean") && (answer[0].valueBoolean == null || answer[0].valueBoolean == "")) ||
            (answer[0].hasOwnProperty("valueQuantity") && (answer[0].valueQuantity.value == null || answer[0].valueQuantity.value == "")));
    }

    makeReference(bundle, resourceType) {
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

    toggleFilledFields() {
        if (this.state.turnOffValues.length > 0) {
            this.setState({ turnOffValues: [] });
        } else {
            const returnArray = [];
            this.state.orderedLinks.forEach((e) => {
                if (this.isNotEmpty(this.state.values[e]) && this.state.itemTypes[e] && this.state.itemTypes[e].enabled) {
                    returnArray.push(e);
                }
            });
            this.setState({ turnOffValues: returnArray });
        }
    }

    submitCommunication(commBundle) {
        this.setState({ loading: true });
        let communicationJson = {
            "resourceType": "Communication",
            "text": {
                "status": "generated",
                "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">DME order</div>"
            },
            "identifier": [
                {
                    "type": {
                        "text": "Ordering System"
                    },
                    "system": "urn:oid:1.3.4.5.6.7",
                    "value": "2345678901"
                }
            ],
            "status": "active",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/communication-category",
                            "code": "instruction"
                        }
                    ],
                    "text": "Instruction"
                }
            ],
            "medium": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationMode",
                            "code": "ELECTRONIC",
                            "display": "electronic"
                        }
                    ],
                    "text": "electronic"
                }
            ],
            "subject": {
                "reference": this.makeReference(commBundle, "Patient")
            },
            "encounter": { reference: sessionStorage.getItem("encounter") },
            "sent": convertDate(new Date(), "isoUtcDateTime"),
            "recipient": [
                {
                    "reference": this.makeReference(commBundle, "Practitioner")
                }
            ],
            "sender": {
                "reference": { reference: sessionStorage.getItem("provider") },
            },
            "payload": [
                {
                    "contentString": "DME order"
                }
            ]
        };
        commBundle.entry.unshift(communicationJson);
        postResource(this.state.orderTo, "Bundle", commBundle).then((res) => {
            if (res) {
                var resBundle = res;
                var communication = getResourceFromBundle(resBundle, "Communication");
                this.setState({
                    claimResponseBundle: resBundle,
                    claimResponse: communication,
                    claimMessage: "Order has been submitted successfully",
                    loading: false
                }, () => {
                    console.log(this.state.claimResponseBundle, this.state.claimResponse);
                    this.setState({ displayQuestionnaire: false });
                })
            } else {
                this.setState({ loading: false, claimMessage: "Order Request Failed." });
            }
        })
    }

    render() {
        return (
            <div>
                {this.state.displayQuestionnaire &&
                    this.ui.getQuestionnaireTemplate(this, this.props.qform.title, this.state.items, this.updateDocuments, this.state.showPreview, this.state.priorAuthBundle, this.state.previewloading, this.state.loading)
                }
                {!this.state.displayQuestionnaire &&

                    this.ui.getClaimResponseTemplate(this, this.state.claimMessage, this.state.claimResponse, this.state.resloading, this.state.showBundle, this.state.claimResponseBundle)
                }
            </div>

        );
    }
}