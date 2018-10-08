import React from "react";
import PresenceComponent from "./presence_component";

export default class Presence extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            items: {}
        };
        this.i = 0;
    }

    componentDidMount() {
        this.subscription = this.props.observables.presence.subscribe((data) => {
            const items = {};
            for (const line in data) {
                if (data.hasOwnProperty(line)) {
                    if (data[line] != null) {
                        const presenceItem = data[line];
                        if (!presenceItem.online) {
                            continue;
                        }
                        presenceItem.dataUpdater = () => {
                            this.setState();
                        };
                        items[presenceItem.online.displayName] = presenceItem;
                    }
                }
            }
            this.setState({
                items: items
            });
        });
    }

    componentWillUnmount() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    render() {
        return <div className="presence-items-block">
            {Object.keys(this.state.items).map(key => <PresenceComponent key={key} item={this.state.items[key]}/>)}
        </div>;
    }
}
