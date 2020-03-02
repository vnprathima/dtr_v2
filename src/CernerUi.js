import React, { Component } from "react";
import Testing from "./components/ConsoleBox/Testing";
import TextInput from './components/Inputs/TextInput/TextInput';
import QuestionnaireForm from "./components/QuestionnaireForm/QuestionnaireForm";
import ChoiceInput from './components/Inputs/ChoiceInput/ChoiceInput';
import Base from 'terra-base';
import Arrange from 'terra-arrange';
import Heading from 'terra-heading';
import Input from 'terra-form-input';
import Select from 'terra-form-select';
import Field from 'terra-form-field';
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
import CernerDropdownServiceCode from './components/CernerDropdownServiceCode';
import CernerDropdownCoverage from './components/CernerDropdownCoverage';
import SectionHeaderExampleTemplate from 'terra-section-header/lib/terra-dev-site/doc/example/SectionHeaderExampleTemplate';
import Table, {
  Header,
  HeaderCell,
  Body,
  Cell,
  Row,
} from 'terra-html-table';
import CernerDropdownEncounter from './components/CernerDropdownEncounter';
import SelectPayer from './components/SelectPayer';
import Checkbox from 'terra-form-checkbox';
import ProviderRequest from "./ProviderRequest";
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

    getProviderRequestUI(){

        return(
             <ThemeProvider isGlobalTheme theme={ThemeProvider.Opts.Themes.CONSUMER}>
                <Base locale={locale}>
                    <ContentContainer>
                        <ProviderRequest />
                    </ContentContainer>
                </Base>
            </ThemeProvider>
        );
    }



    getProviderRequestForm(inputThis){
        const template = {
            'grid-template-columns': '1fr 1fr',
            'grid-template-rows': 'auto',
            'grid-gap': '10px',
        };
        const template_3_col = {
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
        const region3 = {
            'grid-column-start': 3,
            'grid-row-start': 1,
        };
        let records = inputThis.state.records_by_type;
        return (
        <div>
           <Arrange
                    align="center"
                    fill={(
                        <div>
                           
                            <Heading level={2}>
                                Prior Authorization
                            </Heading>
                            <Heading level={3}>
                                Submit your request to check for prior authorization
                            </Heading>
                        </div>
                    )}
                />

            <DynamicGrid defaultTemplate={template}>
                <DynamicGrid.Region defaultPosition={region1}>
                    <Field label="NPI">
                     <Input type="text" placeholder="Practitioner NPI" name="practitioner" id="name" ariaLabel="NPI"
                    value={inputThis.state.practitionerId} onChange={inputThis.onPractitionerChange} />
                    </Field>
                    {inputThis.state.encounters.length > 0 &&
                          <CernerDropdownEncounter elementName="encounterId" encounters={inputThis.state.encounters} updateCB={inputThis.updateStateElement} />
                    }
                    { inputThis.state.coverageResources.length > 0 &&
                         <CernerDropdownCoverage elementName="coverageId" coverages={inputThis.state.coverageResources} updateCB={inputThis.updateStateElement} />
                    }

                </DynamicGrid.Region>
                <DynamicGrid.Region defaultPosition={region2}>
                     <CernerDropdownServiceCode elementName="selected_codes" updateCB={inputThis.updateStateElement} />

                   
                </DynamicGrid.Region>
            </DynamicGrid>

            <Heading level={2}>
                Requests History
            </Heading>
            {
            <DynamicGrid defaultTemplate={template_3_col}>
                <DynamicGrid.Region defaultPosition={region1}>
                    <Heading level={3}>
                        Draft
                    </Heading>
                    <Table>
                        <Header>
                          <HeaderCell key="Date">Date</HeaderCell>
                          <HeaderCell key="Codes">Codes</HeaderCell>
                          <HeaderCell key="Action">Action to be taken</HeaderCell>
                        </Header>
                        <Body>
                          {
                              records["draft"].map((rec,i)=>{
                                return(
                                  <Row key={i}>
                                    <Cell key="Date">{this.formatDate(rec.date)}</Cell>
                                    <Cell key="Codes">
                                      {rec.codes}
                                    </Cell>
                                     <Cell key="Action">
                                       <Button  text="Submit"  />
                                     </Cell>
                                  </Row>
                                )
                              })

                            }
                        </Body>
                    </Table>
                </DynamicGrid.Region>
                <DynamicGrid.Region defaultPosition={region2}>
                    <Heading level={3}>
                        Submitted
                    </Heading>
                     <Table>
                        <Header>
                          <HeaderCell key="Date">Date</HeaderCell>
                          <HeaderCell key="Codes">Codes</HeaderCell>
                          <HeaderCell key="Action">Action to be taken</HeaderCell>
                        </Header>
                        <Body>
                          {
                              records["submitted"].map((rec,i)=>{
                                return(
                                  <Row key={i}>
                                    <Cell key="Date">{this.formatDate(rec.date)}</Cell>
                                    <Cell key="Codes">
                                      {rec.codes}
                                    </Cell>
                                     <Cell key="Action">
                                       <Button  text="Check Status"  />
                                     </Cell>
                                  </Row>
                                )
                              })

                            }
                        </Body>
                    </Table>
                </DynamicGrid.Region>
                <DynamicGrid.Region defaultPosition={region3}>
                    <Heading level={3}>
                        Completed
                    </Heading>
                     <Table>
                        <Header>
                          <HeaderCell key="Date">Date</HeaderCell>
                          <HeaderCell key="Codes">Codes</HeaderCell>
                        </Header>
                        <Body>
                          {
                              records["completed"].map((rec,i)=>{
                                return(
                                  <Row key={i}>
                                    <Cell key="Date">{this.formatDate(rec.date)}</Cell>
                                    <Cell key="Codes">
                                      {rec.codes}
                                    </Cell>
                                    
                                  </Row>
                                )
                              })

                            }
                        </Body>
                    </Table>
                </DynamicGrid.Region>
            </DynamicGrid>
        }
            
       </div>)
    }

    formatDate(dateString){
        var date = new Date(dateString)
        return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()
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

    getTextInput(linkId, item, updateValue, retrieveValue, inputType, display, valueType) {
        return <CernerTextInput
            key={linkId}
            item={item}
            updateCallback={updateValue}
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
