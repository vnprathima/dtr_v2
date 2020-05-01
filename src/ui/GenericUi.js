import React, { Component } from "react";
import Testing from "../components/ConsoleBox/Testing";
import TextInput from '../components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "../components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from '../components/Inputs/ChoiceInput/ChoiceInput';
import DocumentInput from '../components/Inputs/DocumentInput/DocumentInput';
import Loader from 'react-loader-spinner';
import BooleanInput from '../components/Inputs/BooleanInput/BooleanInput';
import DropdownServiceCode from '../components/CRDRequest/DropdownServiceCode';
import DropdownEncounter from '../components/CRDRequest/DropdownEncounter';
import CRDRequest from "../components/CRDRequest/CRDRequest";
import '../index.css';
import '../components/ConsoleBox/consoleBox.css';
import Section from '../components/Section/Section';
import OpenChoice from '../components/Inputs/OpenChoiceInput/OpenChoice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import QuantityInput from '../components/Inputs/QuantityInput/QuantityInput';
import ReferenceInput from '../components/Inputs/ReferenceInput/ReferenceInput';
import ShowError from '../components/ShowError';
import { convertDate } from '../util/util.js';
import { Radio } from 'semantic-ui-react';
import DropdownOrderTo from "../components/QuestionnaireForm/DropdownOrderTo";

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

  getCRDRequestUI() {
    return (<CRDRequest />);
  }

  getCRDRequestForm(inputThis) {
    let records = { "completed": [], "submitted": [], "draft": [] }
    if (inputThis.state.prior_auth_records !== undefined && inputThis.state.prior_auth_records.length > 0) {
      inputThis.state.prior_auth_records.map((rec, i) => {
        // console.log(JSON.stringify(rec))
        rec["index"] = i
        records[rec.type].push(rec)
      })
    }
    return (
      <React.Fragment>
        <div>
          <div id="main">
            <div className="form">
              <div className="container disable">
                {inputThis.state.showError &&
                  <ShowError type={inputThis.state.errorType} />
                }
                <div className="col-12 cerner-header">Orders and Prior Authorization</div>
                <div className="row" style={{ marginTop: "20px" }}>
                  <div className="col-6">
                    <div className="form-row">
                      <div className="col-6 offset-6">
                        <Radio
                          label='Order'
                          name='order_pa'
                          value='Order'
                          checked={inputThis.state.order_pa === 'Order'}
                          onChange={inputThis.handleChange}
                        />
                        <Radio
                          style={{ marginLeft: "10px" }}
                          label='Prior Authorization'
                          name='order_pa'
                          value='PA'
                          checked={inputThis.state.order_pa === 'PA'}
                          onChange={inputThis.handleChange}
                        />
                      </div>
                    </div>
                    {
                      inputThis.state.showPatientField === true &&
                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <h4 className="title">Benificiary Identifier</h4>
                        </div>
                        <div className="form-group col-md-4">
                          <input type="text" className="form-control" onChange={(event) => { inputThis.onPatientChange(event) }}></input>
                        </div>
                        <div className="form-group col-md-2">
                          <button type="button" style={{ "padding": "7px 10px" }} onClick={inputThis.handlePrefetch}>Search
                              <div id="fse" className={"spinner " + (inputThis.state.prefetchloading ? "visible" : "invisible")}>
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
                    }
                    {
                      inputThis.state.showPatientField && inputThis.state.patientId != null && inputThis.state.patientId != undefined && inputThis.state.patientResource &&
                      <div className="">
                        <div className="form-row ">
                          <div className="ml-md-auto col-md-3 patient-data">
                            <div className="col-md-12">
                              {inputThis.state.patientResource.name[0].given[0] + " " + inputThis.state.patientResource.name[0].family}
                            </div>
                            <div className="col-md-12">
                              {inputThis.state.patientResource.gender.charAt(0).toUpperCase() + inputThis.state.patientResource.gender.slice(1)}
                            </div>
                          </div>
                          <div className="col-md-3 patient-data">
                            <div className="col-md-12 ">
                              {convertDate(inputThis.state.patientResource.birthDate)}
                            </div>
                            <div className="col-md-12">

                              {inputThis.state.patientResource.address !== undefined && inputThis.state.patientResource.address !== null &&

                                <span>{inputThis.state.patientResource.address[0].state + " "}</span>

                              }
                              {(inputThis.state.patientResource.address[0].postalCode !== undefined && inputThis.state.patientResource.address[0].postalCode !== null) &&

                                <span>-</span>

                              }
                              {(inputThis.state.patientResource.address[0].postalCode !== undefined && inputThis.state.patientResource.address[0].postalCode !== null) &&
                                <span>{" " + inputThis.state.patientResource.address[0].postalCode}</span>
                              }
                            </div>
                          </div>
                        </div>



                      </div>
                    }



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
                    <div className="module-inside">
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
                                    <button className="table-btn" type="button"
                                      onClick={() => { inputThis.submitDraftPA(rec) }}>Edit & Submit</button>
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
      <div className="main" style={{ marginBottom: "100px" }}>
        <div className="container">
          {inputThis.state.showError &&
            <ShowError type={this.state.errorType} />
          }

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

              <div className="col-12">
                <Radio
                  label='Just Order'
                  name='order_pa'
                  value='Order'
                  checked={inputThis.state.order_pa === 'Order'}
                  onChange={inputThis.handleChange}
                />
                <Radio
                  style={{ marginLeft: "10px" }}
                  label='Submit for Prior Authorization'
                  name='order_pa'
                  value='PA'
                  checked={inputThis.state.order_pa === 'PA'}
                  onChange={inputThis.handleChange}
                />
              </div>
              {sessionStorage.getItem("order_pa") === "Order" &&
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <h4 className="title">Order To *</h4>

                  </div>
                  <div className="form-group col-md-6">
                    <DropdownOrderTo elementName="orderTo" updateCB={inputThis.updateStateElement} />
                  </div>
                </div>
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
                <button type="button" onClick={inputThis.outputResponse}>Submit
                                <div id="fse" className={"spinner " + (loading ? "visible" : "invisible")}>
                    <Loader
                      type="Oval"
                      color="#fff"
                      height={15}
                      width={15}
                    />
                  </div>
                </button>
                <button style={{ marginLeft: "5px" }} type="button" onClick={() => inputThis.saveQuestionnaireData()}>Save for Later</button>

              </div>
              {inputThis.state.saved && <div className="simple-success"><strong style={{ color: "green", marginLeft: "1%" }}>Saved Successfully!!</strong></div>}
              {inputThis.state.validated === false &&
                <div className="error-msg">{inputThis.state.validationError}</div>
              }
              {showPreview &&
                <div><pre style={{ background: "#dee2e6", margin: "0px" }}> {JSON.stringify(priorAuthBundle, null, 2)}</pre></div>
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
                updateCallback={updateDocuments}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  getClaimResponseTemplate(inputThis, claimMessage, claimResponse, resloading, showBundle, claimResponseBundle) {
    return (
      <div className="container">
        <div className="success-msg">
          <span className="success-icon">
            <FontAwesomeIcon icon={faCheckCircle} size="2x" color="white" /></span>&nbsp;&nbsp;{claimMessage}</div>
        {inputThis.state.order_pa === "PA" &&
          <div>
            <div className="form-row">
              <div className="col-3"><b>Outcome</b></div>
              {claimResponse.outcome === "complete" &&
                <div className="col-6">: Affirmed</div>
              }
              {claimResponse.outcome === "queued" &&
                <div className="col-6">: Pending</div>
              }
              {claimResponse.outcome !== "complete" && claimResponse.outcome !== "queued" &&
                <div className="col-6">: {claimResponse.outcome}</div>
              }
            </div>
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
          </div>
        }
        {inputThis.state.order_pa === "Order" &&
          <div style={{ paddingTop: "10px", paddingBottom: "10px" }} className="col-12">
            <button style={{ float: "right" }} type="button" onClick={inputThis.handleShowBundle}>Show Order Response Bundle</button>
          </div>
        }
        {showBundle &&
          <div style={{ paddingTop: "10px", paddingBottom: "10px", paddingRight: "0px" }} className="row col-12">
            <pre style={{ background: "#dee2e6", margin: "0px" }}> {JSON.stringify(claimResponseBundle, null, 2)}</pre>
          </div>
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
      containedResources={containedResources}
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
  getReferences(linkId, item, updateQuestionValue, retrieveValue, valueType) {
    return <ReferenceInput
      key={linkId}
      item={item}
      updateCallback={updateQuestionValue}
      retrieveCallback={retrieveValue}
      inputTypeDisplay="reference"
      valueType={valueType}
    />
  }

}