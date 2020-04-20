import React, { Component } from 'react';

import './QuantityInput.css';
import '../../ComponentStyles.css';
import { Dropdown } from 'semantic-ui-react';

const options = [
    { key: '=', text: '=', value: '=' },
    { key: '<', text: '<', value: '<' },
    { key: '>', text: '>', value: '>' },
    { key: '<=', text: '<=', value: '<=' },
    { key: '>=', text: '>=', value: '>=' }
]
export default class QuantityInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
            comparator: "=",
            unit: "",
            system: "",
            code: ""
        };

        this.updateState = this.updateState.bind(this);
        this.ref = React.createRef();
    }

    componentWillUnmount() {
        this.props.updateQuestionValue(this.props.item.linkId,
            {
                "type": "quantity",
                "text": this.props.item.text,
                "valueType": "valueQuantity",
                "ref": this.ref,
                "enabled": false
            }, "itemTypes")
    }

    componentDidMount() {
        // setup initial value from qForm
        const value = this.props.retrieveCallback(this.props.item.linkId);
        if (value) {
            // console.log("value-quantity-", value);
            this.prepopulate(value);
        }

        this.props.updateQuestionValue(this.props.item.linkId,
            {
                "type": "quantity",
                "text": this.props.item.text,
                "valueType": "valueQuantity",
                "ref": this.ref,
                "enabled": true
            }, "itemTypes")
    }

    prepopulate(item) {
        Object.keys(item).map((e) => { this.updateState(e, item[e]) });
    }

    updateState(elementName, object) {
        let obj;
        if (typeof object === "object") {
            obj = object.target.value;
        } else {
            obj = object;
        }
        this.setState(prevState => ({
            [elementName]: obj
        }));

        this.props.updateCallback(this.props.item.linkId, elementName, obj, "values")
    }

    render() {
        return (

            <div ref={this.ref}>
                <div className="text-input-label quantity">{this.props.inputTypeDisplay}</div>
                <div class="input-group">
                    <div class="input-group-prepend">
                        <Dropdown style={{borderRadius: "0px",border: "1px solid #797979"}} fluid placeholder='comparator' search selection options={options} />
                    </div>
                    <input type="text" class="form-control group-input-box" placeholder="value" value={this.state.value} onChange={(e) => { this.updateState("value", e) }}></input>
                    <input type="text" class="form-control group-input-box" placeholder="unit" value={this.state.unit} onChange={(e) => { this.updateState("unit", e) }}></input>
                </div>
                <div class="input-group">
                    <input type="text" class="form-control group-input-box" placeholder="code" value={this.state.code} onChange={(e) => { this.updateState("code", e) }}></input>
                    <input type="text" class="form-control group-input-box" placeholder="system" value={this.state.system} onChange={(e) => { this.updateState("system", e) }}></input>
                </div>
                {/* <div className="quantity-border">
                    <DropdownInput name="comparator" options={options} callback={this.updateState}></DropdownInput>
                    <input className="quantity-input value" placeholder="value" value={this.state.value} onChange={(e) => { this.updateState("value", e) }}></input>
                    <input className="quantity-input unit" placeholder="unit" value={this.state.unit} onChange={(e) => { this.updateState("unit", e) }}></input>
                </div>
                <div>
                    <input className="quantity-input code" placeholder="code" value={this.state.code} onChange={(e) => { this.updateState("code", e) }}></input>
                    <input className="quantity-input system" placeholder="system" value={this.state.system} onChange={(e) => { this.updateState("system", e) }}></input>
                </div> */}
            </div>
        );
    }
}