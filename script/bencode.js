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
                    options.dictionary == null && (options.state = !options.defaultState);
                } else {
                    options.dictionary = null;
                }
            }
            return options.state;
        };

        var popItemOption = function(options) {
            options.dictionary = options.parents.pop();
            options.dictionary != null && (options.state = options.defaultState);
            return options.state;
        };

        var decodeItem = function() {
            var ch = source.charCodeAt(position);

            if (ch >= 0x30 && ch <= 0x39) // /\d/
                return decodeString();

            switch (ch) {
                case 0x69: // /i/
                    return decodeInteger();
                case 0x6c: // /l/
                    return decodeList();
                case 0x64: // /d/
                    return decodeDictionary();
                default:
                    throw Error('Wrong type symbol');
            }
        };

        var decodeString = function() {
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

            if (position != end)
                throw Error('Wrong string encoding');

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
            while (source.charAt(position) != 'e') {
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
            while (source.charAt(position) != 'e') {
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
