import React, { Component } from 'react';

// import InputField from 'terra-form-input/lib/InputField';

import Input from 'terra-form-input';
import ThemeProvider from 'terra-theme-provider';
import DatePicker from 'terra-date-picker';
import Arrange from 'terra-arrange';
import Heading from 'terra-heading';

export default class CernerTextInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ""
        };
        this.handleDateChange = this.handleDateChange.bind(this);
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
        const value = this.props.retrieveCallback(this.props.item.linkId);
        if (value) {
            this.setState({ value: value });
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
        if (this.props.valueType === 'valueAttachment') {
            this.setState({ value: event.target.value })
            console.log("Input change", event.target.files, event.target.value);
            let file = event.target.files[0];
            let content_type = file.type;
            let file_name = file.name;
            var fileValue = {}
            let self = this;
            var reader = new FileReader();
            reader.onload = function (e) {
                // get file content  
                fileValue = {
                    "data": reader.result,
                    "contentType": content_type,
                    "title": file_name,
                    "language": "en"
                }
                console.log(fileValue, JSON.stringify(fileValue));
                // update the parent state
                self.props.updateCallback(self.props.item.linkId, fileValue, "values")
            }
            reader.readAsBinaryString(file);
        } else {
            // update the parent state
            this.props.updateCallback(this.props.item.linkId, event.target.value, "values")
            // update local state
            this.setState({ value: event.target.value })
        }
    }

    handleDateChange(event,date) {
        console.log("date----",date);
        // update the parent state
        this.props.updateCallback(this.props.item.linkId, date, "values")

        // update local state
        this.setState({ value: date })
    }

    render() {
        return (
            <div ref={this.myRef}>
                {this.props.inputType === "textArea" &&
                    <textarea
                        className="form-control"
                        value={this.state.value}
                        onChange={this.onInputChange}>
                    </textarea>
                }
                {this.props.inputType === "text" &&
                    <Input name={this.props.item.text} id={this.props.linkId} ariaLabel={this.props.item.text} value={this.state.value} onChange={this.onInputChange} />
                }
                {this.props.inputType === "date" &&
                    <DatePicker
                    name={this.props.item.text}
                    id={this.props.linkId}
                    onChange={this.handleDateChange}
                    value={this.state.value}
                  />
                }
            </div>
        );
    }
}
