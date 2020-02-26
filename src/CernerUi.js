import React, { Component } from "react";
import Testing from "./components/ConsoleBox/Testing";
import TextInput from './components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "./components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from './components/Inputs/ChoiceInput/ChoiceInput';
import Base from 'terra-base';
import Field from 'terra-form-field';
import Input from 'terra-form-input';
import ThemeProvider from 'terra-theme-provider';

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
        return (
            <div className="App"><Base locale={locale}>{this.getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults,
                serviceRequest, bundle, claimEndpoint)}</Base></div>
        );
    }
    getQuestionnaireForm(smart, questionnaire, cqlPrepoulationResults, serviceRequest, bundle, claimEndpoint) {
        return (<QuestionnaireForm smart={smart} qform={questionnaire}
            cqlPrepoulationResults={cqlPrepoulationResults}
            serviceRequest={serviceRequest} bundle={bundle}
            claimEndpoint={claimEndpoint} />);
    }

    getTextInput(linkId, item, updateQuestionValue, retrieveValue, inputType, display, valueType) {
        return <ThemeProvider themeName={ThemeProvider.Opts.Themes.CONSUMER}>
            <Input name={item.text} id={linkId} ariaLabel={item.text} value={retrieveValue(item.linkId)} onChange={(e) => updateQuestionValue(item.linkId, e.target.value, "values")} />
        </ThemeProvider>
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


}
