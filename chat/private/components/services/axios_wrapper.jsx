import Axios from 'axios';

export default class AxiosWrapper {

    constructor() {
        this.axios = Axios.create();
        this.headers = {};
        this.unauthorizedAttempts = 5;
    }

    setGoToHomeCallback(goToHomeCallback) {
        this.goToHomeCallback = goToHomeCallback;
    }

    setErrorCallback(errorCallback) {
        this.errorCallback = errorCallback;
    }

    setSuccessCallback(successCallback) {
        this.successCallback = successCallback;
    }

    setHeader(header, value) {
        this.headers[header] = value;
        this.axios = Axios.create({
            headers: this.headers
        });
    }

    resetUnauthorizedAttempts() {
        this.unauthorizedAttempts = 5;
    }

    goToHome() {
        if (this.goToHomeCallback) {
            this.goToHomeCallback();
        }
        this.resetUnauthorizedAttempts();
    }

    catchErrors(promise) {
        return promise
            .then(result => {
                this.resetUnauthorizedAttempts();
                if (this.successCallback) {
                    this.successCallback();
                }
                return result;
            })
            .catch(error => {
                if (this.errorCallback) {
                    this.errorCallback();
                }
                if (error.response && error.response.status === 401) {
                    if (!this.unauthorizedAttempts--) {
                        this.goToHome();
                    }
                }
                return Promise.reject(error);
        });
    }

    get(url, config) {
        return this.catchErrors(this.axios.get(url, config));
    }

    post(url, config) {
        return this.catchErrors(this.axios.post(url, config));
    }
}