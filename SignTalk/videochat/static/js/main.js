console.log("In main.js")


var mapPeers = {};



var labelusername = document.querySelector("#label-username")
var usernameInput = document.querySelector("#username")
var btnJoin = document.querySelector("#btn-join")
var photo = document.querySelector("#server-frame");

var username;

function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);
    // console.log(parsedData)
    var peerUsername = parsedData['peer']
    var action = parsedData['action']
    console.log(action)

    // Ignoring messages sent to you by you

    if( action == 'new-video' ){
        var serverframe = parsedData['message']['server_frame']
        console.log('serverframe',serverframe)
        photo.src = serverframe;
        return;
    }
    if(username === peerUsername){
        return
    }


    // When new peer joins the group

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];


    if(action == 'new-peer'){
        createOfferer(peerUsername,receiver_channel_name)
        console.log("New peer: I am here")
        return;
    }

    if(action == 'new-offer'){
        var offer = parsedData['message']['sdp'];

        createAnswerer(offer, peerUsername, receiver_channel_name)
        console.log("New Offer: I am here")
        return;
    }

    if(action == 'new-answer'){
        var answer = parsedData['message']['sdp'];

        var peer = mapPeers[peerUsername][0];

        peer.setRemoteDescription(answer);

        console.log("New Answer: I am here")

        return;
    }

    
}

// DEALING WITH THE WEBSOCKETS

var loc = window.location;
var wsStart = 'ws://';

if (loc.protocol == 'https'){
    wsStart = 'wss://'
}

var endpoint = wsStart+ loc.host + loc.pathname

console.log('Endpoint for websocket', endpoint)


var chatSocket;

btnJoin.addEventListener('click', ()=>{
    username = usernameInput.value
    console.log('Username:', username)
    if(username == ''){
        return;
    }

    usernameInput.value = ''
    usernameInput.disabled = true;
    usernameInput.style.visibility = 'hidden'

    btnJoin.disabled = true
    btnJoin.style.visibility = 'hidden'
    labelusername.innerHTML = username


    // Connecting to endpoint
    chatSocket = new WebSocket(endpoint);
    
    chatSocket.addEventListener('open',(e) =>{
        console.log("Connection Opened");
    
    
        sendSignal('new-peer',{})
        
        chatSocket.addEventListener('message',webSocketOnMessage)
        chatSocket.addEventListener('close',(e) =>{
            console.log("Connection closed")
        })
        chatSocket.addEventListener('error',(e)=>{
            console.log("Error Occured")
        })
        // var jsonMessage = JSON.stringify({
        //     'message': 'I have joined the group'
        // })
    
        // chatSocket.send(jsonMessage)
    })



})






var localStream = new MediaStream();

const constraints = {
    'video': true,
    'audio': true,
}

const localVideo = document.querySelector('#local-video')

const btnToggleAudio = document.querySelector('#btn-toggle-audio')
const btnToggleVideo = document.querySelector('#btn-toggle-video')

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        var audioTracks = stream.getAudioTracks();
        var videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;

        btnToggleAudio.addEventListener('click', ()=>{
            audioTracks[0].enabled = !audioTracks[0].enabled;

            if(audioTracks[0].enabled){
                btnToggleAudio.innerHTML = 'Audio Mute';
                return
            }

            btnToggleAudio.innerHTML = 'Audio Unmute';
            
        })


        btnToggleVideo.addEventListener('click', ()=>{
            videoTracks[0].enabled = !videoTracks[0].enabled;

            if(videoTracks[0].enabled){
                btnToggleVideo.innerHTML = 'Video Off';

                return;
            }

            btnToggleVideo.innerHTML = 'Video On';
            
        })
    })
    .catch(error =>{
        console.log("Error accessing media devices", error)
    })
   
    
    
    const FPS = 25;
    
    setInterval(() =>{
        var canvas = document.querySelector("#canvas")
        context = canvas.getContext('2d')
        width = 400;
        height = 300;
        context.drawImage(localVideo,0,0,width,height);
        var data = canvas.toDataURL('image/jpeg',0.5);
        // console.log('Frame:',data)
        console.log('Receiving frames')
        context.clearRect(0,0,width,height);
        // photo.src = data
        sendSignal("new-video",{
            'video-stream': data
        });
    }, 1000/FPS);

    
var btnSendMsg = document.querySelector('#btn-send-msg');

btnSendMsg.addEventListener('click', sendMsgOnClick);

var messageList = document.querySelector("#message-list")
var messageInput = document.querySelector('#msg')

function sendMsgOnClick(){
    var message = messageInput.value;

    var li = document.createElement('li')
    li.appendChild(document.createTextNode('Me:'+message));
    messageList.appendChild(li)

    var dataChannels = getDataChannels();

    message = username + ': '+ message;

    for (index in dataChannels){
        dataChannels[index].send(message);
    }

    messageInput.value = '';
}

