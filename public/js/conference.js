let easyrtcid = ""

function my_init() 
{
    //easyrtc.setRoomOccupantListener( loggedInListener);
    const connectSuccess = function(myId) {
        easyrtcid = myId
        console.log("My easyrtcid is " + myId);
    }
    const connectFailure = function(errmesg) {
        console.log(errmesg);
    }
    easyrtc.initMediaSource(
          function(){       // success callback
              const selfVideo = document.getElementById("self");
              easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
              easyrtc.connect("VideoConferenceApp", connectSuccess, connectFailure);
          },
          connectFailure
    );
    const urlParams = new URLSearchParams(window.location.search);
    //const roomDisplayName = urlParams.get('roomDisplayName')
    //document.title = roomDisplayName
    const roomId = urlParams.get('roomId');
    const roomPass = urlParams.get('roomPass') 
    easyrtc.joinRoom(roomId)  
}

// Handle incoming streams
easyrtc.setStreamAcceptor((easyrtcid, stream) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    document.getElementById('videos').appendChild(video);
});

// Handle new connections
easyrtc.setOnStreamClosed((easyrtcid) => {
    const video = document.querySelector(`video[data-easyrtcid="${easyrtcid}"]`);
    if (video) {
        video.remove();
    }
});



