define(function(require) {
    var ajax = require('./ajax');
    var util = require('./util');
    var View = require('./View');
    var Deferred = require('./Deferred');
    var Observable = require('./Observable');
    var _deferred;

    function Action(opt) {
        Observable.apply(this, arguments);

        this._options = opt || {};
        this._url = this._options.url || '',
        this._views = this._options.views || [];
        this._tplParamName = this._options.tplParamName || '_tpl';
        this._dataType = this._options.dataType || 'json';
        this._method = this._options.method || 'GET';
        this._params = {};

        util.each(this._views, function(item, index) {
            item.key = item.key || util.guid();
        });
    }

    util.inherits(Action, Observable);

    Action.prototype.initBehavior = function() {
        util.each(this._views, function(item, index) {

            item.instance.dispose();
            item.instance.reload(
                this._data[item.key],
                this._data,
                this._options.id
            );
        }, this);
    };

    Action.prototype.getTplParam = function() {
        var tplParam = {};

        var arr = [];
        util.each(this._views, function(item, index) {
            arr.push(item.key + '|' + item.tpl);
        });

        tplParam[this._tplParamName] = arr.join(',');

        return tplParam;
    };

    Action.prototype.reload = function() {
        var params = util.mix(
            {}, 
            this._params,
            this.getTplParam(),
            this.getQuery() || {}
        );

        var options = {
            url: this._url,
            method: this._method,
            dataType: this._dataType,
            data: params
        };

        _deferred = ajax.request(options);
        _deferred.done(util.bind(Action.prototype.done, this));
        _deferred.fail(util.bind(Action.prototype.fail, this));
    };

    Action.prototype.trigger = function(params) {
        var params = params || {};

        util.mix(this._params, params);
        this.reload();
    };

    Action.prototype.getInitData = function() {
        var deferred = new Deferred();

        if (!this._options.initData) {
            deferred.resolve({});
        }
        else {
            require([this._options.initData], function(data) {
                deferred.resolve(data);
            });
        }
        
        return deferred.promise;
    };

    Action.prototype.done = function(data) {
        this._data = data.data;

        this.initBehavior();
    };

    Action.prototype.fail = function(data) {
        console.log('fail');
    };

    Action.prototype.getQuery = function() {
    };

    return Action;
});
