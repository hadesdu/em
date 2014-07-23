/**
 * @file 控制器实现
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {
    var util = require('./util');
    var Action = require('./Action');
    var View = require('./View');
    var locator = require('./locator');
    var hash = require('./hash');

    var _initQuery = {};
    var _defaultQuery = {};

    var _actionConfig = [];
    var _actionMap = {};

    function start() {
        initAction();
        
        locator.on('redirect', util.bind(onRedirect));
    }

    function registerAction(config) {
        var config = config || [];
        //todo 根据actionId做merge
        _actionConfig = _actionConfig.concat(config);
    }

    function get(id) {
        return _actionMap[id];
    }

    function setInitQuery(query) {
        _initQuery = query || {};
    }

    function setDefaultQuery(query) {
        _defaultQuery = query || {};
    }

    function initAction() {
        util.each(_actionConfig, function(item, index) {
            var action;
            item.id = item.id || util.guid();

            if (typeof item.action === 'function') {
                action = new item.action(item);
            }
            else {
                action = new Action(item);
            }

            action.config = item;

            _actionMap[item.id] = action;

            util.each(item.views || [], function(v, i) {
                if (typeof v.view === 'function') {
                    v.instance = new v.view(v);
                }
                else {
                    v.instance = new View(v);
                }

                v.instance.action = action;
                v.instance.enterDocument();

                action.getInitData().then(function(data) {
                    v.instance.reload(null, data, item.id);
                });
            });
        });
    }

    function onRedirect(e) {
        var query = util.mix(
            {},
            _initQuery,
            _defaultQuery,
            hash.getQuery()
        );

        var historyQuery = util.mix(
            {},
            _initQuery,
            _defaultQuery,
            hash.parse(e.referrer)
        );

        var diff = util.diffObject(query, historyQuery);

        for (var key in _actionMap) {
            var action = _actionMap[key];
            
            var args = action.config.args || {};

            if (args.exclude && args.exclude.length) {

                var obj;
                util.each(diff, function(item, index) {
                    if (util.inArray(args.exclude, item) >= 0) {
                        if (obj) {
                            obj[item] = query[item];
                        }
                        else {
                            obj = {};
                            obj[item] = query[item];
                        }
                    }
                });

                if (obj) {
                    action.trigger(util.mix(obj, _initQuery));
                }
            }
            else if (args.include) {
                
                var obj;
                util.each(args.include, function(item, index) {
                    if (util.inArray(args.include, item) >= 0) {
                        if (obj) {
                            obj[item] = query[item];
                        }
                        else {
                            obj = {};
                            obj[item] = query[item];
                        }
                    }
                });

                if (obj) {
                    action.trigger(util.mix(obj, _initQuery));
                }
            }
            else {
                action.trigger(query);
            }
        }
    }

    return {
        start: start,
        get: get,
        registerAction: registerAction,
        setInitQuery: setInitQuery,
        setDefaultQuery: setDefaultQuery
    };
});
