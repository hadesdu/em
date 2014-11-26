/**
 * @file 事件代理模块，提供全局的事件代理
 * @author hades(denghongqi@baidu.com)
 */

define(function(require) {
    var util = require('./util');
    var hash = require('./hash');
    var locator = require('./locator');

    /**
     * 启动事件代理
     *
     * @public
     */
    function start() {
        util.on(document.body, 'click', onClick);
    }

    /**
     * 停止事件代理
     *
     * @public
     */
    function stop() {
        util.un(document.body, 'click', onClick);
    }

    /**
     * 页面有click事件，冒泡到body的时候触发
     *
     * @event
     * @param {Object} e 事件对象
     */
    function onClick(e) {
        e = e || window.event;
        var target = e.target || e.srcElement;
        var recentA = getRecentA(target);

        if (recentA) {
            var href = recentA.getAttribute('href');
            if (/#~/.test(href)) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }

                redirect(href.slice(href.indexOf('#') + 1));
            }
        }
    }

    /**
     * 向上遍历获取最近的A标签，包括自身
     *
     * @param {Object} current 当前节点
     * @return {(Object|null)} 最近的a标签祖先节点
     */
    function getRecentA(current) {
        if (!current) {
            return null;
        }

        if (current.tagName && current.tagName.toUpperCase() === 'A') {
            return current;
        }

        return getRecentA(current.parentNode);
    }

    /**
     * 出发hash redirect
     *
     * @param {string} str 跳转的hash字符串
     */
    function redirect(str) {
        var query = hash.parse(str || '');

        var newHash = hash.addQuery(query);
        locator.redirect(newHash);
    }

    return {
        start: start,
        stop: stop
    };
});