// Doing real webrtc stuff


// Function to send signals. Message is a dictionary/javascript object
function sendSignal(action,message){

    var jsonStr = JSON.stringify({
        'peer': username,
        'action':action ,//type of action eg. new-peer, new-offer, new-answer
        'message': message 
    });
    
    if(chatSocket)
        chatSocket.send(jsonStr)
}


function createOfferer(peerUsername, receiver_channel_name){

    console.log("In createOfferer function")
    var peer = new RTCPeerConnection(null);

    // null because in this tutorial we want to only connect devices
    // in our local network.
    // If you want to connect to devices on the internet, you have to 
    // setup stun and turn servers and in that case you will supply a 
    // dictionary containing the turn and stun server credentials.

    // add our local audio and video tracks and add it to the peer 
    // connection so they can be streamed to the other peer
    addLocalTracks(peer)

    //Creating the datachannel to send the data

    var dc = peer.createDataChannel("channel");
    dc.addEventListener('open', ()=>{
        console.log('Channel Connection Opened!');
    })

    dc.addEventListener('message',dcOnMessage);

    var remoteVideo = createVideo(peerUsername);

    setOnTrack(peer, remoteVideo); 


    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener('iceconnectionstatechange', ()=>{
        var iceConnectionState = peer.iceConnectionState;

        if(iceConnectionState === 'failed'|| iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername]

            if(iceConnectionState != 'closed'){
                peer.close()

                removeVideo(remoteVideo)
            }
        }
    })

    peer.addEventListener('icecandidate', (event) =>{
        if(event.candidate){
            // console.log('New Ice candidate', JSON.stringify(peer.localDescription))
            return;
        }
        //Sending SDP to peer
        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        });
    }); 

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(()=>{
            console.log('Local Description set successfully')
        })
}



function createAnswerer(offer,peerUsername,receiver_channel_name){
    var peer = new RTCPeerConnection(null);

   
    addLocalTracks(peer)

    var remoteVideo = createVideo(peerUsername);

    setOnTrack(peer, remoteVideo); 


    peer.addEventListener('datachannel', e=>{
        peer.dc = e.channel; //Gives you the data channel created by the offerer
        peer.dc.addEventListener('open', ()=>{
            console.log('Channel Connection Opened!');
        })
    
        peer.dc.addEventListener('message',dcOnMessage);

        mapPeers[peerUsername] = [peer,peer.dc ]
    })


    peer.addEventListener('iceconnectionstatechange', ()=>{
        var iceConnectionState = peer.iceConnectionState;

        if(iceConnectionState === 'failed'|| iceConnectionState === 'disconnected' || iceConnectionState === 'closed'){
            delete mapPeers[peerUsername]

            if(iceConnectionState != 'closed'){
                peer.close()

                removeVideo(remoteVideo)
            }
        }
    })

    peer.addEventListener('icecandidate', (event) =>{
        if(event.candidate){
            // console.log('New Ice candidate', JSON.stringify(peer.localDescription))
            return;
        }
        //Sending SDP to peer
        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
        })
    })


    peer.setRemoteDescription(offer)
        .then(() =>{
            console.log("Remote Description Set Successfully for $s.", peerUsername)

            return peer.createAnswer();
                
        })
        .then(a =>{
            console.log("Answer created!")

            peer.setLocalDescription(a);
        })
}


function addLocalTracks(peer){
    console.log("In add Local tracks")
    localStream.getTracks().forEach(track =>{
        peer.addTrack(track,localStream);
    })

    return;
}

var messageList = document.querySelector("#message-list")
function dcOnMessage(event){
    var message = event.data

    var li = document.createElement('li')
    li.appendChild(document.createTextNode(message))
    messageList.appendChild(li)
}

//Adding video streams from other peers to your screen
function createVideo(peerUsername){
    var videoContainer = document.querySelector('#video-container');

    var remoteVideo = document.createElement('video')

    remoteVideo.id = peerUsername + '-video'

    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;

    var videowrapper = document.createElement('div')

    videoContainer.appendChild(videowrapper);
    videowrapper.appendChild(remoteVideo)
    return remoteVideo;

}

function setOnTrack(peer, remoteVideo){
    var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;
    peer.addEventListener('track', async (event) =>{
        remoteStream.addTrack(event.track, remoteStream)
    })
}



function removeVideo(video){
    var videoWrapper = video.parentNode;

    videoWrapper.parentNode.removeChild(videoWrapper) 
}


function getDataChannels(){
    var dataChannels = [];

    for (peerUsername in mapPeers){
        var dataChannel=mapPeers[peerUsername][1];

        dataChannels.push(dataChannel);
    }
    
    return dataChannels
}