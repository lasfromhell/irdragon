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

    updateTitle(newTitle) {
        document.title = newTitle;
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
                <Chat userData={this.state.userData} updateTitleCB={this.updateTitle}/> : <Login authenticatedCB={this.authenticated}/>
            );
    }
};