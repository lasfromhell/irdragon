import React from "react";
import Chat from "./chat";

export default class ChatMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    processMessage(message) {
        message = message.replace(/</g, '&lt;');
        return message.replace(/(\w{1,10}:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, '<a target="_blank" rel="noopener noreferrer" href="$1">$1</a>');
    }

    render() {
        return <div className={"chat-msg " + (this.props.message.from === this.props.userData.displayName ? "msg-mine" : "msg-yours")} id={this.props.id}>
                <div className="chat-msg-header"><span className="chat-time">{Chat.formatDate(new Date(this.props.message.date * 1000))}</span><span
                    className="chat-author">{this.props.message.from}</span>
                </div>
                <div className={"chat-msg-body " + (this.props.message.clientSent ? "chat-msg-client" : "") +
                    (this.props.message.highlightNew && !this.props.message.animateNew ? ' chat-msg-new' : "") + (this.props.message.animateNew ? ' chat-msg-new-animation ' : " ")}><span className="chat-msg-text" dangerouslySetInnerHTML={{__html: this.processMessage(this.props.message.message)}}/></div>
            </div>;
    }
}
