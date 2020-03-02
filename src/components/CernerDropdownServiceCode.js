import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { hot } from "react-hot-loader";
import Select from 'terra-form-select';
import Table, {
  Header,
  HeaderCell,
  Body,
  Cell,
  Row,
} from 'terra-html-table';
import Input from 'terra-form-input';
import Field from 'terra-form-field';


let blackBorder = "blackBorder";

class CernerDropdownServiceCode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentValue: "",
      service_category: [],
      codes: [],
      codesList: [],
      selected_codes: [],
      selected_options:[]
    }
    // this.handleChange = this.handleChange.bind(this);
    this.handleDeselect = this.handleDeselect.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
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


  async onChangeAmount(code , event){
    var selected_options = this.state.selected_options;
    selected_options.map((option)=>{
      if(option.value == code){
        option.quantity = event.target.value;
      }
    })
    this.setState({selected_options});
    console.log(this.state.selected_options)
    this.props.updateCB(this.props.elementName, {codes:this.state.selected_codes,codeObjects:selected_options})
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

  handleCategoryChange = (value ) => {
    console.log("handle Category",value)
    this.setState({selected_codes:[]});
    this.setState({selected_options:[]});
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

  handleDeselect=(value)=>{
    console.log("onDeselect",value)
    var selected_codes = this.state.selected_codes;
    let index = selected_codes.indexOf(value);
    selected_codes.splice(index,1);
    this.setState({selected_codes})
    var selected_options = [];
    this.state.selected_options.map((option)=>{
      if(selected_codes.indexOf(option.value) > -1){
        selected_options.push(option);
      }
    })
    selected_codes.map((val,key)=>{
      let found = false;
      selected_options.map((option)=>{
        if(val == option.value){
          found = true;
        }
      })
      if(!found){
        selected_options.push({value:val,quantity:1})

      }

    });
    this.setState({selected_options:selected_options});
    this.props.updateCB(this.props.elementName, {codes:selected_codes,codeObjects:selected_options})
  }

  handleSelect = ( value ) => {
        console.log("handleSelect",value)

    this.setState({ currentValue: value })
    this.setState({selected_codes:value});
    var selected_codes = this.state.selected_codes;
    selected_codes.push(value);
    this.setState({selected_codes});
    console.log(value);
    var selected_options = [];
    this.state.selected_options.map((option)=>{
      if(selected_codes.indexOf(option.value) > -1){
        selected_options.push(option);
      }
    })
    selected_codes.map((val,key)=>{
      let found = false;
      selected_options.map((option)=>{
        if(val == option.value){
          found = true;
        }
      })
      if(!found){
        selected_options.push({value:val,quantity:1})

      }

    });
    this.setState({selected_options:selected_options});
    this.props.updateCB(this.props.elementName, {codes:selected_codes,codeObjects:selected_options})
    
   
    // var option = {value:value,quantity:quantity}
    console.log("Valllue",selected_options);
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

            <Field label="Category">
              <Select placeholder="select a category" onSelect={this.handleCategoryChange}>
                  {

                    this.state.service_category.map((category)=>{
                      return(
                       <Select.Option value={category.value} key={category.key} display={category.text} />
                      )
                    })
                  }
              </Select>
            </Field>
            <Field label="Codes">
         
             <Select placeholder="Choose code(s)" variant="multiple"  value={this.state.selected_codes} onDeselect={this.handleDeselect}  onSelect={this.handleSelect}  >
                  {

                    this.state.codes.map((code)=>{
                      return(
                       <Select.Option value={code.value} key={code.key} display={code.text} />
                      )
                    })
                  }
              </Select>
            </Field>
     
        { this.state.selected_codes.length > 0 &&
          
          <Table>
            <Header>
              <HeaderCell key="Code">Code</HeaderCell>
              <HeaderCell key="Quantity">Quantity</HeaderCell>
            </Header>
            <Body>
              {
                  this.state.selected_options.map((item)=>{
                    return(
                      <Row key={item.value}>
                        <Cell key="Code">{item.value}</Cell>
                        <Cell key="Quantity">
                          <Input type="text"  name="quantity" id="quantity" ariaLabel="Quantity"
                    value={item.quantity} onChange={(event)=>this.onChangeAmount(item.value,event)} />
                        </Cell>
                      </Row>
                    )
                  })

                }
            </Body>
          </Table>
       
          }
      </div>
    )
  }
}
export default hot(module)(CernerDropdownServiceCode);
