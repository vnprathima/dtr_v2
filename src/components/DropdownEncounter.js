import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
var dateFormat = require('dateformat');

// this.myclient = new FhirClient(this.URL);
export const encounterOptions = [];

let blackBorder = "blackBorder";

export default class DropdownEncounter extends Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: "" }
    this.handleChange = this.handleChange.bind(this);

  };
  componentDidMount() {
    this.getEncounterDetails();
  }
  async getEncounterDetails() {
    let encounters = this.props.encounters;
    for (var i = 0; i < encounters.length; i++) {
      console.log(encounters[i].resource.id)
      encounterOptions.push({
        key: encounters[i].resource.id,
        value: encounters[i].resource.id,
        text: encounters[i].resource.type[0].text + " ("+dateFormat(encounters[i].resource.period.start,"mm/dd/yyyy hh:mm")+")",
      })

    }
  }
  handleChange = (e, { value }) => {
    console.log(this.props);
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
    return (
      <Dropdown
        className={blackBorder}
        options={encounterOptions}
        placeholder='Choose Encounter'
        search
        selection
        fluid
        onChange={this.handleChange}
      />
    )
  }
}
