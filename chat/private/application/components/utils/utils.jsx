export default class Utils {
    static processMessage(message) {
        const replaceParams = [];
        const addedElements = [];
        const maps = [];
        let celebrateWrapper = { celebrate: false };
        if (message.indexOf('`') === 0) {
            message = message.replace('`', '');
        }
        else {
            message = this.replaceMap(message, addedElements, maps);
            message = message.replace(/{file:([a-f0-9-]+);name:(.*?)}/g, '<a href="files/uploaded/$1/$2" download>$2</a>');
            message = message.replace(/{img:([a-f0-9-]+\.[a-z]{3,4})}/g, '<a href="images/uploaded/$1" target="_blank"><img class="thumbnail" src="images/uploaded/thumbnails/$1"/></a>');
            message = this.replaceCelebrate(message, celebrateWrapper);
            message = message.replace(/(\w{1,10}:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:;%_\+.~#?&//=]*)/g, '<a target="_blank" rel="noopener noreferrer" href="$1">$1</a>');
            message = message.replace(/(:D)|(:=D)|(:-D)|(:d)|(:=d)|(:-d)/g, '<img class="smile" src="images/smiles/01.gif"/>');
            message = message.replace(/(:o)|(:=o)|(:-o)|(:O)|(:=O)|(:-O)/g, '<img class="smile" src="images/smiles/02.gif"/>');
            message = message.replace(/\(love\)/g, '<img class="smile" src="images/smiles/05.gif"/>');
            message = message.replace(/(;\))|(;=\))|(;-\))/g, '<img class="smile" src="images/smiles/07.gif"/>');
            message = message.replace(/\(kiss\)/g, '<img class="smile" src="images/smiles/08.gif"/>');
            message = message.replace(/(:\))|(:=\))|(:-\))/g, '<img class="smile" src="images/smiles/09.gif"/>');
            message = message.replace(/(:\()|(:=\()|(:-\()/g, '<img class="smile" src="images/smiles/13.gif"/>');
            message = message.replace(/(:'\()|(:'=\()|(:'-\()/g, '<img class="smile" src="images/smiles/16.gif"/>');
            message = message.replace(/\(cool\)/g, '<img class="smile" src="images/smiles/28.gif"/>');
            message = message.replace(/\(vomit\)/g, '<img class="smile" src="images/smiles/30.gif"/>');
            message = message.replace(/\(devil\)/g, '<img class="smile" src="images/smiles/31.gif"/>');
            message = message.replace(/\(angel\)/g, (match, offset, line) => Utils.setReplaceParams(replaceParams, match, offset, line, '<img class="smile" src="images/smiles/32.gif"/>'));
        }
        return {
            message: message,
            params: replaceParams,
            addedElements: addedElements,
            maps: maps,
            celebrate: celebrateWrapper.celebrate
        };
    }

    static replaceCelebrate(message, celebrateWrapper) {
        const reg = /^{celebrate:(.*)}$/s;
        const matches = message.trim().match(reg);
        if (matches) {
            celebrateWrapper.celebrate = true;
            return `<div class="celebrate-frame center-text">${matches[1]}</div>`;
        }
        celebrateWrapper.celebrate = false;
        return message;
    }

    static replaceMap(message, addedElements, maps) {
        const reg = /{loc:(\d+);(\d+.\d+);(\d+.\d+)}/i;
        const matches = message.match(reg);
        if (matches) {
            const mapId = `map${matches[1]}`;
            maps.push({id: `map${matches[1]}`});

            const scriptElem = document.createElement('script');
            scriptElem.setAttribute('type', 'text/javascript');
            scriptElem.innerHTML =
                `ymaps.ready(()=>{` +
                `const map${mapId} = new ymaps.Map("${mapId}", {` +
                `center: [${matches[2]}, ${matches[3]}],` +
                `zoom: 16, controls: []` +
                `});` +
                `map${mapId}.geoObjects.add(new ymaps.Placemark(map${mapId}.getCenter()));});`;
            addedElements.push(scriptElem);
            return this.replaceMap(message.replace(reg, ''));
        }
        return message;
    }

    static setReplaceParams(replaceParams, match, offset, line, replacer) {
        replaceParams.push({
            replacingLength: match.length,
            replacerLength: replacer.length,
            offset: offset
        });
        return replacer;
    }

    static isMultiline(message) {
        return message.indexOf('\n') >= 0;
    }

    static getSelectionCharacterOffsetWithin(element) {
        let start = 0;
        let end = 0;
        const doc = element.ownerDocument || element.document;
        const win = doc.defaultView || doc.parentWindow;
        let sel;
        let startNodeId;
        if (typeof win.getSelection !== "undefined") {
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                var range = win.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                start = preCaretRange.toString().length;
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                end = preCaretRange.toString().length;
                // start = range.startOffset;
                // end = range.endOffset;
                // for (let i = 0; i < element.childNodes.length; i++) {
                //     if (element.childNodes[i] === range.startContainer) {
                //         startNodeId = i;
                //         break;
                //     }
                // }
            }
        } else if ((sel = doc.selection) && sel.type !== "Control") {
            var textRange = sel.createRange();
            var preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToStart", textRange);
            start = preCaretTextRange.text.length;
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            end = preCaretTextRange.text.length;
        }
        return {start: start, end: end, startNodeId: startNodeId};
    }

    static setSelectionCharacterOffsetWithin(element, position) {
        const range = document.createRange();
        // let totalSize = 0;
        // for (let i = 1; i < element.childNodes.length; i++) {
        //     const node = element.childNodes[i];
        //     if (node.outerHTML) {
        //         totalSize += node.outerHTML.length;
        //     }
        //     else {
        //         totalSize += node.textContent.length;
        //     }
        // }
        let nodeId = position.startNodeId;
        if (element.childNodes.length > position.startNodeId) {
            let node = element.childNodes[position.startNodeId];
            if ((node.innerText && node.innerText.length < position.start) ||
                node.textContent && node.textContent.length < position.start) {
                let nodeAppended = false;
                do {
                    nodeId++;
                    if (nodeId === element.childNodes.length) {
                        element.appendChild(document.createTextNode(''));
                        nodeAppended = true;
                    }
                    node = element.childNodes[nodeId];
                } while (typeof node.innerHTML !== 'undefined' && node.innerHTML.length === 0);
                if (!nodeAppended) {
                    position.start = position.start - Utils.getTextLengthOfElement(element.childNodes[position.startNodeId]);
                    position.end = position.end - Utils.getTextLengthOfElement(element.childNodes[position.startNodeId]);
                } else {
                    position.start = 0;
                    position.end = 0;
                }
            }
        }
        else {
            nodeId = element.childNodes.length - 1;
        }
        if (nodeId >= 0) {
            range.setStart(element.childNodes[nodeId], position.start);
            range.setEnd(element.childNodes[nodeId], position.end);
            range.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    static getTextLengthOfElement(element) {
        if (element.innerText) {
            return element.innerText.length;
        }
        return element.textContent.length;
    }

    static isSafari() {
        return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    }
}