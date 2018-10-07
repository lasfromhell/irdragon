
export const CALL_STATE_NONE = 'none';
export const CALL_STATE_INCOMING = 'incoming';
export const CALL_STATE_INCOMING_CALLING = 'incoming_calling';
export const CALL_STATE_CALLING = 'calling';
export const CALL_STATE_CALLING_ANSWER = 'calling_answer';
export const CALL_STATE_CONNECTED = 'connected';

export const MEDIA_STATE_NONE = 'none';
export const MEDIA_STATE_INITIALIZED = 'initialized';
export const MEDIA_STATE_ERROR = 'error';
const DEFAULT_ICE_SERVERS = [{url:'stun:stun01.sipphone.com'},
    {url:'stun:stun.ekiga.net'},
    {url:'stun:stun.fwdnet.net'},
    {url:'stun:stun.ideasip.com'},
    {url:'stun:stun.iptel.org'},
    {url:'stun:stun.rixtelecom.se'},
    {url:'stun:stun.schlund.de'},
    {url:'stun:stun.l.google.com:19302'},
    {url:'stun:stun1.l.google.com:19302'},
    {url:'stun:stun2.l.google.com:19302'},
    {url:'stun:stun3.l.google.com:19302'},
    {url:'stun:stun4.l.google.com:19302'},
    {url:'stun:stunserver.org'},
    {url:'stun:stun.softjoys.com'},
    {url:'stun:stun.voiparound.com'},
    {url:'stun:stun.voipbuster.com'},
    {url:'stun:stun.voipstunt.com'},
    {url:'stun:stun.voxgratia.org'},
    {url:'stun:stun.xten.com'},
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    }];

export default class CallService {

    constructor(log, chatProxy, chatId, displayName) {
        this.stream = null;
        this.log = log;
        this.chatProxy = chatProxy;
        this.chatId = chatId;
        this.reset();
        this.onNewTrack = null;
        this.onCallStateChanged = null;
        this.displayName = displayName;
        this.lastCancelledCall = null;
    }

    reset() {
        this.remoteSavedCadnidates = [];
        this.localSavedCandidates = [];
        this.setCallState(CALL_STATE_NONE);
        this.mediaState = MEDIA_STATE_NONE;
        this.communications = null;
        this.callId = null;
        this.videoAllowed = false;
        this.pc = null;
    }

    setVideoAllowed(allow) {
        this.videoAllowed = allow;
    }

    setCallState(state) {
        this.callState = state;
        if (this.onCallStateChanged) {
            this.onCallStateChanged(state);
        }
    }

    isNoneCallState() {
        return this.callState == CALL_STATE_NONE;
    }

    getCallState() {
        return this.callState;
    }

    setIncomingData(communications) {
        if (communications && communications.callId) {
            this.communications = communications;
            if (this.callState === CALL_STATE_NONE && communications.state === 'initial' && communications.caller !== this.displayName && this.lastCancelledCall !== communications.callId) {
                this.setCallState(CALL_STATE_INCOMING);
                this.callId = communications.callId;
                this.otherPartyDisplayName = communications.caller;
                this.log.info(`New incoming call ${communications.callId} from ${communications.caller}`);
            }
            else if (this.callState === CALL_STATE_CALLING && communications.answerSdp && communications.state === 'answer') {
                this.setCallState(CALL_STATE_CALLING_ANSWER);
                this.log.info(`Answer received ${communications.callId} from ${communications.callee}`);
                this.onAnswerReceived();
            }
            if (communications.state === 'cancelled') {
                if (communications.callId === this.callId) {
                    this.cancelCall(false);
                }
                if (this.callState === CALL_STATE_INCOMING) {
                    this.log.info(`Call cancelled received for incoming call ${communications.callId}`);
                    this.reset();
                }
            }
            if (this.callState === CALL_STATE_CALLING || this.callState === CALL_STATE_CALLING_ANSWER || this.callState === CALL_STATE_INCOMING_CALLING) {
                this.checkCandidates();
            }
        }
        else if (this.callState === CALL_STATE_INCOMING) {
            this.reset();
        }
    }

    setOtherParty(otherParty) {
        this.otherPartyDisplayName = otherParty;
    }

