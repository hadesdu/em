/**
 * @file 框架入口文件
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {

    var locator = require('./locator');

    /**
     * 启动框架
     *
     * @public
     */
    function start() {
        locator.start();
    }

    return {
        version: '0.1.0',
        start: start
    };
});
