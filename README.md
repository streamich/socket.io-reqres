# Request/response for socket.io

Emulates request/response pattern in socket.io. You can also choose to make your Node.js app a client, and make browser a server.

On "client" side:

```js
var Client = require("socket.io-reqres").Client;
var client = new Client;

// Where `socket` is socket.io socket object.
client.setSocket(socket);

client.request("myMethod", "Hello", function(err, response) {
    console.log(err, response);
});
```

On "server" side:

```js

var Server = require("socket.io-reqres").Server;

var server = new Server();
server.use("myMethod", function(data, send) {
    send(data + " world");
});

// Where `socket` is socket.io socket object.
server.setSocket(socket);
```


## API

- `new Server(name)` - optional server name, defaults to `""`.
- `Server.setSocket(socket)` - set socket.io socket object.
- `Server.use(method, send)` - register RPC method.
- `new Client(name, timeout)` - optional server name, defaults to `""`. Optional timeout in ms.
- `Client.setSocket(socket)` - set socket.io socket object.
- `Client.request(method, data, callback)` - send request to the server.
