import React from 'react';
import Login from './login';
import Chat from './chat';
import axios from 'axios';

export default class Base extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false,
            isChecked: false
        };

        this.authenticated = this.authenticated.bind(this);
        this.checkAuthentication();
    }

    checkAuthentication() {
        axios.post("/api/user/authorize")
            .then(response => {
                if (response.status === 200) {
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
        this.setState({
            isLoggedIn: false
        });
    }

    render() {
        return (
            this.state.isChecked ? (
            this.state.isLoggedIn ?
                <Chat userData={this.state.userData} updateTitleCB={Base.updateTitle} onLogout={this.onLogout.bind(this)}/> : <Login authenticatedCB={this.authenticated}/>
            ) : <div/> );
    }
};