/**
 * @file View类
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {
    var util = require('./util');
    var EventTarget = require('mini-event/EventTarget');

    /**
     * 用于匹配事件代理元素的正则表达式
     *
     * @type {RegExp}
     */
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;

    /**
     * View类声明
     *
     * extends mini-event.EventTarget
     * @constructor
     */
    function View() {
        this._id = util.guid();

        this._initAjaxTpl();

        this._initModelEvents();

        this.el && this.setElement(this.el);
    }

    /**
     * 处理模版配置，给模版生成guid，同时向model注册模版
     *
     * @inner
     */
    View.prototype._initAjaxTpl = function() {
        var ajaxTpl = this.ajaxTpl || [];

        if (!util.isArray(ajaxTpl)) {
            ajaxTpl = [ajaxTpl];
        }

        var tplConfig = {};

        var me = this;
        util.each(ajaxTpl, function(item, index) {

            var config = util.mix(
                {
                    _guid: util.guid()
                },
                item
            );
            
            var model = config.model || me.model;
            var modelArr = util.isArray(model) ? model : [model];

            util.each(modelArr, function(m) {
                m && m.registerTpl(config);
            });

            tplConfig[item.key || '__default'] = config;
        });

        this._tplConfig = tplConfig;
    };

    /**
     * 向model注册事件，在model抛出change事件的时候出发view reload
     *
     * @inner
     */
    View.prototype._initModelEvents = function() {
        this._models = util.isArray(this.model)
            ? this.model.slice()
            : [this.model];

        var me = this;
        util.each(this._models, function(item) {
            item.on('change', function() {
                var index = util.inArray(me._models, item);
                me._models.splice(index, 1);
                me._models.unshift(item);

                me.reload();
            });
        });
        
    };

    /**
     * 设置view的最外层主元素
     *
     * @public
     * @param {(HTMLElement | Object)} el dom节点或者jquery对象
     */
    View.prototype.setElement = function(el) {
        this.undelegateEvents();
        this._setElement(el);
        this.delegateEvents();

        return this;
    };

    /**
     * 将主元素置位jquery对象
     *
     * @inner
     * @param {(HTMLElement | Object)} el dom节点或者jquery对象
     */
    View.prototype._setElement = function(el) {
        this.$el = el instanceof $ ? el : $(el);
        this.el = this.$el[0];
    };

    /**
     * 根据events列表代理冒泡到主元素的事件并绑定this为view
     *
     * @public
     * @param {Object} events key为'a click'类似的选择器+事件类型
     *                        value为事件处理函数
     */
    View.prototype.delegateEvents = function(events) {
        if (!this.$el) {
            return this;
        }

        var events = events || this.events;

        if (!events) {
            return this;
        }

        this.undelegateEvents();

        for (var key in events) {
            var method = events[key];
            if (!util.isFunction(method)) {
                method = this[events[key]];
            }

            if (!method) {
                continue;
            }

            var match = key.match(delegateEventSplitter);
            this.delegate(match[1], match[2], util.bind(method, this));
        }
    };

    /**
     * 绑定代理事件到主元素
     *
     * @public
     * @param {string} eventName 事件名称，如click
     * @param {string} selector jquery选择器
     * @param {Function} listener 事件处理函数
     */
    View.prototype.delegate = function(eventName, selector, listener) {
        this.$el.on(
            eventName + '.delegateEvents' + this._id, 
            selector, 
            listener
        );
    };

    View.prototype.undelegateEvents = function() {
        if (this.$el) {
            this.$el.off('.delegateEvents' + this._id);
        }

        return this;
    };

    /**
     * 业务层可通过该接口获取model中的数据，实现方式是遍历models
     * 返回第一个不为undefined的值，models顺序在change时被提前
     *
     * @public
     * @param {string} key 要获取的数据的key
     * @return {*} 
     */
    View.prototype.get = function(key) {
        for (var i = 0; i < this._models.length; i++) {
            var model = this._models[i];

            var data = model.get(key);

            if (data !== undefined) {
                return data;
            }
        }
    };

    /**
     * 用于业务层获取模板数据
     * 
     * @public
     * @param {string} key 模板的key
     * @return {string} 模板的html片段
     */
    View.prototype.getTpl = function(key) {
        var tplConfig = this._tplConfig;

        var key = key || '__default';

        return this.get(tplConfig[key]['_guid']);
    };

    /**
     * 生成view的guid
     *
     * @public
     * @return {string} guid
     */
    View.prototype.getGuid = function() {
        this._id = this._id || util.guid();
        return this._id;
    };

    /**
     * 初始化view的时候执行，业务层处理
     *
     * @public
     */
    View.prototype.init = util.noop;

    util.inherits(View, EventTarget);

    View.extend = require('./extend');
    
    return View;
});
