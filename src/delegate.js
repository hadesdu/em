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
     * @param {e} 事件对象
     */
    function onClick(e) {
        var e = e || window.event;
        var target = e.target || e.srcElement;
        var tagName = target.tagName.toUpperCase();

        if (tagName === 'A') {
            var href = target.getAttribute('href');
            if (/^#~/.test(href)) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }
                redirect(href.slice(1));
            }
        }
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
