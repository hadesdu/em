define(function(require) {
    var util = require('./util');
    var hash = require('./hash');
    var ajax = require('./ajax');
    var locator = require('./locator');
    var EventTarget = require('mini-event/EventTarget');

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

    Model.prototype.set = function(key, value) {
        this._database[key] = value;
    };

    Model.prototype.get = function(key) {
        return this._database[key];
    };

    Model.prototype.update = function() {
    };

    Model.prototype.registerTpl = function(tplConfig) {
        if (!tplConfig) {
            return ;
        }

        switch (Object.prototype.toString.call(tplConfig))
        {
            case '[object String]':
                tplConfig = [{
                    tpl: tplConfig
                }];
                break;

            case '[object Object]':
                tplConfig = [tplConfig];
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
    }

    Model.prototype.getTplParam = function() {
        var tplParam = {};

        var arr = [];
        util.each(this._tpl, function(item, index) {
            arr.push(item._guid + '|' + item.tpl);
        });

        tplParam[this._tplParamName] = arr.join(',');

        return tplParam;
    };

    Model.prototype.onRedirect = function(e) {
        var isJump = this.isJump(e);
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

    Model.prototype.done = function(data) {
        if (data.status != 0) {
            return ;
        }
        
        var data = data.data || {};

        util.mix(this._database, data);
        
        this.fire('change');
    };

    Model.prototype.fail = util.noop;

    Model.prototype.getParams = function() {
        return util.mix(
            {},
            this._params,
            this.getTplParam(),
            hash.getQuery()
        );
    };

    Model.prototype.setParams = function(params) {
        util.mix(
            this._params,
            params || {}
        );
    };

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

    Model.extend = require('./extend');
    
    return Model;
});
