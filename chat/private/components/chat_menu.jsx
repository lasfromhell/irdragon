import React from 'react';
import Presence from "./presence";

const PRESENCE = 'presence';
const NONE = 'none';

export default class ChatMenu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showMenu: false,
            choosedItem: ''
        };
        this.loggingOut = false;
    }

    static removeCookie(name) {
        const date = new Date();
        date.setTime(date.getTime() - 1000);
        document.cookie = name + "=;" + date.toUTCString();
    }

    logout() {
        if (!this.loggingOut) {
            this.loggingOut = true;
            this.props.chatProxy.logout()
                .finally(() => {
                    ChatMenu.removeCookie(name);
                    this.props.onLogout();
                    this.loggingOut = false;
                });
        }
    }

    togglePresence() {
        let choosedItem;
        if (this.state.choosedItem === PRESENCE) {
            choosedItem = NONE;
        }
        else {
            choosedItem = PRESENCE;
        }
        this.setState({
            choosedItem: choosedItem
        });
    }

    fullScreen() {
        this.props.control.fullScreen();
    }

    render() {
        return <div><div className="chat-header">
            <span className="chat-header-text">{this.props.headerMessage}</span>
            <div className="chat-menu">
                <i className={"awesome-default fas fa-users" + (this.state.choosedItem === PRESENCE ? ' awesome-selected' : '')} onClick={this.togglePresence.bind(this)}/>
                <i className={"awesome-default fas fa-arrows-alt"} onClick={this.fullScreen.bind(this)}/>
                <i className="awesome-default fas fa-sign-out-alt" onClick={this.logout.bind(this)}/>
                <div className={"chat-preferences-block " + (this.state.showMenu ? "" : "hidden")} >
                    <div className="chat-preferences-item" onClick={this.logout.bind(this)}>Logout</div>
                </div>
            </div>
        </div><div className={"chat-menu-data" + (this.state.choosedItem === '' ? '' : (this.state.choosedItem === NONE ? ' ' : ' chat-menu-data-animate'))}>
        {
            this.state.choosedItem === PRESENCE ? <Presence observables={this.props.observables}/> : <div/>
        }
        </div></div>;
    }
}