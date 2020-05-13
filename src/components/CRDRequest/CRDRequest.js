
import React, { Component } from 'react';
import { hot } from "react-hot-loader";
import "react-datepicker/dist/react-datepicker.css";
import "../../index.css";
import "../../components/ConsoleBox/consoleBox.css";
import "isomorphic-fetch";
import UiFactory from "../../ui/UiFactory.js";
import globalConfig from '../../globalConfiguration.json';
import { hasTokenExpired, fetchFhirResource, randomString, postResource, convertDate } from '../../util/util.js';

class CRDRequest extends Component {
  constructor(props) {
    super(props);
    this.ui = new UiFactory().getUi();
    this.state = {
      loadingTabels: true,
      patientId: sessionStorage.getItem('auth_patient_id') !== undefined ? sessionStorage.getItem('auth_patient_id') : '',
      encounterId: '',
      coverageId: '',
      loading: false,
      hook: "order-select",
      selected_codes: [],
      quantity: 1,
      prefetch: false,
      patientResource: '',
      prefetchloading: false,
      coverageResources: [],
      coverage: {},
      crd_error_msg: '',
      encounters: [],
      provider_fhir_url: sessionStorage.getItem("serviceUri"),
      prior_auth_records: [
      ],
      tokenExpired: false,
      showError: false,
      errorType: '',
      showPatientField: false,
      order_pa: "PA"
    }
    this.startLoading = this.startLoading.bind(this);
    this.submit_info = this.submit_info.bind(this);
    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.checkRequestStatus = this.checkRequestStatus.bind(this);
    this.onPatientChange = this.onPatientChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    this.setState({ showError: hasTokenExpired() });
    if (!this.state.showError) {
      await this.handlePrefetch();
    } else {
      this.setState({ errorType: "token" })
    }
    await this.getRequests()
  }
  onPatientChange(event) {
    console.log("event.target.value", event.target.value)
    this.setState({ patientId: event.target.value });
  }

  handleChange(e, { name, value }) {
    console.log("In on change---", name, value);
    this.setState({ [name]: value })
    sessionStorage.setItem("order_pa", value);
  }

