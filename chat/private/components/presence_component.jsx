import React from "react";
import Chat from "./chat";
import DeviceService from "./services/device_service"

export default class PresenceComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    calculateStatus() {
        let presenceDate;
        const currentDate = new Date().getTime();
        if (this.item.online) {
            const diff = currentDate - this.item.online.activityDate * 1000;
            this.online = diff < 12000;
        }
        if (this.item.action) {
            const diff = currentDate - this.item.action.activityDate * 1000;
            this.active = diff < 15000;
        }
        if (this.online && this.item.action) {
            presenceDate = new Date(this.item.action.activityDate * 1000);
            this.device = this.item.action.device;
        }
        else if (this.item.online) {
            presenceDate = new Date(this.item.online.activityDate * 1000);
            this.device = this.item.online.device;
        }
        this.presenceDateString = Chat.formatDate(presenceDate);
    }

    onlineStatus() {
        return this.online ? 'presence-status-online' : 'presence-status-offline';
    }

    actionStatus() {
        if (this.online) {
            if (this.active) {
                return ['presence-status-online', 'presence-text-online'];
            }
            return ['presence-status-away', 'presence-text-away'];

        }
        return ['presence-status-offline', 'presence-text-offline'];
    }

    render() {
        this.item = this.props.item;
        this.calculateStatus();
        let backActionClass, textActionClass;
        [backActionClass, textActionClass] = this.actionStatus();
        let deviceUISubClass = DeviceService.getDeviceUISubClass(this.device);
        return <div className="presence-item">
            <div className="presence-name">{this.item.online.displayName}</div>
            <div className={"presence-status " + this.onlineStatus()}/>
            <div className={"presence-status " + backActionClass}/>
            <div className={"presence-date " + textActionClass}>{this.presenceDateString}</div>
            <div className={"presence-device " + textActionClass}><i className={DeviceService.getDeviceUIClass(this.device)}></i></div>
            <div className={"presence-device " + (deviceUISubClass === "" ? "hidden " : "") }><i className={deviceUISubClass}></i></div>
        </div>;
    }
}
