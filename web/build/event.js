//Ref : http://jsfiddle.net/JxYca/3/
var EventManager = function() {
    this.initialize();
};
EventManager.prototype = {
    initialize: function() {
        //declare listeners as an object
        this.listeners = {};
    },
    // public methods
    addListener: function(event, fn) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        if (fn instanceof Function) {
            this.listeners[event].push(fn);
        }
        return this;
    },
    dispatchEvent: function(event, params) {
        // loop through listeners array
        for (var index = 0, l = this.listeners[event].length; index < l; index++) {
            // execute matching 'event' - loop through all indices and
            // when ev is found, execute
            this.listeners[event][index].call(window, params);
        }
    },
    removeListener: function(event, fn) {
        // split array 1 item after our listener
        // shorten to remove it
        // join the two arrays back together
        if (this.listeners[event]) {
            for (var i = 0, l = this.listners[event].length; i < l; i++) {
                if (this.listners[event][i] === fn) {
                    this.listners[event].slice(i, 1);
                    break;
                }
            }
        }
    }
};

module.exports = EventManager;