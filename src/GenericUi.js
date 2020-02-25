import React, { Component } from "react";
import Testing from "./components/ConsoleBox/Testing";
import TextInput from './components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "./components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from './components/Inputs/ChoiceInput/ChoiceInput';
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
    getQuestionnaireFormApp(smart,questionnaire,cqlPrepoulationResults,serviceRequest,bundle,claimEndpoint) {
        return (
            <div className="App">{this.getQuestionnaireForm(smart,questionnaire,cqlPrepoulationResults,
                serviceRequest,bundle,claimEndpoint)}</div>
         );
    }
    getQuestionnaireForm(smart,questionnaire,cqlPrepoulationResults,serviceRequest,bundle,claimEndpoint) {
        return (<QuestionnaireForm smart={smart} qform={questionnaire}
            cqlPrepoulationResults={cqlPrepoulationResults}
            serviceRequest={serviceRequest} bundle={bundle}
            claimEndpoint={claimEndpoint} />);

    }

    getTextInput(linkId,item,updateQuestionValue,retrieveValue,inputType,display,valueType) {
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

    getChoiceInput(linkId,item,updateQuestionValue,retrieveValue,containedResources,valueType) {
         return <ChoiceInput
                        key={linkId}
                        item={item}
                        updateCallback={updateQuestionValue}
                        retrieveCallback={retrieveValue}
                        containedResources={containedResources}
                        valueType={valueType}
                    />
    }


}