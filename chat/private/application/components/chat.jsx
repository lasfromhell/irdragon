import React from 'react';
import ChatMessage from "./chat_message";
import SortedMap from 'collections/sorted-map'
import ChatMenu from "./chat_menu";
import {BehaviorSubject} from 'rxjs';
import CallService, {
    CALL_STATE_CALLING,
    CALL_STATE_CALLING_ANSWER,
    CALL_STATE_CONNECTED,
    CALL_STATE_INCOMING, CALL_STATE_INCOMING_CALLING
} from "./services/call_service";
import {Celebrate} from "./celebrate";

const uuidv1 = require('uuid/v1');

const TYPING_OFFSET_MS = 3000;
const TYPING_REFRESH_SEND_OFFSET_MS = 3000;
const DIALOG_SMILES = 'smiles';
const DIALOG_CALL_TO = 'call_to';

export default class Chat extends React.Component {

    constructor(props) {
        super(props);
        this.a = 0;
        this.log = props.log;
        this.state = {
            messages: new SortedMap(),
            proposedMessages: new SortedMap(),
            data: '',
            serverError: false,
            headerMessage: '',
            activeDialog: null,
            videoCall: false
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

        this.presenceObservable = new BehaviorSubject({});
        this.observables = {
            presence: this.presenceObservable
        };
        this.control = {
            fullScreen: this.onFullScreen.bind(this)
        };
        this.scrolledToBottom = true;
        this.messageText = '';
        this.messageTextPreviousPosition = {
            start: 0,
            end: 0
        };
        this.lastActiveDate = 0;
        this.presenceTargets = [];

        this.loadChatSize();

        this.startMessagesGathering();
        this.startPresenceGathering();
        this.initializeCallService();

        window.addEventListener('focus', this.onWindowActive.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('beforeUnload', this.onWindowBeforeUnload.bind(this));

        if (document.hasFocus()) {
            this.onWindowActive();
        }
    }

    initializeCallService() {
        this.callService = new CallService(this.log, this.chatProxy, this.chatId, this.props.userData.displayName);
        this.callService.onNewTrack = (track) => {
            this.log.debug(`OnNewTrack called`);
            if (track == null) {
                this.refs.remotePlayer.srcObject = null;
                this.setState({
                    hasVideoTrackInCall: false
                });
                return;
            }
            if (track.kind === 'video') {
                this.setState({
                    hasVideoTrackInCall: true
                });
                this.onScrollChatToBottom();
            }
            if (this.refs.remotePlayer.srcObject && this.refs.remotePlayer.srcObject.addTrack && this.refs.remotePlayer.srcObject instanceof MediaStream) {
                this.log.debug(`Adding track ${JSON.stringify(track)}`);
                this.refs.remotePlayer.srcObject.addTrack(track);
            }
            else if (!this.refs.remotePlayer.srcObject) {
                this.log.debug(`Current sink id is ${this.refs.remotePlayer.sinkId}`);
                // try {
                //     this.refs.remotePlayer.srcObject = stream;
                // } catch (e) {
                //     this.log.debug(`Looks like I can't add track in safari`);
                // }
                try {
                    const mediaStream = new MediaStream();
                    mediaStream.addTrack(track);
                    this.refs.remotePlayer.srcObject = mediaStream;
                    this.log.debug(`Browser stream assigned`);
                } catch (e) {
                    this.log.debug(`Looks like I can't add track as media stream in this browser`);
                }
            }
        };
        this.callService.onNewStream = (stream) => {
            this.log.debug(`OnNewStream called`);
            if (this.isSafari()) {
                this.refs.remotePlayer.srcObject = stream;
            }
            else {
                this.log.debug(`Not safari. Skipping onNewStream...`);
            }
        };
        this.callService.onCallStateChanged = (newState) => {
            this.refs.rtcVideoCheckbox.checked = this.callService.isVideoAllowed();
            this.setState({
                callState: newState,
                videoCall: this.callService.isVideoAllowed()
            });
            if (this.state.activeDialog === DIALOG_CALL_TO) {
                this.onScreenWrapper();
            }
        }
    }

    isSafari() {
        return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
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
                setTimeout(this.startMessagesGathering.bind(this), 1000);
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
                const date = new Date();
                this.setState({
                    headerMessage: 'Updated: ' + Chat.toTwoDigits(date.getHours()) + ":" + Chat.toTwoDigits(date.getMinutes()) + ":" + Chat.toTwoDigits(date.getSeconds())
                });
                const messagesBlock = response.data.messages;
                this.updateTyping(messagesBlock.typing);
                if (messagesBlock.messages && messagesBlock.messages.length) {
                    this.updateStateByNewMessages(messagesBlock.messages, true, false, messagesBlock.last_read_message);
                }
                this.updateNewMessageCount(messagesBlock.last_read_message);
                if (document.hasFocus()) {
                    this.onWindowActive();
                }
                const communicationBlock = response.data.communications;
                this.callService.setIncomingData(communicationBlock);
            })
            .catch(error => {
                console.error('Unable to get latest messages', error);
            })
            .then(() => {
                this.messsageGatheringTimeout = setTimeout(this.sendRequestOnLatestMessages.bind(this), Math.max(0, 1000 - (new Date().getTime() - requestInitTime)));
            });
    }

