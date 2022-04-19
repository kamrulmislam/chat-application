# chat-application
A Chat Application where multiple clients can chat.

In this application, each client is a chat participant and they communicate with each other through a messaging server(NTAs). Each client is a node.js application. We can make as many client as we want using docker. 

Each client opens a web service through which we can see a list of active user. Instead of a group chat or peer-to-peer chat, it's a round-robin kind of chat. When one client sends a message, one of the other clients will get that message. But, when one client replies to a message, only the sender will get the reply. 

# Change Note


In this branch, client side codebase is converted into typeScript. I have also changed the web server to run the client side. In master branch, client side was run by a nginx server in container port 80. In this branch, client side will be run as node js server in container port 4000 (which can also be modified by user changing the CLIENT_PORT environment variable).

The functionality of the index.ts is similar to the index.js file of master branch. An additional script (app.ts) is added to run the server.


# How To Run


To run the chat application run the following command -

    docker-compose up

It will start the NATs messaging server, backend server and three clients at port 3001, 3002 and 3003.


Then, you can access the clients by url,

http://localhost:3001 ,
http://localhost:3002 ,
http://localhost:3003

You can add more client by editing the docker-compose.yml file or using the follwing command -


    docker run --name [container name] -p [host port]:[host port] -e CLIENT_PORT=[host port] -e WEBSOCKET_URL=ws://127.0.0.1:3000 client
    
For Example,

    docker run --name client-4 -p 3004:4000 -e CLIENT_PORT=4000 -e WEBSOCKET_URL=ws://127.0.0.1:3000 client

creates a new client with container name "client-4" and it can be accessed by url http://localhost:3004
