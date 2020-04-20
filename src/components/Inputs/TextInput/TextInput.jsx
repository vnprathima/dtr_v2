import React, { Component } from 'react';
import './TextInput.css';
import '../../ComponentStyles.css';
var dateFormat = require('dateformat');

export default class TextInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
            area: false
        };

        this.onInputChange = this.onInputChange.bind(this);
        this.myRef = React.createRef();
    }

    componentWillUnmount() {
        this.props.updateCallback(this.props.item.linkId,
            {
                "type": this.props.inputTypeDisplay,
                "text": this.props.item.text,
                "valueType": this.props.valueType,
                "ref": this.myRef,
                "enabled": false
            }, "itemTypes");
    }

    componentDidMount() {
        // setup initial value from qForm
        var value = this.props.retrieveCallback(this.props.item.linkId); 
        // console.log("Initial value---",value, this.props.inputType, this.props.item.text);
        if (value) {
            if(this.props.inputType === "datetime-local"){
                value = value.toString();   
                value = dateFormat(value, "yyyy-mm-dd'T'HH:MM:ss");
            }
            this.setState({ value: value });
        // Add Values from initial key setup in Questionnarie
        } else if(this.props.item.hasOwnProperty("initial") && this.props.item.initial[0].hasOwnProperty(this.props.valueType)){
            this.setState({ value: this.props.item.initial[0][this.props.valueType] });
        }
        if (this.props.inputType === "textArea") {
            this.setState({ area: true });
        }

        this.props.updateCallback(this.props.item.linkId,
            {
                "type": this.props.inputTypeDisplay,
                "text": this.props.item.text,
                "valueType": this.props.valueType,
                "ref": this.myRef,
                "enabled": true
            }
            , "itemTypes")

    }

    onInputChange(event) {
        // update the parent state
        this.props.updateCallback(this.props.item.linkId, event.target.value, "values")
        // update local state
        this.setState({ value: event.target.value })
    }

    render() {
        return (
            <div>
                <div ref={this.myRef}>
                    {/* <div className="text-input-label">{this.props.inputTypeDisplay}</div> */}
                    {this.state.area ?
                        <textarea
                            className="ui fluid search selection text-input-box"
                            value={this.state.value}
                            onChange={this.onInputChange}>
                        </textarea>
                        :
                        <input className="ui fluid search selection text-input-box"
                            type={this.props.inputType}
                            value={this.state.value}
                            onChange={this.onInputChange}
                            readOnly={this.props.item.readOnly}>
                        </input>
                    }
                </div>
            </div>

        );
    }
}
