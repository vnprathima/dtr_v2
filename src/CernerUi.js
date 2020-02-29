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
                    </DynamicGrid.Region>
                    <DynamicGrid.Region defaultPosition={region2}>
                        {
                            items.map((item) => {
                                if (item.linkId > (items.length / 2 + 1)) {
                                    return inputThis.renderComponent(item, 0);
                                }
                            })
                        }
                        <div style={{ marginBottom: "30px" }}>
                            <DocumentInput
                                updateCallback={updateDocuments}
                            />
                        </div >
                    </DynamicGrid.Region>
                </DynamicGrid>
                {showPreview &&
                    <div><pre style={{ background: "#dee2e6", height: "500px" }}> {JSON.stringify(priorAuthBundle, null, 2)}</pre></div>
                }
                <div className="text-center" style={{ marginBottom: "50px" }}>
                    <Button text="Preview" onClick={inputThis.previewBundle} variant="emphasis" />
                    <Button text="Submit Prior Authorization" onClick={inputThis.outputResponse} variant="emphasis" />
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
