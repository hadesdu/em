/**
 * @file 地址监听器对象
 * @author hades(denghongqi@baidu.com)
 */
define(function (require) {
    /**
     * 地址监听对象
     * 
     * 该对象用于监听地址中的hash部分的变化，以及根据要求更新hash值
     * 
     * locator的基本工作流程：
     * 
     * 1. 监听hash的变化
     * 2. 当hash变化时，如果确实发生变化（与上一次的值不同），则执行逻辑
     * 3. 保存当前的地址信息（高版本浏览器此时自动记录历史项）
     * 4. 触发`redirect`事件
     */
    var locator = {};
    var currentLocation = '';

    var hash = require('./hash');
    var util = require('./util');

    /**
     * redirect hook函数集合
     *
     * @type {Array<Function>}
     */
    var redirectHooks = [];

    /**
     * 获取URL中的hash值
     *
     * @return {string} 当前URL中的hash值
     */
    function getLocation() {
        // Firefox下`location.hash`存在自动解码的情况，
        // 比如hash的值是**abc%3def**，
        // 在Firefox下获取会成为**abc=def**
        // 为了避免这一情况，需要从`location.href`中分解
        var index = location.href.indexOf('#');
        var url = index === -1 
            ? ''
            : location.href.slice(index);

        return url;
    }

    /**
     * 执行hash变更的相关逻辑
     */
    function forwardHash() {
        var url = getLocation();
        locator.redirect(url);
    }

    /**
     * 用于低版本浏览器监听hash变化的定时器
     *
     * @type {number}
     */
    var rollTimer = 0;

    /**
     * 初次进入时处理hash的定时器
     *
     * @type {number}
     */
    var startupTimer = 1;

    /**
     * 启动地址栏事件监听
     *
     * @param {boolean} firstTime 是否为首次进入
     */
    function start(firstTime) {
        // 如果有hashchange事件则使用事件，否则定时监听
        if (window.addEventListener) {
            window.addEventListener('hashchange', forwardHash, false);
        }
        else if ('onhashchange' in window && document.documentMode > 7) {
            window.attachEvent('onhashchange', forwardHash);
        }
        else {
            rollTimer = setInterval(forwardHash, 100);
        }

        // 处理初次进入的hash
        if (firstTime) {
            startupTimer = setTimeout(forwardHash, 0);
        }
    }

    /**
     * 停止地址栏事件监听
     */
    function stop() {
        if (rollTimer) {
            clearInterval(rollTimer);
            rollTimer = null;
        }
        if (startupTimer) {
            clearTimeout(startupTimer);
            startupTimer = null;
        }

        if (window.removeEventListener) {
            window.removeEventListener('hashchange', forwardHash, false);
        }
        else if ('onhashchange' in window && document.documentMode > 7) {
            window.detachEvent('onhashchange', forwardHash);
        }
    }

    /**
     * 更新当前的hash值，同时在历史记录中添加该项
     * 
     * 如果hash值与当前的地址相同则不会进行更新
     * 
     * 注意该函数不会触发`redirect`事件，需要跳转请使用`forward`方法，
     * 直接使用`updateURL`修改地址**后果自负**
     *
     * @param {string} url 需要进行更新的hash值
     * @param {Object} options 配置项
     * @return {boolean} 如果地址有过变更则返回true
     */
    function updateURL(url, options) {
        var changed = currentLocation !== url;

        // 存储当前信息
        // 
        // Opera下，相同的hash重复写入会在历史堆栈中重复记录，
        // 需要再行与当前的hash比较
        if (changed && getLocation() !== url) {
            if (options.silent) {
                stop();
                location.hash = url;
                start(false);
            }
            else {
                location.hash = url;
            }
        }

        currentLocation = url;
        return changed;
    }

    /**
     * 开始`locator`对象的工作
     */
    locator.start = function () {
        start(true);
    };

    locator.stop = stop;

    /**
     * 根据输入的URL，进行处理后获取真实应该跳转的URL地址
     *
     * @param {string | URL} url 重定向的地址
     */
    locator.resolveURL = function (url) {
        // 当类型为URL时，使用`toString`可转为正常的url字符串
        url = url + '';
        // 如果直接获取`location.hash`，则会有开始处的**#**符号需要去除
        if (url.indexOf('#') === 0) {
            url = url.slice(1);
        }

        return url;
    };

    /**
     * 执行重定向逻辑
     *
     * @param {string | URL} url 重定向的地址
     * @param {Object=} options 额外附加的参数对象
     * @param {boolean=} options.force 确定当跳转地址不变时是否强制刷新
     */
    locator.redirect = function (url, options) {
        options = options || {};
        url = locator.resolveURL(url);

        var referrer = currentLocation;

        if (url === currentLocation) {
            return ;
        }

        var Deferred = require('./Deferred');

        var deferred = new Deferred();

        deferred.done(function(query) {
            var url = hash.createUrl(query);
            var isLocationChanged = updateURL(url, options);
            if (isLocationChanged || options.force) {
                if (!options.silent) {
                    /**
                     * URL跳转时触发
                     *
                     * @event redirect
                     * @param {Object} e 事件对象
                     * @param {string} e.url 当前的URL
                     */
                    locator.fire(
                        'redirect', 
                        { url: url, referrer: referrer }
                    );
                }
            }
        });

        locator._handleRedirectHooks(deferred, url);
    };

    /**
     * 向locator redirect添加hook
     *
     * @param {Function} hook
     */
    locator.addRedirectHook = function(hook) {
        if (typeof hook === 'function') {
            redirectHooks.push(hook);
        }
    };

    /**
     * 处理locator redirect hook
     *
     * @inner
     * @param {Object} deferred promise实例，用于回调执行redirect
     * @param {string} targetUrl redirect的目标url
     */
    locator._handleRedirectHooks = function(deferred, targetUrl) {
        var targetQuery = hash.parse(targetUrl || '');
        var currentQuery = hash.getQuery();
        var changedArr = util.diffObject(targetQuery, currentQuery);

        var changed = {};

        for (var i = 0; i < changedArr.length; i++) {
            var query = changedArr[i];
            changed[query] = targetQuery[query];
        }

        /**
         * 用于统计promise个数，在所有promise done的时候回调redirect
         *
         * @type {string}
         */
        var count = 0;

        for (var i = 0; i < redirectHooks.length; i++) {
            var hook = redirectHooks[i];
            
            if (typeof hook !== 'function') {
                continue;
            }

            var res = hook(targetQuery, currentQuery, changed);

            if (util.isObject(res) && typeof res.done === 'function') {
                count++;

                res.ensure(function(query) {
                    targetQuery = util.mix(targetQuery, query || {});

                    if (--count === 0) {
                        deferred.resolve(targetQuery);
                    }
                });
            }
            else if (util.isObject(res)) {
                targetQuery = util.mix(targetQuery, res);
            }
        }

        if (count === 0) {
            deferred.resolve(targetQuery);
        }
    };

    /**
     * 刷新当前地址
     */
    locator.reload = function () {
        if (currentLocation) {
            locator.redirect(currentLocation, { force: true });
        }
    };

    require('mini-event/EventTarget').enable(locator);
    return locator;
});
