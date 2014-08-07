/**
 * @file 通过extend继承父类生成子类且绑定子类属性
 * @author hades(denghongqi@baidu.com)
 */
define(function(require) {
    var util = require('./util');

    /**
     * 继承父类生成子类且给子类绑定属性和方法
     *
     * @param {Object} protoProps 需要绑定到子类prototype的属性和方法
     * @param {Object} staticProps 需要直接绑定到子类上的静态属性和方法
     * @return {Function} 子类的构造函数
     */
    function extend(protoProps, staticProps) {
        var self = this;
        var child;

        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        }
        else {
            child = function () { 
                return self.apply(this, arguments); 
            };
        }

        util.mix(child, self, staticProps);
        
        util.inherits(child, self);

        protoProps && util.mix(child.prototype, protoProps);
        child.__super__ = self.prototype;

        return child;
    }

    return extend;
});
