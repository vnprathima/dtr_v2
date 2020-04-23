import React, { Component } from 'react';

import { getDocumentReferences } from '../../../util/util.js';
import { Dropdown } from 'semantic-ui-react';

export default class ReferenceInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            options: false,
            valueType: "valueReference"
        };

        this.onInputChange = this.onInputChange.bind(this);
        this.onChange = this.onChange.bind(this);
        this.getDocumentReferences = this.getDocumentReferences.bind(this);
        this.ref = React.createRef();
    }

    componentWillUnmount() {
        this.props.updateCallback(this.props.item.linkId,
            {
                "type": this.props.inputTypeDisplay,
                "text": this.props.item.text,
                "valueType": "valueCoding",
                "ref": this.ref,
                "enabled": false
            }, "itemTypes");
    }

    componentWillMount() {
        this.getDocumentReferences(this.props.item.linkId);
    }

    componentDidMount() {
        const value = this.props.retrieveCallback(this.props.item.linkId);
        this.autofill(value);
        this.props.updateCallback(this.props.item.linkId,
            {
                "type": this.props.inputTypeDisplay,
                "text": this.props.item.text,
                "valueType": this.state.valueType,
                "ref": this.ref,
                "enabled": true
            }, "itemTypes");
    }

    autofill(value) {
        console.log("Reference type --", value);
        try {
            if (value.hasOwnProperty("valueReference")) {
                id = value.valueReference.reference.split("/")[1];
                this.setState({ value: id });
            }
        } catch (err) {
            console.log("Unable to set initial value for " + this.props.item.linkId);
        }
    }

    onInputChange(e, { name, value }) {
        this.setState({ [name]: value });
        let reference = {
            "reference": "DocumentReference/" + value,
            "type": "DocumentReference"
        }
        this.props.updateCallback(this.props.item.linkId, reference, "values")
    }
    onChange(event) {
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
    }
    getDocumentReferences() {
        let self = this;
        const Http = new XMLHttpRequest();
        let url = sessionStorage.getItem("serviceUri") + "/DocumentReference?patient=" + sessionStorage.getItem('auth_patient_id');
        Http.open("GET", url);
        Http.setRequestHeader("Content-Type", "application/json");
        Http.setRequestHeader("Accept", "application/json");
        Http.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem("token"));
        Http.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                let references = [];
                console.log("Doc reference ---", JSON.parse(this.responseText));
                let response = JSON.parse(this.responseText);
                if (response.hasOwnProperty("total") && response.total > 0) {
                    response.entry.map((doc) => {
                        references.push({ key: doc.resource.id, text: doc.resource.id, value: doc.resource.id });
                    })
                    self.setState({ options: references });
                } else {
                    self.setState({ options: false });
                }
            }
        }
        Http.send();
    }

    render() {
        return (
            <div>
                {this.state.options &&
                    <Dropdown style={{ borderRadius: "0px", border: "1px solid #797979" }}
                        fluid name="value"
                        search selection options={this.state.options}
                        onChange={this.onInputChange} />
                }
                {!this.state.options &&
                    <input className="ui fluid search selection text-input-box"
                        type="file"
                        name="attachment"
                        onChange={this.onChange}
                        readOnly={this.props.item.readOnly}
                    >
                    </input>
                }
            </div>

        );
    }
}
