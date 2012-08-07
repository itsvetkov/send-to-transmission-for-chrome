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

    if (typeof localStorage.verConfig === 'undefined' || localStorage.verConfig < 5) {
        chrome.tabs.create({
            url: 'options.html'
        });
    }

}());
