import React, { Component } from "react";
import Testing from "./components/ConsoleBox/Testing";
import TextInput from './components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "./components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from './components/Inputs/ChoiceInput/ChoiceInput';
import Base from 'terra-base';
import Arrange from 'terra-arrange';
import Heading from 'terra-heading';
import DocumentInput from './components/Inputs/DocumentInput/DocumentInput';
import Loader from 'react-loader-spinner';
import CernerTextInput from './components/Inputs/TextInput/CernerTextInput';
import CernerSection from './components/Section/CernerSection';
import ThemeProvider from "terra-theme-provider";
import BooleanInput from './components/Inputs/BooleanInput/BooleanInput';
import QuantityInput from './components/Inputs/QuantityInput/QuantityInput';
import ApplicationBase from 'terra-application/lib/application-base';
import ContentContainer from 'terra-content-container';
import DynamicGrid from 'terra-dynamic-grid';
import Button from 'terra-button/lib/Button';
import DropdownServiceCode from './components/DropdownServiceCode';

import DropdownCoverage from './components/DropdownCoverage';

import { DateInput } from 'semantic-ui-calendar-react';

import { Dropdown } from 'semantic-ui-react';

import DropdownEncounter from './components/DropdownEncounter';
import SelectPayer from './components/SelectPayer';

import SectionHeader from 'terra-section-header';

const locale = (navigator.languages && navigator.languages[0])
    || navigator.language
    || navigator.userLanguage
    || 'en';

export default class CernerUi {
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

    getProviderRequestUI(inputThis){
        return( this.getProviderRequestForm())
    }

