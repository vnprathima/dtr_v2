import React, { Component } from 'react';
import Field from 'terra-form-field';
import DynamicGrid from 'terra-dynamic-grid';

var dateFormat = require('dateformat');

let blackBorder = "blackBorder";
import Select from 'terra-form-select';


const coverageOptions = [];

export default class CernerDropdownCoverage extends Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: "", coverageOptions: [] }
    this.handleChange = this.handleChange.bind(this);
  };

  handleChange = (value) => {
    console.log(this.props);
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  componentDidMount() {
    this.getCoverageDetails();
  }
  async getCoverageDetails() {
    let coverages = this.props.coverages;
    console.log("Coverages PRoPs", this.props.coverages)
    for (var i = 0; i < coverages.length; i++) {
      console.log(coverages[i].id)
      if (coverages[i] != null && coverages[i] != undefined) {
        if (coverages[i].hasOwnProperty("class") && coverages[i].hasOwnProperty("period")) {
          let text = coverages[i].class[0].name + " (" + dateFormat(coverages[i].period.start, "mm/dd/yyyy hh:mm") + ")"
          coverageOptions.push({
            key: coverages[i].id,
            value: coverages[i].id,
            text: text,
          })
        }
      }
    }
    this.setState({ coverageOptions })
  }

  render() {
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
    return (
      <DynamicGrid defaultTemplate={template}>
        <DynamicGrid.Region defaultPosition={region1}>
          <Field htmlFor="coverage" label="Coverage"></Field>
        </DynamicGrid.Region>
        <DynamicGrid.Region defaultPosition={region2}>
          <Select variant="search" id="coverage" placeholder="Choose coverage" value={this.state.currentValue} onSelect={this.handleChange}  >
            {
              this.state.coverageOptions.map((option) => {
                return (
                  <Select.Option value={option.value} key={option.key} display={option.text} />
                )
              })
            }
          </Select>
        </DynamicGrid.Region>
      </DynamicGrid>
    )
  }
}
