const socketIo = require('socket.io');

const config = require('../config');
const chatRoom = require('../services/chat-room');
const { formatTimestamp } = require('../utils/time');

function attachSocketServer(server) {
  const io = socketIo(server, {
    cors: config.cors
  });

  io.on('connection', (socket) => {
    socket.on('add user', (username) => {
      const result = chatRoom.addUser(username, socket.id);
      if (!result.success) {
        socket.emit('Error msg', {
          type: result.reason
        });
        return;
      }

      socket.username = result.user.username;

      socket.emit('add user', {
        sessionid: socket.id,
        username: socket.username,
        users: result.users
      });

      io.emit('refresh list', {
        sessionid: socket.id,
        username: socket.username,
        users: result.users
      });
    });

    socket.on('public msg', (msg) => {
      if (!socket.username) {
        socket.emit('Error msg', { type: 'notAuthorized' });
        return;
      }

      io.emit('public msg', {
        userid: socket.id,
        username: socket.username,
        time: formatTimestamp(),
        publicmsg: msg
      });
    });

    socket.on('private msg', (sendTo, msg) => {
      if (!socket.username) {
        socket.emit('Error msg', { type: 'notAuthorized' });
        return;
      }

      const target = chatRoom.getUserByName(sendTo);
      if (!target) {
        socket.emit('Error msg', {
          type: 'userNotFound',
          username: sendTo
        });
        return;
      }

      const payload = {
        userid: socket.id,
        username: socket.username,
        time: formatTimestamp(),
        privatemsg: msg
      };

      io.to(target.sessionid).emit('private msg', payload);
      socket.emit('private msg', payload);
    });

    socket.on('disconnect', () => {
      const leftUser = chatRoom.removeUser(socket.id);
      if (!leftUser) {
        return;
      }

      io.emit('user left', {
        leftuser: leftUser.username,
        leftid: leftUser.sessionid,
        time: formatTimestamp(),
        users: chatRoom.listUsers()
      });
    });
  });

  return io;
}

module.exports = attachSocketServer;
