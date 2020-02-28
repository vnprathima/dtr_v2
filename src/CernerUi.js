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
    getQuestionnaireFormApp(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
        console.log("Out global true----",ThemeProvider.Opts.Themes.MOCK);
        return (
            <ThemeProvider isGlobalTheme theme={ThemeProvider.Opts.Themes.MOCK}>
                <Base locale={locale}>{this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
                serviceRequest, bundle, claimEndpoint)}</Base>
            </ThemeProvider>
        );
    }
    getQuestionnaireTemplate(inputThis, toggleFilledFields, title, items, renderComponent, updateDocuments, showPreview, priorAuthBundle, previewloading, loading) {
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
                <div className="wrapper1">
                    {
                        items.map((item) => {
                            return renderComponent(item, 0);
                        })
                    }
                    <div style={{ marginBottom: "30px" }}>
                        <DocumentInput
                            updateCallback={updateDocuments}
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
        return  <OpenChoice
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
                        retrieveValue, valueType){
        return <BooleanInput
                    key={linkId}
                    item={item}
                    updateCallback={updateQuestionValue}
                    retrieveCallback={retrieveValue}
                    valueType={valueType}
                />
    }
    getSection(linkId,renderComponent,updateQuestionValue,item,level){
        return <CernerSection
                        key={linkId}
                        componentRenderer={renderComponent}
                        updateCallback={updateQuestionValue}
                        item={item}
                        level={level}
                    />
    }

    getQuantityInput(linkId, item, updateNestedQuestionValue,
                        updateQuestionValue,retrieveValue, quantity, valueQuantity){
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
