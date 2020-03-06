import React, { Component } from "react";
import Testing from "./components/ConsoleBox/Testing";
import TextInput from './components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "./components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from './components/Inputs/ChoiceInput/ChoiceInput';
import DocumentInput from './components/Inputs/DocumentInput/DocumentInput';
import Loader from 'react-loader-spinner';
import BooleanInput from './components/Inputs/BooleanInput/BooleanInput';
import DropdownServiceCode from './components/DropdownServiceCode';

import DropdownCoverage from './components/DropdownCoverage';

import { DateInput } from 'semantic-ui-calendar-react';

import { Dropdown } from 'semantic-ui-react';

import DropdownEncounter from './components/DropdownEncounter';
import SelectPayer from './components/SelectPayer';
import ProviderRequest from "./ProviderRequest";
import './index.css';
import './components/consoleBox.css';

export default class GenericUi {
  constructor(props) {

  }
  getError(logs) {
    return (
      <div className="App">
        <p>Loading...</p>
        <Testing logs={logs} />
      </div>
    );
  }

  getProviderRequestUI() {
    return (<ProviderRequest />);
  }

  getProviderRequestForm(inputThis) {
    return (
      <React.Fragment>
        <div>
          <div id="main">
            <div className="form">
              <div className="container">
                <h4>CRD Request</h4>
                <div className="row">
                  <div className="col-6">
                    <DropdownServiceCode elementName="selected_codes" updateCB={inputThis.updateStateElement} />
                  </div>
                  <div className="col-6">
                    {inputThis.state.encounters.length > 0 &&
                      <div className="form-row">
                        <div className="form-group col-md-3 offset-1">
                          <h4 className="title">Encounter</h4>
                        </div>
                        <div className="form-group col-md-8">
                          <DropdownEncounter elementName="encounterId" encounters={inputThis.state.encounters} updateCB={inputThis.updateStateElement} />
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <div className="text-center">
                  <button type="button" onClick={inputThis.startLoading}>Submit
                    <div id="fse" className={"spinner " + (inputThis.state.loading ? "visible" : "invisible")}>
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
                  {inputThis.state.crd_error_msg &&
                    <div className="text-center"><p>{inputThis.state.crd_error_msg}</p></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment >)
  }


  getQuestionnaireFormApp(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
    return (
      <div className="App">{this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
        serviceRequest, bundle, claimEndpoint)}</div>
    );
  }
  getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
    return (<QuestionnaireForm smart={smart} qform={questionnaire}
      cqlPrepoulationResults={cqlPrepoulationResults}
      serviceRequest={serviceRequest} bundle={bundle}
      claimEndpoint={claimEndpoint} />);

  }
  getQuestionnaireTemplate(inputThis, toggleFilledFields, title, items, renderComponent, showPreview, priorAuthBundle, previewloading, loading) {
    return (
      <div>
        <div className="floating-tools">
          <p className="filter-filled" >Show Prefilled : <input type="checkbox" onClick={() => {
            inputThis.toggleFilledFields();
          }}></input></p>
        </div>
        <div className="container">
          <div className="section-header">
            <h3>{title}</h3>
          </div>
        </div>
        {/* <div className="sidenav">
                {this.state.orderedLinks.map((e) => {
                    if (Object.keys(this.state.sectionLinks).indexOf(e) < 0) {
                        const value = this.state.values[e];
                        let extraClass;
                        let indicator;
                        if (this.state.itemTypes[e] && this.state.itemTypes[e].enabled) {
                            extraClass = (this.isNotEmpty(value) ? "sidenav-active" : "")
                            indicator = true;
                        } else {
                            if (this.isNotEmpty(value) && this.state.turnOffValues.indexOf(e) > -1) {
                                extraClass = "sidenav-manually-disabled";
                            } else if (value) {
                                extraClass = "sidenav-disabled filled"
                            } else {
                                extraClass = "sidenav-disabled"
                            }

                        }
                        return <div
                            key={e}
                            className={"sidenav-box " + extraClass}
                            onClick={() => {
                                indicator ? window.scrollTo(0, this.state.itemTypes[e].ref.current.previousSibling.offsetTop) : null;
                            }}
                        >
                            {e}
                        </div>
                    }
                })}
                <div className="sidenav-box "></div>
            </div> */}
        <div className="wrapper1">
          {
            items.map((item) => {
              return renderComponent(item, 0);
            })
          }
          <div style={{ marginBottom: "30px" }}>
            <DocumentInput
              updateCallback={this.updateDocuments}
            />
          </div >
          {showPreview &&
            <div><pre style={{ background: "#dee2e6", height: "500px" }}> {JSON.stringify(priorAuthBundle, null, 2)}</pre></div>
          }
          <div className="text-center" style={{ marginBottom: "50px" }}>
            <button type="button" style={{ background: "grey" }} onClick={this.previewBundle}>Preview
                                <div id="fse" className={"spinner " + (previewloading ? "visible" : "invisible")}>
                <Loader
                  type="Oval"
                  color="#fff"
                  height={15}
                  width={15}
                />
              </div>
            </button>
            <button type="button" onClick={this.outputResponse}>Submit Prior Authorization
                                <div id="fse" className={"spinner " + (loading ? "visible" : "invisible")}>
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
      </div>
    );
  }

