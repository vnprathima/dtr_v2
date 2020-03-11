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
import Section from './components/Section/Section';
import OpenChoice from './components/Inputs/OpenChoiceInput/OpenChoice';
import { isTSEnumMember } from '@babel/types';
import Select from "react-dropdown-select";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'

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
    let records = { "completed": [], "submitted": [], "draft": [] }
    if (inputThis.state.prior_auth_records !== undefined && inputThis.state.prior_auth_records.length > 0) {
      inputThis.state.prior_auth_records.map((rec, i) => {
        console.log(JSON.stringify(rec))
        rec["index"] = i
        records[rec.type].push(rec)
      })
    }
    return (
      <React.Fragment>
        <div>
          <div id="main">
            <div className="form">
              <div className="container">
                <div className="col-12 cerner-header">Prior Authorization</div>
                <div className="row" style={{marginTop:"20px"}}>
                  <div className="col-6">
                    {inputThis.state.encounters.length > 0 &&
                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <h4 className="title">Encounter</h4>
                          
                        </div>
                        <div className="form-group col-md-6">
                          <DropdownEncounter elementName="encounterId" encounters={inputThis.state.encounters} updateCB={inputThis.updateStateElement} />
                        </div>
                      </div>
                    }
                    <DropdownServiceCode elementName="selected_codes" updateCB={inputThis.updateStateElement} />
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
                  {inputThis.state.crd_error_msg &&
                    <div className="text-center"><p>{inputThis.state.crd_error_msg}</p></div>
                  }
                  </div>
                  
                  <div className="col-6 module" style={{}}>
                    <div class="module-inside">
                     <p>Prior Authorizations were never so simple. </p>
                     <p>One app for all Payers. </p>
                     <p>You are not among the Providers who spend 15% of your time on prior Authorizations </p>


                     <p>Medical ePA is here </p>
                      </div>
                    
                  </div>
                </div>

                <div className="row" style={{ marginTop: "50px" }}>
                  <div className="col-4">
                    <div className="col-12 cerner-header">Draft PA Requests</div>
                    {records["draft"].length > 0 &&
                      <table className="table table-striped  table-sm table-condensed table-bordered">
                        <thead className="thead-light" >
                          <tr>
                            <td key="Date">Date</td>
                            <td key="Codes">Codes</td>
                            <td key="Action">Action</td>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            records["draft"].map((rec, i) => {
                              return (
                                <tr key={i}>
                                  <td key="Date">{this.formatDate(rec.date)}</td>
                                  <td key="Codes">
                                    {rec.codes}
                                  </td>
                                  <td key="Action">
                                    <button className="table-btn" type="button" onClick={() => { sessionStorage.setItem("showCDSHook", false); window.location.href = "/index?appContextId=" + rec.app_context }}>Edit & Submit</button>
                                  </td>
                                </tr>
                              )
                            })

                          }
                        </tbody>
                      </table>
                    }
                    {records["draft"].length == 0 && inputThis.state.loadingTabels && 
                      <span>Loading ...</span>
                    }
                    {(records["draft"].length == 0 && !inputThis.state.loadingTabels) && 
                      <span>No Requests.</span>
                    }
                  </div>
                  <div className="col-4">
                  <div className="col-12 cerner-header">Pending PA Requests</div>
                    {records["submitted"].length > 0 &&
                      <table className="table table-striped table-sm table-bordered">
                        <thead className="thead-light" >
                          <tr>
                            <td key="Date">Date</td>
                            <td key="Codes">Codes</td>
                            <td key="Action">Action</td>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            records["submitted"].map((rec, i) => {
                              return (
                                <tr key={i}>
                                  <td key="Date">{this.formatDate(rec.date)}</td>
                                  <td key="Codes">
                                    {rec.codes}
                                  </td>
                                  <td key="Action">
                                    <button className="table-btn" type="button" onClick={() => { inputThis.checkRequestStatus(rec) }}>Check Status</button>
                                  </td>
                                </tr>
                              )
                            })

                          }
                        </tbody>
                      </table>
                    }
                    {records["submitted"].length == 0 && inputThis.state.loadingTabels && 
                      <span>Loading ...</span>
                    }
                    {(records["submitted"].length == 0 && !inputThis.state.loadingTabels) && 
                      <span>No Requests.</span>
                    }
                  </div>
                  <div className="col-4">
                    <div className="col-12 cerner-header">Recent Prior Authorizations</div>
                    {records["completed"].length > 0 &&
                      <table className="table table-striped  table-sm table-condensed table-bordered">
                        <thead className="thead-light" >
                          <tr>
                            <td key="Date">Date</td>
                            <td key="Codes">Codes</td>
                            <td key="Status">Status</td>
                            <td key="RefId">PA Reference ID</td>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            records["completed"].map((rec, i) => {
                              return (
                                <tr key={i}>
                                  <td key="Date">{this.formatDate(rec.date)}</td>
                                  <td key="Codes">
                                    {rec.codes}
                                  </td>
                                  <td key="Status">
                                    Affirmed
                                  </td>
                                  <td key="RefId">
                                    {rec.prior_auth_ref}
                                  </td>

                                </tr>
                              )
                            })

                          }
                        </tbody>
                      </table>
                    }
                    {records["completed"].length == 0 && inputThis.state.loadingTabels && 
                      <span>Loading ...</span>
                    }
                    {(records["completed"].length == 0 && !inputThis.state.loadingTabels) && 
                      <span>No Requests.</span>
                    }
                  </div>
                </div>

              </div>
            </div>
          </div>
          <nav className="navbar navbar-expand-sm  navbar-dark footer fixed-bottom row">
            <div className="col-9 text-left">
              <span>
                  Copyright 2018 - 2020 Mettles Solutions, LLC.
              </span>
            </div>
            <div className="col-2 text-right">
              <span>
                  Powered By Medical EPA.
              </span>
            </div>
          </nav>
        </div>
      </React.Fragment >)
  }

  formatDate(dateString) {
    var date = new Date(dateString)
    return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()
  }

  getQuestionnaireFormApp(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
    return (
      <div>{this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
        serviceRequest, bundle, claimEndpoint)}
         <nav className="navbar navbar-expand-sm  navbar-dark footer fixed-bottom row">
            <div className="col-8 text-left">
              <span>
                  Copyright 2018 - 2020 Mettles Solutions, LLC.
              </span>
            </div>
            <div className="col-3 text-right">
              <span>
                  Powered By Medical EPA.
              </span>
            </div>
          </nav>
      </div>
    );
  }
  getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
    return (<QuestionnaireForm smart={smart} qform={questionnaire}
      cqlPrepoulationResults={cqlPrepoulationResults}
      serviceRequest={serviceRequest} bundle={bundle}
      claimEndpoint={claimEndpoint} />);

  }
  getQuestionnaireTemplate(inputThis, title, items, updateDocuments, showPreview, priorAuthBundle, previewloading, loading) {
    return (
      <div class="main" style={{marginBottom:"100px"}}>
        <div className="container">
          <div className="col-12 cerner-main-header">
            {title}
            <span className="show-prefilled" style={{ float: "right" }}>
               <input type="checkbox" onClick={() => {
                inputThis.toggleFilledFields();
              }}></input> Show Prefilled
            </span>
          </div>
          <div className="row">
            <div className="col-6">
              {
                items.map((item) => {
                  if (item.linkId <= (items.length / 2 + 1)) {
                    return inputThis.renderComponent(item, 0);
                  }
                })
              }

              <div style={{ marginBottom: "20px" }}>
                <button type="button" style={{ background: "grey", float: "right" }} onClick={inputThis.previewBundle}>Preview FHIR Data
                                <div id="fse" className={"spinner " + (previewloading ? "visible" : "invisible")}>
                    <Loader
                      type="Oval"
                      color="#fff"
                      height={15}
                      width={15}
                    />
                  </div>
                </button>
                <button type="button" onClick={inputThis.outputResponse}>Submit Prior Authorization
                                <div id="fse" className={"spinner " + (loading ? "visible" : "invisible")}>
                    <Loader
                      type="Oval"
                      color="#fff"
                      height={15}
                      width={15}
                    />
                  </div>
                </button>
                /
                <button type="button" onClick={() => inputThis.saveQuestionnaireData()}>Save for Later</button>
              </div>
              {showPreview &&
                <div><pre style={{ background: "#dee2e6",margin:"0px" }}> {JSON.stringify(priorAuthBundle, null, 2)}</pre></div>
              }
            </div>
            <div className="col-6">
              {
                items.map((item) => {
                  if (item.linkId > (items.length / 2 + 1)) {
                    return inputThis.renderComponent(item, 0);
                  }
                })
              }
              <DocumentInput
                updateCallback={this.updateDocuments}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  getClaimResponseTemplate(inputThis, claimMessage, claimResponse, resloading, showBundle, claimResponseBundle){
    return (
      <div className="container">
        <div className="success-msg"> 
        <span className="success-icon">
          <FontAwesomeIcon icon={faCheckCircle} size="2x" color="white"/></span>&nbsp;&nbsp;{claimMessage}</div>
        <div className="form-row">
          <div className="col-3"><b>Outcome</b></div>
          {claimResponse.outcome === "complete" &&
            <div className="col-6">: Affirmed</div>
          }
          {claimResponse.outcome !== "complete" &&
            <div className="col-6">: {claimResponse.outcome}</div>
          }
        </div>
        {/* <div className="form-row">
          <div className="col-3"><b>Outcome</b></div>
          <div className="col-6">: {claimResponse.outcome}</div>
        </div> */}
        {claimResponse.outcome !== "queued" &&
          <div className="form-row">
            <div className="col-3"><b>Prior Auth Reference No</b></div>
            <div className="col-6">: {claimResponse.preAuthRef}</div>
          </div>
        }
        {JSON.stringify(claimResponse).length > 0 &&
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <button style={{ float: "right" }} type="button" onClick={inputThis.handleShowBundle}>Show Claim Response Bundle</button>

            <button type="button" onClick={inputThis.reloadClaimResponse} >Reload Claim Response
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
          <pre style={{ background: "#dee2e6",margin:"0px" }}> {JSON.stringify(claimResponseBundle, null, 2)}</pre>
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