    callAction() {
        if (this.mediaState !== MEDIA_STATE_INITIALIZED) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                devices.forEach(o => {
                    this.log.debug(`Found available input/output device: ${JSON.stringify(o)}`);
                });
                navigator.mediaDevices.getUserMedia({
                    audio: devices.filter(d => d.kind === 'audioinput').length > 0,
                    video: this.videoAllowed && devices.filter(d => d.kind === 'videoinput').length > 0
                }).then((stream) => {
                    this.log.info('Stream received ' + stream);
                    this.mediaState = MEDIA_STATE_INITIALIZED;
                    this.stream = stream;
                    this.activateRTCSession();
                }).catch((err) => {
                    if (this.callState === CALL_STATE_INCOMING) {
                        this.cancelCall(true);
                    }
                    this.log.error('Unable to get stream: ' + err.message);
                })
            })
        }
        else if (this.callState === CALL_STATE_NONE || this.callState === CALL_STATE_INCOMING) {
            this.activateRTCSession();
        }
        else if (this.callState === CALL_STATE_CONNECTED || this.callState === CALL_STATE_CALLING_ANSWER ||
            this.callState === CALL_STATE_CALLING) {
            this.cancelCall(true);
        }
    }

    cancelCall(sendMessage) {
        if (this.callState === CALL_STATE_NONE) return;
        this.log.info(`Cancelling call... ${this.callId} ${this.pc}`);
        const callId = this.callId;
        if (this.pc) {
            this.pc.close();
        }
        this.lastCancelledCall = callId;
        this.reset();
        if (callId && sendMessage) {
            this.log.info(`Sending call cancel... ${callId}`);
            this.chatProxy.cancelCall(this.chatId, callId);
        }
    }

    sendCandidate(candidate) {
        this.chatProxy.addCandidate(this.chatId, this.callId, candidate)
            .catch(e => {
                this.log.error('Unable to make a call ' + e.message);
            })
    }

    activateRTCSession() {
        this.pc = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS});
        const pc = this.pc;
        this.pc.onicecandidate = (e) => {
            if (!e.candidate) return;
            this.log.debug(`New Ice Candidate: ${e.candidate.sdpMid} ${e.candidate.sdpMLineIndex} ${e.candidate.candidate}`);
            if (this.callId) {
                this.sendCandidate(e.candidate);
            }
            else {
                this.localSavedCandidates.push(e.candidate);
            }
        };
        this.pc.onicegatheringstatechange = (e) => {
            if (!this.pc) return;
            this.log.info(`Ice state changed: ${this.pc.iceGatheringState}`);
        };
        this.pc.onicecandidateerror = (e) => {
            this.log.error(`Ice candidate error: ${e.message}`);
        };
        this.pc.oniceconnectionstatechange = (e) => {
            if (!this.pc) return;
            this.log.info(`Ice connection state changed: ${this.pc.iceConnectionState}`);
            if (this.pc.iceConnectionState === 'failed') {
                if (pc === this.pc) {
                    this.cancelCall(true);
                }
            }
            else if (this.pc.iceConnectionState === 'closed') {
                if (pc === this.pc) {
                    this.reset();
                }
            }
            else if (this.pc.iceConnectionState === 'connected') {
                if (pc === this.pc) {
                    this.setCallState(CALL_STATE_CONNECTED);
                    this.chatProxy.onCall(this.chatId, this.callId);
                }
            }
        };
        this.pc.onconnectionstatechange = (e) => {
            if (!this.pc) return;
            this.log.info(`RTC connection state changed: ${this.pc.connectionState}`);
        };
        this.pc.ontrack = (e) => {
            this.log.info(`Track received ${JSON.stringify(e.track)}`);
            if (pc === this.pc) {
                if (this.onNewTrack) {
                    this.onNewTrack(e.track);
                }
            }
        };
        this.stream.getTracks().forEach(track => this.pc.addTrack(track, this.stream));
        if (this.callState === CALL_STATE_INCOMING) {
            this.callId = this.communications.callId;
            this.setCallState(CALL_STATE_INCOMING_CALLING);
            this.log.info('Remote SDP: ' + this.communications.sdp);
            this.pc.setRemoteDescription({
                sdp: this.communications.sdp,
                type: this.communications.type
            });
            this.pc.createAnswer({}).then(answer => {
                if (pc !== this.pc) return;
                this.pc.setLocalDescription(answer);
                this.log.debug('Local SDP: ' + answer.sdp);
                this.chatProxy.answerCall(this.chatId, this.communications.callId, answer)
                    .catch(e => {
                        this.log.error('Unable to answer call ' + e.message);
                    })
            })
        }
        else if (this.callState === CALL_STATE_NONE) {
            this.setCallState(CALL_STATE_CALLING);
            this.pc.createOffer({}).then((offer) => {
                this.pc.setLocalDescription(offer);
                this.log.info('Local SDP: ' + offer.sdp);
                this.chatProxy.makeCall(this.chatId, this.otherPartyDisplayName, offer)
                    .then(r => {
                        this.callId = r.data.callId;
                        if (pc !== this.pc) {
                            this.cancelCall(true);
                            return;
                        }
                        if (this.localSavedCandidates) {
                            this.localSavedCandidates.forEach(v => this.sendCandidate(v));
                        }
                    })
                    .catch(e => {
                        this.log.error('Unable to make call ' + e.message);
                    })
            }).catch(err => {
                this.log.error('Unable to create offer. ' + err.message);
            })
        }
    }

    onAnswerReceived() {
        this.log.info('Answer received: ' + this.communications.sdp);
        this.pc.setRemoteDescription({
            sdp: this.communications.answerSdp,
            type: this.communications.answerType
        });
    }

    checkCandidates() {
        if (!this.communications.candidates) return;
        const remoteCandidates = this.communications.candidates[this.otherPartyDisplayName];
        if (remoteCandidates && (!this.remoteSavedCadnidates || remoteCandidates.length !== this.remoteSavedCadnidates.length)) {
            remoteCandidates.forEach(r => {
                let candidateFound = false;
                this.remoteSavedCadnidates.forEach(s => {
                    if (r.candidate === s.candidate && r.sdpMid === s.sdpMid && r.sdpMLineIndex === s.sdpMLineIndex) {
                        candidateFound = true;
                    }
                });
                if (!candidateFound) {
                    this.log.info(`New Remote Ice Candidate: ${r.sdpMid} ${r.sdpMLineIndex} ${r.candidate}`);
                    if (this.pc) {
                        this.pc.addIceCandidate({
                            candidate: r.candidate,
                            sdpMid: r.sdpMid,
                            sdpMLineIndex: r.sdpMLineIndex
                        });
                    }
                }
            });
            this.remoteSavedCadnidates = remoteCandidates;
        }
    }
}