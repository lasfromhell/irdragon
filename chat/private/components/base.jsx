import React from 'react';
import Login from './login';
import Chat from './chat';

export default class Base extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false
        };

        this.authenticated = this.authenticated.bind(this);

    }

    authenticated(userData) {
        this.setState({
            isLoggedIn: true,
            userData: userData
        });
    }

    render() {
        return (
            this.state.isLoggedIn ?
                <Chat userData={this.state.userData}/> : <Login authenticatedCB={this.authenticated}/>
            );
    }
};