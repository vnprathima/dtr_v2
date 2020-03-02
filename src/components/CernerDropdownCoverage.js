import React, {Component} from 'react';
import Field from 'terra-form-field';


var dateFormat = require('dateformat');

let blackBorder = "blackBorder";
import Select from 'terra-form-select';


const coverageOptions = [];

export default class CernerDropdownCoverage extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: "",coverageOptions:[]}
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
    this.setState({coverageOptions})
  }

  render() {
   
    return (
      <Field label="Coverage">
        <Select placeholder="Choose a coverage" value={this.state.currentValue}   onSelect={this.handleChange}  >
          {

            this.state.coverageOptions.map((option)=>{
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
