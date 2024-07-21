const maxCALLERS = 100
let pendingCalls = {}; // Track pending calls to avoid duplicate call attempts

function callEverybodyElse(roomName, otherPeople) {
    console.log('room name', roomName)
    console.log('other:',otherPeople)
    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    const list = [];
    let connectCount = 0;
    for (const easyrtcid in otherPeople) {
        list.push(easyrtcid)
    }

    function establishConnection(position) {
        if (pendingCalls[list[position]]) {
            return; // Skip if there's already a pending call to this user
        }

        pendingCalls[list[position]] = true;

        function callSuccess() {
            connectCount++;
            delete pendingCalls[list[position]]; // Remove from pending calls
            if (connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1)
            }
        }

        function callFailure(errorCode, errorText) {
            easyrtc.showError(errorCode, errorText);
            delete pendingCalls[list[position]]; // Remove from pending calls
            if (connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1)
            }
        }

        easyrtc.call(list[position], callSuccess, callFailure)
    }

    if (list.length > 0) {
        establishConnection(list.length - 1)
    }
}

async function my_init() 
{
    easyrtc.setRoomOccupantListener(null)
    const userDisplayName = sessionStorage.getItem('userDisplayName')
    const roomDisplayName = sessionStorage.getItem('roomDisplayName')
    document.title = roomDisplayName

    let myEasyrtcid = null

    const connectFailure = function(errmesg) {
        console.log(errmesg);
    }
    easyrtc.initMediaSource(
          function(){       // success callback
              const selfVideo = document.getElementById("self");
              easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
          },
          connectFailure
    )


    async function connectToEasyrtc() {
        return new Promise((resolve, reject) => {
            easyrtc.connect("VideoConferenceApp", (myId) => {
                myEasyrtcid = myId;
                resolve(); // Resolve the promise when the connection is successful
            }, (errmesg) => {
                console.log(errmesg);
                reject(errmesg); // Reject the promise on failure
            });
        });
    }

    const updateRoomParticipants = async (roomId) => {
            try {
                const response = await fetch('/update-room-participants', {
                    "method": 'POST',
                    "headers": {
                        "Content-type": 'application/json'
                    },
                    "body": JSON.stringify({roomId, myEasyrtcid, userDisplayName})
            })

            const result = await response.json();

            if(!result.success) {
                alert(result.message);
            }

        } catch (error) {
            console.error('Error: ', error)
        }
    }

    const roomDetails = {}
    try {
        const response = await fetch('/get-roomId', {
            "method": 'POST'
        })
        const { roomId } = await response.json()
        roomDetails['roomId'] = roomId

        await connectToEasyrtc()

        await updateRoomParticipants(roomId)

        await easyrtc.joinRoom(roomId, null, (roomName) => {
            easyrtc.setRoomOccupantListener((roomName, otherPeople) => callEverybodyElse(roomName, otherPeople))
        })

    } catch (error){
        console.error('Error: ', error)
    }

    try {
        const response = await fetch('/get-roomPass', {
            "method": 'POST'
        })
        const result = await response.json()

        if(result.success) {
            roomDetails['roomPass'] = result.roomPass
        }
    } catch(error) {
        console.error('Error: ', error)
    }

    if(roomDetails['roomPass']) { // Host
        id = document.createElement('p')
        id.textContent = 'Room ID: ' + roomDetails['roomId']
        pass = document.createElement('p')
        pass.textContent = 'Room Password: ' + roomDetails['roomPass']
        roomInfo = document.createElement('div')
        roomInfo.className = 'room-info'
        roomInfo.appendChild(id)
        roomInfo.appendChild(pass)
        document.body.appendChild(roomInfo)
    }
     
}

// Handle incoming streams
easyrtc.setStreamAcceptor(async (easyrtcid, stream) => {
    const fetchRoomId = async () => {
        const response = await fetch('/get-roomId', {
            "method": 'POST'
        })

        const { roomId } = await response.json()
        return roomId
    }

    const fetchUserDisplayName = async () => {
            try {
            const roomId = await fetchRoomId()

            const response = await fetch('/retrieve-room-participant-name', {
                "method": 'POST',
                "headers": {
                    "Content-type": 'application/json'
                },
                "body": JSON.stringify({roomId, easyrtcid})
            })

            const result = await response.json();

            if(result.success) {
                return result.userDisplayName
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('Error: ', error)
        }
    }

    
    const wrapper = document.createElement('div')
    wrapper.className = 'video-wrapper'
    const video = document.createElement('video')
    const nametag = document.createElement('div')
    nametag.className = 'nametag'
    nametag.textContent = await fetchUserDisplayName();
    wrapper.setAttribute("easyrtcid", easyrtcid)
    easyrtc.setVideoObjectSrc(video, stream)
    wrapper.appendChild(video)
    wrapper.appendChild(nametag)
    document.getElementById('videos').appendChild(wrapper)
})

// Handle disconnections
easyrtc.setOnStreamClosed((easyrtcid) => {
    const video = document.querySelector(`div[easyrtcid="${easyrtcid}"]`)
    if (video) {
        video.remove();
    }
});



