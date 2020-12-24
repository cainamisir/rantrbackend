const express = require("express");
const socket = require("socket.io");

// App setup
const PORT = 5000;
const app = express();
const cors = require("cors");
app.use(cors());
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

// Static files
app.use(express.static("public"));

// Socket setup
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
var people = {};
var unmatched = null;

io.on("connection", function (socket) {
    let id = socket.id;
    console.log(unmatched);
    console.log(people);
    console.log("Made socket connection for id:" + id);
    people[id] = socket;
    socket.on("disconnect", () => {
        console.log("Client disconnected with id:" + id);

        socket.broadcast.emit("clientdisconnect", id);
        if (matchOf(socket)) matchOf(socket).emit("matchdisconnect", {});

        delete people[id];
        if (unmatched === id) unmatched = null;
    });

    join(socket);

    if (matchOf(socket)) {
        // If the user has someone to talk to, the chat can begin
        socket.emit("chat begin", {
            // Send the chat begin event to the user
        });

        matchOf(socket).emit("chat begin", {
            // Send the chat begin event to the other user
        });
    }
});
function join(socket) {
    people[socket.id] = {
        opponent: unmatched,
        socket: socket,
    };

    // If 'unmatched' is defined it contains the socket.id of the player who was waiting for a match
    // then, the current socket is user #2
    if (unmatched !== null) {
        people[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        //If 'unmatched' is not defined it means the user (current socket) is waiting for a match (player #1)
        unmatched = socket.id;
    }
}

function matchOf(socket) {
    if (!people[socket.id].opponent) {
        return;
    }
    if (people[people[socket.id].opponent] !== undefined)
        return people[people[socket.id].opponent].socket;
    else return;
}
