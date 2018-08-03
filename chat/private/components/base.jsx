import React from 'react';
import Login from './login';
import Chat from './chat';
import ChatProxy from './services/chat_proxy'

export default class Base extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoggedIn: false,
            isChecked: false,
            siteVisible: true
        };
        this.storedTitle = 'IR Dragon';
        this.authenticated = this.authenticated.bind(this);
        this.chatProxy = new ChatProxy();
        this.checkAuthentication();
        this.lastActivity = 0;

        document.addEventListener('keypress', this.onKeyPress.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('focus', this.onFocus.bind(this));
        setInterval(this.updateActivityByTimer.bind(this) ,5000)
    }

    updateActivityByTimer() {
        if (document.hasFocus()) {
            this.updateActivity();
        }
    }

    onKeyPress(e) {
        if ((e.code === 'space' || e.key === ' ') && e.ctrlKey) {
            this.setState({
                siteVisible: !this.state.siteVisible
            });
            if (this.state.siteVisible) {
                this.updateTitle(this.storedTitle);
            }
            else {
                document.title = "New Site";
            }
        }
        this.updateActivity();
    }

    onMouseMove() {
        this.updateActivity();
    }

    onFocus() {
        this.updateActivity();
    }

    updateActivity() {
        if (!this.state.isLoggedIn) {
            return;
        }
        const currentActivity = new Date().getTime();
        if (currentActivity - this.lastActivity > 5000) {
            this.chatProxy.sendAction();
            this.lastActivity = currentActivity;
        }
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

    updateTitle(newTitle) {
        if (this.state.siteVisible) {
            document.title = newTitle;
        }
        this.storedTitle = newTitle;
    }

    authenticated(userData) {
        this.chatProxy.setToken(userData.token);
        this.setState({
            isLoggedIn: true,
            userData: userData
        });
    }
    
    onLogout() {
        this.chatProxy.setGoToHomeCallback(null);
        this.chatProxy.setSuccessCallback(null);
        this.chatProxy.setErrorCallback(null);
        this.setState({
            isLoggedIn: false
        });
    }

    render() {
        return (
            <div className={this.state.siteVisible ? "" : "hidden"}>
                {this.state.isChecked ? (
            this.state.isLoggedIn ?
                <Chat userData={this.state.userData} updateTitleCB={this.updateTitle.bind(this)} onLogout={this.onLogout.bind(this)} chatProxy={this.chatProxy}/>
                : <Login authenticatedCB={this.authenticated} chatProxy={this.chatProxy}/>
            ) : <div/> }
            </div>
            );
    }
};