Send to Transmission for Chrome
===============================

Chrome Extension for sending torrents files to Transmission.

Initially based on [Transmission Remote Plus](https://chrome.google.com/webstore/detail/gfpmpadkekeahaihamlppljnegbbkoff) ([cherepanov/chrome-transmission-remote-plus](https://github.com/cherepanov/chrome-transmission-remote-plus)) but rewritten from scratches.

Description
-----------

Transmission is a cross-platform BitTorrent client: www.transmissionbt.com

This extension integrates Transmission with Chrome allowing to seamlessly add new torrent files without storing them locally. The goal is to eliminate the inconvenience of manually having to manage torrent files outside of the browser and provide intuitive user interface for customizable downloads.

Just install this extension, setup Transmission options (initially, you will be asked to store your server’s address, username, and password) and “Send to Transmission” context menu item will be available for every link.
To add new torrent to Transmission right-click a torrent-file link and select “Send to Transmission” menu item. Popup will appear allowing you to customize download options.

Note. When adjusting Transmission settings, please double check any authentication settings, including username and password, and ensure they are entered into the “Send to Transmission” options page.

Features:
* right-click link to add torrent-file to local or remote Transmission client;
* preview a list of files inside of a torrent to confirm before downloading;
* choose files inside of a torrent you what to download;
* add torrent to Transmission client in a paused state;
* create your own custom list of download locations.
