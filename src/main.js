/**
 * @file 框架入口文件
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {

    var locator = require('./locator');
    var delegate = require('./delegate');

    /**
     * 启动框架
     *
     * @public
     */
    function start() {
        locator.start();
        delegate.start();
    }

    /**
     * 停止框架
     *
     * @public
     */
    function stop() {
        locator.stop();
        delegate.stop();
    }

    /**
     * 向hash新增query参数
     *
     * @public
     * @param {Object} query 参数对象
     */
    function addQuery(query) {
        locator.addQuery(query);
    }

    return {
        version: '0.1.0',
        start: start,
        stop: stop,
        addQuery: addQuery
    };
});
