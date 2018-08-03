import React from 'react';
import ChatMessage from "./chat_message";
import SortedMap from 'collections/sorted-map'
import ChatMenu from "./chat_menu";
const uuidv1 = require('uuid/v1');

const TYPING_OFFSET_MS = 1000;
const TYPING_REFRESH_SEND_OFFSET_MS = 1000;

export default class Chat extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: new SortedMap(),
            proposedMessages: new SortedMap(),
            data: '',
            serverError: false,
            headerMessage: ''
        };
        this.chatId = this.props.userData.chats[0];

        this.latestId = -1;
        this.firstId = 0;
        this.fullHistoryLoaded = false;
        this.historyLoading = false;
        this.newMessagesCount = 0;

        this.lastTypingProgressDate = null;
        this.typingTimer = null;
        this.messagesToAnimate = [];
        this.hasNewMessages = false;

        this.messageGatheringStopped = false;
        this.messsageGatheringTimeout = null;
        this.presenceGatheringStopped = false;
        this.presenceGatheringInterval = null;
        this.chatProxy = props.chatProxy;
        this.chatProxy.setGoToHomeCallback(this.onLogout.bind(this));
        this.chatProxy.setErrorCallback(this.onServerError.bind(this));
        this.chatProxy.setSuccessCallback(this.onServerSuccess.bind(this));

        this.loadChatSize();

        this.startMessagesGathering();
        this.startPresenceGathering();

        window.addEventListener('focus', this.onWindowActive.bind(this));
        if (document.hasFocus()) {
            this.onWindowActive();
        }
    }

    startMessagesGathering() {
            this.chatProxy.getLatestMessages(this.chatId).then(response => {
                if (response.status !== 200) {
                    this.messsageGatheringTimeout = setTimeout(this.startMessagesGathering.bind(this), 1000);
                }
                this.updateTyping(response.data.typing);
                if (!response.data.messages || response.data.messages.length === 0) {
                    this.latestId = -1;
                }
                else {
                    this.updateStateByNewMessages(response.data.messages, true, false, response.data.last_read_message);
                    this.firstId = response.data.messages[0].id;//this.state.messages.min().id;
                }
                this.updateNewMessageCount(response.data.last_read_message);
                if (document.hasFocus()) {
                    this.onWindowActive();
                }
                this.loadPreviousMessages();
                this.messsageGatheringTimeout = setTimeout(this.sendRequestOnLatestMessages.bind(this), 1000)
            })
            .catch((e) => {
                console.log(e);
            });
    }

    sendRequestOnLatestMessages() {
        if (this.messageGatheringStopped) {
            clearTimeout(this.messsageGatheringTimeout);
            return;
        }
        const requestInitTime = new Date().getTime();
        this.chatProxy.getMessagesAfter(this.chatId, this.latestId)
            .then(response => {
                this.setState({
                    headerMessage: 'Last update time: ' + new Date().toLocaleString()
                });
                this.updateTyping(response.data.typing);
                if (response.data.messages && response.data.messages.length) {
                    this.updateStateByNewMessages(response.data.messages, true, false, response.data.last_read_message);
                }
                this.updateNewMessageCount(response.data.last_read_message);
                if (document.hasFocus()) {
                    this.onWindowActive();
                }
            })
            .catch(error => {
                console.error('Unable to get latest messages', error);
            })
            .then(() => {
                this.messsageGatheringTimeout = setTimeout(this.sendRequestOnLatestMessages.bind(this), Math.max(0, 1000 - (new Date().getTime() - requestInitTime)));
            });
    }

    updateStateByNewMessages(messages, modifyLatestId = true, proposed = false, lastReadMessage) {
        if (proposed) {
            this.setStateProposedMessages(messages);
        }
        else {
            this.setStateMessages(messages, lastReadMessage);
        }
        Chat.scrollToBottom(this.refs.chatMessagesBox);
        if (modifyLatestId) {
            this.latestId = messages[messages.length - 1].id;//this.state.messages.max().id;
        }
    }

    setStateMessages(newMessages, lastReadMessage) {
        newMessages.forEach(message => {
            if (message.fromId !== this.props.userData.id) {
                const hasFocus = document.hasFocus();
                if (hasFocus && message.highlightNew) {
                    message.animateNew = true;
                }
                if (lastReadMessage < message.id) {
                    if (!message.highlightNew) {
                        message.highlightNew = true;
                    }
                    if (hasFocus) {
                        message.animateNew = true;
                    }
                    else {
                        this.messagesToAnimate.push(message);
                    }
                }
            }
            this.state.messages.set(message.id, message);
        });
        this.setState({messages: this.state.messages});
    }

    setStateProposedMessages(newMessages) {
        newMessages.forEach(message => {
            this.state.proposedMessages.set(message.iid, message);
        });
        this.setState({proposedMessages: this.state.proposedMessages});
    }

    startPresenceGathering() {
        const gatheringFunc = () => {
            if (this.presenceGatheringStopped) {
                clearInterval(this.presenceGatheringInterval);
                return;
            }
            this.chatProxy.getPresence(this.chatId).then(response => {
                    console.info('Presence received:');
                    for (const line in response.data) {
                        if (response.data.hasOwnProperty(line))
                        if (response.data[line] != null) {
                            console.info(`Action: ${this.presenceItemToString(response.data[line].action)}` +
                                `; Online: ${this.presenceItemToString(response.data[line].online)}`)
                        }
                    }
                })
                .catch(e => {
                    console.log(e);
                });
        };
        gatheringFunc();
        this.presenceGatheringInterval = setInterval(gatheringFunc, 10000);
    }

    presenceItemToString(presenceItem) {
        return presenceItem ? `${presenceItem.displayName}: ${new Date(presenceItem.activityDate * 1000)}` : '';
    }

    handleInputKeyPress(event) {
        let messageSent = false;
        if (event.charCode === 13 || event.keyCode === 13 || event.which === 13) {
            if (!event.ctrlKey) {
                this.sendMessage();
                event.preventDefault();
                messageSent = true;
            }
            else {
                const selStart = this.refs.chatInput.selectionStart;
                const lastStrPart = this.state.data.substr(selStart);
                this.setState({
                    data: this.state.data.substr(0, selStart) + "\n" + lastStrPart
                }, () => {
                    this.refs.chatInput.selectionStart = selStart + 1;
                    this.refs.chatInput.selectionEnd = selStart + 1;
                    if (lastStrPart.indexOf('\n') === -1) {
                        Chat.scrollToBottom(this.refs.chatInput);
                    }
                });
            }
        }
        if (messageSent) {
            this.dropTypingTimer();
            this.sendTypingFinished();
        }
        else {
            if (this.typingTimer == null) {
                this.sendTypingStarted();
            }
            this.restartTypingTimer();
        }
    }

    sendTypingStarted() {
        this.chatProxy.sendTypingStarted(this.chatId);
        this.lastTypingProgressDate = new Date().getTime();
    }

    restartTypingTimer() {
        this.dropTypingTimer();
        this.typingTimer = setTimeout(this.sendTypingFinished.bind(this), TYPING_OFFSET_MS);
        if (this.lastTypingProgressDate + TYPING_REFRESH_SEND_OFFSET_MS < new Date().getTime()) {
            this.chatProxy.sendTypingProgress(this.chatId);
            this.lastTypingProgressDate = new Date().getTime();
        }
    }

    dropTypingTimer() {
        if (this.typingTimer !== null) {
            clearTimeout(this.typingTimer);
        }
    }

    sendTypingFinished() {
        this.chatProxy.sendTypingFinished(this.chatId);
        this.typingTimer = null;
        this.lastTypingProgressDate = null;
    }

    sendMessage() {
        const data = this.state.data;
        this.setState({
            data: ''
        });
        const iid = uuidv1();
        this.updateStateByNewMessages([{
            iid: iid,
            fromId: this.props.userData.id,
            from: this.props.userData.displayName,
            message: data,
            date: new Date().getTime()/1000,
            clientSent: true
        }], false, true);
        this.sendMessageData(data, iid);

    }

    sendMessageData(data, iid) {
        this.chatProxy.sendMessage(this.chatId, data).then((response) => {
            try {
                const message = this.state.proposedMessages.get(iid);
                this.state.proposedMessages.delete(iid);
                this.setState({proposedMessages: this.state.proposedMessages});
                if (response.data.messageId && message) {
                    message.clientSent = false;
                    message.id = response.data.messageId;
                    this.updateStateByNewMessages([message]);
                }
            } catch (e) {
                console.error(e);
            }
        }).catch((error) => {
            if (!error.response || error.response.status === 401) {
                setTimeout(() => this.sendMessageData(data), 1000);
            }
            else {
                console.log("Error happened while sending message", error);
            }
        }).finally(() => {
        });
    }

    handleInputChange(event) {
        this.setState({
            data: event.target.value
        });
    }

    componentDidMount() {
        Chat.scrollToBottom(this.refs.chatMessagesBox);
    }

    componentDidUpdate() {
    }

    static scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    static resetCursor(txtElement) {
        if (txtElement.setSelectionRange) {
            txtElement.focus();
            txtElement.setSelectionRange(0, 0);
        } else if (txtElement.createTextRange) {
            const range = txtElement.createTextRange();
            range.moveStart('character', 0);
            range.select();
        }
    }

    handleMessageBoxScroll() {
        this.loadPreviousMessages();
    }

    loadPreviousMessages() {
        if (this.refs.chatMessagesBox.scrollTop / this.refs.chatMessagesBox.scrollHeight < 0.1 && !this.fullHistoryLoaded
                && !this.historyLoading) {
            this.historyLoading = true;
            let wasScrolled = false;
            if (!this.refs.chatMessagesBox.scrollTop) {
                this.refs.chatMessagesBox.scrollTop++;
                wasScrolled = true;
            }
            this.chatProxy.getMessagesBefore(this.chatId, this.firstId, 30)
                .then(response => {
                    this.updateTyping(response.data.typing);
                    if (!response.data.messages) {
                        return;
                    }
                    if (response.data.messages.length === 0) {
                        this.fullHistoryLoaded = true;
                        return;
                    }
                    this.setStateMessages(response.data.messages, response.data.last_read_message);
                    this.firstId = response.data.messages[0].id;
                    setTimeout(this.loadPreviousMessages.bind(this), 1000);
                })
                .finally(() => {
                    this.historyLoading = false;
                    if (wasScrolled) {
                        this.refs.chatMessagesBox.scrollTop--;
                    }
                })
        }
    }

    handleWheel() {
        this.loadPreviousMessages();
    }

    onWindowActive() {
        if (this.hasNewMessages) {
            this.chatProxy.sendLastReadMessage(this.chatId, this.latestId);
            this.hasNewMessages = false;
        }
        if (this.messagesToAnimate.length > 0) {
            this.setStateMessages(this.messagesToAnimate);
            this.messagesToAnimate.length = 0;
        }
    }

    updateTitle() {
        if (this.newMessagesCount) {
            this.props.updateTitleCB(`[${this.newMessagesCount}] IR Dragon`);
        } else {
            this.props.updateTitleCB("IR Dragon");
        }
    }

    loadChatSize() {
        const chatSize = localStorage.getItem('chatSize');
        if (chatSize) {
            const chatSizeObj = JSON.parse(chatSize);
            this.refs.chatBox.offsetHeight = chatSizeObj.height;
            this.refs.chatBox.offsetWidth = chatSizeObj.width;
        }
    }

    updateTyping(typingData) {
        if (typingData && typingData.userId !== this.props.userData.id) {
            this.refs.typingText.innerText = `...${typingData.displayName} is typing...`;
        }
        else {
            this.refs.typingText.innerText = '';
        }
    }

    stopProcessing() {
        if (this.messsageGatheringTimeout) {
            clearTimeout(this.messsageGatheringTimeout);
        }
        this.messageGatheringStopped = true;
        if (this.presenceGatheringInterval) {
            clearInterval(this.presenceGatheringInterval);
        }
        this.presenceGatheringStopped = true;
    }

    onLogout () {
        this.stopProcessing();
        this.props.onLogout()
    }

    updateNewMessageCount(lastReadMessage) {
        this.newMessagesCount = this.messagesToAnimate.length;
        this.hasNewMessages = lastReadMessage - this.latestId;
        this.updateTitle();
    }

    onServerError() {
        this.setState({
            serverError: true
        });
    }

    onServerSuccess() {
        this.setState({
            serverError: false
        });
    }

    render() {
        return <div className={"chat-box" + (this.state.serverError ? " chat-box-error" : "")} ref="chatBox">
            <ChatMenu onLogout={this.onLogout.bind(this)} chatProxy={this.chatProxy} headerMessage={this.state.headerMessage}/>
            <div className="chat-messages-box" ref="chatMessagesBox" onScroll={this.handleMessageBoxScroll.bind(this)} onWheel={this.handleWheel.bind(this)}>
                {this.state.messages.map((value, key) => <ChatMessage id={'cm_' + key} key={key} message={value} userData={this.props.userData}/>)}
                {this.state.proposedMessages.map((value, key) => <ChatMessage id={'propcm_' + key} key={key} message={value} userData={this.props.userData}/>)}
            </div>
            <div className="chat-typing-area" ref="typingArea"><span className="chat-typing-text" ref="typingText"/></div>
            <div className="chat-line"/>
            <textarea className="chat-input" ref="chatInput" onKeyPress={this.handleInputKeyPress.bind(this) } onChange={ this.handleInputChange.bind(this) } value={this.state.data}/>
        </div>;
    }
}

