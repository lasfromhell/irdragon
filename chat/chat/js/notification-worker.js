(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

self.addEventListener('push', function (e) {
    var text = "<No text received>";
    if (e.data) {
        console.log('Push event with data: ', e.data);
        text = e.data.text();
    } else {
        console.log('Push event without data');
    }

    e.waitUntil(self.registration.showNotification('IRDragon', {
        body: text,
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500]
    }));
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3b3JrZXJzL25vdGlmaWNhdGlvbi13b3JrZXIvd29ya2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxLQUFLLGdCQUFMLENBQXNCLE1BQXRCLEVBQThCLGFBQUs7QUFDL0IsUUFBSSxPQUFPLG9CQUFYO0FBQ0EsUUFBSSxFQUFFLElBQU4sRUFBWTtBQUNSLGdCQUFRLEdBQVIsQ0FBWSx3QkFBWixFQUFzQyxFQUFFLElBQXhDO0FBQ0EsZUFBTyxFQUFFLElBQUYsQ0FBTyxJQUFQLEVBQVA7QUFDSCxLQUhELE1BSUs7QUFDRCxnQkFBUSxHQUFSLENBQVkseUJBQVo7QUFDSDs7QUFFRCxNQUFFLFNBQUYsQ0FDSSxLQUFLLFlBQUwsQ0FBa0IsZ0JBQWxCLENBQW1DLFVBQW5DLEVBQStDO0FBQzNDLGNBQU0sSUFEcUM7QUFFM0MsaUJBQVMsQ0FBQyxHQUFELEVBQUssR0FBTCxFQUFTLEdBQVQsRUFBYSxHQUFiLEVBQWlCLEdBQWpCLEVBQXFCLEdBQXJCLEVBQXlCLEdBQXpCLEVBQTZCLEdBQTdCLEVBQWlDLEdBQWpDLEVBQXFDLEVBQXJDLEVBQXdDLEdBQXhDLEVBQTRDLEdBQTVDLEVBQWdELEdBQWhELEVBQW9ELEdBQXBELEVBQXdELEdBQXhELEVBQTRELEVBQTVELEVBQStELEdBQS9EO0FBRmtDLEtBQS9DLENBREo7QUFLSCxDQWZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwic2VsZi5hZGRFdmVudExpc3RlbmVyKCdwdXNoJywgZSA9PiB7XHJcbiAgICBsZXQgdGV4dCA9IFwiPE5vIHRleHQgcmVjZWl2ZWQ+XCI7XHJcbiAgICBpZiAoZS5kYXRhKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1B1c2ggZXZlbnQgd2l0aCBkYXRhOiAnLCBlLmRhdGEpXHJcbiAgICAgICAgdGV4dCA9IGUuZGF0YS50ZXh0KCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnUHVzaCBldmVudCB3aXRob3V0IGRhdGEnKTtcclxuICAgIH1cclxuXHJcbiAgICBlLndhaXRVbnRpbChcclxuICAgICAgICBzZWxmLnJlZ2lzdHJhdGlvbi5zaG93Tm90aWZpY2F0aW9uKCdJUkRyYWdvbicsIHtcclxuICAgICAgICAgICAgYm9keTogdGV4dCxcclxuICAgICAgICAgICAgdmlicmF0ZTogWzUwMCwxMTAsNTAwLDExMCw0NTAsMTEwLDIwMCwxMTAsMTcwLDQwLDQ1MCwxMTAsMjAwLDExMCwxNzAsNDAsNTAwXVxyXG4gICAgICAgIH0pKTtcclxufSk7XHJcbiJdfQ==
