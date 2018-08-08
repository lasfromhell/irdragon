import React from "react";
import Chat from "./chat";

export default class ChatMessage extends React.Component {
    constructor(props) {
        super(props);
    }

    static processMessage(message) {
        if (message.indexOf('`') === 0) {
            message = message.replace('`', '');
        }
        else {
            message = message.replace(/{img:([a-z0-9-]+\.[a-z]{3,4})}/g, '<a href="images/uploaded/$1" target="_blank"><img class="thumbnail" src="images/uploaded/thumbnails/$1"/></a>');
            message = message.replace(/(\w{1,10}:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, '<a target="_blank" rel="noopener noreferrer" href="$1">$1</a>');
            message = message.replace(/(:D)|(:=D)|(:-D)|(:d)|(:=d)|(:-d)/g, '<img class="smile" src="images/smiles/01.gif"/>');
            message = message.replace(/(:o)|(:=o)|(:-o)|(:O)|(:=O)|(:-O)/g, '<img class="smile" src="images/smiles/02.gif"/>');
            message = message.replace(/\(love\)/g, '<img class="smile" src="images/smiles/05.gif"/>');
            message = message.replace(/(;\))|(;=\))|(;-\))/g, '<img class="smile" src="images/smiles/07.gif"/>');
            message = message.replace(/\(kiss\)/g, '<img class="smile" src="images/smiles/08.gif"/>');
            message = message.replace(/(:\))|(:=\))|(:-\))/g, '<img class="smile" src="images/smiles/09.gif"/>');
            message = message.replace(/(:\()|(:=\()|(:-\()/g, '<img class="smile" src="images/smiles/13.gif"/>');
            message = message.replace(/(:'\()|(:'=\()|(:'-\()/g, '<img class="smile" src="images/smiles/16.gif"/>');
            message = message.replace(/\(cool\)/g, '<img class="smile" src="images/smiles/28.gif"/>');
            message = message.replace(/\(vomit\)/g, '<img class="smile" src="images/smiles/30.gif"/>');
            message = message.replace(/\(devil\)/g, '<img class="smile" src="images/smiles/31.gif"/>');
            message = message.replace(/\(angel\)/g, '<img class="smile" src="images/smiles/32.gif"/>');
        }
        return message;
    }

    static isMultiline(message) {
        return message.indexOf('\n') >= 0;
    }

    render() {
        return <div className={"chat-msg " + (this.props.message.from === this.props.userData.displayName ? "msg-mine" : "msg-yours")} id={this.props.id}>
                <div className="chat-msg-header"><span className="chat-time">{Chat.formatDate(new Date(this.props.message.date * 1000))}</span><span
                    className="chat-author">{this.props.message.from}</span>
                </div>
                <div className={"chat-msg-body " + (this.props.message.clientSent ? "chat-msg-client" : "") +
                    (this.props.message.highlightNew && !this.props.message.animateNew ? ' chat-msg-new' : "") +
                    (this.props.message.animateNew ? ' chat-msg-new-animation' : "") +
                    (ChatMessage.isMultiline(this.props.message.message) ? " chat-msg-multiline" : "")
                }><span className="chat-msg-text" dangerouslySetInnerHTML={{__html: ChatMessage.processMessage(this.props.message.message)}}/></div>
            </div>;
    }

    static thumbnailClick(e) {
        return "";
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