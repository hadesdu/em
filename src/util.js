/**
 * @file util工具对象
 * @author hades(denghongqi@baidu.com)
 */

define(function () {

    /**
     * 当前的时间戳
     *
     * @type {number}
     */
    var now = +new Date();

    /**
     * 工具模块，放一些杂七杂八的东西
     */
    var util = {};

    /**
     * 方法静态化
     *
     * 反绑定、延迟绑定
     * @inner
     * @param {Function} method 待静态化的方法
     *
     * @return {Function} 静态化包装后方法
     */
    function generic(method) {
        return function () {
            return Function.call.apply(method, arguments);
        };
    }

    /**
     * 功能降级处理
     *
     * @inner
     * @param {boolean} condition feature 可用的测试条件
     * @param {Function} implement feature 不可用时的降级实现
     * @param {Function} feature 可用的特性方法
     *
     * @return {Function} 静态化后的 feature 或 对应的降级实现函数
     */
    function fallback(condition, implement, feature) {
        return condition ? generic(feature || condition) : implement;
    }

    /**
     * 遍历数组方法
     *
     * 现代浏览器中数组 forEach 方法静态化别名
     * @method module:lib.each
     * @param {Array} obj 待遍历的数组或类数组
     * @param {Function} iterator 迭代方法
     * @param {Object=} bind 迭代方法中绑定的 this
     */
    util.each = fallback(
        Array.prototype.forEach,
        function (obj, iterator, bind) {
            for (var i = 0, l = (obj.length >>> 0); i < l; i++) {
                if (i in obj) {
                    iterator.call(bind, obj[i], i, obj);
                }
            }
        }
    );

    /**
     * 获取一个唯一的ID
     *
     * @return {number} 一个唯一的ID
     */
    util.guid = function () {
        return 'em' + now++;
    };

    /**
     * 混合多个对象
     *
     * @param {Object} source 源对象
     * @param {...Object} destinations 用于混合的对象
     * @return {Object} 返回混合了`destintions`属性的`source`对象
     */
    util.mix = function (source) {
        for (var i = 1; i < arguments.length; i++) {
            var destination = arguments[i];

            // 就怕有人传**null**之类的进来
            if (!destination) {
                continue;
            }

            // 这里如果`destination`是字符串的话，会遍历出下标索引来，
            // 认为这是调用者希望的效果，所以不作处理
            for (var key in destination) {
                if (destination.hasOwnProperty(key)) {
                    source[key] = destination[key];
                }
            }
        }
        return source;
    };

    // `bind`的实现特别使用引擎原生的，
    // 因为自己实现的`bind`很会影响调试时的单步调试，
    // 跳进一个函数的时候还要经过这个`bind`几步很烦，原生的就不会
    var nativeBind = Function.prototype.bind;
    /**
     * 固定函数的`this`变量和若干参数
     *
     * @param {function} fn 操作的目标函数
     * @param {*} context 函数的`this`变量
     * @param {...*} args 固定的参数
     * @return {function} 固定了`this`变量和若干参数后的新函数对象
     */
    util.bind = nativeBind
        ? function (fn) {
            return nativeBind.apply(fn, [].slice.call(arguments, 1));
        }
        : function (fn, context) {
            var extraArgs = [].slice.call(arguments, 2);
            return function () {
                var args = extraArgs.concat([].slice.call(arguments));
                return fn.apply(context, args);
            };
        };

    /**
     * 空函数
     *
     * @type {Function}
     * @const
     */
    util.noop = function () {};

    var dontEnumBug = !(({toString: 1}).propertyIsEnumerable('toString'));

    /**
     * 设置继承关系
     *
     * @param {Function} type 子类
     * @param {Function} superType 父类
     * @return {Function} 子类
     */
    util.inherits = function (type, superType) {
        var Empty = function () {};
        Empty.prototype = superType.prototype;
        var proto = new Empty();

        var originalPrototype = type.prototype;
        type.prototype = proto;

        for (var key in originalPrototype) {
            if (originalPrototype.hasOwnProperty(key)) {
                proto[key] = originalPrototype[key];
            }
        }
        if (dontEnumBug) {
            // 其实还有好多其它的，但应该不会撞上吧(╯‵□′)╯︵┻━┻
            if (originalPrototype.hasOwnProperty('toString')) {
                proto.toString = originalPrototype.toString;
            }
            if (originalPrototype.hasOwnProperty('valueOf')) {
                proto.valueOf = originalPrototype.valueOf;
            }
        }
        type.prototype.constructor = type;

        return type;
    };

    /**
     * 将一段文本变为JSON对象
     *
     * @param {string} text 文本内容
     * @return {*} 对应的JSON对象
     */
    util.parseJSON = function (text) {
        if (!text) {
            return undefined;
        }

        if (window.JSON && typeof JSON.parse === 'function') {
            return JSON.parse(text);
        }
        /*eslint-disable no-irregular-whitespace*/
        /*eslint-disable no-eval*/
        return eval('(' + text + ')');
        /*eslint-enable no-eval*/
        /*eslint-enable no-irregular-whitespace*/
    };

    /**
     * 用于判断空白字符的正则表达式
     *
     * @type {RegExp}
     */
    var whitespace = /(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g;

    /**
     * 移除字符串前后空格字符
     *
     * @param {string} source 源字符串
     * @return {string} 移除前后空格后的字符串
     */
    util.trim = function (source) {
        return source.replace(whitespace, '');
    };

    /**
     * 对字符中进行HTML编码
     *
     * @param {string} source 源字符串
     * @return {string}
     */
    util.encodeHTML = function (source) {
        source = source + '';
        return source
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * 兼容性获取一个元素
     *
     * @param {HTMLElement|string} element 元素或元素的id
     * @return {HTMLElement}
     */
    util.getElement = function (element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        return element;
    };

    /**
     * diff两个Object，返回value不同的key列表
     *
     * @param {Object} obj1 要diff的对象之一
     * @param {Object} obj2 要diff的对象之一
     * @return {Array} value不同的key列表
     */
    util.diffObject = function(obj1, obj2) {
        obj1 = obj1 || {};
        obj2 = obj2 || {};
        var obj = {};

        var key;

        for (key in obj1) {
            if (obj1.hasOwnProperty(key)) {
                if (obj1[key] !== obj2[key]) {
                    obj[key] = 1;
                }
            }
        }

        for (key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                if (obj1[key] !== obj2[key]) {
                    obj[key] = 1;
                }
            }
        }

        var res = [];
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                res.push(key);
            }
        }

        return res;
    };

    /**
     * 判断item是否在arr中
     *
     * @param {Array} arr 要判断的arr
     * @param {*} item 要判断的item
     * @return {number}
     */
    util.inArray = function(arr, item) {
        arr = arr || [];

        if (arr.indexOf) {
            return arr.indexOf(item);
        }

        for (var i = 0; i < arr.length; i++) {
            if (item === arr[i]) {
                return i;
            }
        }

        return -1;
    };

    /**
     * 判断参数类型是否为Array
     *
     * @param {*} arr 要判断的arr
     * @return {boolean} 参数为Array类型则返回true，否则为false
     */
    util.isArray = function(arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    };

    /**
     * 判断参数类型是否为Function
     *
     * @param {*} func 要判断类型的变量
     * @return {boolean} 参数为Function类型则返回true，否则为false
     */
    util.isFunction = function(func) {
        return Object.prototype.toString.call(func) === '[object Function]';
    };

    /**
     * 判断参数类型是否为Object
     *
     * @param {*} obj 要判断类型的变量
     * @return {boolean} 参数为Object类型则返回true，否则为false
     */
    util.isObject = function(obj) {
        if (obj && Object.prototype.toString.call(obj) === '[object Object]') {
            return true;
        }

        return false;
    };

    /**
     * 给DOM元素添加指定类型的事件
     *
     * @param {HTMLElement} element DOM节点
     * @param {string} type 事件类型
     * @param {Function} listener 事件处理函数
     */
    util.on = function (element, type, listener) {
        if (element.addEventListener) {
            element.addEventListener(type, listener, false);
        }
        else if (element.attachEvent) {
            element.attachEvent('on' + type, listener);
        }
    };

    /**
     * 给DOM元素移除指定类型的事件
     *
     * @param {HTMLElement} element DOM节点
     * @param {string} type 事件类型
     * @param {Function} listener 事件处理函数
     */
    util.un = function (element, type, listener) {
        if (element.addEventListener) {
            element.removeEventListener(type, listener, false);
        }
        else if (element.attachEvent) {
            element.detachEvent('on' + type, listener);
        }
    };

    /**
     * 获取Object上自身所有的key
     *
     * @param {Object} obj 参数obj
     * @return {Array} 参数上自身所有的key
     */
    util.keys = function(obj) {
        var keys = [];
        obj = obj || {};

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

    return util;
});