  getClaimResponseTemplate(claimMessage, claimResponse, resloading, showBundle, claimResponseBundle) {
    return (
      <div>
        <div style={{ fontSize: "1.5em", background: "#98ce94", padding: "10px" }}> {claimMessage}</div>
        <div className="form-row">
          <div className="col-3">Status</div>
          {claimResponse.status === "active" &&
            <div className="col-6">: Affirmed</div>
          }
          {claimResponse.status !== "active" &&
            <div className="col-6">: {claimResponse.status}</div>
          }
        </div>
        <div className="form-row">
          <div className="col-3">Outcome</div>
          <div className="col-6">: {claimResponse.outcome}</div>
        </div>
        {claimResponse.outcome !== "queued" &&
          <div className="form-row">
            <div className="col-3">Prior Auth Reference No</div>
            <div className="col-6">: {claimResponse.preAuthRef}</div>
          </div>
        }
        {JSON.stringify(claimResponse).length > 0 &&
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <button style={{ float: "right" }} type="button" onClick={this.handleShowBundle}>Show Claim Response Bundle</button>

            <button type="button" onClick={this.reloadClaimResponse} >Reload Claim Response
                                <div id="fse" className={"spinner " + (resloading ? "visible" : "invisible")}>
                <Loader
                  type="Oval"
                  color="#fff"
                  height={15}
                  width={15}
                />
              </div>
            </button></div>
        }
        {showBundle &&
          <pre style={{ background: "#dee2e6", height: "500px" }}> {JSON.stringify(claimResponseBundle, null, 2)}</pre>
        }
      </div>
    )
  }

  getTextInput(linkId, item, updateQuestionValue, retrieveValue, inputType, display, valueType) {
    return <TextInput
      key={linkId}
      item={item}
      updateCallback={updateQuestionValue}
      retrieveCallback={retrieveValue}
      inputType={inputType}
      inputTypeDisplay={display}
      valueType={valueType}
    />
  }

  getChoiceInput(linkId, item, updateQuestionValue, retrieveValue, containedResources, valueType) {
    return <ChoiceInput
      key={linkId}
      item={item}
      updateCallback={updateQuestionValue}
      retrieveCallback={retrieveValue}
      containedResources={containedResources}
      valueType={valueType}
    />
  }

  getOpenChoice(linkId, item, updateQuestionValue, retrieveValue, containedResources, valueType) {
    return <OpenChoice
      key={linkId}
      item={item}
      updateCallback={updateQuestionValue}
      retrieveCallback={retrieveValue}
      inputTypeDisplay="open-choice"
      containedResources={this.state.containedResources}
      valueType={valueType}
    />
  }

  getBooleanInput(linkId, item, updateQuestionValue,
    retrieveValue, valueType) {
    return <BooleanInput
      key={linkId}
      item={item}
      updateCallback={updateQuestionValue}
      retrieveCallback={retrieveValue}
      valueType={valueType}
    />
  }
  getSection(linkId, renderComponent, updateQuestionValue, item, level) {
    return <Section
      key={linkId}
      componentRenderer={renderComponent}
      updateCallback={updateQuestionValue}
      item={item}
      level={level}
    />
  }

  getQuantityInput(linkId, item, updateNestedQuestionValue,
    updateQuestionValue, retrieveValue, quantity, valueQuantity) {
    return <QuantityInput
      key={linkId}
      item={item}
      updateCallback={updateNestedQuestionValue}
      updateQuestionValue={updateQuestionValue}
      retrieveCallback={retrieveValue}
      inputTypeDisplay={quantity}
      valueType={valueQuantity}
    />
  }


}