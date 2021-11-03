const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, leaveUser, getRoomUser } = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {

    socket.on('joinRoom', ({username, room})=>{

        const user = userJoin(socket.id ,username, room, );

        socket.join(user.room);
        
        //for current user
        socket.emit('message', formatMessage('Admin' ,'welcome to the chat app'));
    
        //broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage('Admin' ,`${user.username} has joined the chat`));
        
         //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUser(user.room)
        });

    });

    //listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //runs when users disconnects
    socket.on('disconnect', ()=>{
        const user = leaveUser(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage('Admin' ,
            `${user.username} has left the chat`));

            //send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUser(user.room)
            });
        };
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=>{
    console.log(`server listening on port ${PORT}`);
});