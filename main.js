// let APP_ID = "838d80f6aeb842de9a0be0e4bb918825";

// let token = null;
// let UID = String(Math.floor(Math.random() * 100000));

// let localeStream; // its for our locale video and mic feed
// let remoteStream; // its for the remote video and mic feed
// let peerConnection; // establishes the p2p connection between the 2 users

// const servers = {
//     iceServers:[
//         {
//             url:[
//                 "stun1.l.google.com:19302",
//                 "stun2.l.google.com:19302",
//             ]
//         }
//     ]
// }; // different stun servers

// let init = async () => {
//     client = await AgoraRTM.createInstance(APP_ID);
//     await client.login({UID, token});

//     channel = await client.createChannel('main');
//     await channel.join();

//     channel.on('MemberJoined', handleUserJoined);

//     localeStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true}); // getting the permission for user-1 media devices
//     document.getElementById('user-1').srcObject = localeStream; // setting up media devices of user-1 in video frame-1

//     createOffer();
// };

// let handleUserJoined = async (MemberID) => {
//     console.log("A new user has joined the Channel: ", MemberID);
// };

// let createOffer = async () => { // this function is responsible for getting user-2 media devices and also to make an offer to user-2 via user-1 and send an answer back to user-1 for the requested offer

//     peerConnection = new RTCPeerConnection(); // storing the RTCPeerConnection object in the variable

//     remoteStream = new MediaStream(); // getting the media devices of user-2
//     document.getElementById('user-2').srcObject = remoteStream; // setting up media devices of user-2 in video frame-2

//     localeStream.getTracks().forEach( (tracks) => {
//         peerConnection.addTrack(tracks, localeStream);
//     });

//     peerConnection.ontrack = (event) => {
//         event.streams[0].getTracks().forEach( (tracks) => {
//             remoteStream.addTrack(tracks);  
//         });
//     };

//     peerConnection.onicecandidate = async (event) => {
//         if(event.candidate){
//             console.log('New ICE candidate: ', event.candidate);
//         }
//     };

//     let offer = await peerConnection.createOffer(); // creating an offer for user-2
//     await peerConnection.setLocalDescription(offer); // setting up the SDP of user-1 for the requested offer

//     console.log('Offer :', offer);
// };

// init(); // this function gets called everytime the page is refreshed and it is responsible for taking the permission of user-1 media devices

let peerConnection = new RTCPeerConnection()
let localStream;
let remoteStream;

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
    remoteStream = new MediaStream()
    document.getElementById('user-1').srcObject = localStream
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
        });
    };
}

let createOffer = async () => {


    peerConnection.onicecandidate = async (event) => {
        //Event that fires off when a new offer ICE candidate is created
        if(event.candidate){
            document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

let createAnswer = async () => {

    let offer = JSON.parse(document.getElementById('offer-sdp').value)

    peerConnection.onicecandidate = async (event) => {
        //Event that fires off when a new answer ICE candidate is created
        if(event.candidate){
            console.log('Adding answer candidate...:', event.candidate)
            document.getElementById('answer-sdp').value = JSON.stringify(peerConnection.localDescription)
        }
    };

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer); 
}

let addAnswer = async () => {
    console.log('Add answer triggerd')
    let answer = JSON.parse(document.getElementById('answer-sdp').value)
    console.log('answer:', answer)
    if (!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer);
    }
}
init()

document.getElementById('create-offer').addEventListener('click', createOffer)
document.getElementById('create-answer').addEventListener('click', createAnswer)
document.getElementById('add-answer').addEventListener('click', addAnswer)