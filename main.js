let localeStream; // its for our locale video and mic feed
let remoteStream; // its for the remote video and mic feed
let peerConnection;

let init = async () => {
    localeStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    document.getElementById('user-1').srcObject = localeStream;

    createOffer();
};

let createOffer = async () => {
    peerConnection = new RTCPeerConnection();

    remoteStream = new MediaStream();
    document.getElementById('user-2').srcObject = remoteStream;

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log('Offer :', offer);
};

init();