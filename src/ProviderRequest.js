
import React, { Component } from 'react';
import { hot } from "react-hot-loader";
import SelectPayer from './components/SelectPayer';
import DropdownServiceCode from './components/DropdownServiceCode';
import DropdownCoverage from './components/DropdownCoverage';
import { DateInput } from 'semantic-ui-calendar-react';
import Client from 'fhir-kit-client';
import "react-datepicker/dist/react-datepicker.css";
import './index.css';
import './components/consoleBox.css';
import Loader from 'react-loader-spinner';
// import { createToken } from './components/Authentication';
import { Dropdown } from 'semantic-ui-react';
import stateOptions from './stateOptions'
import "isomorphic-fetch";
// var dateFormat = require('dateformat');
import DropdownEncounter from './components/DropdownEncounter';
import UiFactory from "./UiFactory.js";
import globalConfig from './globalConfiguration.json';



const types = {
  error: "errorClass",
  info: "infoClass",
  debug: "debugClass",
  warning: "warningClass"
}


class ProviderRequest extends Component {
  constructor(props) {
    super(props);
    this.ui = new UiFactory().getUi();
    this.state = {
      config: sessionStorage.getItem('config') !== undefined ? JSON.parse(sessionStorage.getItem('config')) : {},
      patient: null,
      accessToken: '',
      scope: '',
      payer: '',
      patientId: sessionStorage.getItem('auth_patient_id') !== undefined ? sessionStorage.getItem('auth_patient_id') : '',
      practitionerId: (localStorage.getItem('npi') !== null) ? localStorage.getItem('npi') : "",
      resourceType: null,
      resourceTypeLT: null,
      encounterId: '',
      coverageId: '',
      encounter: null,
      request: "coverage-requirement",
      response: null,
      token: null,
      oauth: false,
      diagnosis: null,
      loading: false,
      logs: [],
      cards: [],
      medicationInput: null,
      medication: null,
      medicationStartDate: '',
      medicationEndDate: '',
      hook: "order-select",
      hookName: 'order-review',
      healthcareCode: null,
      resource_records: {},
      prior_auth: false,
      dosageAmount: null,
      color: 'grey',
      validatePatient: false,
      validateFhirUrl: false,
      validateAccessToken: false,
      req_active: 'active',
      auth_active: '',
      prefetchData: {},
      // prefetch: false,
      frequency: null,
      loadCards: false,
      showMenu: false,
      selected_codes: [],
      category_name: "",
      // device_code: "",
      // device_text: "",
      quantity: 1,
      unit: null,
      birthDate: '',
      patientState: '',
      patientPostalCode: '',
      prefetch: false,
      patientResource: '',
      gender: '',
      firstName: '',
      lastName: '',
      prefetchloading: false,
      coverageResources: [],
      coverage: {},
      crd_error_msg: '',
      genderOptions: [{ key: 'male', text: 'Male', value: 'male' },
      { key: 'female', text: 'Female', value: 'female' },
      { key: 'other', text: 'Other', value: 'other' },
      { key: 'unknown', text: 'Unknown', value: 'unknown' },
      ],
      stateOptions: stateOptions,
      encounters: [],
      provider_fhir_url: sessionStorage.getItem("serviceUri"),
      prior_auth_records:[
        ]
      
    }
    this.validateMap = {
      status: (foo => { return foo !== "draft" && foo !== "open" }),
      code: (foo => { return !foo.match(/^[a-z0-9]+$/i) })
    };
    this.medication_prescribe = false;
    this.startLoading = this.startLoading.bind(this);
    this.submit_info = this.submit_info.bind(this);
    this.onPatientChange = this.onPatientChange.bind(this);
    this.onChangeFirstName = this.onChangeFirstName.bind(this);
    this.onChangeLastName = this.onChangeLastName.bind(this);
    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.onPractitionerChange = this.onPractitionerChange.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changefrequency = this.changefrequency.bind(this);
    this.onClickLogout = this.onClickLogout.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.getPrefetchData = this.getPrefetchData.bind(this);
    this.readFHIR = this.readFHIR.bind(this);
    this.onClickMenu = this.onClickMenu.bind(this);
    this.handleGenderChange = this.handleGenderChange.bind(this);
    this.handlePatientStateChange = this.handlePatientStateChange.bind(this);
    this.changebirthDate = this.changebirthDate.bind(this);
    this.onPatientPostalChange = this.onPatientPostalChange.bind(this);
    this.getResourceData = this.getResourceData.bind(this);
    this.checkRequestStatus = this.checkRequestStatus.bind(this);
  }

