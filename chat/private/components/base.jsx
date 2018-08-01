import React from 'react';
import Login from './login';
import Chat from './chat';
import ChatProxy from './services/chat_proxy'

export default class Base extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false,
            isChecked: false
        };

        this.authenticated = this.authenticated.bind(this);
        this.chatProxy = new ChatProxy();
        this.checkAuthentication();
    }

    checkAuthentication() {
        this.chatProxy.authorize()
            .then(response => {
                if (response.status === 200) {
                    this.chatProxy.setToken(response.data.token);
                    this.setState({
                        isLoggedIn: true,
                        userData: response.data,
                        isChecked: true
                    });
                }
            }).catch(e => {
            this.setState({isChecked: true});
        })
    }

    static updateTitle(newTitle) {
        document.title = newTitle;
    }

    authenticated(userData) {
        this.setState({
            isLoggedIn: true,
            userData: userData
        });
    }
    
    onLogout() {
        this.chatProxy.setGoToHomeCallback(null);
        this.setState({
            isLoggedIn: false
        });
    }

    render() {
        return (
            this.state.isChecked ? (
            this.state.isLoggedIn ?
                <Chat userData={this.state.userData} updateTitleCB={Base.updateTitle} onLogout={this.onLogout.bind(this)} chatProxy={this.chatProxy}/>
                : <Login authenticatedCB={this.authenticated} chatProxy={this.chatProxy}/>
            ) : <div/> );
    }
};