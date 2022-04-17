const nats = require("nats");
const webSocketServer = require("websocket").server;
const http = require("http");

const port = process.env.SERVER_PORT || 3000;

const envServers = process.env.NATS_SERVERS || ["nats://localhost:4222"];
const servers = envServers.split(",");
const nc = nats.connect({ encoding: "binary", preserveBuffers: true, servers });

const clients = [];

// Helpers
/*
All websocket connections are pushed in an Array as a client object including corresponding username 
and channel. This function returns the index of the client object to which the given connection belongs to 
*/
const getConnectionIdx = (connection) => {
  return clients.indexOf(
    clients.filter((conn) => conn.connection === connection)[0]
  );
};

/*
This function destroys the given Websocket connection
*/
const removeConnection = (connection) => {
  let connectionIdx = getConnectionIdx(connection);
  if (connectionIdx > -1) {
    clients.splice(connectionIdx, 1);
  } else throw "Connection not avilable";
};

/*
This function returns the corresponding username for a connection.
If the connection is not available, it returns false
*/
const getName = (connection) => {
  let connectionIdx = getConnectionIdx(connection);
  if (connectionIdx > -1) {
    return clients[connectionIdx].name;
  }
  return false;
};

/*
This function returns the corresponding channel for a connection.
If the connection is not available, it returns false
*/
const getChannel = (connection) => {
  let connectionIdx = getConnectionIdx(connection);
  if (connectionIdx > -1) {
    return clients[connectionIdx].channel;
  }
  return false;
};

/*
This function returns an array of username of the active users
*/
const getUserList = () => {
  let user = [];
  clients.forEach((client) => {
    user.push(client.name);
  });
  return user;
};

const server = http.createServer((_req, _res) => {});
server.listen(port, () => {
  console.log(`Server running on port ${port}... `);
});

// Websocket connection handler
const webSocket = new webSocketServer({ httpServer: server });
webSocket.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  clients.push({
    channel: null,
    name: null,
    connection: connection,
  });
  console.log("Websocket: connection accepted");

  connection.on("message", (rawMessage) => {
    if (rawMessage.type != "utf8") return;
    let msg;

    try {
      msg = JSON.parse(rawMessage.utf8Data);
      if (msg.type === "join") {
        Object.assign(clients[getConnectionIdx(connection)], {
          channel: msg.channel,
          name: msg.name,
        });

        /* 
        Subscription to common channel. All connections need to subscribe to 
        this channel for joining and leaving notifications. After consuming message
        the connection will send the message through websocket
        */
        nc.subscribe(`channel.${msg.channel}`, (msg) => {
          connection.send(msg.toString("utf-8"));
        });

        /* 
        Subscription to single channel. Each connection subscribes to a single channel based on their 
        corresponding usernames. Using wildcard subscriptions, as each consumer will listen for 
        messages sent for them regardless of the publisher
        */
        nc.subscribe(`channel.*.${getName(connection)}`, (msg) => {
          connection.send(msg.toString("utf-8"));
        });

        /*
        When connection is created, a event with message type "join" is emited and based on that, 
        a message is published on common channel for joining notification. List of active username is sent as 
        content of the message
        */
        let newMessage = JSON.parse(rawMessage.utf8Data);
        Object.assign(newMessage, {
          content: getUserList(),
        });
        nc.publish(`channel.${msg.channel}`, JSON.stringify(newMessage));
      } else if (msg.type === "message") {
        /*
      When a message is sent, an event with message type "message" is emitted and based on that, the message is 
      published on the single channel (sChannel). The single channel name is configured in such a way that
      only the intended consumer will consume the message
      */
        nc.publish(`channel.${msg.sChannel}`, JSON.stringify(msg));
      } else {
        /*
      if an event is receivrd without our mentioned message type, the message will be published to the common 
      channel. So, every consumer will receive the message
      */
        nc.publish(
          `channel.${msg.channel}`,
          Buffer.from(rawMessage.utf8Data, "utf-8")
        );
      }
      console.log("Receved: ", msg);
    } catch (error) {
      console.log("error: ", error);
    }
  });

  /*
  When the connection is closed, a message is published on the common channel for leaving notification.
  List of active username is sent as content of the message
  */
  connection.on("close", (con) => {
    let name = getName(connection);
    let channel = getChannel(connection);
    removeConnection(connection);
    console.log(`Websocket: disconnected`);
    try {
      let newMessage = {
        type: "close",
        name: name,
        channel: channel,
        sChannel: null,
        content: getUserList(),
      };
      nc.publish(`channel.${channel}`, JSON.stringify(newMessage));
    } catch (error) {
      console.log("error: ", error);
    }
  });
});
