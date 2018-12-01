import React from 'react';
import Presence from "./presence";
import PushService from "./services/push_service";
import Utils from "./utils/utils";

export default class ChatMenu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showMenu: false,
            presenceChosen: false,
            notificationTypesReceived: false
        };
        this.log = this.props.chatApi.getLog();
        this.loggingOut = false;
        this.supportsPushNotifications = Utils.checkIfBrowserSupportsNotifications();
    }

    static removeCookie(name) {
        const date = new Date();
        date.setTime(date.getTime() - 1000);
        document.cookie = name + "=;" + date.toUTCString();
    }

    logout() {
        if (!this.loggingOut) {
            this.loggingOut = true;
            this.props.chatApi.getChatProxy().logout()
                .finally(() => {
                    ChatMenu.removeCookie(name);
                    this.props.onLogout();
                    this.loggingOut = false;
                });
        }
    }

    togglePresence() {
        this.setState({
            presenceChosen: !this.state.presenceChosen
        });
    }

    fullScreen() {
        this.props.control.fullScreen();
    }

    notificationSubscribeErrorHandler(result) {
        if (result === 'default') {
            this.log.info("Push notifications dialog was ignored by user");
            alert("Can't enable notifications. Please, allow notifications in web browser");
        }
        else if (result === 'denied') {
            this.log.info("Push notifications declined by user");
            alert("Can't enable notifications. Please, allow notifications in web browser");
        }
        else {
            if (result && result.message) {
                this.log.error('Push notification un/subscribing. Error happened. ' + result.message);
                alert('Push notification un/subscribing. Error happened. ' + result.message);
            }
            else {
                this.log.error('Push notification un/subscribing. Unknown error. ' + result);
                alert('Push notification un/subscribing. Unknown error. ' + result);
            }
        }
    }

    onNotificationsPropertiesClick() {
        this.props.chatApi.activateDialog(this.props.chatApi.dialogs.notifications);
    }

    onMessagesNotificationsClick() {
        if (this.refs.msgNotifications.checked) {
            this.pushService.subscribeForChatMessages(this.props.chatApi.getChatId())
                .then(() => {
                    this.log.info("Message subscription registered");
                })
                .catch(result => {
                    this.notificationSubscribeErrorHandler(result);
                    this.refs.msgNotifications.checked = false;
                });
        }
        else {
            this.pushService.unsubscribeFromChatMessages(this.props.chatApi.getChatId())
                .then(() => {
                    this.log.info("Message subscription unregistered");
                })
                .catch(result => {
                    this.notificationSubscribeErrorHandler(result);
                    this.refs.msgNotifications.checked = true;
                });
        }
    }

    onPresenceNotificationsClick() {
        if (this.refs.presNotifications.checked) {
            this.pushService.subscribeForChatPresence(this.props.chatApi.getChatId())
                .then(() => {
                    this.log.info("Presence subscription registered");
                })
                .catch(result => {
                    this.notificationSubscribeErrorHandler(result);
                    this.refs.presNotifications.checked = false;
                });
        }
        else {
            this.pushService.unsubscribeFromChatPresence(this.props.chatApi.getChatId())
                .then(() => {
                    this.log.info("Presence subscription unregistered");
                })
                .catch(result => {
                    this.notificationSubscribeErrorHandler(result);
                    this.refs.presNotifications.checked = true;
            });
        }
    }

    componentDidMount() {
        if (this.supportsPushNotifications) {
            this.pushService = new PushService(this.log, this.props.chatApi.getChatProxy());
            this.pushService.getSubscription().then((subscription) => {
                if (subscription) {
                    this.log.info("Push subscription found. Querying server to get active subscriptions");
                    this.props.chatApi.getChatProxy().getNotificationsSubscriptionTypes(this.props.chatApi.getChatId(), subscription)
                        .then(types => {
                            if (types.data.indexOf('presence') >= 0) {
                                this.refs.presNotifications.checked = true;
                            }
                            if (types.data.indexOf('message') >= 0) {
                                this.refs.msgNotifications.checked = true;
                            }
                            this.setState({
                                notificationTypesReceived: true
                            })
                        })
                        .catch(e => {
                            this.log.error("Unable to get active subscription types for notifications. " + e.message);
                        })
                }
                else {
                    this.setState({
                        notificationTypesReceived: true
                    })
                }
            }).catch(e => {
                this.log.error("Error while gathering subscription. " + e.message);
            });
        }
    }

    render() {
        return <div><div className={"chat-header" + this.props.chatApi.getCelebrationStyle()}>
            <span className="chat-header-text">{this.props.headerMessage}</span>
            <div className="chat-menu">
                <i className={"awesome-default far fa-flag" + (this.props.chatApi.getActiveDialog() === this.props.chatApi.dialogs.notifications ? ' awesome-selected' : '') +
                  (this.state.notificationTypesReceived ? '' : 'hidden') + this.props.chatApi.getCelebrationStyle()} onClick={this.onNotificationsPropertiesClick.bind(this)}/>
                <div className={(this.props.chatApi.getActiveDialog() === this.props.chatApi.dialogs.notifications ? "notifications-box-wrapper" : "hidden")}>
                    <div className={"notifications-box " + this.props.chatApi.getCelebrationStyle()}>
                        <div className="row">
                            <label htmlFor="msgNotifications">Enable messages notifications</label>
                            <div>
                                <input type="checkbox" ref="msgNotifications" id="msgNotifications" onClick={this.onMessagesNotificationsClick.bind(this)}/>
                            </div>
                        </div>
                        <div className="row">
                            <label htmlFor="presNotifications">Enable presence notifications</label>
                            <div>
                                <input type="checkbox" ref="presNotifications" id="presNotifications" onClick={this.onPresenceNotificationsClick.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </div>
                <i className={"awesome-default fas fa-users" + (this.state.presenceChosen ? ' awesome-selected' : '') + this.props.chatApi.getCelebrationStyle()} onClick={this.togglePresence.bind(this)}/>
                <i className={"awesome-default fas fa-arrows-alt" + this.props.chatApi.getCelebrationStyle()} onClick={this.fullScreen.bind(this)}/>
                <i className={"awesome-default fas fa-sign-out-alt" + this.props.chatApi.getCelebrationStyle()} onClick={this.logout.bind(this)}/>
                <div className={"chat-preferences-block " + (this.state.showMenu ? "" : "hidden")} >
                    <div className="chat-preferences-item" onClick={this.logout.bind(this)}>Logout</div>
                </div>
            </div>
        </div><div className={"chat-menu-data " + (!this.state.presenceChosen ? '' : ' chat-menu-data-animate')  + this.props.chatApi.getCelebrationStyle()}>
        {
            this.state.presenceChosen ? <Presence observables={this.props.observables} chatApi={this.props.chatApi}/> : <div/>
        }
        </div></div>;
    }
}