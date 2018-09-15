import React from "react";
import Chat from "./chat";
import Utils from './utils/utils'
import DeviceService from "./services/device_service";

export default class ChatMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let deviceUISubClass = DeviceService.getDeviceUISubClass(this.props.message.device);
        return <div className={"chat-msg " + (this.props.message.from === this.props.userData.displayName ? "msg-mine" : "msg-yours")} id={this.props.id}>
                <div className="chat-msg-header"><span className="chat-time">{Chat.formatDate(new Date(this.props.message.date * 1000))}</span><span
                    className="chat-author">{this.props.message.from}</span>
                    <div className={"message-device"}>
                        <i className={DeviceService.getDeviceUIClass(this.props.message.device)}></i>
                    </div>
                    <div className={"message-device " + (deviceUISubClass === "" ? "hidden " : "") }>
                        <i className={deviceUISubClass}></i>
                    </div>
                </div>
                <div className={"chat-msg-body " + (this.props.message.clientSent ? "chat-msg-client" : "") +
                    (this.props.message.highlightNew && !this.props.message.animateNew ? ' chat-msg-new' : "") +
                    (this.props.message.animateNew ? ' chat-msg-new-animation' : "") +
                    (Utils.isMultiline(this.props.message.message) ? " chat-msg-multiline" : "") +
                    (this.props.message.date > this.props.lastActiveDate && this.props.message.from === this.props.userData.displayName ? " chat-msg-unread" : "")
                }><span className="chat-msg-text" dangerouslySetInnerHTML={{__html: Utils.processMessage(this.props.message.message).message}}/></div>
            </div>;
    }
}

/*

09 :) :=) :-)
13 :( :=( :-(
01 :D :=D :-D :d :=d :-d
02 :o :=o :-o :O :=O :-O
08 (kiss)
05 (love)
07 ;) ;=) ;-)
16 :'( :'-( :'=(
28 (cool)
30 (vomit)
31 (devil)
32 (angel)

 */