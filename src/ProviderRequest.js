
import React, { Component } from 'react';
import { hot } from "react-hot-loader";
import SelectPayer from './components/SelectPayer';
import DropdownServiceCode from './components/DropdownServiceCode';
import { DateInput } from 'semantic-ui-calendar-react';
import Client from 'fhir-kit-client';
import "react-datepicker/dist/react-datepicker.css";
import DisplayBox from './components/DisplayBox';
// import './font-awesome/css/font-awesome.min.css';
import './index.css';
import './components/consoleBox.css';
import Loader from 'react-loader-spinner';
import { createToken } from './components/Authentication';
import { Dropdown } from 'semantic-ui-react';
import stateOptions from './stateOptions'
import "isomorphic-fetch";
// var dateFormat = require('dateformat');

const types = {
  error: "errorClass",
  info: "infoClass",
  debug: "debugClass",
  warning: "warningClass"
}


class ProviderRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: localStorage.getItem('config') !== undefined ? JSON.parse(localStorage.getItem('config')) : {},
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
      noRules: false,
      coverageResources: [],
      coverage: {},
      crd_error_msg:'',
      genderOptions: [{ key: 'male', text: 'Male', value: 'male' },
      { key: 'female', text: 'Female', value: 'female' },
      { key: 'other', text: 'Other', value: 'other' },
      { key: 'unknown', text: 'Unknown', value: 'unknown' },
      ],
      stateOptions: stateOptions
    }
    this.validateMap = {
      status: (foo => { return foo !== "draft" && foo !== "open" }),
      code: (foo => { return !foo.match(/^[a-z0-9]+$/i) })
    };
    this.medication_prescribe = false;
    this.startLoading = this.startLoading.bind(this);
    this.submit_info = this.submit_info.bind(this);
    this.onFhirUrlChange = this.onFhirUrlChange.bind(this);
    this.onAccessTokenChange = this.onAccessTokenChange.bind(this);
    this.onScopeChange = this.onScopeChange.bind(this);
    this.onEncounterChange = this.onEncounterChange.bind(this);
    this.onPatientChange = this.onPatientChange.bind(this);
    this.onChangeFirstName = this.onChangeFirstName.bind(this);
    this.onChangeLastName = this.onChangeLastName.bind(this);
    this.medicationButton = this.medicationButton.bind(this);
    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.onPractitionerChange = this.onPractitionerChange.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changefrequency = this.changefrequency.bind(this);
    this.changeMedicationInput = this.changeMedicationInput.bind(this);
    this.onCoverageChange = this.onCoverageChange.bind(this);
    this.changeMedicationStDate = this.changeMedicationStDate.bind(this);
    this.changeMedicationEndDate = this.changeMedicationEndDate.bind(this);
    this.onClickLogout = this.onClickLogout.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.getPrefetchData = this.getPrefetchData.bind(this);
    this.readFHIR = this.readFHIR.bind(this);
    this.onClickMenu = this.onClickMenu.bind(this);
    this.getUrlParameter = this.getUrlParameter.bind(this);
    this.handleGenderChange = this.handleGenderChange.bind(this);
    this.handlePatientStateChange = this.handlePatientStateChange.bind(this);
    this.changebirthDate = this.changebirthDate.bind(this);
    this.onPatientPostalChange = this.onPatientPostalChange.bind(this);
    this.getHookFromCategory = this.getHookFromCategory.bind(this);
    // this.noRulesChange = this.noRulesChange.bind(this);
  }

  getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split("&");
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split("=");
      if (sParameterName[0] === sParam) {
        var res = sParameterName[1].replace(/\+/g, "%20");
        return decodeURIComponent(res);
      }
    }
  }
  componentDidMount() {
    if (!localStorage.getItem('isLoggedIn')) {
      window.location = `${window.location.protocol}//${window.location.host}/login`;
    }
    this.handlePrefetch()
    this.getCoverageInfo()
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
  getCoverageInfo() {
    var tempURL = sessionStorage.getItem("serviceUri") + "/Coverage?patient=" + this.state.patientId;
    fetch(tempURL, {
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
    }).then((coverageRes) => {
      console.log("Coverage resource", coverageRes.total);
      if (coverageRes.total > 0) {
        console.log("if total>0", coverageRes.entry);
        let coverageResources = this.state.coverageResources
        for (var r in coverageRes.entry) {
          console.log("in loop,", r)
          coverageResources.push(coverageRes.entry[r].resource);
        }
        this.setState({ coverageResources });
        console.log("Coversge reso", this.state.coverageResources)
      }
    });
  }
  handlePrefetch = async () => {
    console.log(this.state.prefetch, 'here kya')
    this.setState({ prefetch: true });
    this.setState({ prefetchloading: true });
    var tempURL = sessionStorage.getItem("serviceUri") + "/Patient/" + this.state.patientId;
    fetch(tempURL, {
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
    }).then((patientResource) => {

      console.log("Patient get response", patientResource);
      this.setState({ prefetchloading: false });
      if (patientResource.hasOwnProperty("resourceType") && patientResource.resourceType === 'Patient') {
        this.setState({ prefetchloading: false });
        this.setState({ patientResource: patientResource })
        this.setState({ firstName: patientResource.name[0].given })
        this.setState({ lastName: patientResource.name[0].family })
        this.setState({ gender: patientResource.gender })
        this.setState({ birthDate: patientResource.birthDate })
        this.setState({ patientState: patientResource.address[0].state })
        this.setState({ patientPostalCode: patientResource.address[0].postalCode })
      } else{
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
  }

  updateStateElement = (elementName, text) => {
    if (elementName === "selected_codes" && ["E1390", "E1391", "E0424", "E0439", "E1405", "E1406", "E0431", "E0434", "E1392", "E0433", "K0738", "E0441", "E0442", "E0443", "E0444"].indexOf(text[0])) {
      this.setState({ hook: "order-review" });
    } else {
      this.setState({ hook: "order-select" });
    }
    this.setState({ [elementName]: text });
  }
  async getHookFromCategory() {
    let category_name = this.state.category_name;
    let hook = this.state.hook;
    if (category_name === "Healthcare") {
      hook = "home-health-service";
    } else if (category_name === "Ambulate or other medical transport services") {
      hook = "ambulatory-transport";
    } else if (category_name === "Durable Medical Equipment") {
      hook = "home-oxygen-therapy";
    }
    this.setState({ hook: hook });
    console.log("hook ----", this.state.hook);
    return hook;
  }

  validateForm() {
    let formValidate = true;
    if (this.state.firstName === '' || this.state.lastName === '') {
      formValidate = false;
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
    const fhirClient = new Client({ baseUrl: this.state.config.provider_fhir_url });
    fhirClient.bearerToken = this.state.accessToken;
    let readResponse = await fhirClient.read({ resourceType: resourceType, id: resourceId });
    // console.log('Read Rsponse', readResponse)
    return readResponse;
  }

  async getPrefetchData() {
    // console.log(this.state.hook);
    var docs = [];
    if (this.state.hook === "patient-view") {
      var prefectInput = { "Patient": this.state.patientId };
    }
    else if (this.state.hook === "liver-transplant") {
      prefectInput = {
        "Patient": this.state.patientId,
        "Practitioner": this.state.practitionerId
      }
    }
    else if (this.state.hook === "order-review") {
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

  async getResourceData(token, prefectInput) {
    let headers = {
      "Content-Type": "application/json",
      'Authorization': "Bearer " + token
    }
    // console.log("Prefetch input--", JSON.stringify(prefectInput));
    const url = this.state.config.crd_url + "prefetch";
    await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(prefectInput),
    }).then((response) => {
      return response.json();
    }).then((response) => {
      this.setState({ prefetchData: response });
    })
  }

  medicationButton() {
    console.log('Medication')
    this.setState({ hookName: 'order-select' })
    // this.setState({patientId : ''})
    this.setState({ hook: null })
    // this.setState({quantity : ''})
    // this.setState({ service_code: "" })
    // this.setState({quantity : ''})

  }

  setRequestType(req) {
    this.setState({ request: req });
    if (req === "coverage-requirement") {
      this.setState({ auth_active: "" });
      this.setState({ req_active: "active" });
      this.setState({ hook: "" })
    }
    if (req === "patient-view") {
      this.setState({ auth_active: "active" });
      this.setState({ req_active: "" });
      this.setState({ request: "coverage-requirement" });
      this.setState({ hook: "patient-view" });
    }
    if (req === "config-view") {
      window.location = `${window.location.protocol}//${window.location.host}/configuration`;
    }
    if (req === "x12-converter") {
      window.location = `${window.location.protocol}//${window.location.host}/x12converter`;
    }
    if (req === "reporting-scenario") {
      window.location = `${window.location.protocol}//${window.location.host}/reportingScenario`;
    }
    if (req === "cdex-view") {
      window.location = `${window.location.protocol}//${window.location.host}/cdex`;
    }
  }

  setPatientView(req, res) {
    this.setState({ request: req });
    this.setState({ hook: res });
    this.setState({ auth_active: "active" });
    this.setState({ req_active: "" });
  }
  onFhirUrlChange(event) {
    this.setState({ fhirUrl: event.target.value });
    this.setState({ validateFhirUrl: false });
  }
  onAccessTokenChange(event) {
    this.setState({ accessToken: event.target.value });
    this.setState({ validateAccessToken: false });
  }
  onScopeChange(event) {
    this.setState({ scope: event.target.value });
  }
  onEncounterChange(event) {
    this.setState({ encounterId: event.target.value });
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
  // noRulesChange(event) {
  //   let noRules = this.state.noRules;
  //   noRules = !noRules;
  //   console.log("no rules toggle--" + noRules);
  //   this.setState({ noRules });
  // }
  onCoverageChange(event) {
    this.setState({ coverageId: event.target.value });
  }
  changeMedicationInput(event) {
    this.setState({ medicationInput: event.target.value });
  }
  changeMedicationStDate = (event, { name, value }) => {

    if (this.state.hasOwnProperty(name)) {
      this.setState({ [name]: value });
    }
  }
  changeMedicationEndDate = (event, { name, value }) => {
    if (this.state.hasOwnProperty(name))
      this.setState({ [name]: value });

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
      url = this.state.config.crd_order_review_url;
      url = "https://sm.mettles.com/crd/r4/cds-services/order-review-crd";
    }
    if (this.state.hook === 'order-select') {
      url = this.state.config.crd_url;
      url = "https://sm.mettles.com/crd/r4/cds-services/order-select-crd";
    }
    console.log("json_request", json_request, this.state.config.crd_url)
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
          self.setState({ loading: false, crd_error_msg: "Error while retrieving CRD Response, "+cardResponse['cards'][0].links[0].label });
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
    return (
      <React.Fragment>
        <div>
          <header id="inpageheader">
            <div className="container">

              <div id="logo" className="pull-left">
                <h1><a href="#intro" className="scrollto">Beryllium</a></h1>
                {/* <a href="#intro"><img src={process.env.PUBLIC_URL + "/assets/img/logo.png"} alt="" title="" /></a> */}
              </div>

              <nav id="nav-menu-container">
                <ul className="nav-menu">
                  <li className="menu-has-children"><a href="">{localStorage.getItem('username')}</a>
                    <ul>
                      <li><a href="" onClick={this.onClickLogout}>Logout</a></li>
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          <div id="main" style={{ marginTop: "92px" }}>

            <div className="form">
              <div className="container">
                <div className="section-header">
                  <h3>Prior Authorization
                  <div className="sub-heading">Submit your request to check for prior authorization.</div>
                  </h3>

                </div>
                {(this.state.hookName === 'order-review' || this.state.hookName === 'order-select') &&
                  <div>

                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title">Beneficiary Id</h4>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="patient" className="form-control" id="name" placeholder="Beneficiary Id"
                          value={this.state.patientId} onChange={this.onPatientChange}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                      <div className="form-group col-md-4">
                        <button type="button" onClick={this.handlePrefetch}>Prefetch
                        <div id="fse" className={"spinner " + (this.state.prefetchloading ? "visible" : "invisible")}>
                            <Loader
                              type="Oval"
                              color="#fff"
                              height={15}
                              width={15}
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title">Patient Info*</h4>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="firstName" className="form-control" id="name" placeholder="First Name"
                          value={this.state.firstName} onChange={this.onChangeFirstName}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="lastName" className="form-control" id="name" placeholder="Last Name"
                          value={this.state.lastName} onChange={this.onChangeLastName}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title"></h4>
                      </div>
                      <div className="form-group col-md-4">
                        <Dropdown
                          className={"blackBorder"}
                          options={this.state.genderOptions}
                          placeholder='Gender'
                          search
                          selection
                          fluid
                          value={this.state.gender}
                          onChange={this.handleGenderChange}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <DateInput
                          name="birthDate"
                          placeholder="Birth Date"
                          dateFormat="MM/DD/YYYY"
                          fluid
                          value={this.state.birthDate}
                          iconPosition="left"
                          onChange={this.changebirthDate}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title"></h4>
                      </div>
                      <div className="form-group col-md-4">
                        <Dropdown
                          className={"blackBorder"}
                          options={this.state.stateOptions}
                          placeholder='State'
                          search
                          selection
                          fluid
                          value={this.state.patientState}
                          onChange={this.handlePatientStateChange}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="patientPostalCoade" className="form-control" id="name" placeholder="Postal Code"
                          value={this.state.patientPostalCode} onChange={this.onPatientPostalChange}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                    </div>

                    {/* {this.state.validatePatient === true &&
                      <div className='errorMsg dropdown'>{this.props.config.errorMsg}</div>
                    } */}
                  </div>}
                {this.state.coverageResources.length > 0 &&
                  <div className="form-row">
                    <div className="form-group col-md-3 offset-1">
                      <h4 className="title">Select Coverage</h4>
                    </div>
                    <div className="form-group col-md-8">
                      {this.state.coverageResources.map((element) => {
                        return (
                          <div key={element.id}>
                            <button
                              className={"radio-button btn " + (this.state.coverageId === element.id ? "selected" : null)}
                              onClick={() => {
                                this.setCoverage(element)
                              }}
                            >
                            </button>
                            <span className="text-radio tooltip-x">
                              <div><b>Coverage</b></div>
                              {/* <div><b>Status</b>: {element.status}</div> */}
                              {/* <div><b>Subscriber</b>: {element.subscriber.display}</div> */}
                              <div><b>Beneficiary</b>: {element.beneficiary.display}</div>
                              {/* <div><b>Coverage Start Date</b>: {dateFormat(element.period.start,"fulldate")}</div> */}
                              <div><b>Payor</b>: {element.payor[0].display}</div>
                              {/* <div><b>Class</b>: plan: Value: {element.class[0].value} Name: {element.class[0].name}</div> */}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>}
                {this.state.coverageResources.length === 0 &&
                  <SelectPayer elementName='payer' updateCB={this.updateStateElement} />
                }
                <DropdownServiceCode elementName="selected_codes" updateCB={this.updateStateElement} />

                <div className="form-row">
                  <div className="form-group col-md-3 offset-1">
                    <h4 className="title">Quantity</h4>
                  </div>
                  <div className="form-group col-md-8">
                    <input type="text" name="quantity" className="form-control" id="name" placeholder="Quantity"
                      value={this.state.quantity} onChange={this.onQuantityChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-3 offset-1">
                    <h4 className="title">NPI</h4>
                  </div>
                  <div className="form-group col-md-8">
                    <input type="text" name="practitioner" className="form-control" id="name" placeholder="Practitioner NPI"
                      value={this.state.practitionerId} onChange={this.onPractitionerChange}
                      data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                    <div className="validation"></div>
                  </div>
                </div>
                {/* <div className="form-row">
                  <div className="form-group col-md-3 offset-1">
                    <h4 className="title">No Rules</h4>
                  </div>
                  <div className="form-group col-md-8">
                    <input type="checkbox" style={{ "marginLeft": "-350px" }} name="noRules" className="form-control" id="noRules"
                      checked={this.state.noRules} onChange={this.noRulesChange} />
                  </div>
                </div> */}
                <div className="text-center">
                  <button type="button" onClick={this.startLoading}>Submit
                    <div id="fse" className={"spinner " + (this.state.loading ? "visible" : "invisible")}>
                      <Loader
                        type="Oval"
                        color="#fff"
                        height={15}
                        width={15}
                      />
                    </div>
                  </button>
                </div>
                <div>
                  {this.state.crd_error_msg &&
                    <div className="text-center"><p>{this.state.crd_error_msg}</p></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment >);
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
    var tempURL = sessionStorage.getItem("serviceUri") + "/" + org_ref;
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
      // if (noRules) {
      //   organization["id"] = "default_" + this.state.payer
      // } else {
      //   organization["id"] = this.state.payer
      // }
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
      coverage = this.state.coverage;
      sessionStorage.setItem("coverage", JSON.stringify(coverage))
      if (coverage.hasOwnProperty("payor")) {
        let org_ref = coverage.payor[0].reference
        let org = await this.getOrganization(org_ref)
        if (org) {
          organization = org
          sessionStorage.setItem("organization", JSON.stringify(organization))
        }
      }
    }
    let selected_codes = this.state.selected_codes;
    let serviceRequest = {
      "resourceType": "ServiceRequest",
      "identifier": [
        {
          "value": this.randomString()
        }
      ],
      "status": "draft",
      "intent": "order",
      "category": [],
      "subject": {
        "reference": "Patient/" + patientId
      },
      "quantity": { "value": this.state.quantity },
      "authoredOn": "2013-05-08T09:33:27+07:00",
      "insurance": [
        {
          "reference": "Coverage/" + coverage.id
        }
      ],
      "performer": {
        "reference": "PractitionerRole/practitioner1"
      }
    }

    for (var i = 0; i < selected_codes.length; i++) {
      let obj = {
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": selected_codes[i]
            }
          ],
        }
      }
      if (i == 0) {
        serviceRequest["code"] = obj.code;
      }
      serviceRequest.category.push(obj)
    }
    let deviceRequest = {
      "resourceType": "DeviceRequest",
      "identifier": [
        {
          "value": this.randomString()
        }
      ],
      "status": "draft",
      "intent": "order",
      "parameter": [],
      "subject": {
        "reference": "Patient/" + patientId
      },
      "authoredOn": "2013-05-08T09:33:27+07:00",
      "insurance": [
        {
          "reference": "Coverage/" + coverage.id
        }
      ],
      "performer": {
        "reference": "PractitionerRole/practitioner1"
      }
    }
    for (var i = 0; i < selected_codes.length; i++) {
      let obj = {
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": selected_codes[i]
            }
          ],
        },
        "valueQuantity": {
          "value": this.state.quantity,
        }
      }
      if (i == 0) {
        deviceRequest["codeCodeableConcept"] = obj.code;
      }
      deviceRequest.parameter.push(obj)
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
    let requestEntryObj = {}
    let prefetchObj = {}
    if (this.state.hook === "order-review") {
      prefetchObj = {
        "deviceRequestBundle": {
          "resourceType": "Bundle",
          "type": "collection",
          "entry": [
            {
              "resource": deviceRequest
            },
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
      requestEntryObj = {
        resource: deviceRequest
      }
    } else {
      prefetchObj = {
        "serviceRequestBundle": {
          "resourceType": "Bundle",
          "type": "collection",
          "entry": [
            {
              "resource": serviceRequest
            },
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
      requestEntryObj = {
        resource: serviceRequest
      }
    }
    let request = {
      hook: this.state.hook,
      hookInstance: "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
      fhirServer: this.state.config.provider_fhir_url,
      fhirAuthorization: {
        "access_token": this.state.accessToken,
        "token_type": "Bearer",
        "expires_in": 300,
        "scope": "patient/Patient.read patient/Observation.read",
        "subject": "cds-service"
      },
      user: "Practitioner/" + this.state.practitionerId,
      context: {
        patientId: patientId,
        orders: {
          resourceType: "Bundle",
          entry: [
            requestEntryObj
          ]
        }
      },
      "prefetch": prefetchObj
    };
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


