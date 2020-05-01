import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import providerOptions from './providerOptions.json';

let blackBorder = "blackBorder";

export default class DropdownOrderTo extends Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: "" }
    this.handleChange = this.handleChange.bind(this);
  };

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
        options={providerOptions}
        placeholder='Select Provider'
        search
        selection
        fluid
        onChange={this.handleChange}
      />
    )
  }
}
