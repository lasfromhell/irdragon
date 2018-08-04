import React from "react";
import Chat from "./chat";

export default class PresenceComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    calculateStatus() {
        const currentDate = new Date().getTime();
        if (this.item.online) {
            const diff = currentDate - this.item.online.activityDate * 1000;
            this.online = diff < 7000;
        }
        if (this.item.action) {
            const diff = currentDate - this.item.action.activityDate * 1000;
            this.active = diff < 10000;
        }
        let presenceDate;
        if (this.online) {
            presenceDate = new Date(this.item.action.activityDate * 1000);
        }
        else {
            presenceDate = new Date(this.item.online.activityDate * 1000);
        }
        this.presenceDateString = Chat.formatDate(presenceDate);
    }

    onlineStatus() {
        return this.online ? 'presence-status-online' : 'presence-status-offline';
    }

    actionStatus() {
        if (this.online) {
            if (this.active) {
                return 'presence-status-online';
            }
            return 'presence-status-away';

        }
        return 'presence-status-offline';
    }

    render() {
        this.item = this.props.item;
        this.calculateStatus();
        return <div className="presence-item">
            <div className="presence-name">{this.item.online.displayName}</div>
            <div className={"presence-status " + this.onlineStatus()}/>
            <div className={"presence-status " + this.actionStatus()}/>
            <div className="presence-date">{this.presenceDateString}</div>
        </div>;
    }
}
