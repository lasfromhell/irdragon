import React from 'react';
import Chat from "./chat";

export default class ChatMenu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showMenu: false
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
            this.props.axios.post('/api/user/logout')
                .finally(() => {
                    ChatMenu.removeCookie(name);
                    this.props.onLogout();
                    this.loggingOut = false;
                });
        }
    }

    render() {
        return <div className="chat-menu">
            <i className="awesome-default fas fa-sign-out-alt" onClick={this.logout.bind(this)}/>
            <div className={"chat-preferences-block " + (this.state.showMenu ? "" : "hidden ")} >
                <div className="chat-preferences-item" onClick={this.logout.bind(this)}>Logout</div>
            </div>
        </div>;
    }
}