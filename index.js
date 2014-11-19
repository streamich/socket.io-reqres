/**
 * Request-response pattern emulation using socket.io.
 *
 * Sends frame in the format:
 * {
 *  i: 1,   // Frame ID.
 *  m: "",  // Method name.
 *  e: {},  // Error.
 *  b: {}   // Body.
 * }
 */

function Server(prefix) {

    // Registered server procedures.
    this.methods = {};

    // Prefix before request/response events.
    if(!prefix) { prefix = ""; }
    this.prefix = prefix;
    this.responseEvent = prefix + "response";
}

Server.prototype = {

    setSocket: function(socket) {
        socket.on(this.prefix + "request", this.process.bind(this));
        this.socket = socket;
        return this;
    },

    use: function(method, callback) {
        this.methods[method] = callback;
        return this;
    },

    send: function(frame) {
        this.socket.emit(this.responseEvent, frame);
    },

    process: function(frame) {
        if((typeof frame == "object") && (typeof frame.i != "undefined")) {
            if(typeof frame.m == "string") {
                var method = frame.m;
                if(this.methods[method]) {
                    var self = this;
                    this.methods[method](frame.b, function(response) {
                        self.send({
                            i: frame.i,
                            b: response
                        });
                    }, frame);
                } else {
                    this.send({
                        i: frame.i,
                        e: "no_method"
                    });
                }
            } else {
                this.send({
                    i: frame.i,
                    e: "no_method"
                });
            }
        }
    }

};

function Client(prefix, timeout) {
    if(!prefix) { prefix = ""; }
    this.prefix = prefix;
    this.requestEvent = prefix + "request";

    this.timeout = timeout ? timeout : 1000 * 5;
}

Client.prototype = {

    id: 0,

    cbs: {},    // Callbacks.

    timeouts: {},

    setSocket: function(socket) {
        this.socket = socket;
        socket.on(this.prefix + "response", this.response.bind(this));
        return this;
    },

    request: function(method, body, meta, callback) {
        if(typeof meta == "function") {
            callback = meta;
            meta = {};
        }
        if(!meta) { meta = {}; }

        var frame = typeof meta == "object" ? meta : {};
        frame.i = this.id;
        frame.m = method;
        frame.b = body;

        if(callback) {
            var self = this;
            this.cbs[this.id] = callback;
            this.timeouts[this.id] = setTimeout((function(id) {
                return function() { self.error(id); };
            })(this.id), this.timeout);
        }

        this.socket.emit(this.requestEvent, frame);

        this.id++;
        this.id %= 1000;
    },

    response: function(frame) {
        if((typeof frame == "object") && (typeof frame.i != "undefined")) {
            var id = frame.i;
            if(this.cbs[id]) {
                if(frame.e) { // Error.
                    this.cbs[id](frame.e);
                } else {
                    this.cbs[id](null, frame.b);
                }
                this.clear(id);
            }
        }
    },

    clear: function(id) {
        if(this.cbs[id]) { delete this.cbs[id]; }
        if(this.timeouts[id]) {
            clearTimeout(this.timeouts[id]);
            delete this.timeout[id];
        }
    },

    error: function(id) {
        if(this.cbs[id]) {
            this.cbs[id]("timeout");
            this.clear(id);
        }
    }

};

module.exports = {
    Server: Server,
    Client: Client
};