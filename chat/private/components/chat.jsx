import React from 'react';
import ChatMessage from "./chat_message";
import axios from 'axios';

export default class Chat extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: [],
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
        // this.connectSSE();
        this.startMessagesGathering();
        this.startPresenceGathering();
    }

    connectSSE() {
        const sse = new EventSource(`/api/chat/events?token=${this.props.userData.token}&chatId=${this.chatId}`);
        sse.onmessage = e => {
            const messageData = JSON.parse(e.data);
            switch (messageData.type) {
                case 'message_array':
                    // this.state.messages.concat(messageData.data);
                    this.setState({messages: [...this.state.messages, ...messageData.data]});
                    break;
            }
        }
    }

    startMessagesGathering() {
        this.axios.get(`/api/chat/${this.chatId}/latest/20`)
            .then(response => {
                if (response.status !== 200) {
                    setTimeout(this.startMessagesGathering.bind(this), 1000);
                }
                if (response.data.length === 0) {
                    this.latestId = -1;
                }
                else {
                    this.setState({messages: [...this.state.messages, ...response.data]});
                    this.latestId = this.state.messages[this.state.messages.length-1].id;
                    this.firstId = this.state.messages[0].id;
                    this.updateScroll(this.refs.chatMessagesBox);
                }
                this.loadPreviousMessages();
                setInterval(() => {
                    this.axios.get(`/api/chat/${this.chatId}/after/${this.latestId}`)
                        .then(response => {
                            if (response.data.length === 0) {
                                return;
                            }
                            this.setState({messages: [...this.state.messages, ...response.data]});
                            this.latestId = this.state.messages[this.state.messages.length-1].id;
                            this.updateScroll(this.refs.chatMessagesBox);
                        });
                }, 1000)
            })
            .catch((e) => {
                console.log(e);
            });
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
        if (event.charCode === 13 || event.keyCode === 13 || event.which === 13) {
            if (!event.ctrlKey) {
                this.sendMessage();
                event.preventDefault();
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
                        this.updateScroll(this.refs.chatInput);
                    }
                });
            }
        }
    }

    sendMessage() {
        const data = this.state.data;
        this.setState({
            data: ''
        }
        // , () => {
        //     this.resetCursor(this.refs.chatInput);
        // }
        );
        axios.post(`/api/chat/${this.props.userData.chats[0]}/message`, {
            data: data,
            token: this.props.userData.token
        }).then((response) => {
        }).catch((error) => {
            this.setState({
                error: error.message + ' : ' + error.response.statusText
            });
        }).finally(() => {
            this.setState({
                authenticating: false
            });
        });
    }

    handleInputChange(event) {
        this.setState({
            data: event.target.value
        });
    }

    componentDidMount() {
        this.updateScroll(this.refs.chatMessagesBox);
    }

    componentDidUpdate() {
    }

    updateScroll(element) {
        element.scrollTop = element.scrollHeight;
    }

    resetCursor(txtElement) {
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
        if (this.refs.chatMessagesBox.scrollTop / this.refs.chatMessagesBox.scrollHeight < 0.2 && !this.fullHistoryLoaded
                && !this.historyLoading) {
            this.historyLoading = true;
            this.axios.get(`/api/chat/${this.chatId}/before/${this.firstId}`)
                .then(response => {
                    if (response.data.length === 0) {
                        this.fullHistoryLoaded = true;
                        return;
                    }
                    this.setState({messages: [...response.data, ...this.state.messages]});
                    this.firstId = this.state.messages[0].id;
                    this.loadPreviousMessages();
                    // this.updateScroll(this.refs.chatMessagesBox);
                })
                .finally(() => {
                    this.historyLoading = false;
                })
        }
    }

    handleWheel() {
        this.loadPreviousMessages();
    }

    render() {
        return <div className="chat-box">
            <div className="chat-messages-box" ref="chatMessagesBox" onScroll={this.handleMessageBoxScroll.bind(this)} onWheel={this.handleWheel.bind(this)}>
                {this.state.messages.map(messageData => <ChatMessage id={'cm_' + messageData.id} key={messageData.id} message={messageData} userData={this.props.userData}/>)}
            </div>
            <div className="chat-line"/>
            <textarea className="chat-input" ref="chatInput" onKeyPress={this.handleInputKeyPress.bind(this) } onChange={ this.handleInputChange.bind(this) } value={this.state.data}/>
        </div>;
    }
}

