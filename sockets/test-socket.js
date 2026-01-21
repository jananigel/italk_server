const { io } = require("socket.io-client");
const config = require('../config');

const socket = io(`http://localhost:${config.port}`);

socket.on("connect", () => {
  console.log("Connected, socket id:", socket.id);

  socket.emit("hello", { msg: "from client" });
});

socket.on("reply", (data) => {
  console.log("Response:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});