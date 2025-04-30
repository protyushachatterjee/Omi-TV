const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const indexRouter = require('./routes/index');
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = socketIO(server);

let waitingUsers = [];
let rooms = {};


io.on("connection", (socket) => {
    socket.on("joinroom", function () {
        if (waitingUsers.length > 0) {
            let partner = waitingUsers.shift();
            let roomName = `${socket.id}-${partner.id}`;

            socket.join(roomName);
            partner.join(roomName);

            io.to(roomName).emit("joined", roomName)
        } else {
            waitingUsers.push(socket);
        }
    })

    socket.on("message", function (data) {
        socket.broadcast.to(data.room).emit("message", data.message);
    })

    socket.on("signalingMessage", function (data) {
        socket.broadcast.to(data.room).emit("signalingMessage", data.message);
    })

    socket.on("startVideoCall", function ({ room }) {
        socket.broadcast.to(room).emit("incomingCall");
    })


    socket.on("acceptCall", function(data){
        socket.broadcast.to(data.room).emit("callAccepted");
    })

    socket.on("rejectCall", function(data){
        socket.broadcast.to(data.room).emit("callRejected");
    })


    socket.on("disconnect", function () {
        let index = waitingUsers.findIndex(waitingUser => waitingUser.id === socket.id);  //this will give the index of the user in the waitingUsers array
        waitingUsers.splice(index, 1);
        // console.log("disconnected")
    })


})

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


app.use('/', indexRouter);


server.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on ${port}`);
});