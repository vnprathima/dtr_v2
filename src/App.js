import React, { Component } from "react";
import { hot } from "react-hot-loader";
// import "./App.css";
import cqlfhir from "cql-exec-fhir";
import executeElm from "./elmExecutor/executeElm";
import fetchArtifacts from "./util/fetchArtifacts";
//import Testing from "./components/ConsoleBox/Testing";
import UiFactory from "./UiFactory.js";
// import sample from './sample_questionnaire.json';


// aggregateTranslations({ configPath: './terraI18n.config.js' });


//window.alert("in App.js")
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questionnaire: null,
      cqlPrepoulationResults: null,
      serviceRequest: null,
      bundle: null,
      logs: [],
      claimEndpoint: null
    }
    this.smart = props.smart;
    this.consoleLog = this.consoleLog.bind(this);
    sessionStorage['UI_TYPE'] = "cerner_ui";
    this.ui = new UiFactory().getUi();

  }

  componentDidMount() {
    const fhirWrapper = cqlfhir.FHIRWrapper.FHIRv300();
    this.consoleLog("fetching artifacts", "infoClass");
    //window.alert("fetchartifacts in componentDidMount-- ");
    fetchArtifacts(this.props.FHIR_URI_PREFIX, this.props.questionnaireUri, this.smart, this.props.filepath, this.consoleLog)
      .then(artifacts => {
        //window.alert("Got Requirements to load ");
        console.log("fetched needed artifacts:", artifacts)
        this.setState({ "claimEndpoint": artifacts.claimEndpoint })
        sessionStorage['claim_endpoint'] = artifacts.claimEndpoint;
        this.setState({ questionnaire: artifacts.questionnaire })
        this.setState({ serviceRequest: this.props.serviceRequest })
        console.log("device request--", this.props.serviceRequest, artifacts.dataRequirement);
        // if (this.props.serviceRequest) {
        //   var filtered = artifacts.dataRequirement.filter(function (value, index, arr) {
        //     return value.type !== "Procedure";
        //   });
        //   console.log("filtered requirements", filtered);
        //   this.props.serviceRequest.category.forEach(code => {
        //     console.log(code);
        //     if (code.code.coding[0].code) {
        //       let obj = {
        //         type: "Procedure",
        //         "codeFilter": [{ path: "code", valueSetString: code.code.coding[0].code }]
        //       }
        //       filtered.push(obj);
        //     }
        //   });
        //   console.log("requirements---", filtered);
        // }
        const executionInputs = {
          dataRequirement: artifacts.dataRequirement,
          elm: artifacts.mainLibraryElm,
          elmDependencies: artifacts.dependentElms,
          valueSetDB: {},
          parameters: { device_request: this.props.serviceRequest }
        }
        this.consoleLog("executing elm", "infoClass");
        return executeElm(this.smart, "r4", executionInputs, this.consoleLog);
      })
      .then(cqlResults => {
        this.consoleLog("executed cql, result:" + JSON.stringify(cqlResults), "infoClass");
        this.setState({ bundle: cqlResults.bundle })
        this.setState({ cqlPrepoulationResults: cqlResults.elmResults })
      });
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
    console.log("93 App.js",this.state.questionnaire, this.state.bundle , this.state.cqlPrepoulationResults,this.state.questionnaire && this.state.bundle && this.state.cqlPrepoulationResults)
    if (this.state.questionnaire && this.state.bundle && this.state.cqlPrepoulationResults) {
      return (this.ui.getQuestionnaireFormApp(this.smart,this.state.questionnaire,this.state.cqlPrepoulationResults,
                                                this.state.serviceRequest,this.state.bundle,this.state.claimEndpoint)
        );
    } else {
      return (this.ui.getError(this.state.logs));
    }
  }
}
//window.alert("after  App class")
export default hot(module)(App);
