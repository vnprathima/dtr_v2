import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';
var dateFormat = require('dateformat');


export const options = [
  { key: 'Coverage/5', value: 'Coverage/5', text: 'Coverage 5',resource_json:{
    resourceType: "Coverage",
    id: "5",
    class: [
      {
        type: {
          system: "http://hl7.org/fhir/coverage-class",
          code: "plan"
        },
        value: "Medicare Part D"
      }
    ],
    payor: [
      {
        reference: "Organization/6"
      }
    ]
    }
  },
  { key: 'Coverage/2', value: 'Coverage/2', text: 'Coverage b',resource_json:{} },
  { key: 'Coverage/3', value: 'Coverage/3', text: 'Coverage c',resource_json:{} },

]

let blackBorder = "blackBorder";

export const coverageOptions = [];

export default class DropdownCoverage extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: ""}
    this.handleChange = this.handleChange.bind(this);
  };

  handleChange = (e, { value }) => {
    console.log(this.props);
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  componentDidMount() {
    this.getCoverageDetails();
  }
  async getCoverageDetails() {
    let coverages = this.props.coverages;
    console.log("Coverages PRoPs",this.props.coverages)
    for (var i = 0; i < coverages.length; i++) {
      console.log(coverages[i].id)
      if(coverages[i] != null && coverages[i] != undefined){
        if(coverages[i].hasOwnProperty("class")  && coverages[i].hasOwnProperty("period")){
          let text = coverages[i].class[0].name + " ("+dateFormat(coverages[i].period.start,"mm/dd/yyyy hh:mm")+")"
          coverageOptions.push({
            key: coverages[i].id,
            value: coverages[i].id,
            text: text,
          })
        }

      }
      
    }
  }

  render() {
    const { currentValue } = this.state
    if(currentValue){
        blackBorder = "blackBorder";
    }else{
        blackBorder = "";
    }
    return (
      <Dropdown
      className={blackBorder}
        options={coverageOptions}
        placeholder='Choose Coverage'
        search
        selection
        fluid
        onChange={this.handleChange}
      />
    )
  }
}
