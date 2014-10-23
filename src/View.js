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
     * 通过View类的extend方法可以派生出子类，在extend方法中可以通过传入参数
     * 为子类绑定方法和属性，如：
     *
     * var ChildView = View.extend({
     *
     *     el: $('#main'),    //el为jquery对象，作为view的主元素，提供事件代理
     *
     *     components: [],
     *     
     *     ajaxTpl: {    //多个tpl可以传一个数组
     *         key: 'list',    //多个模板时用户前端获取模板，只有单个模版时可不填
     *         tpl: 'car/list'    //模板对应的smarty目录
     *     },
     *
     *     model: require('./childModel'),    //多个model可传入一个数组     
     *     
     *     events: {    //events为一个map，event handler自动绑定this指针为当前view
     *         'click .btn': function() {
     *              //do something
     *          }
     *     }, 
     *
     *     init: function() {},    //用于首屏加载时初始化页面逻辑
     *
     *     render: function() {},    //一般首屏和ajax都需要处理的逻辑写在这里
     *
     *     reload: function() {},    //model change会触发view reload回调
     *
     * });
     *
     * extends mini-event.EventTarget
     * @constructor
     */
    function View() {
        this._id = util.guid();

        this._initAjaxTpl();

        this._initModelEvents();

        this.el && this.setElement(this.el);

        this._initComponents();
    }

    /**
     * 处理模版配置，给模版生成guid，同时向model注册模板
     * view关联的smarty模板需要向model注册，这样model在refresh
     * 的时候会自动生成tpl参数向后端请求渲染后的模板
     *
     * @inner
     */
    View.prototype._initAjaxTpl = function() {
        var ajaxTpl = this.ajaxTpl || [];

        if (!util.isArray(ajaxTpl)) {
            ajaxTpl = [ ajaxTpl ];
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
            var modelArr = util.isArray(model) ? model : [ model ];

            util.each(modelArr, function(m) {
                m && m.registerTpl(config);
            });

            tplConfig[item.key || '__default'] = config;
        });

        this._tplConfig = tplConfig;
    };

    /**
     * 向model注册事件，在model抛出change事件的时候触发view reload
     * 同时model列表的顺序会发生变化，抛出change的model被提到最前
     *
     * @inner
     */
    View.prototype._initModelEvents = function() {
        if (!this.model) {
            return;
        }

        this._models = util.isArray(this.model)
            ? this.model.slice()
            : [ this.model ];

        var me = this;
        util.each(this._models, function(item) {
            item.on('change', function(e) {
                var index = util.inArray(me._models, item);
                me._models.splice(index, 1);
                me._models.unshift(item);

                me.reload.call(me, e);
                me._initComponents();
            });
        });
        
    };

    /**
     * 初始化view包含的控件
     */
    View.prototype._initComponents = function() {
        this.components = this.components || [];

        var me = this;
        util.each(this.components, function(item, index) {
            var control = item.control;

            if (!control) {
                return ;
            }

            if (control.setMain && item.selector) {
                var main = me.$el.find(item.selector);

                if (main.length) {
                    control.setMain(main);
                }
            }

            if (control && control.init) {
                control.init();
            }
        });
    };

    /**
     * 设置ajax模板
     *
     * @public
     * @param {(Array | Array<Object>)} 模板参数
     */
    View.prototype.setAjaxtpl = function(config) {
        this.ajaxTpl = config || [];
        this._initAjaxTpl();
    };

    /**
     * 设置view的最外层主元素，view的最外层元素用来提供事件代理
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
     * 将主元素置为jquery对象
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

    /**
     * 取消主元素上的代理事件，通常在reload的时候要先取消事件代理，
     * 重绘的时候再添加事件代理
     */
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
     * 用于业务层获取模板数据，传入ajaxTpl配置的key可获取模板数据
     * 当智配置一个模板时，此处可不传入参数
     * 
     * @public
     * @param {string} key 模板的key
     * @return {string} 模板的html片段
     */
    View.prototype.getTpl = function(key) {
        var tplConfig = this._tplConfig;

        var key = key || '__default';

        return this.get(tplConfig[key]._guid);
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

    /**
     * 给View添加extend方法
     */
    View.extend = require('./extend');
    
    return View;
});
