/* 
 * Copyright 2012, Ilya Tsvetkov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the Software), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software,  and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * The software is provided as is, without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising from,
 * out of or in connection with the software or the use or other dealings in
 * the software.
 */

var Bencode = {

    decode: function(string, skipItems, utfDefault, uftItems) {

        var source = string;
        var position = 0;
        var skip = false;
        var utf = utfDefault == null || !!utfDefault;
        var skipOption = {
            dictionary: skipItems,
            state: skip,
            defaultState: skip,
            parents: []
        };
        var utfOption = {
            dictionary: uftItems,
            state: utf,
            defaultState: utf,
            parents: []
        };

        var pushItemOption = function(options, key) {
            options.parents.push(options.dictionary);
            if (options.dictionary != null) {
                if (key in options.dictionary) {
                    options.dictionary = options.dictionary[key];
                    if (options.dictionary == null) {
                        options.state = !options.defaultState;
                    }
                } else {
                    options.dictionary = null;
                }
            }
            return options.state;
        };

        var popItemOption = function(options) {
            options.dictionary = options.parents.pop();
            if (options.dictionary != null) {
                options.state = options.defaultState;
            }
            return options.state;
        };

        var decodeItem = function() {
            var ch = source.charCodeAt(position);

            if (ch >= 0x30 && ch <= 0x39) { // /\d/
                return decodeString();
            }

            switch (ch) {
                case 0x69: // /i/
                    return decodeInteger();
                case 0x6c: // /l/
                    return decodeList();
                case 0x64: // /d/
                    return decodeDictionary();
                default:
                    throw new Error('Wrong type symbol');
            }
        };

        var decodeString = function() {
            /*jshint bitwise:false*/
            
            var col = source.indexOf(':', position + 1);
            var len = parseInt(source.slice(position, col), 10);
            var end = col + len + 1;
            var result = '';
            var ch;

            if (skip) {
                position = end;
                return null;
            }

            if (!utf) {
                position = end;
                return source.slice(col + 1, position);
            }

            position = col + 1;

            while (position < end) {
                ch = source.charCodeAt(position);

                if (ch < 0x80) {
                    result += String.fromCharCode(ch);
                    position++;
                } else if ((ch >= 0xc0) && (ch < 0xe0)) {
                    ch = ((ch & 0x1f) << 6) | (source.charCodeAt(position + 1) & 0x3f);
                    result += String.fromCharCode(ch);
                    position += 2;
                } else {
                    ch = ((ch & 0x0f) << 12) | ((source.charCodeAt(position + 1) & 0x3f) << 6) |
                         (source.charCodeAt(position + 2) & 0x3f);
                    result += String.fromCharCode(ch);
                    position += 3;
                }
            }

            if (position !== end) {
                throw new Error('Wrong string encoding');
            }

            return result;
        };

        var decodeInteger = function() {
            var start = position + 1;
            var end = source.indexOf('e', start);
            position = end + 1;
            if (skip) {
                return null;
            }
            return parseInt(source.slice(start, end), 10);
        };

        var decodeList = function() {
            var list = skip ? null : [];
            var item;
            ++position;
            while (source.charAt(position) !== 'e') {
                item = decodeItem();
                if (!skip) {
                    list.push(item);
                }
            }
            ++position;
            return list;
        };

        var decodeDictionary = function() {
            var dictionary = skip ? null : {};
            var key, item;
            ++position;
            while (source.charAt(position) !== 'e') {
                key = decodeString();
                skip = pushItemOption(skipOption, key);
                utf = pushItemOption(utfOption, key);
                item = decodeItem();
                if (!skip) {
                    dictionary[key] = item;
                }
                skip = popItemOption(skipOption);
                utf = popItemOption(utfOption);
            }
            ++position;
            return dictionary;
        };

        return decodeItem();
    }

};
