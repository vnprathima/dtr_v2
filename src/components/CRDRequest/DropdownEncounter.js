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
    encounters.sort(function (a, b) {
      if (b.resource.hasOwnProperty("period") && a.resource.hasOwnProperty("period")) {
        return new Date(b.resource.period.start) - new Date(a.resource.period.start)
      } else {
        return a.resource.status > b.resource.status
      }
    })
    for (var i = 0; i < encounters.length; i++) {
      // console.log(encounters[i].resource.id)
      if (encounters[i].resource.hasOwnProperty("period")) {
        encounterOptions.push({
          key: encounters[i].resource.id,
          value: encounters[i].resource.id,
          text: encounters[i].resource.type[0].text + " (" + dateFormat(encounters[i].resource.period.start, "mm/dd/yyyy hh:mm") + ")",
        })
      } else {
        encounterOptions.push({
          key: encounters[i].resource.id,
          value: encounters[i].resource.id,
          text: encounters[i].resource.type[0].text,
        })
      }

    }
    // console.log("enc1",encounterOptions)
    if (encounterOptions.length > 0) {
      // console.log("enc opts",encounterOptions)
      this.props.updateCB(this.props.elementName, encounterOptions[0].value)
      this.setState({ currentValue: encounterOptions[0].value })
    }
    // console.log("enc 2",encounterOptions)


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
        value={this.state.currentValue}
        search
        selection
        fluid
        onChange={this.handleChange}
      />
    )
  }
}
