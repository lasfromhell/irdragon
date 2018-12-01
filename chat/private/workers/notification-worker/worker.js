self.addEventListener('push', e => {
    let text = "<No text received>";
    if (e.data) {
        console.log('Push event with data: ', e.data)
        text = e.data.text();
    }
    else {
        console.log('Push event without data');
    }

    e.waitUntil(
        self.registration.showNotification('IRDragon', {
            body: text,
            vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500]
        }));
});
