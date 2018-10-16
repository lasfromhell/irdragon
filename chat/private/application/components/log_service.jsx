import Chat from "./chat";

export default class Log {

    constructor() {
        this._log = '';
    }

    debug(message) {
        this.log('DEBUG', message);
        console.debug(message);
    }

    info(message) {
        this.log('INFO', message);
        console.info(message);
    }

    error(message) {
        this.log('ERROR', message);
        console.error(message);
    }

    log(level, message) {
        this._log += `[${Chat.formatDate(new Date())}][${level}] ${message}\n`;
    }

    download() {
        const link = document.createElement('a');
        // const blob = new Blob([this._log], {type: 'octet/stream'});
        // link.href = window.URL.createObjectURL(blob);
        // link.download = 'log_' + new Date().getTime() + ".log";
        // link.click();
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this._log));
        link.setAttribute('download', 'log_' + new Date().getTime() + ".log");
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}