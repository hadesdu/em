define(function(require) {
    var util = require('./util');

    function extend(protoProps, staticProps) {
        var parent = this;
        var child;

        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        }
        else {
            child = function(){ 
                return parent.apply(this, arguments); 
            };
        }

        util.mix(child, parent, staticProps);
        
        util.inherits(child, parent);

        protoProps && util.mix(child.prototype, protoProps);
        child.__super__ = parent.prototype;

        return child;
    }

    return extend;
});
