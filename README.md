# Chat Socket API

## Connection
To connect to chat websocket, provide valid query and authorization parameters as shown below.

```tsx
interface Auth {
  token: string
}

interface Query {
  username: string,
  room: string
}

export interface Connection {
  auth: Auth
  query: Query
}

export const connect = (socketEndpoint: string, connection: Connection) => {
    const socket = require('socket.io-client')(socketEndpoint, connection);
}
```

## Room history
When a user successfully connects to a websocket, an event will be emitted to the user giving them the recent history of the room they joined.

```tsx
interface HistoryElement {
  username: string,
  text: string,
  timeStamp: number,
  type: "Message" | "LeaveAlert" | "JoinAlert"
}

export interface HistoryData {
  history: Array<IHistoryElement>
}

socket.on("history", (data: HistoryData) => {
    // handle the history
})
```

## Room data
When a user successfully connects to or disconnects from the websocket, a roomData event is emitted to other users connected to the same room.

```tsx
export interface RoomData {
  room: string,
  numUsers: number,
}

socket.on("roomData", (data: RoomData) => {
    // handle the room data
})
```

## Join/Leave Alerts
When a user successfully connects to or disconnects from the websocket, a JoinAlert event or LeaveAlert is emitted to other users connected to the same room. This alert contains the username joining or leaving.

```tsx
export interface JoinLeaveAlertData {
  username: string
}

// when a different user joins the room
socket.on("JoinAlert", (data: JoinLeaveAlertData) => {
    // handle the join event
})

// when a different user joins the room
socket.on("LeaveAlert", (data: JoinLeaveAlertData) => {
    // handle the leave event
})
```

## Sending a message
To send a message to the room, emit a sendMessage event and pass the string representation of the message, as shown below.

```tsx
export const sendMessage = (message: string) => {
    socket.emit('sendMessage', message);
}
```

## Receiving a message
When a user in the room sends a message, a Message event will be emitted to all other users. They can receive messages by listening for a Message event as shown below.

```tsx
export interface ChatData {
  username: string,
  text: string,
  timestamp: number
}

socket.on("Message", (data: ChatData) => {
    // handle receiving a message
})
```
