// Load required modules
const http = require('http')
const express = require('express')
const io = require('socket.io')
const easyrtc = require('open-easyrtc')
const bodyParser = require('body-parser')

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
const app = express();
app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.json())

// Start Express http server on port 8080
const webServer = http.createServer(app).listen(8080);

// Start Socket.io so it attaches itself to Express server
const socketServer = io.listen(webServer);

// Start EasyRTC server
let VideoConferenceApp = null
easyrtc.listen(
    app,
    socketServer,
    {
        logLevel:"debug", 
        logDateEnable:true,
        appAutoCreateEnable:false,
        demosEnable:false
    },
    function(err, rtc) {
        rtc.createApp(
            "VideoConferenceApp",
            null,
            function (err, app) {
                VideoConferenceApp = app
            }
        )
    }
)

// Create room
const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
};

const generateRoomPass = () => {
    return Math.random().toString(36).substr(2, 9);
};

app.post('/create-conference', (req, res) => {
    const { roomDisplayName } = req.body

    if (!roomDisplayName) {
        return res.json({ success: false, message: "Room Name is required!" });
    }

    const roomId = generateRoomId()
    const roomPass = generateRoomPass()

    // Save the new conference details to a database or in-memory storage if needed
    roomDetails = {
        "id": roomId,
        "name": roomDisplayName,
        "pass": roomPass
    }

    // Create a new easyrtc room in the app
    VideoConferenceApp.createRoom(roomId, null, ()=>{})
    return res.json({success:true, roomDisplayName, roomId, roomPass})
})

app.post('/join-conference', (req,res) => {
    const { roomId, roomPass } = req.body
    if (!roomId || !roomPass) {
        return res.json({ success: false, message: "Room Id and pass are required!" });
    }

    // Validate room details and get roomDisplayName

    return res.json({success:true, roomId, roomPass})
})

// app.get('/conference', (req, res) => {
//     if (!req.session.roomId || !req.session.roomPass) {
//         return res.redirect('/'); // Redirect to home page if session data is missing
//     }

//     res.sendFile(__dirname + '/public/conference.html');
// });