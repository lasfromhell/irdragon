import React from "react";

export default class ChatMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <div className={"chat-msg " + (this.props.message.from === this.props.userData.displayName ? "msg-mine" : "msg-yours")} id={this.props.id}>
                <div className="chat-msg-header"><span className="chat-time">{new Date(this.props.message.date + ' UTC').toLocaleString()}</span><span
                    className="chat-author">{this.props.message.from}</span>
                </div>
                <div className="chat-msg-body"><span className="chat-msg-text">{this.props.message.message}</span></div>
            </div>;
    }
}

//29.06.2018 23:50