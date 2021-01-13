
const chat = (io) => {
    io.on("connection", (socket) => {
        const { username, room } = socket.handshake.query;

        // add socket to the room and send an alert
        socket.join(room);
        socket.to(room).emit("JoinAlert", {username});
        
        // save alert to message history
        const joinAlert = createMessage("JoinAlert", username, "User joined");
        saveToHistory(room, joinAlert);

        // give the client room data
        emitRoomData(room);

        // emit the history of the room once socket has joined
        emitHistory(room, socket.id);

        socket.on("sendMessage", (message_txt) => {
                const newMessage = createMessage("Message", username, message_txt);
                socket.to(room).emit("Message", newMessage);

                // save the message to the history of the room
                saveToHistory(room, newMessage);
        })

        socket.on("disconnect", () => {
            socket.to(room).emit("LeaveAlert", {username});
            // save alert to message history
            const leaveAlert = createMessage("LeaveAlert", username, "User left");
            saveToHistory(room, leaveAlert);
            emitRoomData(room);
            // remove username from room database
            redisClient.srem(`${room}_users`, username);
        })
    })

    function saveToHistory(room, message) {
        const room_history = `${room}_history`;
        redisClient.rpush(room_history, JSON.stringify(message), function(err, numMsgs) {
            if (numMsgs > process.env.NUM_MESSAGES_SAVED) {
                redisClient.lpop(room_history)
            }
        })
    }

    function emitHistory(room, socketID) {
        redisClient.lrange(`${room}_history`, 0, -1, function(err, history) {
            if (err) {
                io.to(socketID).emit("history", {history, error: true});;
            }
            // parse json
            parsedHistory = history.map((data) => JSON.parse(data))
            io.to(socketID).emit("history", {history: parsedHistory, error: false});
        })
    }

    function createMessage(type, username, text) {
        return {
            type,
            username,
            text,
            timeStamp: new Date().getTime()
        }
    }

    function emitRoomData(roomName) {
        if (!roomName) throw Error(`Invalid room name: ${roomName}`)
    
        const room = io.sockets.adapter.rooms.get(roomName);
        if (!room) return;
        
        var numUsers = room.size;
        if (numUsers === undefined) throw Error('numUsers not defined.');
        io.to(roomName).emit("roomData", {
            roomName,
            numUsers
        })
    }
};


module.exports = chat;