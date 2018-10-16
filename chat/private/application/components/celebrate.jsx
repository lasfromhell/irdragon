export class Celebrate {
    startCelebrate() {
        const chatBox = document.getElementsByClassName('chat-box')[0];
        const stars =  200, sparkle = 20;

        const createStar = (size) => {
            chatBox.appendChild(this.createStarshine(sparkle, size));
        };

        for (var i = 0; i < stars; i++) {
            let size;
            if(i % 2 === 0) {
                size = 'small';
            } else if(i % 3 === 0) {
                size = 'medium';
            } else {
                size = 'large';
            }
            createStar(size);
        }
    }

    createStarshine(sparkle, size) {
        const starshine = document.createElement('div');
        starshine.classList.add('template', 'shine');
        starshine.style.top = (Math.random() * 100) + '%';
        starshine.style.left = (Math.random() * 100) + '%';
        starshine.style.animationDelay = (Math.random() * sparkle) + 's';
        starshine.style.pointerEvents = 'none';
        starshine.classList.add(size);
        return starshine;
    }
}