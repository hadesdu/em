define(function(require) {
    var util = require('./util');
    var EventTarget = require('mini-event/EventTarget');
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;

    function View() {
        this._id = util.guid();

        this._initAjaxTpl();

        this._initModelEvents();

        this.el && this.setElement(this.el);
    }

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

    View.prototype._initModelEvents = function() {
        var tplConfig = this._tplConfig;

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

    View.prototype.setElement = function(el) {
        this.undelegateEvents();
        this._setElement(el);
        this.delegateEvents();

        return this;
    }

    View.prototype._setElement = function(el) {
        this.$el = el instanceof $ ? el : $(el);
        this.el = this.$el[0];
    };

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

    View.prototype.get = function(key) {
        for (var i = 0; i < this._models.length; i++) {
            var model = this._models[i];

            var data = model.get(key);

            if (data !== undefined) {
                return data;
            }
        }
    };

    View.prototype.getTpl = function(key) {
        var tplConfig = this._tplConfig;

        var key = key || '__default';

        return this.get(tplConfig[key]['_guid']);
    };

    View.prototype.getGuid = function() {
        this._id = this._id || util.guid();
        return this._id;
    };

    View.prototype.init = util.noop;

    util.inherits(View, EventTarget);

    View.extend = require('./extend');
    
    return View;
});