  async componentDidMount() {
    await this.handlePrefetch()
    await this.getRequests()

  }


  async getRequests() {
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
       "Cache-Control": "no-cache,no-store",
      // 'Accept-Encoding': 'gzip, deflate, sdch, br',
      // 'Accept-Language': 'en-US,en;q=0.8',
      "Access-Control-Allow-Origin":"*",
      'Authorization': "Basic " +btoa(globalConfig.odoo_username +":"+globalConfig.odoo_password)
    }
    const url = globalConfig.restURL+"/api/pa_info/"+this.state.patientId;
    let res = fetch(url, {
      method: "GET",
      headers: headers,
    }).then((response) => {
      return response.json();
    }).then((response) => {
      console.log("requests recccss",response);
      this.setState({prior_auth_records:response.result})
      return response
    })
    return res;
  }

 
  async checkRequestStatus(rec){
    console.log("check stattt records",rec.index)
    let prior_auth_records = this.state.prior_auth_records
    prior_auth_records[rec.index].checking = true
    this.setState({prior_auth_records})
    if(rec.claim_response_id != undefined){

      const priorAuthUrl = "https://sm.mettles.com/payerfhir/hapi-fhir-jpaserver/fhir/ClaimResponse/" + rec.claim_response_id;
      let fhirHeaders = {
        'Content-Type': 'application/fhir+json',
        "Cache-Control": "no-cache,no-store"

      }
      let claimRes = await fetch(priorAuthUrl, {
        method: "GET",
        headers: fhirHeaders

      }).then((response) => {
        return response.json();
      }).then(async(response) => {
        console.log("claim Resppsps",response);
        if(response.hasOwnProperty("outcome")){
           // response.outcome = "complete"
          if(response.outcome == "complete"){

            let headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              "Cache-Control": "no-store",
              "Access-Control-Allow-Origin":"*",
              'Authorization': "Basic " +btoa(globalConfig.odoo_username +":"+globalConfig.odoo_password)
            }
            let url = globalConfig.restURL+"/api/pa_info_cri/"+this.state.patientId+"/"+rec.claim_response_id;
            let codesString = ""
            try{
                let getReq = await fetch(url, {
                  method: "GET",
                  headers: headers,
                }).then((response) => {
                  return response.json();
                }).then((response) => {
                  console.log("!!Record found",response);
                  if(response.hasOwnProperty("result")){
                    response.result.map((rec)=>{
                      if(codesString != ""){
                        codesString = codesString+","+rec.codes
                      }
                      else{
                        codesString = rec.codes
                      }
                    })
                  }
                  return response
                })
            }
            catch(e){
                console.log(e)

            }
            try{
                let deleteReq = await fetch(url, {
                  method: "DELETE",
                  headers: headers,
                }).then((response) => {
                  return response.json();
                }).then((response) => {
                  console.log("!!Record deleted",response);
                  return response
                })
            }
            catch(e){
                console.log(e)
            }
            try{
              let date = new Date(response.created)
              let body = {
                  "type":"completed",
                  "date":date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate(),
                  "patient_id":this.state.patientId,
                  "claim_response_id":response.id,
                  "claim_response":response,
                  "prior_auth_ref":response.preAuthRef,
                  "codes":codesString
                }

              await this.createRequest(body)
              await this.getRequests();
            }
            catch(e){
              console.log("Error!!",e)
            }
          }
          else{
            // console.log("in else 1",prior_auth_records[rec.index])
            prior_auth_records[rec.index].checking = false
            this.setState({prior_auth_records})
          }
        }
        else{
          // console.log("in else 2",prior_auth_records[rec.index])
          prior_auth_records[rec.index].checking = false
          this.setState({prior_auth_records})
        }
        //this.setState({prior_auth_records:response.result})
        return response
      })
      return true
    }

    prior_auth_records[rec.index].checking = false
    this.setState({prior_auth_records})
    return false;
  }


  async createRequest(body){
    this.setState({saved:false})
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      "Access-Control-Allow-Origin":"*",
      'Authorization': "Basic " +btoa(globalConfig.odoo_username +":"+globalConfig.odoo_password)
    }
    let url = globalConfig.restURL+"/api/pa_info"
    let today = new Date();
    
   
    let res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    }).then((response) => {
      return response.json();
    }).then((response) => {
      console.log("Questionnaires Saved: ",response);
      this.setState({saved:true})
      return response
    })
    return res;
    }

  consoleLog(content, type) {
    let jsonContent = {
      content: content,
      type: type
    }
    this.setState(prevState => ({
      logs: [...prevState.logs, jsonContent]
    }))
  }
  handleGenderChange = (event, data) => {
    this.setState({ gender: data.value })
  }
  handlePatientStateChange = (event, data) => {
    this.setState({ patientState: data.value })
  }

  handlePrefetch = async () => {
    if (this.state.patientId !== null) {
      console.log(this.state.prefetch, 'here kya')
      this.setState({ prefetch: true });
      this.setState({ prefetchloading: true });
      await this.getResourceData(sessionStorage.getItem("token"),
        "Patient", "/" + this.state.patientId).then(async(patientResource) => {
          console.log("Patient get response", patientResource);
          this.setState({ prefetchloading: false });
          if (patientResource.hasOwnProperty("resourceType") && patientResource.resourceType === 'Patient') {
            this.setState({ prefetchloading: false });
            this.setState({ patientResource: patientResource })
            this.setState({ firstName: patientResource.name[0].given })
            this.setState({ lastName: patientResource.name[0].family })
            this.setState({ gender: patientResource.gender })
            this.setState({ birthDate: patientResource.birthDate })
            if (patientResource.address !== undefined) {
              this.setState({ patientState: patientResource.address[0].state })
              this.setState({ patientPostalCode: patientResource.address[0].postalCode })
            }
          } else {
            const errorMsg = "Token post request failed. Try launching again !!";
            document.body.innerText = errorMsg;
            console.error(errorMsg);
            return;
          }
        }).catch((reason) => {
          console.log("No response recieved from the server", reason)
          this.setState({ gender: '' })
          this.setState({ birthDate: '' })
          this.setState({ patientState: '' })
          this.setState({ patientPostalCode: '' })
          this.setState({ firstName: '' })
          this.setState({ lastName: '' })
        });
      await this.getResourceData(sessionStorage.getItem("token"),
        "Encounter", "?patient=" + this.state.patientId).then(async(encounterRes) => {
          if (encounterRes.resourceType === "Bundle" && encounterRes.total > 0) {
            this.setState({ encounters: encounterRes.entry })
          }
        }).catch((reason) => {
          console.log("No response recieved from the server", reason)
        });
      await this.getResourceData(sessionStorage.getItem("token"),
        "Coverage", "?patient=" + this.state.patientId).then(async(coverageRes) => {
          console.log("Coverage resource", coverageRes.total);
          if (coverageRes.total > 0) {
            console.log("if total>0", coverageRes.entry);
            let coverageResources = this.state.coverageResources
            let coverageId = false;
            for (var r in coverageRes.entry) {
              console.log("in loop,", r)
              coverageId = coverageRes.entry[r].resource.id
              coverageResources.push(coverageRes.entry[r].resource);
            }
            this.setState({ coverageResources:coverageResources,coverageId:coverageId });
            console.log("Coversge reso", this.state.coverageResources)
          }
        }).catch((reason) => {
          console.log("No response recieved from the server", reason)
        });
    }
  }

  updateStateElement = (elementName, text) => {
    let value = text;
    if (elementName === "selected_codes") {
      console.log("In if selected_codes----", text);
      if (text.hasOwnProperty("codes") && ["E1390", "E1391", "E0424", "E0439", "E1405", "E1406", "E0431", "E0434", "E1392", "E0433", "K0738", "E0441", "E0442", "E0443", "E0444"].indexOf(text.codes[0]) >= 0) {
        value = text.codes
        this.setState({ hook: "order-review" });
      }
      else {
        this.setState({ hook: "order-select" });
      }
      value = text.codeObjects;
    }
    console.log("Ellelelm", elementName, text)
    this.setState({ [elementName]: value });
  }

  validateForm() {
    let formValidate = true;
    if (this.state.firstName === '' || this.state.lastName === '') {
      formValidate = false;
    }
    if(this.state.coverageId === ""){
      formValidate = false;
      this.setState({ loading: false, crd_error_msg: "Unable to Submit Request. No Coverage Information Found !!" });
    }
    if(this.state.encounterId === ""){
      formValidate = false;
      this.setState({ loading: false, crd_error_msg: "Unable to Submit Request. No Encounter Information Found !!" });
    }
    // if (this.state.patientId === '') {
    //   formValidate = false;
    //   this.setState({ validatePatient: true });
    // }
    // if ((this.state.hook === '' || this.state.hook === null) ) {
    //   formValidate = false;
    // }
    return formValidate;
  }

  startLoading() {
    if (this.validateForm()) {
      this.setState({ loading: true }, () => {
        this.submit_info();
      })
    }
  }

  onClickMenu() {
    var showMenu = this.state.showMenu;
    this.setState({ showMenu: !showMenu });
  }

  async readFHIR(resourceType, resourceId) {
    const fhirClient = new Client({ baseUrl: this.state.provider_fhir_url });
    fhirClient.bearerToken = sessionStorage.getItem("token");
    let readResponse = await fhirClient.read({ resourceType: resourceType, id: resourceId });
    // console.log('Read Rsponse', readResponse)
    return readResponse;
  }

  async getPrefetchData() {
    // console.log(this.state.hook);
    var docs = [];
    if (this.state.hook === "order-review") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Encounter": this.state.encounterId,
        "Practitioner": this.state.practitionerId,
        "Coverage": this.state.coverageId
      };
    } else if (this.state.hook === "order-select") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Practitioner": this.state.practitionerId
      };
    }
    var self = this;
    docs.push(prefectInput);

    var prefetchData = {};
    for (var key in docs[0]) {
      var val = docs[0][key]
      if (key === 'patientId') {
        key = 'Patient';
      }
      if (val !== '') {
        prefetchData[key.toLowerCase()] = await self.readFHIR(key, val);
      }
    }
    return prefetchData;
  }

  async getResourceData(token, resourceType, query) {
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json+fhir',
      'Accept-Encoding': 'gzip, deflate, sdch, br',
      'Accept-Language': 'en-US,en;q=0.8',
      'Authorization': "Bearer " + token
    }
    const url = this.state.provider_fhir_url + "/" + resourceType + query;
    let res = fetch(url, {
      method: "GET",
      headers: headers,
    }).then((response) => {
      return response.json();
    }).then((response) => {
      return response
    })
    return res;
  }

  onPatientChange(event) {
    this.setState({ patientId: event.target.value });
    this.setState({ validatePatient: false });
  }
  onChangeFirstName(event) {
    this.setState({ firstName: event.target.value });
  }
  onChangeLastName(event) {
    this.setState({ lastName: event.target.value });
  }
  onQuantityChange(event) {
    this.setState({ quantity: event.target.value });
  }
  onPractitionerChange(event) {
    this.setState({ practitionerId: event.target.value });
  }
  changebirthDate = (event, { name, value }) => {
    if (this.state.hasOwnProperty(name)) {
      this.setState({ [name]: value });
    }
  }

  onPatientPostalChange(event) {
    this.setState({ patientPostalCode: event.target.value })
  }

  changeDosageAmount(event) {
    if (event.target.value !== undefined) {
      let transformedNumber = Number(event.target.value) || 1;
      if (transformedNumber > 5) { transformedNumber = 5; }
      if (transformedNumber < 1) { transformedNumber = 1; }
      this.setState({ dosageAmount: transformedNumber });
    }

  }
  changefrequency(event) {
    if (event.target.value !== undefined) {
      let transformedNumber = Number(event.target.value) || 1;
      // if (transformedNumber > 5) { transformedNumber = 5; }
      if (transformedNumber < 1) { transformedNumber = 1; }
      this.setState({ frequency: transformedNumber });
    }

  }
  onClickLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('config');
    localStorage.removeItem('npi');
    window.location = `${window.location.protocol}//${window.location.host}/login`;
  }
  setCoverage(coverage) {
    let coverageId = coverage.id;
    this.setState({ coverageId })
    this.setState({ coverage });
  }

  async submit_info() {
    //alert("in submit");
    //let token = await createToken(this.state.config.provider_grant_type, 'provider', localStorage.getItem('username'), localStorage.getItem('password'), true);
    //token = "Bearer " + token;
    var myHeaders = new Headers({
      "Content-Type": "application/json"
      //"authorization": token,
    });
    //    let accessToken = this.state.accessToken;
    //  accessToken = token;
    // console.log(accessToken, 'accesstoken')
    // this.setState({ accessToken });
    //alert("before json");
    let json_request = await this.getJson();

    let url = '';
    if (this.state.hook === 'order-review') {
      // url = this.state.config.crd_order_review_url;
      url = "https://sm.mettles.com/crd/r4/cds-services/order-review-crd";
    }
    if (this.state.hook === 'order-select') {
      // url = this.state.config.crd_url;
      url = "https://sm.mettles.com/crd/r4/cds-services/order-select-crd";
    }
    // console.log("json_request", json_request, this.state.config.crd_url)
    try {
      let self = this;
      //alert(JSON.stringify(json_request));
      await fetch(url, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(json_request)
      }).then(response => {
        return response.json();
      }).then((cardResponse) => {
        console.log("CRD Response---", cardResponse);
        let appContext = cardResponse['cards'][0].links[0].appContext;
        sessionStorage.setItem("appContext", appContext);
        sessionStorage.setItem("showCDSHook", false);
        self.setState({ response: cardResponse });
        if (appContext !== null) {
          window.location = `${window.location.protocol}//${window.location.host}/index?appContextId=${appContext}`;
        } else {
          self.setState({ loading: false, crd_error_msg: "Error while retrieving CRD Response, " + cardResponse['cards'][0].links[0].label });
        }
      }).catch((reason) => {
        self.setState({ loading: false, crd_error_msg: "Unable to get CRD Response !! Please try again." });
      });
    } catch (error) {
      //alert("In catch"+error);
      var res_json = {
        "cards": [{
          "source": {
            "label": "CMS Medicare coverage database",
            "url": "https://www.cms.gov/medicare-coverage-database/details/ncd-details.aspx?NCDId=70&ncdver=3&bc=AAAAgAAAAAAA&\n",
          },
          "suggestions": [],
          "summary": "Requirements for Home Oxygen Theraphy",
          "indicator": "info",
          "detail": "The requested procedure needs more documentation to process further",
          "links": [{
            "url": "/index?npi=" + this.state.practitionerId,
            "type": "smart",
            "label": "SMART App"
          }]

        }]
      }
      this.setState({ response: res_json });
      this.setState({ loading: false });
      this.consoleLog("Unexpected error occured", types.error)
      if (error instanceof TypeError) {
        this.consoleLog(error.name + ": " + error.message, types.error);
      }
    }
  }
  renderClaimSubmit() {
    console.log(this.ui);
    return this.ui.getProviderRequestForm(this);
  };

  async getRequestID(token) {

    const min = 1;
    const max = 1000000000;
    const num = parseInt(min + Math.random() * (max - min));
    // console.log("num----------", num);
    let req_check = await this.getResources(token, "ServiceRequest", num);
    // console.log("random------------", req_check);
    if (req_check.hasOwnProperty('total')) {
      if (req_check.total > 0) {
        await this.getRequestID(token);
      }
      else {
        return num;
      }
    }
  }
  async getOrganization(org_ref) {
    var tempURL = this.state.provider_fhir_url + "/" + org_ref;
    let org = await fetch(tempURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json+fhir',
        'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'en-US,en;q=0.8',
        'Authorization': 'Bearer ' + sessionStorage.getItem("token")
      }
    }).then((response) => {
      return response.json()
    }).then((orgRes) => {
      console.log("------Organization----response", orgRes);
      return orgRes;
    }).catch((reason) => {
      console.log("No response recieved from the server for Organization", reason)
      return false;
    })
    return org;
  }
  async getResources(token, resource, identifier) {
    var url = this.state.config.payer_fhir_url + '/' + resource + "?identifier=" + identifier;
    // console.log("url-------",url,token);
    let headers = {
      "Content-Type": "application/json",
    }
    if (this.state.config.payer_authorised) {
      headers['Authorization'] = "Bearer " + token
    }
    let sender = await fetch(url, {
      method: "GET",
      headers: headers
    }).then(response => {
      // console.log("response----------",response);
      return response.json();
    }).then((response) => {
      // console.log("----------response", response);
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    return sender;
  }

  randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring
  }
  async getJson() {
    var patientId = this.state.patientId;
    let coverage = {}
    let organization = {}
    let PractitionerRole = {
      "resourceType": "PractitionerRole",
      "id": "practitioner1",
      "practitioner": {
        "reference": "Practitioner/" + this.state.practitionerId
      }
    }

    if (this.state.coverageId === '') {
      organization = {
        "resourceType": "Organization",
        "name": this.state.payer,
        "id": this.state.payer
      }
      coverage = {
        resourceType: "Coverage",
        id: "coverage1",
        class: [
          {
            type: {
              system: "http://hl7.org/fhir/coverage-class",
              code: "plan"
            },
            value: "Medicare Part D"
          }
        ],
        payor: [
          {
            reference: "Organization/" + organization["id"]
          }
        ]
      };
    } else {
      console.log("Coverage resources--", this.state.coverageResources, this.state.coverageId)
      coverage = this.state.coverageResources.find(cov => cov.id === this.state.coverageId);
      sessionStorage.setItem("coverage", JSON.stringify(coverage))
      if (coverage.hasOwnProperty("payor")) {
        let org_ref = coverage.payor[0].reference
        let org = await this.getOrganization(org_ref)
        if (org) {
          organization = org
          sessionStorage.setItem("organization", JSON.stringify(organization))
        }
      } else {
        organization = {
          "resourceType": "Organization",
          "name": this.state.payer,
          "id": this.state.payer
        }
      }
    }
    let patientResource;
    if (this.state.prefetch === true) {
      patientResource = this.state.patientResource;
    }
    else {
      patientResource = {
        resourceType: "Patient",
        id: patientId,
        gender: this.state.gender,
        "birthDate": this.state.birthDate,
        "address": [
          {
            "use": "home",
            "city": "Thornton",
            "state": this.state.patientState,
            "postalCode": this.state.patientPostalCode,
            "country": "USA"
          }
        ],
        "active": true,
        "name": [
          {
            "use": "official",
            "family": this.state.lastName,
            "given": [
              this.state.firstName
            ]
          }
        ],
        "identifier": [
          {
            "use": "usual",
            "type": {
              "coding": [
                {
                  "system": "http://hl7.org/fhir/v2/0203",
                  "code": "MR",
                  "display": "Medical record number"
                }
              ]
            },
            "system": "http://hospital.davinci.org",
            "value": this.randomString()
          }
        ],
      }
      this.setState({ patientResource: patientResource });
      console.log(patientResource, JSON.stringify(patientResource))
    }
    let prefetchObj = {}
    if (this.state.hook === "order-review") {
      prefetchObj = {
        "deviceRequestBundle": {
          "resourceType": "Bundle",
          "type": "collection",
          "entry": [
            {
              "resource": patientResource
            },
            {
              "resource": PractitionerRole
            },
            {
              "resource": coverage
            },
            {
              "resource": organization
            }
          ]
        }
      }
    } else {
      prefetchObj = {
        "serviceRequestBundle": {
          "resourceType": "Bundle",
          "type": "collection",
          "entry": [
            {
              "resource": patientResource
            },
            {
              "resource": PractitionerRole
            },
            {
              "resource": coverage
            },
            {
              "resource": organization
            }
          ]
        }
      }
    }
    let request = {
      hook: this.state.hook,
      hookInstance: "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
      fhirServer: this.state.provider_fhir_url,
      fhirAuthorization: {
        "access_token": sessionStorage.getItem("token"),
        "token_type": "Bearer",
        "expires_in": 300,
        "scope": "patient/Patient.read patient/Coverage.read",
        "subject": "cds-service"
      },
      user: "Practitioner/" + this.state.practitionerId,
      context: {
        patientId: patientId,
        encounterId: this.state.encounterId,
      },
      "prefetch": prefetchObj
    };
    let selected_codes = this.state.selected_codes;
    if (this.state.hook === "order-review") {
      request.context["orders"] = {
        resourceType: "Bundle",
        entry: []
      }
      for (var i = 0; i < selected_codes.length; i++) {
        console.log("IIn device request--",selected_codes[i], i);
        let deviceRequest = {
          "resourceType": "DeviceRequest",
          "identifier": [
            {
              "value": this.randomString()
            }
          ],
          "status": "draft",
          "intent": "order",
          "subject": {
            "reference": "Patient/" + patientId
          },
          "authoredOn": "2013-05-08T09:33:27+07:00",
          "insurance": [
            {
              "reference": "Coverage/" + coverage.id
            }
          ],
          "encounter":{
            "reference": "Encounter/" + this.state.encounterId
          },
          "performer": {
            "reference": "PractitionerRole/practitioner1"
          },
          "codeCodeableConcept": {
            "coding": [
              {
                "system": "http://loinc.org",
                "code": selected_codes[i].value
              }
            ],
          }
        }
        request.context.orders.entry.push({ "resource": deviceRequest });
      }
    } else {
      request.context["draftOrders"] = {
        resourceType: "Bundle",
        entry: []
      }
      for (var i = 0; i < selected_codes.length; i++) {
        let serviceRequest = {
          "resourceType": "ServiceRequest",
          "identifier": [
            {
              "value": this.randomString()
            }
          ],
          "status": "draft",
          "intent": "order",
          "subject": {
            "reference": "Patient/" + patientId
          },
          "quantity": { "value": selected_codes[i].quantity },
          "authoredOn": "2013-05-08T09:33:27+07:00",
          "insurance": [
            {
              "reference": "Coverage/" + coverage.id
            }
          ],
          "encounter":{
            "reference": "Encounter/" + this.state.encounterId
          },
          "performer": {
            "reference": "PractitionerRole/practitioner1"
          },
          "code": {
            "coding": [
              {
                "system": "http://loinc.org",
                "code": selected_codes[i].value
              }
            ],
          }
        }
        request.context.draftOrders.entry.push({ "resource": serviceRequest });
      }
    }
    return request;
  }
  render() {
    return (
      <div className="attributes mdl-grid">
        {this.renderClaimSubmit()}
      </div>)
  }
}
export default hot(module)(ProviderRequest);