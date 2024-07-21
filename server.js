// Load required modules
const https = require('http')
const fs = require('fs')
const express = require('express')
const session = require('express-session')
const io = require('socket.io')
const easyrtc = require('open-easyrtc')
const bodyParser = require('body-parser')
const { v4:uuidv4 } = require('uuid')
const helmet = require('helmet')
require('dotenv').config();

// Setup and configure Express http server. Expect a subfolder called "public" to be the web root.
const app = express();
app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.json())

// Security Configurations
app.use(helmet())
// CSP policy
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        fontSrc: ["'self'"]
    }
}));
// HSTS policy
app.use(helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true, // Apply to all subdomains
    preload: true // Add to HSTS preload list
}));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xssFilter())
// Custom middleware to set the Permissions-Policy header
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
    next();
})
app.use(session({
    secret: process.env.SECRET_KEY, // Use a strong secret key
    resave: false,             // Do not save session if unmodified
    saveUninitialized: true,   // Save new sessions
    cookie: {
        secure: false,          // Use HTTPS to send cookies
        httpOnly: true,        // Prevent client-side JavaScript access
        sameSite: 'strict'     // CSRF protection
    }
}))



// Start Express https server on port 8443
// const options = {
//     key: fs.readFileSync('certs/server.key'),
//     cert: fs.readFileSync('certs/server.cert')
// };
const webServer = https.createServer(app).listen(8443);

// Start Socket.io so it attaches itself to Express server
const socketServer = io.listen(webServer);

// Start EasyRTC server and create EasyRTCApp
let VideoConferenceApp = null
easyrtc.listen(
    app,
    socketServer,
    {
        logLevel:"debug",
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
const rooms = {}

function generatePassword(length) {
    const upperCase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I and O
    const lowerCase = 'abcdefghijkmnpqrstuvwxyz'; // Exclude l
    const digits = '23456789'; // Exclude 0 and 1
    const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';

    const allChars = upperCase + lowerCase + digits + specialChars;
    let password = '';

    // Ensure the password has at least one character from each category
    password += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
    password += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
    password += digits.charAt(Math.floor(Math.random() * digits.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Generate the remaining characters randomly
    for (let i = password.length; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to ensure randomness
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
}

function sanitizeRoomName(name) {
    // Remove invalid characters and trim to allowed length
    return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
}
// Endpoints
app.post('/create-conference', (req, res) => {
    const { roomDisplayName } = req.body

    if (!roomDisplayName) {
        return res.json({ success: false, message: "Room Name is required!" });
    }

    const roomId = sanitizeRoomName(uuidv4())
    const roomPass = generatePassword(12)

    // Save the new conference details
    roomDetails = {
        "name": roomDisplayName,
        "pass": roomPass,
        "participants": {}
    }
    rooms[roomId] = roomDetails

    // Create a new easyrtc room in the app
    VideoConferenceApp.createRoom(roomId, null, ()=>{})
    req.session.user = {"roomId":roomId, "roomPass": roomPass}
    return res.json({success:true})
})

app.post('/join-conference', (req,res) => {
    const { roomId, roomPass } = req.body
    if (!roomId || !roomPass)
        return res.json({ success: false, message: "Room Id and pass are required!" });

    // Validate room details and get roomDisplayName
    if(!roomId in rooms)
        return res.json({ success: false, message: "Invalid room id" });
    if(rooms[roomId]['pass'] != roomPass)
        return res.json({ success: false, message: "Invalid room password" });

    const roomDisplayName = rooms[roomId]['name']

    req.session.user = {"roomId": roomId}

    return res.json({success:true, roomDisplayName, roomId})
})

app.post('/get-roomId', (req, res) => {
    if(req.session.user) {
        const roomId = req.session.user.roomId
        return res.json({success:true, roomId})
    }
    return res.json({success:false})
})

app.post('/get-roomPass', (req, res) => {
    if(req.session.user && req.session.user.roomPass) {
        const roomPass = req.session.user.roomPass
        return res.json({success:true, roomPass})
    }
    return res.json({success:false})
})

app.post('/update-room-participants', (req, res) => {
    const { roomId, myEasyrtcid, userDisplayName } = req.body

    rooms[roomId]['participants'][myEasyrtcid] = userDisplayName
    return res.json({success:true})
})

app.post('/retrieve-room-participant-name', (req, res) => {
    const { roomId, easyrtcid } = req.body

    const userDisplayName = rooms[roomId]['participants'][easyrtcid]

    return res.json({success:true, userDisplayName})
})