/**
 * @file url相关的函数
 * @author hades(denghongqi@baidu.com)
 */

define(function(require) {
    var util = require('./util');

    var hash = {};

    /**
     * 将参数对象转换为hash字符串
     *
     * @param {Object} query 参数对象
     * @return {string} 转换后的参数字符串
     */
    hash.serialize = function(query) {
        if (!query) {
            return '';
        }

        var search = '';
        for (var key in query) {
            if (query.hasOwnProperty(key)) {
                var value = query[key];
                // 如果`value`是数组，其`toString`会自动转为逗号分隔的字符串
                search += '&' + encodeURIComponent(key)
                    + '=' + encodeURIComponent(value);
            }
        }

        return search.slice(1);
    };

    /**
     * 将参数对象转换为hash url
     *
     * @param {Object} query 参数对象
     * @return {string} 转换后的hash url
     */
    hash.createUrl = function(query) {
        return '~' + hash.serialize(query);
    };

    /**
     * 将字符串转化成参数对象
     *
     * @param {string} hash 要转化的hash字符串
     * @return {Object} 转化后的参数对象
     */
    hash.parse = function(hash) {
        hash += '';
        hash = hash.slice(hash.indexOf('~') + 1);

        var pairs = hash.split('&');
        var query = {};
        for (var i = 0; i < pairs.length; i++) {
            // 考虑到有可能因为未处理转义问题，
            // 导致value中存在**=**字符，因此不使用`split`函数
            var pair = pairs[i];
            if (!pair) {
                continue;
            }
            var index = pair.indexOf('=');
            // 没有**=**字符则认为值是**true**
            var key = index < 0
                ? decodeURIComponent(pair)
                : decodeURIComponent(pair.slice(0, index));
            var value = index < 0
                ? true
                : decodeURIComponent(pair.slice(index + 1));

            // 已经存在这个参数，且新的值不为空时，把原来的值变成数组
            if (query.hasOwnProperty(key)) {
                if (value !== true) {
                    query[key] = [].concat(query[key], value);
                }
            }
            else {
                query[key] = value;
            }
        }
        return query;
    };

    /**
     * 将参数对象序列化成hash
     *
     * @param {Object} query 参数对象
     * @return {string} 转化后的参数字符串
     */
    hash.setQuery = function(query) {
        query = query || {};

        return '~' + this.serialize(query);
    };

    /**
     * 将参数对象添加到hash字符串中
     *
     * @param {Object} query 参数对象
     * @return {string} 转换后的参数字符串
     */
    hash.addQuery = function(query) {
        query = query || {};
        var currentQuery = this.parse(window.location.hash);

        return this.setQuery(util.mix(currentQuery, query));
    };

    /**
     * 获取当前hash的参数对象
     *
     * @param {string=} key 要获取的参数的key
     * @return {Object} 当前hash的参数对象
     */
    hash.getQuery = function(key) {
        var query = this.parse(window.location.hash);

        if (key) {
            return (query[key] ? query[key] : '');
        }

        return query;
    };

    return hash;
});
