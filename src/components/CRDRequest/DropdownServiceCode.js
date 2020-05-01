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
      selected_codes: [],
      selected_options: []
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
  };

  async componentDidMount() {
    try {
      let codesList = await this.getResources();
      this.setState({ codesList });
      let codes = this.state.codes;
      let service_category = this.state.service_category;
      service_category = [];
      this.setState({ service_category });
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
        let text = item.code
        if(item.code_description != "" && item.code_description != undefined && item.code_description != null){
          text = item.code + " - "+item.code_description
        }

        /**Update code options */
        let obj = { key: item.id, value: item.code, text: text,code_description:item.code_description  };
        codes.push(obj);
      });
      this.setState({ codes });
      this.setState({ service_category });
    } catch (error) {
      console.log('Codes list error, ', error);
    }
  }


  async onChangeAmount(code, event) {
    var selected_options = this.state.selected_options;
    selected_options.map((option) => {
      if (option.value == code) {
        option.quantity = event.target.value;
      }
    })
    this.setState({ selected_options });
    console.log(this.state.selected_options)
    this.props.updateCB(this.props.elementName, { codes: this.state.selected_codes, codeObjects: selected_options })
  }

  async getResources() {
    var url = "https://sm.mettles.com/cds/getCodes";
    let headers = {
      "Content-Type": "application/json",
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
    this.setState({ selected_codes: [] });
    this.setState({ selected_options: [] });
    this.props.updateCB(this.props.elementName, []);
    let codes = this.state.codes;
    codes = [];
    this.setState({ codes });
    
    this.state.codesList.map((item) => {
      if (item.service_category === value) {
        let text = item.code
        if(item.code_description != "" && item.code_description != undefined && item.code_description != null){
          text = item.code + " - "+item.code_description
        }
        let obj = { key: item.id, value: item.code, text: text ,code_description: item.code_description};
        codes.push(obj);
      }
    });
    this.setState({ codes });
    console.log(this.props);
  }

  handleChange = (e, { value }) => {
    this.setState({ currentValue: value })
    this.setState({ selected_codes: value });
    console.log(value);
    var selected_options = [];

    this.state.selected_options.map((option) => {
      if (value.indexOf(option.value) > -1) {
            let code_description = ""
          this.state.codes.map((codeObj)=>{
            if(option.value == codeObj.value){
              option.code_description = codeObj.code_description
            }
            
          })
        selected_options.push(option);
      }
    })
    value.map((val, key) => {
      let found = false;
      selected_options.map((option) => {
        if (val == option.value) {
          found = true;
        }
      })
      if (!found) {
       let code_description = ""
        this.state.codes.map((codeObj)=>{
          console.log(codeObj,val)
          if(val == codeObj.value){
            code_description = codeObj.code_description
          }
          
        })
        selected_options.push({ value: val, quantity: 1,code_description:code_description })

      }

    });
    this.setState({ selected_options: selected_options });
    this.props.updateCB(this.props.elementName, { codes: value, codeObjects: selected_options })


    // var option = {value:value,quantity:quantity}
    console.log("Valllue", selected_options);
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
          <div className="form-group col-md-6">
            <h4 className="title">Service type*</h4>
          </div>
          <div className="form-group col-md-6">
            <Dropdown
              className={blackBorder}
              options={this.state.service_category}
              placeholder='Service Type'
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
          <div className="form-group col-md-6">
            <h4 className="title">Codes*</h4>
          </div>
          <div className="form-group col-md-6">
            <Dropdown
              className={blackBorder}
              options={this.state.codes}
              value={this.state.selected_codes}
              placeholder='Codes'
              search
              selection
              fluid
              multiple
              closeOnChange
              onChange={this.handleChange}
            />
          </div>
        </div>
        {this.state.selected_codes.length > 0 &&
          <div className="form-row">
            <div className="col-md-12">
              <table className="table table-bordered table-sm table-striped">
                <thead>
                  <tr><td style={{width:"20%"}}>Code</td><td style={{width:"10%"}}>Quantity</td><td>Description</td></tr>
                </thead>
                <tbody>
                  {
                    this.state.selected_options.map((item) => {
                      return (
                        <tr key={item.value}>
                          <td>
                            {item.value}
                          </td>
                          
                          <td>
                            <div className="">
                              <input type="number" step="0.01" name="quantity" className="form-control" id="number" placeholder="Quantity"
                                onChange={(event) => this.onChangeAmount(item.value, event)}
                                value={item.quantity}
                              />
                            </div>
                          </td>
                          <td>
                            {item.code_description}
                          </td>
                        </tr>
                      )
                    })

                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    )
  }
}
export default hot(module)(DropdownServiceCode);