  async getRequests() {
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      "Cache-Control": "no-cache,no-store",
      "Access-Control-Allow-Origin": "*",
      'Authorization': "Basic " + btoa(globalConfig.odoo_username + ":" + globalConfig.odoo_password)
    }
    const url = globalConfig.restURL + "/api/pa_info/" + this.state.patientId;
    let res = fetch(url, {
      method: "GET",
      headers: headers,
    }).then((response) => {
      this.setState({ loadingTabels: false })
      return response.json();
    }).then((response) => {
      console.log("requests recccss", response);
      this.setState({ prior_auth_records: response.result, loadingTabels: false })
      return response
    })
    return res;
  }


  async checkRequestStatus(rec) {
    console.log("check stattt records", rec.index,rec);
    let prior_auth_records = this.state.prior_auth_records
    prior_auth_records[rec.index].checking = true
    this.setState({ prior_auth_records })
    if (rec.claim_response_id != undefined) {

      let claim_response_url = "https://sm.mettles.com/other_payerfhir/hapi-fhir-jpaserver/fhir/ClaimResponse/" + rec.claim_response_id;
      if(rec.claim_response != "" && rec.claim_response != undefined && rec.claim_response != null){
        let claim_response = (0, eval)('(' + rec.claim_response + ')');
        claim_response_url = claim_response.res_url;
        console.log("Claimm Resss URL",claim_response_url)
      }
      let fhirHeaders = {
        'Content-Type': 'application/fhir+json',
        "Cache-Control": "no-cache,no-store"
      }
      await fetch(claim_response_url, {
        method: "GET",
        headers: fhirHeaders

      }).then((response) => {
        return response.json();
      }).then(async (response) => {
        console.log("claim Resppsps", response);
        if (response.hasOwnProperty("outcome")) {
          // response.outcome = "complete"
          if (response.outcome == "complete") {

            let headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              "Cache-Control": "no-store",
              "Access-Control-Allow-Origin": "*",
              'Authorization': "Basic " + btoa(globalConfig.odoo_username + ":" + globalConfig.odoo_password)
            }
            let url = globalConfig.restURL + "/api/pa_info_cri/" + this.state.patientId + "/" + rec.claim_response_id;
            let codesString = ""
            try {
              await fetch(url, {
                method: "GET",
                headers: headers,
              }).then((response) => {
                return response.json();
              }).then((response) => {
                console.log("!!Record found", response);
                if (response.hasOwnProperty("result")) {
                  response.result.map((rec) => {
                    if (codesString != "") {
                      codesString = codesString + "," + rec.codes
                    }
                    else {
                      codesString = rec.codes
                    }
                  })
                }
                return response
              })
            }
            catch (e) {
              console.log(e)

            }
            try {
              await fetch(url, {
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
            try {
              let date = new Date(response.created)
              let body = {
                "type": "completed",
                "date": date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                "patient_id": this.state.patientId,
                "claim_response_id": response.id,
                "claim_response": response,
                "prior_auth_ref": response.preAuthRef,
                "codes": codesString
              }

              await this.createRequest(body)
              await this.getRequests();
            }
            catch (e) {
              console.log("Error!!", e)
            }
          }
          else {
            prior_auth_records[rec.index].checking = false
            this.setState({ prior_auth_records })
          }
        }
        else {
          // console.log("in else 2",prior_auth_records[rec.index])
          prior_auth_records[rec.index].checking = false
          this.setState({ prior_auth_records })
        }
        //this.setState({prior_auth_records:response.result})
        return response
      })
      return true
    }

    prior_auth_records[rec.index].checking = false
    this.setState({ prior_auth_records })
    return false;
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

  handlePrefetch = async () => {
    if (this.state.patientId !== null) {
      this.setState({ prefetch: true });
      this.setState({ prefetchloading: true });
      await fetchFhirResource(this.state.provider_fhir_url,
        "Patient/" + this.state.patientId, {}, "Bearer " + sessionStorage.getItem("token")).then(async (patientResource) => {
          console.log("Patient get response", patientResource);
          this.setState({ prefetchloading: false });
          if (patientResource.hasOwnProperty("resourceType") && patientResource.resourceType === 'Patient') {
            this.setState({ prefetchloading: false });
            this.setState({ patientResource: patientResource })
            await fetchFhirResource(this.state.provider_fhir_url,
              "Encounter", { "patient": this.state.patientId }, "Bearer " + sessionStorage.getItem("token")).then(async (encounterRes) => {
                if (encounterRes.resourceType === "Bundle" && encounterRes.entry.length > 0) {
                  this.setState({ encounters: encounterRes.entry })
                }
              }).catch((reason) => {
                this.setState({ "showError": true, "errorType": "token" });
              });
            await fetchFhirResource(this.state.provider_fhir_url,
              "Coverage", { "patient": this.state.patientId }, "Bearer " + sessionStorage.getItem("token")).then(async (coverageRes) => {
                console.log("Coverage resource", coverageRes.total);
                if (coverageRes.total > 0) {
                  let coverageResources = this.state.coverageResources
                  let coverageId = false;
                  for (var r in coverageRes.entry) {
                    coverageId = coverageRes.entry[r].resource.id
                    coverageResources.push(coverageRes.entry[r].resource);
                  }
                  this.setState({ coverageResources: coverageResources, coverageId: coverageId });
                  console.log("Coversge resources", this.state.coverageResources)
                }
              }).catch((reason) => {
                this.setState({ "showError": true, "errorType": "token" });
              });
          } else {
            this.setState({ "showError": true, "errorType": "token" });
          }
        }).catch((reason) => {
          this.setState({ "showError": true, "errorType": "token" });
        });
    } else {
      if (this.state.showPatientField !== true) {
        this.setState({ "showPatientField": true });
      }
    }
  }

  updateStateElement = (elementName, text) => {
    let value = text;
    if (elementName === "selected_codes") {
      if (text.hasOwnProperty("codes") && globalConfig.order_review_codes.indexOf(text.codes[0]) >= 0) {
        this.setState({ hook: "order-sign" });
      }
      else {
        this.setState({ hook: "order-select" });
      }
      value = text.codeObjects;
    }
    this.setState({ [elementName]: value });
  }

  validateForm() {
    let formValidate = true;
    if (this.state.firstName === '' || this.state.lastName === '') {
      formValidate = false;
    }
    if (this.state.coverageId === "") {
      formValidate = false;
      this.setState({ loading: false, crd_error_msg: "Unable to Submit Request. No Coverage Information Found !!" });
    }
    if (this.state.encounterId === "") {
      formValidate = false;
      this.setState({ loading: false, crd_error_msg: "Unable to Submit Request. No Encounter Information Found !!" });
    }
    if (Array.isArray(this.state.selected_codes) && this.state.selected_codes.length === 0) {
      formValidate = false;
      this.setState({ "crd_error_msg": "Please select atleast one code !!" });
      return formValidate;
    }
    return formValidate;
  }

  startLoading() {
    this.setState({ tokenExpired: hasTokenExpired() });
    if (!this.state.tokenExpired) {
      if (this.validateForm()) {
        this.setState({ loading: true }, () => {
          this.submit_info();
        })
      }
    }
  }

  submitDraftPA(draftPA) {
    this.setState({ tokenExpired: hasTokenExpired() });
    if (!this.state.tokenExpired) {
      let appContextId = randomString();
      let appContext = (0, eval)('(' + draftPA.app_context + ')');

      console.log("Random - appcontextID",appContextId)
      localStorage.setItem("crdRequest",JSON.stringify(appContext.crdRequest));
      sessionStorage.setItem("appContextId", appContextId);
      sessionStorage.setItem(appContextId, JSON.stringify(appContext));

      sessionStorage.setItem("showCDSHook", false);
      window.location.href = "/index?appContextId=" + appContextId
    }
  }

  onQuantityChange(event) {
    this.setState({ quantity: event.target.value });
  }

  setCoverage(coverage) {
    let coverageId = coverage.id;
    this.setState({ coverageId })
    this.setState({ coverage });
  }

  async submit_info() {
    let json_request = await this.getJson();
    let url = '';
    if (this.state.hook === 'order-sign') {
      url = globalConfig.order_review_url;
    }
    if (this.state.hook === 'order-select') {
      url = globalConfig.order_select_url;
    }
    let self = this;
    localStorage.setItem("crdRequest", JSON.stringify(json_request.context.draftOrders.entry[0].resource));
    postResource(url, '', json_request).then((cardResponse) => {
      if (cardResponse) {
        console.log("CRD Response---", cardResponse);
        if (cardResponse.hasOwnProperty("cards") && cardResponse.cards !== null) {
          let appContext = '';
          let appContextId = randomString();
          let smarAppLink = cardResponse['cards'][0].links.find(link => link.type === "smart")
          if (smarAppLink) {
            try {
              appContext = smarAppLink.appContext;
              appContext = escape(JSON.stringify({ "request": sessionStorage.getItem("requestId"), "template": "302800" }))
              console.log("unescape appContext----", unescape(appContext));
              appContext = unescape(appContext);
              appContext = JSON.parse(appContext);
              appContext["crdRequest"] = JSON.parse(localStorage.getItem("crdRequest"));
              sessionStorage.setItem("appContextId", appContextId);
              sessionStorage.setItem(appContextId, JSON.stringify(appContext));
              sessionStorage.setItem("showCDSHook", false);
              self.setState({ response: cardResponse });
              if (appContext !== null && appContext !== '') {
                window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?appContextId=${appContextId}`;
              } else {
                self.setState({ loading: false, crd_error_msg: "Error while retrieving CRD Response, " + cardResponse['cards'][0].links[0].label });
              }
            } catch (err) {
              console.log("erreo---",err);
              self.setState({ loading: false, crd_error_msg: "Prior Authorization is not necessary !!" });
            }
          } else {
            self.setState({ loading: false, crd_error_msg: "Prior Authorization is not necessary !!" });
          }
        } else {
          self.setState({ loading: false, crd_error_msg: "Invalid CRD Response !!" });
        }
      } else {
        self.setState({ loading: false, crd_error_msg: "Unable to get CRD Response !! Please try again." });
      }
    })
  }

  async getJson() {
    var patientId = this.state.patientId;
    let organization = {}
    var performer = []
    let prefetch = {}
    let prefetchObj = {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": []
    }
    if (this.state.hook === "order-sign") {
      prefetch = {
        "deviceRequestBundle": prefetchObj
      }
    } else {
      prefetch = {
        "serviceRequestBundle": prefetchObj
      }
    }
    prefetchObj.entry.push({ "resource": this.state.patientResource });

    if (this.state.coverageId !== '') {
      console.log("Coverage resources--", this.state.coverageResources, this.state.coverageId)
      let coverage = this.state.coverageResources.find(cov => cov.id === this.state.coverageId);
      prefetchObj.entry.push({ "resource": coverage });
      sessionStorage.setItem("coverage", JSON.stringify(coverage))
      if (coverage.hasOwnProperty("payor")) {
        let org_ref = coverage.payor[0].reference
        await fetchFhirResource(this.state.provider_fhir_url, org_ref, {},
          "Bearer " + sessionStorage.getItem("token")).then((org) => {
            if (org.resourceType === "OperationOutcome") {
              this.setState({ "showError": true, "errorType": "token" });
            } else {
              prefetchObj.entry.push({ "resource": org });
              sessionStorage.setItem("organization", JSON.stringify(organization))
            }
          });
      }
    }
    if (this.state.encounterId !== '') {
      console.log("Encounters resources--", this.state.encounters, this.state.encounterId)
      let encounter = this.state.encounters.find(enc => enc.resource.id === this.state.encounterId);
      encounter = encounter.resource;
      console.log("Encounter---", encounter);
      prefetchObj.entry.push({ "resource": encounter });
      sessionStorage.setItem("encounter", JSON.stringify(encounter))
      if (encounter.hasOwnProperty("participant")) {
        await Promise.all(encounter.participant.map(async (individual) => {
          await fetchFhirResource(this.state.provider_fhir_url, individual.individual.reference,
            {}, "Bearer " + sessionStorage.getItem("token")).then((res) => {
              if (res.resourceType === "OperationOutcome") {
                this.setState({ "showError": true, "errorType": "token" });
              } else {
                prefetchObj.entry.push({ "resource": res });
                performer.push({
                  "reference": res.resourceType + "/" + res.id
                })
                console.log("performer---", performer);
              }
            })
        }))
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
        "scope": "patient/Patient.read patient/Coverage.read patient/Encounter.read",
        "subject": "cds-service"
      },
      context: {
        patientId: patientId,
        encounterId: this.state.encounterId,
        userId: performer[0].reference,
        draftOrders: {
          resourceType: "Bundle",
          entry: []
        }
      },
      "prefetch": prefetch
    };
    let selected_codes = this.state.selected_codes;
    console.log("selected codes---", selected_codes);
    let resourceType = "ServiceRequest"
    if (this.state.hook === "order-sign") {
      resourceType = "DeviceRequest"
    } else {
      request.context["selections"] = []
    }
    for (var i = 0; i < selected_codes.length; i++) {
      let requestId = randomString();
      sessionStorage.setItem("requestId", requestId);
      let requestResource = {
        "resourceType": resourceType,
        "id": requestId,
        "identifier": [
          {
            "system": "http://identifiers.mettles.com/prior_authorization",
            "value": randomString()
          }
        ],
        "status": "draft",
        "intent": "order",
        "subject": {
          "reference": "Patient/" + patientId
        },
        "authoredOn": convertDate(new Date(), "isoUtcDateTime"),
        "insurance": [
          {
            "reference": "Coverage/" + this.state.coverageId
          }
        ],
        "encounter": {
          "reference": "Encounter/" + this.state.encounterId
        },
        "performer": performer,
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": selected_codes[i].value,
              "display": selected_codes[i].code_description
            }
          ],
        }
      }
      if (resourceType === "ServiceRequest") {
        requestResource["quantityQuantity"] = { "value": selected_codes[i].quantity }
        let requestReference = "ServiceRequest/" + requestId
        request.context.selections.push(requestReference);
        //Add request in prefetch
        request.prefetch.serviceRequestBundle.entry.push({ "resource": requestResource });
      } else {
        //Add request in prefetch
        request.prefetch.deviceRequestBundle.entry.push({ "resource": requestResource });
      }
      //Add request in context
      request.context.draftOrders.entry.push({ "resource": requestResource });
    }


    return request;
  }
  render() {
    return (
      <div className="attributes mdl-grid">
        {this.ui.getCRDRequestForm(this)}
      </div>)
  }
}
export default hot(module)(CRDRequest);