    static toTwoDigits(digit) {
        if (digit < 10) {
            return '0' + digit;
        }
        return digit;
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
                    this.log.debug('Presence received:');
                    for (const line in response.data) {
                        if (response.data.hasOwnProperty(line)) {
                            if (response.data[line] != null) {
                                const presenceItem = response.data[line];
                                if (presenceItem.action && this.lastActiveDate < presenceItem.action.activityDate &&
                                    presenceItem.action.displayName !== this.props.userData.displayName) {
                                    this.lastActiveDate = presenceItem.action.activityDate;
                                }
                                this.log.debug(`Action: ${Chat.presenceItemToString(presenceItem.action)}` +
                                    `; Online: ${Chat.presenceItemToString(presenceItem.online)}`);
                            }
                        }
                    }
                    this.presenceObservable.next(response.data);
                })
                .catch(e => {
                    console.log(e);
                });
        };
        gatheringFunc();
        this.presenceGatheringInterval = setInterval(gatheringFunc, 3000);
    }

    static presenceItemToString(presenceItem) {
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
                const lastStrPart = this.refs.chatInput.value.substr(selStart);
                this.refs.chatInput.value = this.refs.chatInput.value.substr(0, selStart) + "\n" + lastStrPart;
                this.refs.chatInput.selectionStart = selStart + 1;
                this.refs.chatInput.selectionEnd = selStart + 1;
                if (lastStrPart.indexOf('\n') === -1) {
                    Chat.scrollToBottom(this.refs.chatInput);
                }
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
        const data = this.refs.chatInput.value;
        if (data === '') {
            return;
        }
        this.refs.chatInput.value = '';
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
                    message.device = response.data.device;
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
        new Celebrate().startCelebrate();
    }

    componentDidUpdate() {
    }

    static scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
        this.scrolledToBottom = true;
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
        if (this.refs.chatMessagesBox.scrollTop + this.refs.chatMessagesBox.offsetHeight >= this.refs.chatMessagesBox.scrollHeight) {
            this.scrolledToBottom = true;
        }
        else {
            this.scrolledToBottom = false;
        }
    }

    loadPreviousMessages() {
        if (this.refs.chatMessagesBox.scrollTop / this.refs.chatMessagesBox.scrollHeight < 0.1 && this.refs.chatMessagesBox.scrollTop < 100 && !this.fullHistoryLoaded
                && !this.historyLoading) {
            // let wasScrolled = false;
            // if (!this.refs.chatMessagesBox.scrollTop) {
            //     this.refs.chatMessagesBox.scrollTop++;
            //     wasScrolled = true;
            // }
            if (this.scrollUpInProgress) {
                return;
            }
            this.historyLoading = true;
            const scrollDiff = this.refs.chatMessagesBox.scrollHeight - this.refs.chatMessagesBox.scrollTop;
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
                    this.refs.chatMessagesBox.scrollTop = this.refs.chatMessagesBox.scrollHeight - scrollDiff;
                    // setTimeout(this.loadPreviousMessages.bind(this), 1000);
                })
                .finally(() => {
                    this.historyLoading = false;
                    // if (wasScrolled) {
                    //     this.refs.chatMessagesBox.scrollTop--;
                    // }
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
        this.callService.cancelCall(true);
        this.stopProcessing();
        this.props.onLogout()
    }

    updateNewMessageCount(lastReadMessage) {
        this.newMessagesCount = this.messagesToAnimate.length;
        this.hasNewMessages = lastReadMessage - this.latestId;
        this.updateTitle();
    }

    onServerError() {
        if (!this.state.serverError) {
            this.setState({
                serverError: true
            });
        }
    }

    onServerSuccess() {
        if (this.state.serverError) {
            this.setState({
                serverError: false
            });
        }
    }

    onFullScreen() {
        this.refs.chatBox.style.height = '100%';
        this.refs.chatBox.style.width = '100%';
    }

    onWindowResize() {
        if (this.scrolledToBottom) {
            setTimeout(() => {
                this.refs.chatMessagesBox.scrollTop = this.refs.chatMessagesBox.scrollHeight;
            }, 10);
        }
    }

    static formatDate(date) {
        return Chat.toTwoDigits(date.getDate()) + "." + Chat.toTwoDigits(date.getMonth()+1) + "." + date.getFullYear() + " " +
            Chat.toTwoDigits(date.getHours()) + ":" + Chat.toTwoDigits(date.getMinutes()) + ":" + Chat.toTwoDigits(date.getSeconds());
    }

    onInputDrop(e) {
        if (e.dataTransfer && e.dataTransfer.files) {
            e.preventDefault();
            const images = [], others = [];
            for (let i = 0; i < e.dataTransfer.files.length; i++) {
                let file = e.dataTransfer.files[i];
                if (this.checkImageType(file, false)) {
                    images.push(file)
                }
                else {
                    others.push(file);
                }
            }
            this.uploadImages(images);
            this.uploadFiles(others);
        }
    }

    uploadImages(files) {
        this.log.debug('Files number = ' + files.length);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.log.debug(`Handling file ${i} - ${file.name}`);
            if (this.checkImage(file)) {
                this.log.debug(`Uploading file ${file.name}`);
                this.chatProxy.uploadImage(file, (e) => {
                    this.log.debug(`Uploading ${file.name} - ${e.loaded} of ${e.total}...`);
                    console.log(e);
                })
                    .then((response) => {
                        this.log.debug(`File ${file.name} upload response received - ${JSON.stringify(response.data)}...`);
                        if (response.data) {
                            this.log.debug(`Pushing file ${file.name} link ${response.data.id} to chat...`);
                            this.refs.chatInput.value += ` {img:${response.data.id}} `;
                        }
                    }).catch(e => {
                        this.log.debug(`Unable to push file ${file.name}. ${e.message}`);
                        alert("Unable to upload file " + file.name);
                })
            }
        }
    }

    checkImage(file) {
        this.log.debug(`Checking file ${file.name} size - ${file.size}`);
        if (file.size > 20971520) {
            alert("File " + file.name + " size should not be greater than 20MB");
            return false;
        }
        return this.checkImageType(file, true);
    }

    checkImageType(file, notify) {
        this.log.debug(`Checking file ${file.name} type - ${file.type}`);
        if (!file.type.startsWith('image')) {
            if (notify) {
                alert("File " + file.name + " has wrong type");
            }
            return false;
        }
        return true;
    }

    uploadFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (this.checkFile(file)) {
                this.chatProxy.uploadFile(file, (e) => {
                    console.log(e);
                })
                    .then((response) => {
                        if (response.data) {
                            this.refs.chatInput.value += ` {file:${response.data.id};name:${file.name}} `;
                        }
                    }).catch(e => {
                    alert("Unable to upload file " + file.name);
                })
            }
        }
    }

    checkFile(file) {
        if (file.size > 1073741824) {
            alert("File " + file.name + " size should not be greater than 1 GB");
            return false;
        }
        return true;
    }

    onInputPaste(e) {
        if (e.clipboardData && e.clipboardData.files) {
            this.uploadImages(e.clipboardData.files);
        }
    }

    onInputImageSelected(e) {
        this.log.debug('Image was selected');
        if (e.target.files) {
            this.log.debug('Image contains target files ' + e.target.files);
            this.uploadImages(e.target.files);
        }
    }

    onInputFileSelected(e) {
        if (e.target.files) {
            this.uploadFiles(e.target.files);
        }
    }

    onScrollChatToBottom() {
        Chat.scrollToBottom(this.refs.chatMessagesBox);
    }

    onSmilesClick() {
        this.setState({
            activeDialog: DIALOG_SMILES,
        });
    }

    onSmileClick(data) {
        this.appendToCurrentInputPos(data);
        this.onScreenWrapper();
        this.refs.chatInput.focus();
    }

    appendToCurrentInputPos(data) {
        let offset = this.refs.chatInput.selectionEnd;
        if (offset === 0) {
            this.refs.chatInput.value = data + ' ';
            offset += data.length + 1;
        }
        else {
            this.refs.chatInput.value = this.refs.chatInput.value.substr(0, offset) + ' ' + data + ' ' + this.refs.chatInput.value.substr(offset);
            offset += data.length + 2;
        }
        this.refs.chatInput.selectionStart = this.refs.chatInput.selectionEnd = offset;
    }

    onDownloadLogs() {
        this.log.download();
    }

    onCallButtonClick() {
        if (this.callService.isNoneCallState()) {
            this.presenceTargets = [];
            const presence = this.presenceObservable.getValue();
            for (let key in presence) {
                const presenceItem = presence[key];
                if (presenceItem.action && presenceItem.action.displayName !== this.props.userData.displayName) {
                    this.presenceTargets.push(presenceItem.action.displayName);
                }
            }
            this.setState({
                activeDialog: DIALOG_CALL_TO
            })
        }
        else {
            this.callService.callAction();
        }
    }

    onCallClick() {
        this.log.debug('Call clicked');
        if (this.callService.isNoneCallState()) {
            this.log.debug('Call Service is in none call state');
            if (this.refs.rtcTarget.value) {
                this.log.debug('RTC Target is ' + this.refs.rtcTarget.value);
                this.callService.setVideoAllowed(this.refs.rtcVideoCheckbox.checked);
                this.callService.setOtherParty(this.refs.rtcTarget.value);
                this.callService.callAction();
            }
        }
        this.onScreenWrapper();
    }

    onWindowBeforeUnload() {
        this.callService.cancelCall(true);
    }

    onScreenWrapper() {
        this.setState({
            activeDialog: null
        });
    }

    onVideoCheckboxClick() {
        this.setState({
            videoCall: this.refs.rtcVideoCheckbox.checked
        })
    }

    onLocateClick() {
        navigator.geolocation.getCurrentPosition((position => {
            const id = Math.round(Math.random()*10000000000000000);
            this.refs.chatInput.value += ` {loc:${id};${position.coords.latitude};${position.coords.longitude}} `;
        }), err => {
            this.log.error("Unable to get geoposition. " + err.message);
        })
    }

    // onInputChange(e) {
    //     const nativeEvent = e.nativeEvent;
    //     var offset = Utils.getSelectionCharacterOffsetWithin(this.refs.chatInput);
    //     if (nativeEvent.inputType === 'insertText') {
    //         this.messageText = this.messageText.substr(0, this.messageTextPreviousPosition.start) + nativeEvent.data + this.messageText.substr(this.messageTextPreviousPosition.end + 1);
    //     }
    //     else if (nativeEvent.inputType === 'deleteContentBackward') {
    //         this.messageText = this.messageText.substr(0, this.messageTextPreviousPosition.start) + this.messageText.substr(this.messageTextPreviousPosition.end + 1);
    //     }
    //     else {
    //         return;
    //     }
    //     const processData = Utils.processMessage(this.messageText);
    //     // this.refs.chatInput.innerHTML = ;
    //     this.refs.chatInput.innerHTML = this.messageText;
    //     Utils.setSelectionCharacterOffsetWithin(this.refs.chatInput, offset);
    //     this.messageTextPreviousPosition = offset;
    // }
    //
    // onInputMouseUp() {
        // this.messageTextPreviousPosition = Utils.getSelectionCharacterOffsetWithin(this.refs.chatInput);
    // }

    // onInputChange(e) {
    //     var offset = Utils.getSelectionCharacterOffsetWithin(this.refs.chatInput);
    //     const len = this.refs.chatInput.innerText.length;
    //     this.refs.chatInput.innerHTML = Utils.processMessage(this.refs.chatInput.innerHTML).message;
    //     const diff = len - this.refs.chatInput.innerText.length;
    //     Utils.setSelectionCharacterOffsetWithin(this.refs.chatInput, offset, diff);
    // }

    getCallStateClass() {
        switch (this.state.callState) {
            case CALL_STATE_CALLING:
                return " rtc_phone_calling";
            case CALL_STATE_CALLING_ANSWER:
            case CALL_STATE_CONNECTED:
            case CALL_STATE_INCOMING_CALLING:
                return " rtc_phone_cancel";
            case CALL_STATE_INCOMING:
                return " rtc_phone_incoming";
        }
        return "";
    }

    render() {
        return <div className={"chat-box" + (this.state.serverError ? " chat-box-error" : "")} ref="chatBox">
            <div className={"screen-wrapper " + (this.state.activeDialog !== null ? "" : " hidden")} onClick={this.onScreenWrapper.bind(this)}/>
            <ChatMenu onLogout={this.onLogout.bind(this)} chatProxy={this.chatProxy} headerMessage={this.state.headerMessage} observables={this.observables} control={this.control}/>
            <div className="chat-messages-box" ref="chatMessagesBox" onScroll={this.handleMessageBoxScroll.bind(this)} onWheel={this.handleWheel.bind(this)}>
                {this.state.messages.map((value, key) => <ChatMessage id={'cm_' + key} key={key} message={value} userData={this.props.userData} lastActiveDate={this.lastActiveDate}/>)}
                {this.state.proposedMessages.map((value, key) => <ChatMessage id={'propcm_' + key} key={key} message={value} userData={this.props.userData} lastActiveDate={this.lastActiveDate}/>)}
                {/*{<ChatMessage id='preview-message' message={this.refs.chatInput.value} userData={this.props.userData}/>}*/}
                {this.state.videoCall ?
                    <div className="rtcVideoChatDiv">
                        <video ref="remotePlayer" autoPlay playsinline className={this.state.hasVideoTrackInCall ? "" : "hidden"}/>
                    </div>
                    :
                    <audio ref="remotePlayer" autoPlay controls className="hidden"/>
                }
            </div>
            <div className="chat-panel">
                <div className="chat-typing-area" ref="typingArea"><span className="chat-typing-text" ref="typingText"/></div>
                <div className="chat-panel-menu">
                    <i className={"panel-awesome-default fas fa-map-marked"} onClick={this.onLocateClick.bind(this)}/>
                    <i className={"panel-awesome-default " +
                        (this.state.videoCall ? "fas fa-video" : "fas fa-phone") +
                        this.getCallStateClass() + (this.state.activeDialog === DIALOG_CALL_TO ? " panel-awesome-selected" : "")} onClick={this.onCallButtonClick.bind(this)}/>
                    <div className={(this.state.activeDialog === DIALOG_CALL_TO ? "call-box-wrapper" : "hidden")}>
                        <div className="call-box">
                            <div className="row">
                                <label htmlFor="rtcTarget">To:</label>
                                <select ref="rtcTarget" id="rtcTarget">
                                    {this.presenceTargets.map((value) => <option key={value}>{value}</option>)}
                                </select>
                            </div>
                            <div className="row">
                                <label htmlFor="rtcVideoCheckbox">Video:</label>
                                <div>
                                    <input type="checkbox" ref="rtcVideoCheckbox" id="rtcVideoCheckbox" onClick={this.onVideoCheckboxClick.bind(this)}/>
                                </div>
                            </div>
                            <div className="row">
                                <button onClick={this.onCallClick.bind(this)} className="form-submit-btn">Call</button>
                            </div>
                        </div>
                    </div>
                    <i className={"panel-awesome-default fas fa-notes-medical"} onClick={this.onDownloadLogs.bind(this)}/>
                    <label htmlFor="imageInput">
                        <i className={"panel-awesome-default far fa-image"}/>
                    </label>
                    <input type="file" accept="image/*" id="imageInput" ref="imageUploadInput" className="hidden" multiple onChange={this.onInputImageSelected.bind(this)}/>
                    <label htmlFor="fileInput">
                        <i className={"panel-awesome-default far fa-file"}/>
                    </label>
                    <input type="file" id="fileInput" ref="fileUploadInput" className="hidden" multiple onChange={this.onInputFileSelected.bind(this)}/>
                    <i className={"panel-awesome-default far fa-smile " + (this.state.activeDialog === DIALOG_SMILES ? "panel-awesome-selected" : "")} onClick={this.onSmilesClick.bind(this)} />
                    <div className={(this.state.activeDialog === DIALOG_SMILES ? "smiles-box-wrapper" : "hidden")}>
                        <div className="smiles-box">
                            <ul>
                                <li><img className="smile" src="images/smiles/01.gif" onClick={() => this.onSmileClick(":D")}/></li>
                                <li><img className="smile" src="images/smiles/02.gif" onClick={() => this.onSmileClick(":o")}/></li>
                                <li><img className="smile" src="images/smiles/05.gif" onClick={() => this.onSmileClick("(love)")}/></li>
                            </ul>
                            <ul>
                                <li><img className="smile" src="images/smiles/07.gif" onClick={() => this.onSmileClick(";)")}/></li>
                                <li><img className="smile" src="images/smiles/08.gif" onClick={() => this.onSmileClick("(kiss)")}/></li>
                                <li><img className="smile" src="images/smiles/09.gif" onClick={() => this.onSmileClick(":)")}/></li>
                            </ul>
                            <ul>
                                <li><img className="smile" src="images/smiles/13.gif" onClick={() => this.onSmileClick(":(")}/></li>
                                <li><img className="smile" src="images/smiles/16.gif" onClick={() => this.onSmileClick(":'(")}/></li>
                                <li><img className="smile" src="images/smiles/28.gif" onClick={() => this.onSmileClick("(cool)")}/></li>
                            </ul>
                            <ul>
                                <li><img className="smile" src="images/smiles/30.gif" onClick={() => this.onSmileClick("(vomit)")}/></li>
                                <li><img className="smile" src="images/smiles/31.gif" onClick={() => this.onSmileClick("(devil)")}/></li>
                                <li><img className="smile" src="images/smiles/32.gif" onClick={() => this.onSmileClick("(angel)")}/></li>
                            </ul>
                        </div>
                    </div>
                    <i className={"panel-awesome-default far fa-chevron-double-down"} onClick={this.onScrollChatToBottom.bind(this)} />
                </div>
            </div>
            {/*<div className="chat-input" ref="chatInput" onKeyPress={this.handleInputKeyPress.bind(this) } onMouseUp={this.onInputMouseUp.bind(this)} onDrop={this.onInputDrop.bind(this)} onPaste={this.onInputPaste.bind(this)} onInput={this.onInputChange.bind(this)}/>*/}
            <textarea className="chat-input" ref="chatInput" onKeyPress={this.handleInputKeyPress.bind(this) } onDrop={this.onInputDrop.bind(this)} onPaste={this.onInputPaste.bind(this)}/>
        </div>;
    }
};

