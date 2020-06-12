import React, { Component } from "react";
import { hot } from "react-hot-loader";
import "./App.css";
import cqlfhir from "cql-exec-fhir";
import executeElm from "./elmExecutor/executeElm";
import fetchArtifacts from "./util/fetchArtifacts";
//import Testing from "./components/ConsoleBox/Testing";
import UiFactory from "./ui/UiFactory.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questionnaire: null,
      cqlPrepoulationResults: null,
      request: null,
      requestType: null,
      bundle: null,
      logs: []
    }
    this.smart = props.smart;
    this.consoleLog = this.consoleLog.bind(this);
    sessionStorage['UI_TYPE'] = "cerner_ui";
    this.ui = new UiFactory().getUi();

  }

  componentDidMount() {
    const fhirWrapper = cqlfhir.FHIRWrapper.FHIRv300();
    this.consoleLog("fetching artifacts", "infoClass");
    fetchArtifacts(this.props.FHIR_URI_PREFIX, this.props.questionnaireUri, this.smart, this.props.filepath, this.consoleLog)
      .then(artifacts => {
        //window.alert("Got Requirements to load ");
        console.log("fetched needed artifacts:", artifacts)
        this.setState({ questionnaire: artifacts.questionnaire });
        console.log("crd--", sessionStorage.getItem("crdRequest"))
        if (sessionStorage.getItem("crdRequest") !== undefined && sessionStorage.getItem("crdRequest") !== null) {
          console.log("crd----if--", sessionStorage.getItem("crdRequest"))
          var request = JSON.parse(sessionStorage.getItem("crdRequest"));
          return this.executeCql(request, artifacts)
        } else {
          console.log("else--", this.props.requestId);
          var reqId = this.props.requestId;
          console.log("Req Id---", reqId);
          return this.smart.patient.api
            .search({ type: "DeviceRequest", query: { "_id": reqId } })
            .then((response) => {
              console.log("Device Request-res--", response);
              if (response.data && response.data.resourceType === "Bundle") {
                if (response.data.entry) {
                  request = response.data.entry[0].resource;
                  return this.executeCql(request, artifacts);
                } else {
                  this.smart.patient.api
                    .search({ type: "ServiceRequest", query: { "_id": reqId } })
                    .then((response) => {
                      if (response.data && response.data.resourceType === "Bundle") {
                        if (response.data.entry) {
                          request = response.data.entry[0].resource;
                          return this.executeCql(request, artifacts);
                        }
                      }
                    });
                }
              }
            }, (err) => {
              console.log("servicereq error---", err);
              this.smart.patient.api
                .search({ type: "ServiceRequest", query: { "_id": reqId } })
                .then((response) => {
                  if (response.data && response.data.resourceType === "Bundle") {
                    if (response.data.entry) {
                      request = response.data.entry[0].resource;
                      return this.executeCql(request, artifacts);
                    }
                  } else {
                    this.consoleLog("ServiceRequest/DeviceRequest not found !!", "errorClass");
                  }
                }, (err) => {
                  this.consoleLog("ServiceRequest/DeviceRequest not found !!", "errorClass");
                });
            });
        }
      })
      .then(cqlResults => {
        this.consoleLog("executed cql, result:" + JSON.stringify(cqlResults), "infoClass");
        this.setState({ bundle: cqlResults.bundle })
        this.setState({ cqlPrepoulationResults: cqlResults.elmResults })
      });
  }

  executeCql(request, artifacts) {
    let parameters = {}
    var requestType = request.resourceType
    this.setState({requestType});
    this.setState({ request });
    if (requestType === "ServiceRequest") {
      parameters["service_request"] = request
    }
    else if (requestType === "DeviceRequest") {
      parameters["device_request"] = request
    }

    console.log("request Type--", request, requestType, artifacts.dataRequirement);
    const executionInputs = {
      dataRequirement: artifacts.dataRequirement,
      elm: artifacts.mainLibraryElm,
      elmDependencies: artifacts.dependentElms,
      valueSetDB: {},
      parameters: parameters
    }
    this.consoleLog("executing cql", "infoClass");
    return executeElm(this.smart, "r4", executionInputs, this.consoleLog);
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

  render() {
    //window.alert("before render");	
    // console.log("93 App.js",this.state.questionnaire, this.state.bundle , this.state.cqlPrepoulationResults,this.state.questionnaire && this.state.bundle && this.state.cqlPrepoulationResults)
    if (this.state.questionnaire && this.state.bundle && this.state.cqlPrepoulationResults) {
      return (this.ui.getQuestionnaireFormApp(this.smart, this.state.questionnaire, this.state.cqlPrepoulationResults,
        this.state.request, this.state.bundle)
      );
    } else {
      return (this.ui.getError(this.state.logs));
    }
  }
}
//window.alert("after  App class")
export default hot(module)(App);
