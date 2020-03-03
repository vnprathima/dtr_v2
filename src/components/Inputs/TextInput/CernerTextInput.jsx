import React, { Component } from 'react';

// import InputField from 'terra-form-input/lib/InputField';

import Input from 'terra-form-input';
import ThemeProvider from 'terra-theme-provider';
import DatePicker from 'terra-date-picker';
import Arrange from 'terra-arrange';
import Heading from 'terra-heading';
import Radio from 'terra-form-radio';
import Textarea from 'terra-form-textarea';

export default class CernerTextInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ""
        };
        this.handleDateChange = this.handleDateChange.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.myRef = React.createRef();
        this.inputTypes = ['text', 'decimal', 'url', 'datetime-local', 'datetime', 'time', 'file']
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
        if (this.props.inputType === "date" && value) {
            this.setState({ value: value.toString() });
        } else if (this.props.inputType === "boolean" && value !== undefined && value !== null) {
            // console.log("Initial boolean value---", value, this.props.item.text);
            if (value === "true") {
                this.setState({ value: true });
            }
            if (value === "false") {
                this.setState({ value: false });
            }
        }
        else if (value) {
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
        } else if (this.props.valueType === "multipleAttachment"){
            this.setState({ value: event.target.value })
            // console.log("files change", event.target.files);
                // update the parent state
                this.props.updateCallback("files", event.target.files, "values")
 
        } else if (this.props.inputType === 'boolean') {
            if (event.target.value === "true") {
                // update the parent state
                this.props.updateCallback(this.props.item.linkId, true, "values")
                // update local state
                this.setState({ value: true })
            }
            if (event.target.value === "false") {
                // update the parent state
                this.props.updateCallback(this.props.item.linkId, false, "values")
                // update local state
                this.setState({ value: false })
            }
        } else {
            // console.log("value----", event.target.value);
            // update the parent state
            this.props.updateCallback(this.props.item.linkId, event.target.value, "values")
            // update local state
            this.setState({ value: event.target.value })
        }
    }

    handleDateChange(event, date) {
        console.log("date----", date);
        // update the parent state
        this.props.updateCallback(this.props.item.linkId, date, "values")

        // update local state
        this.setState({ value: date })
    }

    render() {
        console.log("Linkd Id", this.props.linkId, this.props.inputType);
        return (
            <div ref={this.myRef}>
                {this.props.inputType === "textArea" &&
                    <Textarea
                        size="small"
                        id={this.props.linkId}
                        ariaLabel={this.props.item.text}
                        value={this.state.value}
                        onChange={this.onInputChange}
                    />
                }
                {(this.inputTypes.indexOf(this.props.inputType) > -1) &&
                    <Input type={this.props.inputType} name={this.props.item.text} id={this.props.linkId} ariaLabel={this.props.item.text}
                        value={this.state.value} onChange={this.onInputChange} multiple={this.props.inputTypeDisplay === "multipleAttachment"} />
                }
                {this.props.inputType === "date" &&
                    <DatePicker
                        name={this.props.item.text}
                        id={this.props.linkId}
                        onChange={this.handleDateChange}
                        value={this.state.value}
                    />
                }
                {this.props.inputType === "boolean" &&
                    <div>
                        <Radio id={"true_" + this.props.linkId} labelText="True" name={this.props.item.text} value="true" onChange={this.onInputChange} checked={this.state.value} isInline />
                        <Radio id={"false_" + this.props.linkId} labelText="False" name={this.props.item.text} value="false" onChange={this.onInputChange} checked={!this.state.value} isInline />
                    </div>
                }
            </div>
        );
    }
}
