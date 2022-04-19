type Info = {
  name: string,
  sChannel: string | null,
  firstMsg: boolean,
  user: string[],
};

declare var MozWebSocket: {
  prototype: WebSocket;
  new(url: string): WebSocket;
  new(url: string, prototcol: string): WebSocket;
  new(url: string, prototcol: string[]): WebSocket;
  OPEN: number;
  CLOSING: number;
  CONNECTING: number;
  CLOSED: number;
}

// Interface elements
const msgList = document.getElementById("messages-list")!;
const activeUsersList = document.getElementById("active-users-list")!;
const sendInput = document.getElementById("send-input")! as HTMLInputElement;
const sendButton = document.getElementById("send-btn")!;
const channelNameonScreen = document.getElementById("channel-name")!;
const currentUserName = document.getElementById("current-user-name")!;

// Channel name is set to 1. It can be set to anything you want (starting with "#")
const channelName = "#1";
channelNameonScreen.innerText = channelName;
let isWsOpen = false;

/* 
A username is taken from the user which is used to recognize the user.
It is also shown in the webpage. Empty value of username will create an alert and
the websocket will be closed
*/
let userName = window.prompt("Enter a username for chat", "yourname");
if (userName) {
  currentUserName.innerText = userName;
  var info: Info = {
    name: userName,
    sChannel: null,
    firstMsg: true,
    user: [],
  };
  
} else {
  alert("No username provided. Please try again.");
}

// Websocket initialization
window.WebSocket = window.WebSocket || window.MozWebSocket;
const connection = new WebSocket("__WEBSOCKET_URL__");
connection.binaryType = "blob";

// Helper functions
/*
This function takes an Array and an element and returns a new Array 
excluding the element
*/
const getFilteredList = (currentList: string[], element: string) => {
  return currentList.filter((item: string) => item !== element);
};

/*
This function creates a random single channel to send the the first message arbitarily.
It returns a String
*/
const getRandomsChannel = () => {
  return `${info.name}.${info.user[Math.floor(Math.random() * info.user.length)]}`;
};

/*
This function shows a notification when someone joins the channel. It also shows
the active user list
*/
const joiningNotification = (name: string, userList: string[]) => {
  var str = "Active Users - ";
  userList.forEach((user) => {
    str += `\n${user}`;
  });
  activeUsersList.innerText = `${name} joined the channel!!!\n\n${str}`;
};

/*
This function shows a notification when someone leaves the channel. It also shows
the active user list
*/
const leavingNotification = (name: string, userList: string[]) => {
  var str = "Active Users - ";
  userList.forEach((user) => {
    str += `\n${user}`;
  });
  activeUsersList.innerText = `${name} left the channel!!!\n\n${str}`;
};

// This function shows the incoming messages
const showMessage = (name: string, msg: string) => {
  const div = document.createElement("div");
  div.innerText = `${name}: ${msg}`;
  msgList.appendChild(div);
};

/*
This function emits event to the Websocket. The event names are set as messsage type
*/
const sendToWS = (type: string, sChannel: string | null, content: string) => {
  if (!isWsOpen) return;
  connection.send(
    JSON.stringify({
      type,
      name: info.name,
      channel: channelName.replace(/^#/, ""),
      sChannel,
      content,
    })
  );
};

/*
This function takes the message content from the message box which will then be emited
as an evernt for the Websocket. It checks and configures the single channel and 
delivers it as sChannel. In case of first message or the disconnection of an user from
the single channel, it collects a random single channel and sets it as sChannel 
*/
sendButton.addEventListener("click", () => {
  if (!isWsOpen) {
    console.error("websocket is closed");
    return;
  }
  const msg = sendInput.value;
  if (msg.length > 0) {
    if (info.sChannel === null) {
      sendToWS("message", getRandomsChannel(), msg);
    } else {
      let sChannelBreakdown = info.sChannel.split(".");
      if (info.user.includes(sChannelBreakdown[0])) {
        let sChannelName = `${sChannelBreakdown[1]}.${sChannelBreakdown[0]}`;
        sendToWS("message", sChannelName, msg);
      } else {
        sendToWS("message", getRandomsChannel(), msg);
      }
    }
    showMessage(info.name, msg);
    //console.log("Message sent: ", msg);
  }
});

sendInput.addEventListener("keyup", (e) => {
  if (e.keyCode == 13) {
    sendButton.click();
    sendInput.value = "";
  }
});

connection.onopen = () => {
  //console.log("connection opened");
  if (info) {
    isWsOpen = true;
    sendToWS("join", null, "HELLO!");
  } else connection.close();
};

/*
This function checks the incoming message type and sends it to the proper
message handlers.
*/
connection.onmessage = (msg) => {
  const data = JSON.parse(msg.data);
  //console.log("Message Received: ", data);
  switch (data.type) {
    case "join":
      Object.assign(info, {
        user: getFilteredList(data.content, info.name),
      });
      joiningNotification(data.name, getFilteredList(data.content, info.name));
      break;
    case "close":
      Object.assign(info, {
        user: getFilteredList(data.content, info.name),
      });
      leavingNotification(data.name, getFilteredList(data.content, info.name));
      break;
    case "message":
      Object.assign(info, {
        sChannel: data.sChannel,
      });
      showMessage(data.name, data.content);
      break;
    default:
    // ignore message
  }
};

connection.onerror = (error) => {
  console.error("error:", error);
  isWsOpen = false;
};
