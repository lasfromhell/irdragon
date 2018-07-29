import React from 'react';
import axios from 'axios';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            login: '',
            password: '',
            authenticating: false,
            error: '',
            rememberCookie: true
        };
        this.unmounted = false;
        this.authenticate = this.authenticate.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputKeyPress = this.handleInputKeyPress.bind(this);
        this.authenticatedCB = props.authenticatedCB;
    }

    authenticate() {
        if (this.state.authenticating) {
            return;
        }
        this.setState({
            authenticating: true
        });
        axios.post('/api/user/authenticate', {
            login: this.state.login,
            password: this.state.password,
            rememberCookie: this.state.rememberCookie
        }).then((response) => {
            this.authenticatedCB(response.data);
        }).catch((error) => {
            this.setState({
                error: error.message + ' : ' + error.response.statusText
            });
        }).finally(() => {
            if (this.unmounted === false) {
                this.setState({
                    authenticating: false
                });
            }
        });
    }

    handleInputChange(event) {
        const target = event.target;
        let value;
        if (target.type === "checkbox") {
            value = target.checked;
        }
        else {
            value = target.value;
        }
        this.setState({
            [target.id]: value
        });
    }

    handleInputKeyPress(event) {
        if (event.charCode === 13 || event.keyCode === 13 || event.which === 13) {
            this.authenticate();
        }
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    render() {
        return <form><div className="authentication-container">
            <div className="authentication-box">
                <div className="row">
                    <label htmlFor="login">Login:</label>
                    <input className="form-submit-text" id="login" type="text" value={this.state.login} onChange={this.handleInputChange} onKeyPress={this.handleInputKeyPress} autoComplete="username"/>
                </div>
                <div className="row">
                    <label htmlFor="password">Password:</label>
                    <input className="form-submit-text" id="password" type="password" value={this.state.password} onChange={this.handleInputChange} onKeyPress={this.handleInputKeyPress} autoComplete="current-password"/>
                </div>
                <div className="row">
                    <input className="form-submit-checkbox" id="rememberCookie" type="checkbox" checked={this.state.rememberCookie} onChange={this.handleInputChange}/>
                    <label htmlFor="rememberCookie">Remember for 2h when closed</label>
                </div>
                <div className="row text-error">
                    {this.state.error}
                </div>
                <div className="row middle">
                    <input className="form-submit-btn" type="button" id="authenticateBtn" value="Sign in" onClick={this.authenticate} disabled={this.state.authenticating}/>
                </div>
            </div>
        </div></form>;
    }
}

