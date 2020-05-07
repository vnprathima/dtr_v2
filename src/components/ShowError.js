import React, { Component } from 'react';
export default class showError extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: ""
        }
    }
    componentDidMount(){
        if(this.props.type === "token"){
            this.setState({errorMessage:"Access token has expired. Try relaunching the app !!"})
        } else if(this.props.type === "invalidAuth"){
            this.setState({errorMessage:"Failed to parse auth response !!"})
        } else if(this.props.type === "invalidContext"){
            this.setState({errorMessage:"Invalid app context. Unable to fetch resources !!"})
        }else if(this.props.type === "noPatient"){
            this.setState({errorMessage:"Failed to get a patientId from the app params or the authorization response."})
        } else {
            this.setState({errorMessage:"An unknown error occured !!"})
        }
    }
    render() {
        return (
            <div className="token-expired">{this.state.errorMessage}</div>
        )
    }
}