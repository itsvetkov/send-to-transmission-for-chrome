/*global chrome:false*/

(function() {

    chrome.contextMenus.create({
        title: 'Send to Transmission',
        contexts: ['link'],
        onclick: function(info, tab) {
            chrome.windows.create({
                url: 'download.html#' + info.linkUrl,
                type: 'popup',
                width: 700,
                height: 700
            });
        }
    });

    if (localStorage.configVersion == null || localStorage.configVersion < 1) {
        chrome.tabs.create({
            url: 'options.html'
        });
    }

}());
