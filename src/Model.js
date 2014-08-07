/**
 * @file Model类
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {
    var util = require('./util');
    var hash = require('./hash');
    var ajax = require('./ajax');
    var locator = require('./locator');
    var EventTarget = require('mini-event/EventTarget');

    /**
     * Model类声明
     * 通过Model类的extend方法可以派生出子类，在extend方法中可以通过传入参数
     * 为子类绑定方法和属性，如：
     * 
     * var ChildModel = Model.extend({
     * 
     *     url: '/foo/bar',    //用于refresh model的ajax地址
     * 
     *     defaults: {,    //model初始化时的默认数据
     *         foo: 1,
     *         bar: 2,
     *     },
     *
     *     params: {    //用于model refresh时ajax请求的额外参数
     *         time: '2014'
     *     }
     * });
     * 
     * extends mini-event.EventTarget
     * @constructor
     */
    function Model() {
        this._tpl = [];
        this._tplParamName = this.tplParamName || '_tpl';
        this._params = util.mix(
            {},
            this.params || {}
        );

        this._database = util.mix(
            {},
            this.defaults || {}
        );

        locator.on('redirect', util.bind(this.onRedirect, this));
    }

    /**
     * 向Model中添加数据
     *
     * @public
     * @param {string} key 向Model中添加的数据的key
     * @param {*} value 向Model中添加的数据value
     */
    Model.prototype.set = function(key, value) {
        this._database[key] = value;
    };

    /**
     * 从Model中获取数据
     *
     * @public
     * @param {string} key 从Model中获取的数据的key
     * @return {*} 取得的数据
     */
    Model.prototype.get = function(key) {
        return this._database[key];
    };

    /**
     * 更新Model，由具体业务实现
     *
     * @public
     */
    Model.prototype.update = util.noop;

    /**
     * 注册模板，其它模块可以使用该方法向Model注册模版
     *
     * @public
     * @param {(string | Array.<string> | Object)} tplConfig 模板配置
     */
    Model.prototype.registerTpl = function(tplConfig) {
        if (!tplConfig) {
            return ;
        }

        switch (Object.prototype.toString.call(tplConfig))
        {
            case '[object String]':
                tplConfig = [
                    {
                        tpl: tplConfig
                    }
                ];
                break;

            case '[object Object]':
                tplConfig = [ tplConfig ];
                break;

            case '[object Array]':
                break;
            
            default: 
                tplConfig = [];
                break;
        }

        var me = this;
        util.each(tplConfig, function(item, index) {
            me._tpl.push(item);
        });
    };

    /**
     * 生成模板请求参数
     * 用于queryString的模版参数
     *
     * @public
     */
    Model.prototype.getTplParam = function() {
        var tplParam = {};

        var arr = [];
        util.each(this._tpl, function(item, index) {
            arr.push(item._guid + '|' + item.tpl);
        });

        tplParam[this._tplParamName] = arr.join(',');

        return tplParam;
    };

    /**
     * locator redirect的时候触发
     *
     * @event
     * @param {Object} e 事件对象
     */
    Model.prototype.onRedirect = function(e) {
        var isJump = this.isJump(e);

        if (!isJump) {
            return ;
        }

        var params = this.getParams();

        var options = {
            url: this.url || '',
            method: this.method || 'GET',
            dataType: this.dataType || 'json',
            data: params
        };

        this._deferred = ajax.request(options);
        this._deferred.done(util.bind(this.done, this));
        this._deferred.fail(util.bind(this.fail, this));
        
    };

    /**
     * ajax更新数据完成后触发
     *
     * @public
     * @param {Object} data ajax返回的数据
     */
    Model.prototype.done = function(data) {
        if (data.status !== 0) {
            return ;
        }
        
        var data = data.data || {};

        util.mix(this._database, data);
        
        this.fire('change');
    };

    /**
     * ajax更新数据失败后触发
     *
     * @public
     */
    Model.prototype.fail = util.noop;

    /**
     * 生成model ajax更新时的请求params
     *
     * @public
     */
    Model.prototype.getParams = function() {
        return util.mix(
            {},
            this._params,
            this.getTplParam(),
            hash.getQuery()
        );
    };

    /**
     * 设置model ajax更新时的默认参数
     *
     * @public
     */
    Model.prototype.setParams = function(params) {
        util.mix(
            this._params,
            params || {}
        );
    };

    /**
     * 判断locator redirect时是否刷新model
     *
     * @public
     * @param {Object} e locator redirect时的事件对象
     * @return {boolean} true 则触发model刷新，false不触发
     */
    Model.prototype.isJump = function(e) {
        var query = hash.getQuery();
        var referrerQuery = hash.parse(e.referrer);

        var diff = util.diffObject(query, referrerQuery);

        if (this.include && this.include.length) {
            for (var i = 0; i < diff.length; i++) {
                if (util.inArray(this.include, diff[i]) >= 0) {
                    return true;
                }
            }
        }
        else if (this.exclude && this.exclude.length) {
            for (var i = 0; i < diff.length; i++) {
                if (util.inArray(this.exclude, diff[i]) < 0) {
                    return true;
                }
            }
        }
        else {
            return true;
        }

        return false;
    };

    util.inherits(Model, EventTarget);

    /**
     * 给Model添加extend方法
     */
    Model.extend = require('./extend');
    
    return Model;
});
