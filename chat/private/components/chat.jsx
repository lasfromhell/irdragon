import React from 'react';
import ChatMessage from "./chat_message";
import axios from 'axios';
import SortedMap from 'collections/sorted-map'
const uuidv1 = require('uuid/v1');

const TYPING_OFFSET_MS = 1000;
const TYPING_REFRESH_SEND_OFFSET_MS = 1000;

export default class Chat extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: new SortedMap(),
            proposedMessages: new SortedMap(),
            data: ''
        };
        this.chatId = this.props.userData.chats[0];
        this.axios = axios.create({
            headers: {
                'Authentication-Token': this.props.userData.token
            }
        });
        this.latestId = -1;
        this.firstId = 0;
        this.fullHistoryLoaded = false;
        this.historyLoading = false;
        this.newMessagesCount = 0;

        this.lastTypingProgressDate = null;
        this.typingTimer = null;

        this.loadChatSize();

        this.resetNewMessagesCount();
        this.startMessagesGathering();
        this.startPresenceGathering();

        window.addEventListener('focus', this.onWindowActive.bind(this));
    }

    startMessagesGathering() {
        this.axios.get(`/api/chat/${this.chatId}/latest/20`)
            .then(response => {
                if (response.status !== 200) {
                    setTimeout(this.startMessagesGathering.bind(this), 1000);
                }
                this.updateTyping(response.data.typing);
                if (!response.data.messages || response.data.messages.length === 0) {
                    this.latestId = -1;
                }
                else {
                    this.updateStateByNewMessages(response.data.messages);
                    this.firstId = response.data.messages[response.data.messages.length-1].id;//this.state.messages.min().id;
                }
                this.loadPreviousMessages();
                setTimeout(this.sendRequestOnLatestMessages.bind(this), 1000)
            })
            .catch((e) => {
                console.log(e);
            });
    }

    sendRequestOnLatestMessages() {
        const requestInitTime = new Date().getTime();
        this.axios.get(`/api/chat/${this.chatId}/after/${this.latestId}`)
            .then(response => {
                this.updateTyping(response.data.typing);
                if (!response.data.messages || response.data.messages.length === 0) {
                    return;
                }
                this.updateStateByNewMessages(response.data.messages);
            })
            .catch(error => {
                console.error('Unable to get latest messages', error);
            })
            .then(() => {
                setTimeout(this.sendRequestOnLatestMessages.bind(this), Math.max(0, 1000 - (new Date().getTime() - requestInitTime)));
            });
    }

    updateStateByNewMessages(messages, modifyLatestId = true, proposed = false) {
        // this.setState({messages: [...this.state.messages, ...data]});
        if (proposed) {
            this.setStateProposedMessages(messages);
        }
        else {
            this.setStateMessages(messages);
        }
        Chat.scrollToBottom(this.refs.chatMessagesBox);
        if (modifyLatestId) {
            this.latestId = messages[messages.length - 1].id;//this.state.messages.max().id;
            if (!document.hasFocus()) {
                this.newMessagesCount += messages.length;
                this.updateTitle();
            }
        }
    }

    setStateMessages(newMessages) {
        newMessages.forEach(message => {
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
            this.axios.get(`/api/chat/${this.chatId}/presence`)
                .then(response => {
                    console.info('Presence received:');
                    for (const line in response.data) {
                        if (response.data.hasOwnProperty(line))
                        if (response.data[line] != null) {
                            console.info(`${response.data[line].displayName}: ${new Date(response.data[line].activityDate * 1000)}`)
                        }
                    }
                })
                .catch(e => {
                    console.log(e);
                });
        };
        gatheringFunc();
        setInterval(gatheringFunc, 10000);
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
        this.axios.post(`/api/chat/${this.chatId}/typingStarted`);
        this.lastTypingProgressDate = new Date().getTime();
    }

    restartTypingTimer() {
        this.dropTypingTimer();
        this.typingTimer = setTimeout(this.sendTypingFinished.bind(this), TYPING_OFFSET_MS);
        if (this.lastTypingProgressDate + TYPING_REFRESH_SEND_OFFSET_MS < new Date().getTime()) {
            this.axios.post(`/api/chat/${this.chatId}/typingProgress`);
            this.lastTypingProgressDate = new Date().getTime();
        }
    }

    dropTypingTimer() {
        if (this.typingTimer !== null) {
            clearTimeout(this.typingTimer);
        }
    }

    sendTypingFinished() {
        this.axios.post(`/api/chat/${this.chatId}/typingFinished`);
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
        this.axios.post(`/api/chat/${this.props.userData.chats[0]}/message`, {
            data: data,
            token: this.props.userData.token
        }).then((response) => {
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
            if (!error.response) {
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
        if (this.refs.chatMessagesBox.scrollTop / this.refs.chatMessagesBox.scrollHeight < 0.4 && !this.fullHistoryLoaded
                && !this.historyLoading) {
            this.historyLoading = true;
            this.axios.get(`/api/chat/${this.chatId}/before/${this.firstId}`)
                .then(response => {
                    this.updateTyping(response.data.typing);
                    if (!response.data.messages) {
                        return;
                    }
                    if (response.data.messages.length === 0) {
                        this.fullHistoryLoaded = true;
                        return;
                    }
                    this.setStateMessages(response.data.messages);
                    this.firstId = this.state.messages.min().id;
                    this.loadPreviousMessages();
                })
                .finally(() => {
                    this.historyLoading = false;
                })
        }
    }

    handleWheel() {
        this.loadPreviousMessages();
    }

    onWindowActive() {
        this.resetNewMessagesCount();
    }

    resetNewMessagesCount() {
        this.newMessagesCount = 0;
        this.props.updateTitleCB("IR Dragon");
    }

    updateTitle() {
        this.props.updateTitleCB(`[${this.newMessagesCount}] IR Dragon`);
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

    render() {
        return <div className="chat-box" ref="chatBox">
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