    getProviderRequestForm(inputThis){
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
                  {/* <li className="menu-has-children"><a href="">{localStorage.getItem('username')}</a>
                    <ul>
                      <li><a href="" onClick={inputThis.onClickLogout}>Logout</a></li>
                    </ul>
                  </li> */}
                </ul>
              </nav>
            </div>
          </header>
          <div id="main" style={{ marginTop: "92px" }}>

            <div className="form">
              <div className="container">
                <div className="section-header">
                  <h3>Prior Authorization</h3>
                  <p>Submit your request to check for prior authorization.</p>
                </div>
                <div className="form-row">
                  <div className="form-group col-md-3 offset-1">
                    <h4 className="title">NPI</h4>
                  </div>
                  <div className="form-group col-md-8">
                    <input type="text" name="practitioner" className="form-control" id="name" placeholder="Practitioner NPI"
                      value={inputThis.state.practitionerId} onChange={inputThis.onPractitionerChange}
                      data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                    <div className="validation"></div>
                  </div>
                </div>
                {(inputThis.state.hookName === 'order-review' || inputThis.state.hookName === 'order-select') &&
                  <div>

                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title">Beneficiary Id</h4>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="patient" className="form-control" id="name" placeholder="Beneficiary Id"
                          value={inputThis.state.patientId} onChange={inputThis.onPatientChange}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                      <div className="form-group col-md-4">
                        <button type="button" onClick={inputThis.handlePrefetch}>Prefetch
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
                    <div className="form-row">
                      <div className="form-group col-md-3 offset-1">
                        <h4 className="title">Patient Info*</h4>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="firstName" className="form-control" id="name" placeholder="First Name"
                          value={inputThis.state.firstName} onChange={inputThis.onChangeFirstName}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="lastName" className="form-control" id="name" placeholder="Last Name"
                          value={inputThis.state.lastName} onChange={inputThis.onChangeLastName}
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
                          options={inputThis.state.genderOptions}
                          placeholder='Gender'
                          search
                          selection
                          fluid
                          value={inputThis.state.gender}
                          onChange={inputThis.handleGenderChange}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <DateInput
                          name="birthDate"
                          placeholder="Birth Date"
                          dateFormat="MM/DD/YYYY"
                          fluid
                          value={inputThis.state.birthDate}
                          iconPosition="left"
                          onChange={inputThis.changebirthDate}
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
                          options={inputThis.state.stateOptions}
                          placeholder='State'
                          search
                          selection
                          fluid
                          value={inputThis.state.patientState}
                          onChange={inputThis.handlePatientStateChange}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <input type="text" name="patientPostalCoade" className="form-control" id="name" placeholder="Postal Code"
                          value={inputThis.state.patientPostalCode} onChange={inputThis.onPatientPostalChange}
                          data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                        <div className="validation"></div>
                      </div>
                    </div>

                    {/* {inputThis.state.validatePatient === true &&
                      <div className='errorMsg dropdown'>{inputThis.props.config.errorMsg}</div>
                    } */}
                  </div>}
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
                {inputThis.state.coverageResources.length > 0 &&
                  <div className="form-row">
                    <div className="form-group col-md-3 offset-1">
                      <h4 className="title">Coverage</h4>
                    </div>
                    <div className="form-group col-md-8">
                      <DropdownCoverage elementName="coverageId" coverages={inputThis.state.coverageResources} updateCB={inputThis.updateStateElement} />
                      {/*inputThis.state.coverageResources.map((element) => {
                        return (
                          <div key={element.id}>
                            <button
                              className={"radio-button btn " + (inputThis.state.coverageId === element.id ? "selected" : null)}
                              onClick={() => {
                                inputThis.setCoverage(element)
                              }}
                            >
                            </button>
                            <span className="text-radio tooltip-x">
                              <div><b>Coverage</b></div>
                              {// <div><b>Status</b>: {element.status}</div> }
                              {// <div><b>Subscriber</b>: {element.subscriber.display}</div> }
                              <div><b>Beneficiary</b>: {element.beneficiary.display}</div>
                              {// <div><b>Coverage Start Date</b>: {dateFormat(element.period.start,"fulldate")}</div> }
                              <div><b>Payor</b>: {element.payor[0].display}</div>
                              {// <div><b>Class</b>: plan: Value: {element.class[0].value} Name: {element.class[0].name}</div> }
                            </span>
                          </div>
                        )
                      }) 
                    */}
                    </div>
                  </div>}
                {inputThis.state.coverageResources.length === 0 &&
                  <SelectPayer elementName='payer' updateCB={inputThis.updateStateElement} />
                }
                <DropdownServiceCode elementName="selected_codes" updateCB={inputThis.updateStateElement} />
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
        console.log("Out global true----", ThemeProvider.Opts.Themes.CONSUMER);
        return (
            <ThemeProvider isGlobalTheme theme={ThemeProvider.Opts.Themes.CONSUMER}>
                <Base locale={locale}>
                    <ContentContainer>
                        {this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
                            serviceRequest, bundle, claimEndpoint)}
                    </ContentContainer>
                </Base>
            </ThemeProvider>
        );
    }
    getQuestionnaireTemplate(inputThis, title, items, updateDocuments, showPreview, priorAuthBundle, previewloading, loading) {
        const template = {
            'grid-template-columns': '1fr 1fr',
            'grid-template-rows': 'auto',
            'grid-gap': '10px',
        };
        const region1 = {
            'grid-column-start': 1,
            'grid-row-start': 1,
        };
        const region2 = {
            'grid-column-start': 2,
            'grid-row-start': 1,
        };
        const singleTemplate = {
            'grid-template-columns': '1fr',
            'grid-template-rows': 'auto',
        };
        const region3 = {
            'grid-column-start': 1,
            'grid-column-end': 1,
            'grid-row-start': 1,
            'grid-row-end': 1,
        };
        return (
            <div>
                <div className="floating-tools">
                    <p className="filter-filled" >Show Prefilled : <input type="checkbox" onClick={() => {
                        inputThis.toggleFilledFields();
                    }}></input></p>
                </div>
                <Arrange
                    align="center"
                    fill={(
                        <div>
                            <Heading level={1}>
                                {title}
                            </Heading>
                        </div>
                    )}
                />
                <DynamicGrid defaultTemplate={template}>
                    <DynamicGrid.Region defaultPosition={region1}>
                        {
                            items.map((item) => {
                                if (item.linkId <= (items.length / 2 + 1)) {
                                    return inputThis.renderComponent(item, 0);
                                }
                            })
                        }
                        <DynamicGrid defaultTemplate={singleTemplate}>
                            <DynamicGrid.Region defaultPosition={region3}>
                                <SectionHeader
                                    title="Uplaod Required/Additional Documentation"
                                    level={3}
                                />
                                {this.getTextInput("100", { "text": "Additional Documentation" }, inputThis.updateDocuments,
                                    inputThis.retrieveValue, "file", "multipleAttachment", "valueAttachment")}
                            </DynamicGrid.Region>
                        </DynamicGrid>

                    </DynamicGrid.Region>
                    <DynamicGrid.Region defaultPosition={region2}>
                        {
                            items.map((item) => {
                                if (item.linkId > (items.length / 2 + 1)) {
                                    return inputThis.renderComponent(item, 0);
                                }
                            })
                        }
                        <DynamicGrid defaultTemplate={singleTemplate}>
                            <DynamicGrid.Region defaultPosition={region3}>
                                <Button text="Preview" onClick={inputThis.previewBundle} />
                                <Button text="Submit Prior Authorization" onClick={inputThis.outputResponse} variant="emphasis" />
                            </DynamicGrid.Region>
                        </DynamicGrid>

                    </DynamicGrid.Region>
                </DynamicGrid>
                {showPreview &&
                    <div><pre style={{ background: "#dee2e6", height: "500px" }}> {JSON.stringify(priorAuthBundle, null, 2)}</pre></div>
                }
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
    getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
        return (<QuestionnaireForm smart={smart} qform={questionnaire}
            cqlPrepoulationResults={cqlPrepoulationResults}
            serviceRequest={serviceRequest} bundle={bundle}
            claimEndpoint={claimEndpoint} />);
    }

    getTextInput(linkId, item, updateQuestionValue, retrieveValue, inputType, display, valueType) {
        return <CernerTextInput
            key={linkId}
            item={item}
            updateCallback={updateQuestionValue}
            retrieveCallback={retrieveValue}
            inputType={inputType}
            inputTypeDisplay={display}
            valueType={valueType} />
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

    getSection(linkId, renderComponent, updateQuestionValue, item, level) {
        return <CernerSection
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
