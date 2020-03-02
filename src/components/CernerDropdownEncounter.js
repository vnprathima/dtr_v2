import React, { Component } from 'react';
import Select from 'terra-form-select';
import Field from 'terra-form-field';

var dateFormat = require('dateformat');

// this.myclient = new FhirClient(this.URL);
export const encounterOptions = [];

let blackBorder = "blackBorder";

export default class CernerDropdownEncounter extends Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: "",encounterOptions:[] }
    this.handleChange = this.handleChange.bind(this);

  };
  componentDidMount() {
    this.getEncounterDetails();
  }
  async getEncounterDetails() {
    let encounters = this.props.encounters;
    let encounterOptions = [];
     console.log(encounters)
    for (var i = 0; i < encounters.length; i++) {
      console.log("Encounter Res:",encounters[i].resource)
      encounterOptions.push({
        key: encounters[i].resource.id,
        value: encounters[i].resource.id,
        text: encounters[i].resource.type[0].text + " ("+dateFormat(encounters[i].resource.period.start,"mm/dd/yyyy hh:mm")+")",
      })

    }
    this.setState({encounterOptions})
  }
  handleChange = (value) => {
    console.log("-------",this.props,value);
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  render() {
    const { currentValue } = this.state
    if (currentValue) {
      blackBorder = "blackBorder";
    } else {
      blackBorder = "";
    }
    console.log("ennne options",this.state.encounterOptions)
    return (
        <Field label="Encounter">
             <Select placeholder="Choose an encounter" value={this.state.currentValue}   onSelect={this.handleChange}  >
            {

              this.state.encounterOptions.map((option)=>{
                return(
                 <Select.Option value={option.value} key={option.key} display={option.text} />
                )
              })
            }
           </Select>
      </Field>
      
     
    )
  }
}
