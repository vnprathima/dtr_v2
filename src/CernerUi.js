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
import Checkbox from 'terra-form-checkbox';
import SectionHeader from 'terra-section-header';
import Spacer from 'terra-spacer';
import IconSuccess from 'terra-icon/lib/icon/IconSuccess';
import StatusView from 'terra-status-view';
import LabelValueView from 'terra-clinical-label-value-view';
import DetailView from 'terra-clinical-detail-view';
import LoadingOverlay from 'terra-overlay/lib/LoadingOverlay';
import RecursiveProperty from './components/RecursiveProperty.tsx';
import BrandFooter from 'terra-brand-footer';

const locale = (navigator.languages && navigator.languages[0])
    || navigator.language
    || navigator.userLanguage
    || 'en';

export default class CernerUi {
    constructor(props) {

    }
    getError(logs) {
        return (
            <Spacer marginTop="medium" marginLeft="medium" marginRight="medium" marginBottom="medium">
                <p>Loading...</p>
                <Testing logs={logs} />
            </Spacer>
        );
    }

    getProviderRequestUI(inputThis) {
        return (this.getProviderRequestForm())
    }

    getProviderRequestForm(inputThis) {
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
        return (
            <ThemeProvider isGlobalTheme theme={ThemeProvider.Opts.Themes.CONSUMER}>
                <Base locale={locale}>
                    <ContentContainer>
                        {this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
                            serviceRequest, bundle, claimEndpoint)}
                        <BrandFooter
                            isVertical
                            sections={[
                                {
                                    headerText: 'Smart App Links',
                                    links: [
                                        { text: 'Terra UI', href: 'http://terra-ui.com/' },
                                        { text: 'Terra UI Components', href: 'http://terra-ui.com/static/#/site/components' },
                                    ],
                                },
                                {
                                    headerText: 'Mettles Links',
                                    links: [
                                        { text: 'Cerner Home', href: 'https://www.cerner.com/' },
                                        { text: 'Cerner Code', href: 'https://code.cerner.com/', target: '_blank' },
                                    ],
                                },
                            ]}
                            contentLeft={(
                                <a
                                    href="http://terra-ui.com/"
                                    aria-label="Smart App Home"
                                >
                                </a>
                            )}
                            contentRight={(
                                <img ></img>
                            )}
                            contentBottom={(
                                <span>
                                    <small>Copyright 2018 - 2020 Mettles Solutions, Inc.  Licensed under the Apache License, Version 2.0 (the &quot;License&quot;).</small>
                                </span>
                            )}
                        />
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
                <Spacer marginTop="medium" marginLeft="medium" marginRight="medium" marginBottom="medium">
                    <LoadingOverlay isOpen={loading} isAnimated isRelativeToContainer={false} zIndex="6000" />
                    <Arrange
                        align="center"
                        fill={(
                            <div>
                                <Heading level={1}>
                                    {title} <Checkbox style={{ float: "right" }} id="ShowPrefilled" labelText="Show Prefilled" onChange={() => {
                                        inputThis.toggleFilledFields();
                                    }} />
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
                                        inputThis.retrieveValue, "file", "multipleAttachment", "multipleAttachment")}
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
                                    {showPreview &&
                                        <Spacer marginTop="small" marginLeft="small" marginRight="small" marginBottom="small">
                                            <RecursiveProperty property={priorAuthBundle.entry} propertyName="Preview Resource List" excludeBottomBorder={false} rootProperty={false} />
                                        </Spacer>
                                    }
                                </DynamicGrid.Region>
                            </DynamicGrid>

                        </DynamicGrid.Region>
                    </DynamicGrid>

                </Spacer>
            </div>
        );
    }
    getClaimResponseTemplate(inputThis, claimMessage, claimResponse, resloading, showBundle, claimResponseBundle) {
        var statusText = claimResponse.status;
        if (claimResponse.status === "active") {
            statusText = "Affirmed";
        }
        const status = (<LabelValueView label="Status" textValue={statusText} />);
        const outcome = (<LabelValueView label="Outcome" textValue={claimResponse.outcome} />);
        const preauthRef = (<LabelValueView label="Prior Auth Reference No" textValue={claimResponse.preAuthRef} />);
        const template = {
            'grid-template-columns': '1fr 1fr 1fr',
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

        return (
            <Spacer marginTop="medium" marginLeft="medium" marginRight="medium" marginBottom="medium">
                <StatusView
                    message={claimMessage}
                    customGlyph={<IconSuccess />}
                    title="Success"
                />
                <DynamicGrid defaultTemplate={template}>
                    <DynamicGrid.Region defaultPosition={region2}>
                        <DetailView style={{ border: "1px solid grey" }}
                            title="Prior Auth Status"
                            details={[
                                (
                                    <DetailView.DetailList key="auth-status">
                                        <DetailView.DetailListItem item={status} />
                                        <DetailView.DetailListItem item={outcome} />
                                        {claimResponse.outcome !== "queued" &&
                                            <DetailView.DetailListItem item={preauthRef} />
                                        }
                                    </DetailView.DetailList>
                                ),
                            ]}
                            isDivided={false}
                        />
                        {JSON.stringify(claimResponse).length > 0 &&
                            <Spacer marginTop="medium" marginLeft="medium" marginRight="medium" marginBottom="medium">
                                <Button text="Show Claim Response Bundle" style={{ float: "right" }} onClick={inputThis.handleShowBundle} variant="emphasis" />
                                <Button text="Reload Claim Response" onClick={inputThis.reloadClaimResponse} variant="emphasis" />
                            </Spacer>
                        }
                        {showBundle &&
                            <RecursiveProperty property={claimResponseBundle.entry} propertyName="ClaimResponse" excludeBottomBorder={false} rootProperty={true} />
                        }
                    </DynamicGrid.Region>
                </DynamicGrid>
            </Spacer>
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
