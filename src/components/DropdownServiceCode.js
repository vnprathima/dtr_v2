import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { hot } from "react-hot-loader";

let blackBorder = "blackBorder";

class DropdownServiceCode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentValue: "",
      service_category: [],
      codes: [],
      codesList: [],
      selected_codes: []
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
  };

  async componentDidMount() {
    try {
      let codesList = await this.getResources();
      this.setState({ codesList });
      let codes = this.state.codes;
      let service_category = this.state.service_category;
      service_category = [];
      this.setState({service_category});
      codesList.map((item) => {
        /**Update code type options */
        let type = item.service_category;
        let service_category_obj = { key: type, value: type, text: item.service_category };
        var exists = false;
        
        for (var i in service_category) {
          if (service_category[i].key === type) {
            exists = true;
          }
        }
        // console.log("Category-",item.id,item.code,"---",service_category,exists,);
        if (!exists) {
          service_category.push(service_category_obj);
        }


        /**Update code options */
        let obj = { key: item.id, value: item.code, text: item.code };
        codes.push(obj);
      });
      this.setState({ codes });
      this.setState({ service_category });
    } catch (error) {
      console.log('Codes list error, ', error);
    }
  }

  async getResources() {
    console.log("Props in  codes----",this.props.config);
      //    var url = this.props.config.cds_service.get_codes;
      var url = "http://cdex.mettles.com/cds/getCodes";
    // let token;
    // token = await createToken(this.props.config.provider.grant_type, 'provider', sessionStorage.getItem('username'), sessionStorage.getItem('password'))
    let headers = {
      "Content-Type": "application/json",
      // 'Authorization': 'Bearer ' + token
    }

    let codesList = await fetch(url, {
      method: "GET",
      headers: headers
    }).then(response => {
      return response.json();
    }).then((response) => {
      return response;
    }).catch(reason =>
      console.log("No response recieved from the server", reason)
    );
    return codesList;
  }

  handleCategoryChange = (e, { value }) => {
    this.setState({selected_codes:[]});
    this.props.updateCB(this.props.elementName, []);
    let codes = this.state.codes;
    codes = [];
    this.setState({ codes });
    this.state.codesList.map((item) => {
      if (item.service_category=== value) {
        let obj = { key: item.id, value: item.code, text: item.code };
        codes.push(obj);
      }
    });
    this.setState({ codes });
    console.log(this.props);
  }

  handleChange = (e, { value }) => {
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
    this.setState({selected_codes:value});
  }

  render() {
    const { currentValue } = this.state
    if (currentValue) {
      blackBorder = "blackBorder";
    } else {
      blackBorder = "";
    }
    return (
      <div>
        <div className="form-row">
          <div className="form-group col-md-3 offset-1">
            <h4 className="title">Service type*</h4>
          </div>
          <div className="form-group col-md-8">
            <Dropdown
              className={blackBorder}
              options={this.state.service_category}
              placeholder='Category'
              search
              selection
              fluid
              onChange={this.handleCategoryChange}
            />
          </div>
          {/* <div className="form-group col-md-3">
          <Dropdown
              className={blackBorder}
              options={this.state.code_options}
              placeholder='Code'
              search
              selection
              fluid
              onChange={this.handleChange}
            />
          </div> */}
        </div>
        <div className="form-row">
          <div className="form-group col-md-3 offset-1">
            <h4 className="title">ICD 10 / HCPCS Codes*</h4>
          </div>
          <div className="form-group col-md-8">
            <Dropdown
              className={blackBorder}
              options={this.state.codes}
              value={this.state.selected_codes}
              placeholder='ICD 10 codes'
              search
              selection
              fluid
              multiple
              onChange={this.handleChange}
            />
          </div>
        </div>
      </div>
    )
  }
}
export default hot(module)(DropdownServiceCode);
