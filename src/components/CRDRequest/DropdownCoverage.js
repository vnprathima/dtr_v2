import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';
var dateFormat = require('dateformat');

let blackBorder = "blackBorder";

const coverageOptions = [];

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
