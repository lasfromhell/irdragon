import AxiosWrapper from './axios_wrapper.jsx'

export default class ChatProxy {
    constructor() {
        this.axios = new AxiosWrapper();
    }

    setGoToHomeCallback(callback) {
        this.axios.setGoToHomeCallback(callback);
    }

    setErrorCallback(callback) {
        this.axios.setErrorCallback(callback);
    }

    setSuccessCallback(callback) {
        this.axios.setSuccessCallback(callback);
    }

    setToken(token) {
        this.axios.setHeader('Authentication-Token', token);
    }

    getLatestMessages(chatId, number = 20) {
        return this.axios.get(`/api/chat/${chatId}/latest/${number}`);
    }

    authorize() {
        return this.axios.post("/api/user/authorize");
    }

    getMessagesAfter(chatId, after, number = 50) {
        return this.axios.get(`/api/chat/${chatId}/after/${after}/${number}`);
    }

    getPresence(chatId) {
        return this.axios.get(`/api/chat/${chatId}/presence`);
    }

    getMessagesBefore(chatId, before, number = 30) {
        return this.axios.get(`/api/chat/${chatId}/before/${before}/${number}`);
    }

    sendTypingStarted(chatId) {
        return this.axios.post(`/api/chat/${chatId}/typingStarted`);
    }

    sendTypingProgress(chatId) {
        return this.axios.post(`/api/chat/${chatId}/typingProgress`);
    }

    sendTypingFinished(chatId) {
        this.axios.post(`/api/chat/${chatId}/typingFinished`);
    }

    sendMessage(chatId, text) {
        return this.axios.post(`/api/chat/${chatId}/message`, {
            data: text,
        });
    }

    logout() {
        return this.axios.post('/api/user/logout');
    }

    authenticate(login, password, rememberCookie) {
        return this.axios.post('/api/user/authenticate', {
            login: login,
            password: password,
            rememberCookie: rememberCookie
        });
    }

    sendLastReadMessage(chatId, messageId) {
        return this.axios.post(`/api/chat/${chatId}/lastReadMessage/${messageId}`);
    }

    sendAction() {
        return this.axios.post(`/api/user/action`);
    }

    uploadImage(file, onProgress) {
        const data = new FormData();
        data.append("image", file);
        data.append("name", file.name);
        return this.axios.post(`/api/image/upload`, data, {
            header: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        });
    }

    uploadFile(file, onProgress) {
        const data = new FormData();
        data.append("file", file);
        data.append("name", file.name);
        return this.axios.post(`/api/file/upload`, data, {
            header: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        });
    }
}