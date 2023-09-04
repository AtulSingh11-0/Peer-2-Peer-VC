let APP_ID = "838d80f6aeb842de9a0be0e4bb918825";

let token = null;
let uid = String(Math.floor(Math.random() * 100000));

let client;
let channel;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if(!roomId) {
    window.location = 'lobby.html';
}

let localeStream; // its for our locale video and mic feed
let remoteStream; // its for the remote video and mic feed
let peerConnection; // establishes the p2p connection between the 2 users

const servers = {
    iceServers:[
        {
            urls:[
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ]
        }
    ]
}; // different stun servers

let constraints = {
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }, 
    audio:true
};

let init = async () => {

    try {
        // Initialize AgoraRTC
        rtc = new AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    
        // Join the channel
        await rtc.init(APP_ID);
        await rtc.join(APP_ID, channelName, null, uid => {
          // Create a local video and audio stream
          localStream = AgoraRTC.createStream({
            streamID: uid,
            audio: true,
            video: true,
          });
    
          // Initialize the local stream
          localStream.init(() => {
            // Play the local video and audio stream
            localStream.play("user-1");
    
            // Publish the local stream to the channel
            rtc.publish(localStream);
    
            // Set up event listeners
            rtc.on("user-published", handleUserPublished);
          });
        });
      } catch (error) {
        console.error("Error initializing AgoraRTC: ", error);
      }

    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid, token});

    channel = client.createChannel(roomId);
    await channel.join();

    channel.on('MemberJoined', handleUserJoined);
    channel.on('MemberLeft', handleUserLeft);

    client.on('MessageFromPeer', handleMessageFromPeer);

    localeStream = await navigator.mediaDevices.getUserMedia(constraints); // getting the permission for user-1 media devices
    document.getElementById('user-1').srcObject = localeStream; // setting up media devices of user-1 in video frame-1

};

function handleUserPublished(user, mediaType) {
    const remoteVideoContainer = document.getElementById("user-2");
  
    if (mediaType === "video") {
      // Create a video element for the remote stream
      const remoteVideoElement = document.createElement("video");
      remoteVideoElement.autoplay = true;
      remoteVideoElement.id = "remote-video";
      remoteVideoContainer.appendChild(remoteVideoElement);
  
      // Subscribe to the remote video stream
      rtc.subscribe(user, remoteVideoElement);
  
      // Store the remote stream for cleanup later
      remoteStream = user.videoTrack;
    }
}

let handleUserLeft = (MemberID) => {
    document.getElementById('user-2').style.display = 'none';
    document.getElementById('user-1').classList.remove('smallFrame');
};

let handleMessageFromPeer = async (message, MemberID) => {

    message = JSON.parse(message.text);
    
    if(message.type === 'offer') {
        createAnswer(MemberID, message.offer);
    }

    if(message.type === 'answer') {
        addAnswer(message.answer);
    }

    if(message.type === 'candidate') {
        if(peerConnection) {
            peerConnection.addIceCandidate(message.candidate);
        }
    }
};

let handleUserJoined = async (MemberID) => {
    console.log('A new user has joined: ', MemberID);
    createOffer(MemberID);
};

let createPeerConnection = async (MemberID) => {
    peerConnection = new RTCPeerConnection(servers); // storing the RTCPeerConnection object in the variable

    remoteStream = new MediaStream(); // getting the media devices of user-2
    document.getElementById('user-2').srcObject = remoteStream; // setting up media devices of user-2 in video frame-2
    document.getElementById('user-2').style.display = 'block';
    document.getElementById('user-1').classList.add('smallFrame');

    if(!localeStream) {
        localeStream = await navigator.mediaDevices.getUserMedia(constraints); 
        document.getElementById('user-1').srcObject = localeStream; 
    }

    localeStream.getTracks().forEach( (tracks) => {
        peerConnection.addTrack(tracks, localeStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach( (tracks) => {
            remoteStream.addTrack(tracks);  
        });
    };

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberID);
        }
    };
};

let createOffer = async (MemberID) => { 

    await createPeerConnection(MemberID);

    let offer = await peerConnection.createOffer(); // creating an offer for user-2
    await peerConnection.setLocalDescription(offer); // setting up the SDP of user-1 for the requested offer

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberID);
};

let createAnswer = async (MemberID, offer) => {
    await createPeerConnection(MemberID);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberID);
};

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
};

let leaveChannel = async () => {
    await channel.leave();
    await client.logout();
};

let toggleCamera = async () => {
    let videoTrack = localeStream.getTracks().find(track => track.kind === 'video');

    if(videoTrack.enabled) {
        videoTrack.enabled = false;
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(255, 80, 80, 1)';
    } else {
        videoTrack.enabled = true;
        document.getElementById('camera-btn').style.backgroundColor = 'rgba(35, 144, 255, 0.9)';
    }
};

let toggleMic = async () => {
    let audioTrack = localeStream.getTracks().find(track => track.kind === 'audio');

    if(audioTrack.enabled) {
        audioTrack.enabled = false;
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(255, 80, 80, 1)';
    } else {
        audioTrack.enabled = true;
        document.getElementById('mic-btn').style.backgroundColor = 'rgba(35, 144, 255, 0.9)';
    }
};

window.addEventListener('beforeunload', leaveChannel);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);

init(); // this function gets called everytime the page is refreshed and it is responsible for taking the permission of user-1 media devices