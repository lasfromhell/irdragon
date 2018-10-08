export default class DeviceService {
    static getDeviceUIClass(device) {
        if (!device) {
            return "fas fa-question"
        }
        switch (device) {
            case 'desktop':
                return "fas fa-desktop";
            case 'android':
                return "fab fa-android";
            case 'iphone':
            case 'ipad':
                return "fab fa-apple";
            case 'mobile':
                return "fas fa-mobile-alt";
            case 'tablet':
                return "fas fa-tablet-alt";
        }
        return "fas fa-question";
    }

    static getDeviceUISubClass(device) {
        if (device === 'ipad') {
            return "fas fa-tablet-alt";
        }
        return "";
    }
}