import React, { Component } from 'react';
import urlUtils from "../../util/url";


// import './QuestionnaireForm.css';

import Section from '../Section/Section';
import TextInput from '../Inputs/TextInput/TextInput';
import BooleanInput from '../Inputs/BooleanInput/BooleanInput';
import QuantityInput from '../Inputs/QuantityInput/QuantityInput';
import { findValueByPrefix } from '../../util/util.js';
import OpenChoice from '../Inputs/OpenChoiceInput/OpenChoice';
import { isTSEnumMember } from '@babel/types';
import Select from "react-dropdown-select";
import providerOptions from "../../providerOptions.json";
import prior_auth_working from '../../prior_auth_working.json';
import UiFactory from "../../UiFactory.js";

// const state = urlUtils.getUrlParameter("state"); // session key
// const code = urlUtils.getUrlParameter("code"); // authorization code
// console.log(state);
// const state = sessionStorage["launchContextId"]
// const params = JSON.parse(sessionStorage[state]); // load app session
// const tokenUri = params.tokenUri;
// const clientId = params.clientId;
// const secret = params.secret;
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
            documentReference: {}
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
        this.onChangeOtherProvider = this.onChangeOtherProvider.bind(this);
        this.getProviderQueries = this.getProviderQueries.bind(this);
        this.renderQueries = this.renderQueries.bind(this);
        this.onChangeProviderQuery = this.onChangeProviderQuery.bind(this);
        this.setProviderSource = this.setProviderSource.bind(this);
        this.submitCommunicationRequest = this.submitCommunicationRequest.bind(this);
        this.relaunch = this.relaunch.bind(this);
        this.handleShowBundle = this.handleShowBundle.bind(this);
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
        this.getProviderQueries(items);
    }

    handleShowBundle() {
        var showBundle = this.state.showBundle;
        this.setState({ showBundle: !showBundle });
    }
    setProviderSource(values) {
        console.log(this.state);
        if (values.length > 0) {
            this.setState({ "providerSource": values[0].value });
            sessionStorage["providerSource"] = values[0].value;
            // console.log("options---", providerOptions)
            providerOptions.forEach((p) => {
                if (p.value === values[0].value) {
                    this.setState({ "otherProviderName": p.label });
                    sessionStorage["otherProviderUrl"] = p.url;
                    console.log("Selected PRovider URi", p.url)
                }
            })
            // sessionStorage["serviceUri"] = values[0].url;
        }
    }

    getProviderQueries(questions) {
        // console.log("In get queries------", questions);
        let queries = this.state.providerQueries;
        // let questions = this.state.items;
        questions.forEach((group) => {
            if (group.type === "group") {
                group.item.forEach((link) => {
                    if (link.type === "attachment" && link.code !== undefined) {
                        console.log("Intype attachemnt---", link);
                        let eachQuery = {
                            "id": link.linkId,
                            "name": link.text,
                            "type": "attachment",
                            "code": link.code,
                            "checked": false
                        }
                        queries.push(eachQuery);
                    }
                })
            }
        })
        if (sessionStorage["fhir_queries"] !== undefined) {
            let fhir_queries = JSON.parse(sessionStorage["fhir_queries"]);
            fhir_queries.forEach((query, key) => {
                let code = "";
                if (query.query["code"] !== undefined) {
                    code = "code=" + query.query["code"];
                }
                let eachQuery = {
                    "id": "fhir_" + key,
                    "name": query.type,
                    "type": "query",
                    "code": code,
                    "checked": false
                }
                queries.push(eachQuery);
            })
        }
        this.setState({ providerQueries: queries });
        // console.log("Final queries---", this.state.providerQueries);

    }
    componentDidMount() {


    }

    onChangeOtherProvider(event) {
        // console.log("other provider----", event.target.value);
        let otherProvider = this.state.otherProvider;
        otherProvider = !otherProvider;
        this.setState({ otherProvider: otherProvider });
    }

    onChangeProviderQuery(event) {
        // console.log("event --", event.target.value, event.target.name);
        let queries = this.state.providerQueries;
        queries.forEach((q) => {
            if (q.id === event.target.name) {
                q.checked = !q.checked;
            }
        })
        this.setState({ providerQueries: queries });
        console.log("key, queries--", queries, this.state.providerQueries);
    }

    reloadClaimResponse() {
        var self = this
        this.setState({ resloading: true });
        const Http = new XMLHttpRequest();
        // const priorAuthUrl = "http://cmsfhir.mettles.com:8080/drfp/fhir/ClaimResponse/" + this.state.claimResponse.id;
        // const priorAuthUrl = "http://cdex.mettles.com:9000/fhir/ClaimResponse/" + this.state.claimResponse.id;
        const priorAuthUrl = "https://sm.mettles.com/payerfhir/hapi-fhir-jpaserver/fhir/ClaimResponse/" + this.state.claimResponse.id;
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
                    message = "Prior Authoriza  tion " + claimResponse.disposition + "\n";
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
        // console.log("Update question --", elementName, object, type);
        this.setState(prevState => ({
            [type]: {
                ...prevState[type],
                [elementName]: object
            }
        }))
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
                "id": this.randomString,
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
                const answer = findValueByPrefix(rule, "answer");
                if (typeof question === 'object' && typeof answer === 'object') {
                    if (rule.answerQuantity) {
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
                } else {
                    results.push(this.evaluateOperator(rule.operator, question, answer));
                }
            });
            return !checkAny ? results.some((i) => { return i }) : results.every((i) => { return i });
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
                // if (item.enableWhen) {
                //     console.log(item.enableWhen);
                // }
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
                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "boolean", "boolean", "valueBoolean");

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
                    this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "time", "time", "valueTime");

                case "dateTime":
                    this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "datetime-local", "datetime", "valueDateTime");


                case "attachment":
                    this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "file", "attachment", "valueAttachment");


                case "integer":
                    this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "number", "valueInteger", "integer");


                case "quantity":

                    return this.ui.getQuantityInput(item.linkId, item, this.updateNestedQuestionValue,
                        this.updateQuestionValue, this.retrieveValue, "quantity", "valueQuantity");


                case "open-choice":
                    return this.ui.getOpenChoice(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, this.state.containedResources, ["valueCoding", "valueString"]);

                default:

                    return this.ui.getTextInput(item.linkId, item, this.updateQuestionValue,
                        this.retrieveValue, "text", "string", "valueString");

            }
        }
    }

    generateBundle() {
        var self = this;
        return new Promise(function (resolve, reject) {
            console.log(self.state.sectionLinks);
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
            // priorAuthBundle.entry.unshift({ resource: self.props.serviceRequest });

            let orgRes = {
                "resourceType": "Organization"
            };
            let org_resource = sessionStorage.getItem("organization");
            if (org_resource === undefined || org_resource === "" || org_resource === null || org_resource.length === 0) {
                let payer = sessionStorage.getItem("payerName");
                if (payer === "united_health_care") {
                    orgRes["id"] = "516"
                    orgRes["name"] = "United Health Care"
                    orgRes['address'] = [
                        {
                            "use": "work",
                            "line": [
                                "9700 Health Care Lane"
                            ],
                            "city": "Minnetonka",
                            "state": "Minnesota",
                            "postalCode": "55343"
                        }
                    ]
                    orgRes["contact"] = [
                        {
                            "name": [
                                {
                                    "use": "official",
                                    "family": "Randall",
                                    "given": [
                                        "Janice"
                                    ]
                                }
                            ],
                            "telecom": [
                                {
                                    "system": "phone",
                                    "value": "803-763-5900",
                                    "use": "home"
                                }
                            ]
                        }
                    ]
                    orgRes["identifier"] = [
                        {
                            "system": "urn:ietf:rfc:3986",
                            "value": "96855.9662.3575.4099.5718.533.8838"
                        }
                    ]
                }
                if (payer === "medicare_fee_for_service") {
                    orgRes["id"] = "516"
                    orgRes["name"] = "Medicare Fee for service"
                    orgRes['address'] = [
                        {
                            "use": "work",
                            "line": [
                                "7210 Ambassador Road"
                            ],
                            "city": "Windsor Mill",
                            "state": "MaryLand",
                            "postalCode": "21244"
                        }
                    ]
                    orgRes["contact"] = [
                        {
                            "name": [
                                {
                                    "use": "official",
                                    "family": "Oliver",
                                    "given": [
                                        "James"
                                    ]
                                }
                            ],
                            "telecom": [
                                {
                                    "system": "phone",
                                    "value": "725-778-5600",
                                    "use": "home"
                                }
                            ]
                        }
                    ]
                    orgRes["identifier"] = [
                        {
                            "system": "urn:ietf:rfc:3986",
                            "value": "17086.5403.3613.5769.6889.6096.6384"
                        }
                    ]
                }
            } else {
                orgRes = JSON.parse(org_resource);
            }
            priorAuthBundle.entry.unshift({ resource: orgRes })
            console.log("org res---", orgRes);

            let coverageRes = {
                "resourceType": "Coverage"
            };
            let coverage_res = sessionStorage.getItem("coverage");
            if (coverage_res === undefined || coverage_res === "" || coverage_res === null || coverage_res.length === 0) {
                coverageRes =
                {
                    "resourceType": "Coverage",
                    "id": "SP1234",
                    "text": {
                        "status": "generated",
                        "div": "<div xmlns=\"http://www.w3.org/1999/xhtml\">A human-readable rendering of a Self Pay Agreement.</div>"
                    },
                    "identifier": [
                        {
                            "system": "http://hospitalx.com/selfpayagreement",
                            "value": "SP12345678"
                        }
                    ],
                    "status": "active",
                    "type": {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/coverage-selfpay",
                                "code": "pay",
                                "display": "PAY"
                            }
                        ]
                    },
                    "subscriber": {
                        reference: self.makeReference(priorAuthBundle, "Patient")
                    },
                    "beneficiary": {
                        reference: self.makeReference(priorAuthBundle, "Patient")
                    },
                    "relationship": {
                        "coding": [
                            {
                                "code": "self"
                            }
                        ]
                    },
                    "period": {
                        "end": "2012-03-17"
                    },
                    "payor": [
                        {
                            "reference": "Organization/516"
                        }
                    ]
                }
            } else {
                coverageRes = JSON.parse(coverage_res);
            }
            priorAuthBundle.entry.unshift({ resource: coverageRes })
            console.log("Coverage res---", coverageRes);

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
                    "reference": "Organization/" + orgRes.id
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
                subType: {
                    coding: [
                        {
                            system: "https://www.cms.gov/codes/billtype",
                            code: "41",
                            display: "Hospital Outpatient Surgery performed in an Ambulatory ​Surgical Center"
                        }
                    ]
                },
                use: "preauthorization",
                patient: { reference: self.makeReference(priorAuthBundle, "Patient") },
                created: authored,
                provider: { reference: self.makeReference(priorAuthBundle, "Organization") },
                enterer: { reference: self.makeReference(priorAuthBundle, "Practitioner") },
                insurer: { reference: self.makeReference(priorAuthBundle, "Organization") },
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
                    valueReference: { reference: self.makeReference(priorAuthBundle, "QuestionnaireResponse") }
                }],
                item: [

                ],
                careTeam: [
                    {
                        sequence: 1,
                        provider: { reference: self.makeReference(priorAuthBundle, "Practitioner") },
                        extension: [
                            {
                                url: "http://terminology.hl7.org/ValueSet/v2-0912",
                                valueCode: "OP"
                            }
                        ]
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
                priorAuthClaim["presciption"] = { reference: self.makeReference(priorAuthBundle, "ServiceRequest") }
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
    // create the questionnaire response based on the current state
    outputResponse(status) {
        this.setState({ loading: true });
        this.generateBundle().then((priorAuthBundle) => {
            /*creating token */
            const tokenPost = new XMLHttpRequest();
            var auth_response;
            var self = this;
            tokenPost.open("POST", tokenUri);
            tokenPost.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            var data = `client_id=app-login&grant_type=password&username=john&password=john123`
            tokenPost.send(data);
            tokenPost.onload = function () {
                if (tokenPost.status === 200) {
                    try {
                        auth_response = JSON.parse(tokenPost.responseText);
                        console.log("auth res--1243-", auth_response);
                    } catch (e) {
                        const errorMsg = "Failed to parse auth response";
                        document.body.innerText = errorMsg;
                        console.error(errorMsg);
                        return;
                    }
                    /** creating cliam  */
                    const Http = new XMLHttpRequest();
                    // const priorAuthUrl = "https://davinci-prior-auth.logicahealth.org/fhir/Claim/$submit";
                    // const priorAuthUrl = "http://cmsfhir.mettles.com:8080/drfp/fhir/Claim/$submit";
                    // const priorAuthUrl = "http://cdex.mettles.com:9000/fhir/Claim/$submit";
                    var priorAuthUrl = "https://sm.mettles.com/payerfhir/hapi-fhir-jpaserver/fhir/Claim/$submit";
                    if (self.props.hasOwnProperty("claimEndpoint") && self.props.claimEndpoint !== null) {
                        priorAuthUrl = self.props.claimEndpoint;
                    }
                    if (priorAuthUrl === "http://stdrfp.mettles.com:8080/drfp/fhir/Claim/$submit") {
                        priorAuthBundle = prior_auth_working;
                    }
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
                                console.log("lllllll")
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
                            } else {
                                self.setState({ "claimMessage": "Prior Authorization Request Failed." })
                                message = "Prior Authorization Request Failed."
                            }
                            self.setState({ loading: false });
                            console.log(message);
                            //alert(message);
                            console.log(this.responseText);
                        }
                    }
                } else {
                    const errorMsg = "Token post request failed. Returned status: " + tokenPost.status;
                    document.body.innerText = errorMsg;
                    console.error(errorMsg);
                    return;
                }
            };
        }).catch((error) => {
            console.log("unable to generate bundle", error);
        })
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
                return (entry.resource.resourceType == resourceType);
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
    randomString() {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ-";
        var string_length = 16;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring
    }
    submitCommunicationRequest() {
        console.log("in send comm reqiest, removed for this project");
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
