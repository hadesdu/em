define(function(require) {
    var util = require('./util');
    var Observable = require('./Observable');

    function View(opt) {
        Observable.apply(this, arguments);
        if (typeof opt.view === 'string') {
            this._container = util.getElement(opt.view);
        }
    }

    View.prototype.enterDocument = function() {
    };

    View.prototype.reload = function(html, data, target) {
        if (html !== undefined && html !== null) {
            this._container && (this._container.innerHTML = html);
        }
    };

    View.prototype.dispose = function() {};

    util.inherits(View, Observable);

    return View;
});
