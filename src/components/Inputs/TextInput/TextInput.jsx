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
            if (this.props.inputType === "datetime-local") {
                value = value.toString();
                value = dateFormat(value, "yyyy-mm-dd'T'HH:MM:ss");
            }
            this.setState({ value: value });
            // Add Values from initial key setup in Questionnarie
        } else if (this.props.item.hasOwnProperty("initial") && this.props.item.initial[0].hasOwnProperty(this.props.valueType)) {
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
        if (this.props.valueType === "valueAttachment") {
            let self = this;
            console.log("files--", event.target.files[0]);
            (function (file) {
                let content_type = file.type;
                let file_name = file.name;
                var reader = new FileReader();
                reader.onload = function (e) {
                    // get file content  
                    let attachment = {
                        "data": reader.result,
                        "contentType": content_type,
                        "title": file_name,
                        "language": "en"
                    }
                    // update the parent state
                    self.props.updateCallback(self.props.item.linkId, attachment, "values")
                }
                reader.readAsBinaryString(file);
            })(event.target.files[0])
        } else if (this.props.valueType === "valueDateTime") {
            var datetime = dateFormat(event.target.value, "yyyy-mm-dd'T'HH:MM:ss");
             // update the parent state
             this.props.updateCallback(this.props.item.linkId, datetime, "values")
             // update local state
             this.setState({ value: event.target.value })
        }else {
            // update the parent state
            this.props.updateCallback(this.props.item.linkId, event.target.value, "values")
            // update local state
            this.setState({ value: event.target.value })
        }
    }

    render() {
        return (
            <div>
                <div ref={this.myRef}>
                    {/* <div className="text-input-label">{this.props.inputTypeDisplay}</div> */}
                    {this.state.area &&
                        <textarea
                            className="ui fluid search selection text-input-box"
                            value={this.state.value}
                            onChange={this.onInputChange}>
                        </textarea>
                    }
                    {(!this.state.area && this.props.valueType !== "valueAttachment") &&
                        <input className="ui fluid search selection text-input-box"
                            type={this.props.inputType}
                            value={this.state.value}
                            onChange={this.onInputChange}
                            readOnly={this.props.item.readOnly}>
                        </input>
                    }
                    {this.props.valueType === "valueAttachment" &&
                        <input className="ui fluid search selection text-input-box"
                            type={this.props.inputType}
                            onChange={this.onInputChange}
                            readOnly={this.props.item.readOnly}>
                        </input>
                    }
                </div>
            </div>

        );
    }
}
