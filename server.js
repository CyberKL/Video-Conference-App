// Load required modules
const http = require('http')
const express = require('express')
const io = require('socket.io')
const easyrtc = require('open-easyrtc')

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
const httpApp = express();
httpApp.use(express.static(__dirname + "/public/"));

// Start Express http server on port 8080
const webServer = http.createServer(httpApp).listen(8080);

// Start Socket.io so it attaches itself to Express server
const socketServer = io.listen(webServer);

// Start EasyRTC server
easyrtc.listen(httpApp, socketServer)