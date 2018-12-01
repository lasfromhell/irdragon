import Utils from "../utils/utils";

const PUSH_SW_PATH = '/chat/js/notification-worker.js';

export default class PushService {

    constructor(log, chatProxy) {
        this.log = log;
        this.chatProxy = chatProxy;
    }

    requestServiceAccess() {
        return new Promise((resolve, reject) => {
            Notification.requestPermission().then(result => {
                if (result === 'granted') {
                    resolve(result);
                }
                else {
                    reject(result);
                }
            }).catch(e => reject(e));
        })
    }

    async activateServiceWorker(path) {
        const registration = await navigator.serviceWorker.register(path);
        if (registration.active) {
            this.log.info("Service worker activated");
            return registration;
        }
        else if (!registration.installing && !registration.waiting) {
            throw "Service worker registration is in unsupported state";
        }
        // const serviceWorker = registration.active ? registration.active : (registration.waiting ? registration.waiting : (registration.installing ? registration.installing : null));
        // this.log.info("Service worker not active yet. Subscribing to active state change");
        // if (serviceWorker) {
        this.log.info("Service worker states: " + JSON.stringify(registration.active) + "; " + JSON.stringify(registration.waiting) + "; " + JSON.stringify(registration.installing) );
        await new Promise((resolve, reject) => (registration.installing || registration.waiting).addEventListener('statechange', (e) => {
            this.log.info("Service worker state changed to " + e.target.state);
            if (e.target.state === 'activated') {
                this.log.info("Service worker activated");
                resolve();
            }
            else if (e.target.state === 'redundant') {
                reject("Unable to activate service worker. It's state is redundant");
            }
        }));
        return registration;
    }

    async defaultSubscribe() {
        const result = await this.requestServiceAccess();
        const registration = await this.activateServiceWorker(PUSH_SW_PATH);
        this.log.info("Subscribing for service worker");
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: Utils.urlBase64ToUint8Array('BLJ5g_bxh4jpJ0rjRlqI8qc974JEaA5--BWdor0QRlSNflw5e9DcIfL2RAE54BY3YWQCv_t_SFhszjWw5c-QWOU')
        });
        this.log.info('Received subscription - ' + JSON.stringify(subscription));
        return subscription;
    }

    async subscribeForChatMessages(chatId) {
        let subscription = await this.getSubscription();
        if (!subscription) {
            subscription = await this.defaultSubscribe();
        }
        await this.chatProxy.subscribeNotifications(chatId, subscription, 'message');
    }

    async subscribeForChatPresence(chatId) {
        let subscription = await this.getSubscription();
        if (!subscription) {
            subscription = await this.defaultSubscribe();
        }
        await this.chatProxy.subscribeNotifications(chatId, subscription, 'presence');
    }

    async unsubscribeFromChatMessages(chatId) {
        const subscription = await this.getSubscription();
        if (subscription) {
            await this.chatProxy.unsubscribeNotifications(chatId, subscription, 'message');
        }
        else {
            this.log.error("Unable to find any active subscription for current browser instance");
            alert("Unable to find any active subscription for current browser instance");
        }
    }

    async unsubscribeFromChatPresence(chatId) {
        const subscription = await this.getSubscription();
        if (subscription) {
            await this.chatProxy.unsubscribeNotifications(chatId, subscription, 'presence');
        }
        else {
            this.log.error("Unable to find any active subscription for current browser instance");
            alert("Unable to find any active subscription for current browser instance");
        }
    }

    async getSubscription() {
        this.log.info("Receiving existing registrations of service workers...");
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations && registrations.length) {
            this.log.info("Registrations for services worker found. Looking for pushing registration...");
            const pushRegistrations = registrations.filter(r => (r.waiting || r.installing || r.active).scriptURL.indexOf(PUSH_SW_PATH) >= 0);
            if (pushRegistrations.length > 0) {
                this.log.info("Pushing registration found. Looking for subscription...");
                return await pushRegistrations[0].pushManager.getSubscription();
            }
            this.log.info("Pushing registration not found");
            return null;
        }
        this.log.info("No registrations of service workers found");
        return null;
    }
}