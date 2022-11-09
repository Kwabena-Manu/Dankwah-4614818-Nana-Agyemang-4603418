// ================================================================================================

console.log("In main.js")

var mapPeers = {};

var myUsername = null;
var targetUsername = null;      // To store username of other peer
var peerChannel = null;      // To store username of other peer
var myPeerConnection = null;    // RTCPeerConnection
var transceiver = null;         // RTCRtpTransceiver
var webcamStream = null;        // MediaStream from webcam
var meetingState = "not-connected"



var labelusername = document.querySelector("#room-name")
var meetingIDInput = document.querySelector("#meetingID")
var doctorid = document.querySelector("#doctorid")
var btnJoin = document.querySelector("#btn-join")
var photo = document.querySelector("#server-frame");
var recordButton = document.querySelector("#record-message")
var messageBox  = document.querySelector("#typemsg")
var audioRecordStatus = false
var messageBuffer;
var call_states = ['no-call','calling','call-established']
var local_call_state = call_states[0]
var username;



// =================== Speech to text ==========
// Detect Chrome
let chromeAgent = navigator.userAgent.indexOf("Chrome") > -1;
    if(chromeAgent == true)
    {
    const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
    const SpeechRecognitionEvent = window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recordButton.addEventListener('click', ()=>{
        if(audioRecordStatus === false){
            message_buffer = ""
            recognition.start();
            audioRecordStatus=true
            messageBuffer = ""
        }
        else{
            recognition.stop();
           
            audioRecordStatus=false
        }
        
        
        
        recognition.addEventListener('start', (event)=>{
            console.log('Voice recognition started');
        })
        recognition.addEventListener('end',(event)=>{
            console.log('Voice recognition ended');
            if(audioRecordStatus === true){
                recognition.start()
            }
            else{
                console.log("I am here")
                messageBox.value = message_buffer
            }
        })
        recognition.onresult = (event) => {
            messageBox.value = event.results[0][0].transcript;
            messageBox.scrollLeft = messageBox.scrollWidth;
            console.log(`Confidence: ${event.results[0][0].confidence}`);
            message_buffer = message_buffer +messageBox.value+ "."
            console.log(message_buffer)
            
        }
        
        recognition.onspeechend = () => {
            // console.log(messageBox.value.slice(-1))
            // if(messageBox.value.slice(-1) == "."){
            // }
            // else{
            //     messageBox.value += "."
            // }
            
          }
    
          recognition.onerror = (event) => {
            console.log(`Error occurred in recognition: ${event.error}`);
          }
    })  
}

// ================chat 1==========================
// function sendbtn() {
	
// 	var printtext = document.getElementById('chatmsg');
// 	var copytext = document.getElementById('typemsg');
// 	var currentdate = new Date();

// 	var copiedtext = copytext.value;

// 	var printnow = '<div class="flex justify-end pt-2 pl-10">'+'<span class="bg-green-900 h-auto text-gray-200 text-xs font-normal rounded-sm px-1 items-end flex justify-end overflow-hidden " style="font-size: 10px;">'+copiedtext+'<span class="text-gray-400 pl-1" style="font-size: 8px;">'+currentdate.getHours()+':'+currentdate.getMinutes()+'</span>'+'</span>'+'</div>';

// 	printtext.insertAdjacentHTML('beforeend', printnow);

// 	var box = document.getElementById('journal-scroll');
// 	box.scrollTop = box.scrollHeight;

// }


// ===================Chat 2=================
const el = document.getElementById('messages')
	el.scrollTop = el.scrollHeight


    function sendbtn(event) {
        // var printtext = document.getElementById('chatmsg');
        var copytext = document.getElementById('typemsg');
        var currentdate = new Date();
    
        var copiedtext = copytext.value;
        if(copiedtext.trim() != ''){

            var printnow = `<div class="chat-message break-words">
            <div class="flex items-end justify-end">
            <div class="flex flex-col space-y-2 text-sm font-semibold max-w-xs mx-2 order-1 items-end">
            <div class="messageDiv"><span class="px-4 py-2 messageSpan rounded-lg break-words inline-block bg-blue-600 text-white ">${copiedtext}<span class="text-white-400 pl-1" style="font-size: 12px;"> <p class="text-right font-semibold">${currentdate.getHours()}:${currentdate.getMinutes()}</p></span></span></div>
            
            </div>
            <div class="overflow-hidden relative w-5 h-5 bg-white-100 order-2 rounded-full border border-gray-300 dark:bg-gray-600">
            <svg class="absolute -left-[0.09em]  w-5 h-5  text-gray-400" fill="currentColor" viewBox="0 0 20 20"
               xmlns="http://www.w3.org/2000/svg">
               <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"></path>
            </svg>
         </div>            </div>
            </div>`;
            
            el.insertAdjacentHTML('beforeend', printnow);
            el.scrollTop = el.scrollHeight
            copytext.value = ''


            // Sending it to the other peers
            var dataChannels = getDataChannels();


            for (index in dataChannels) {
                dataChannels[index].send(copiedtext);
            }


            // Sending message to server
            console.log("Meeting-State: ", meetingState)
            if(meetingState == 'connected'){
                sendToServer({
                  'name': myUsername,
                  'target': targetUsername,
                  'targetChannel': peerChannel,
                  'type': 'doctor-message',
                  'message': copiedtext
                })
              
            }
            
        }
    }
    

//====================WebRTC=================


// function webSocketOnMessage(event) {
//     var parsedData = JSON.parse(event.data);
//     console.log(parsedData)
//     var peerUsername = parsedData['peer']
//     var action = parsedData['action']
//     console.log(action)

//     if (action == 'new-meeting'){
//         var meetinguid = parsedData['message']['uid'] 
//         meetingProcedures(meetinguid)
//         return;
//     }
//     if (action == 'new-video') {
//         var serverframe = parsedData['message']['server_frame']
//         // console.log('serverframe', serverframe)
//         // photo.src = serverframe;
//         showPatientVideo(serverframe);

//         return;
//     }
//     // Ignoring messages sent to you by you
//     if (username === peerUsername) {
//         return
//     }


//     // When new peer joins the group

//     var receiver_channel_name = parsedData['message']['receiver_channel_name'];


//     if (action == 'new-peer') {
//         createOfferer(peerUsername, receiver_channel_name)
//         console.log("New peer: I am here")
//         return;
//     }

//     if (action == 'new-offer') {
//         var offer = parsedData['message']['sdp'];
    
//         createAnswerer(offer, peerUsername, receiver_channel_name)
//         console.log("New Offer: I am here")
//         return;
//     }

//     if (action == 'new-answer') {
//         var answer = parsedData['message']['sdp'];

//         var peer = mapPeers[peerUsername][0];

//         peer.setRemoteDescription(answer);

//         console.log("New Answer: I am here")
//         document.querySelector("#patientName").innerHTML = peerUsername
//         return;
//     }


// }

// DEALING WITH THE WEBSOCKETS

var loc = window.location;
var wsStart = 'ws://';

if (loc.protocol == 'https') {
    wsStart = 'wss://'
}

var endpoint = wsStart + loc.host + loc.pathname

console.log('Endpoint for websocket', endpoint)


var chatSocket;

btnJoin.addEventListener('click', (event) =>{
    event.preventDefault()
    switch(meetingState){
      case "not-connected":
            connect()
            btnJoin.classList.remove('bg-gray-100','hover:bg-blue-800', 'focus:ring-4', 'focus:outline-none', 'focus:ring-blue-300')
            btnJoin.innerHTML= `<svg role="status" class="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
            </svg>
            Waiting...`

            btnJoin.classList.add('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4')
            meetingState = "connecting"
            break;
      case "connected":
            btnJoin.classList.add('bg-gray-100','hover:bg-blue-800', 'focus:ring-4', 'focus:outline-none', 'focus:ring-blue-300')
            btnJoin.classList.remove('bg-red-700','hover:bg-red-800','focus:outline-none','text-white')
            btnJoin.classList.remove('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4')
            btnJoin.innerHTML = "Start Meeting"
            hangUpCall()
            meetingIDInput.value = ''
            meetingState = "not-connected"
            break;
      case "connecting":
            btnJoin.classList.add('bg-gray-100','hover:bg-blue-800', 'focus:ring-4', 'focus:outline-none', 'focus:ring-blue-300')
            btnJoin.classList.remove('bg-red-700','hover:bg-red-800','focus:outline-none','text-white')
            btnJoin.classList.remove('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4')
            btnJoin.innerHTML = "Start Meeting"
            // hangUpCall()
            meetingIDInput.value = ''
            meetingState = "not-connected"
            break;
      



      
    }

})
// btnJoin.addEventListener('click', (event) => {
//     event.preventDefault()
    
       
    
    
//         // Connecting to endpoint
//         chatSocket = new WebSocket(endpoint);
    
//         chatSocket.addEventListener('open', (e) => {
//             console.log("Connection Opened");
    
//             doctoremail = btnJoin.dataset.email
//             username = doctoremail
//             console.log('doctors email:', doctoremail)
//             sendSignal('new-meeting', {'email':doctoremail})
    
//             chatSocket.addEventListener('message', webSocketOnMessage)
//             chatSocket.addEventListener('close', (e) => {
//                 console.log("Connection closed")
//             })
//             chatSocket.addEventListener('error', (e) => {
//                 console.log("Error Occured")
//             })
//             // var jsonMessage = JSON.stringify({
//             //     'message': 'I have joined the group'
//             // })
    
//             // chatSocket.send(jsonMessage)
//         })
    



// })




const mediaConstraints = {
    audio: false, // We want an audio track
    video: true // And we want a video track
};


var localStream = new MediaStream();

const constraints = {
    'video': true,
    'audio': false,
}

const localVideo = document.querySelector('#local-video')

// const btnToggleAudio = document.querySelector('#mic-btn')
// const btnToggleVideo = document.querySelector('#camera-btn')

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;

        // var lvideotag = document.createElement('video')
        // lvideotag.autoplay = true
        // lvideotag.playsInline = true
        // lvideotag.id = "local-video"
        // lvideotag.style.width = 'auto'
        // lvideotag.style.minWidth = '100%'
        // lvideotag.style.height = 'auto'
        // lvideotag.style.height = '100%'


        // var video_container = document.createElement('div')
        // var all_content = document.createElement('div')
        // var video_player = document.createElement('div')
        // var username_wrapper = document.createElement('div')
        // video_container.className = 'video-container'
        // video_container.id = 'user-container-local'

        // video_player.className = 'video-player'
        // video_player.id = 'user-local'
        


        // video_player.appendChild(lvideotag)
        // video_container.appendChild(video_player)
        // username_wrapper.className="username-wrapper"
        // username_wrapper.innerHTML= `<span class="user-name">Local</span>`;

        // video_container.appendChild(username_wrapper);
        // all_content.appendChild(video_container)
        // // let player = `<div  class="video-container" id="user-container-">
        // //              <div class="video-player" id="user">
                        
        // //              </div>
        // //              <div class="username-wrapper"><span class="user-name"></span></div>
        // //           </div>`

        // document.getElementById('video-streams').insertAdjacentHTML('beforeend', all_content.innerHTML)

        aftervideotag = document.querySelector("#local-video")
        aftervideotag.srcObject = stream
        aftervideotag.muted = true
        // localTracks[1].play(`user-${UID}`)
        
        // localVideo.srcObject = localStream;
        // localVideo.muted = true;

        // var audioTracks = stream.getAudioTracks();
        // var videoTracks = stream.getVideoTracks();

        // audioTracks[0].enabled = false;
        // videoTracks[0].enabled = true;

        // btnToggleAudio.addEventListener('click', () => {
        //     audioTracks[0].enabled = !audioTracks[0].enabled;

        //     if (audioTracks[0].enabled) {
        //         btnToggleAudio.children[0].classList.remove('fa-microphone-slash')
        //         btnToggleAudio.children[0].classList.add('fa-microphone')
        //         return
        //     }
            
        //     btnToggleAudio.children[0].classList.remove('fa-microphone')
        //     btnToggleAudio.children[0].classList.add('fa-microphone-slash')

        // })


        // btnToggleVideo.addEventListener('click', () => {
        //     videoTracks[0].enabled = !videoTracks[0].enabled;

        //     if (videoTracks[0].enabled) {
        //         btnToggleVideo.children[0].classList.remove('fa-video-camera-slash')
        //         btnToggleVideo.children[0].classList.add('fa-video-camera')
                
        //         return;
        //     }
            
        //     btnToggleVideo.children[0].classList.add('fa-video-camera-slash')

        // })
    })
    .catch(error => {
        console.log("Error accessing media devices", error)
    })




    function connect() {
        doctoremail = btnJoin.dataset.email
        username = doctoremail
        console.log('doctors email:', doctoremail)
        // sendSignal('new-meeting', {'email':doctoremail})

        // btnJoin.disabled = true
        // btnJoin.style.visibility = 'hidden'
        // labelusername.innerHTML = username
        
        myUsername = username;
          chatSocket = new WebSocket(endpoint);
      
        chatSocket.onopen = function(evt) {
            console.log("Connection Opened");
            sendToServer({
                name: myUsername,
                type: "new-meeting",
                email: doctoremail
            })
        };
      
        chatSocket.onerror = function(evt) {
          console.log("Error Occured")
          console.dir(evt);
        }
      
        chatSocket.onmessage = function(evt) {
          
          var msg = JSON.parse(evt.data);
          console.log("Message received: ");
          console.dir(msg);
          var time = new Date(msg.date);
          var timeStr = time.toLocaleTimeString();
           
          if (msg.type == 'new-peer' &&  msg.name == myUsername){
            return
          }
          switch(msg.type) {
            // case "id":
            //   clientID = msg.id;
            //   setUsername();
            //   break;
      
            // case "username":
            //   text = "<b>User <em>" + msg.name + "</em> signed in at " + timeStr + "</b><br>";
            //   break;
      
            // case "message":
            //   text = "(" + timeStr + ") <b>" + msg.name + "</b>: " + msg.text + "<br>";
            //   break;
      
            // case "rejectusername":
            //   myUsername = msg.name;
            //   text = "<b>Your username has been set to <em>" + myUsername +
            //     "</em> because the name you chose is in use.</b><br>";
            //   break;
      
            // case "userlist":      // Received an updated user list
            //   handleUserlistMsg(msg);
            //   break;
      
            // Signaling messages: these messages are used to trade WebRTC
            // signaling information during negotiations leading up to a video
            // call.
            case'new-peer':
                invite(msg.name, msg.targetChannel);
                break;
            case 'new-meeting':
                var meetinguid = msg.uid 
                meetingProcedures(meetinguid)
                return;
            case "video-offer":  // Invitation and offer to chat
              handleVideoOfferMsg(msg);
              break;
      
            case "video-answer":  // Callee has answered our offer
              handleVideoAnswerMsg(msg);
              break;
      
            case "new-ice-candidate": // A new ICE candidate has been received
              handleNewICECandidateMsg(msg);
              break;
      
            case "hang-up": // The other peer has hung up the call
              handleHangUpMsg(msg);
              break;
      
            // Unknown message; output to console for debugging.
      
            default:
              log_error("Unknown message received:");
              log_error(msg);
          }
      
          // If there's text to insert into the chat buffer, do so now, then
          // scroll the chat panel so that the new text is visible.
      
        //   if (text.length) {
        //     chatBox.innerHTML += text;
        //     chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
        //   }
    
    
    
        };
    
        
      }
    
    
      function handleHangUpMsg(msg) {
        console.log("*** Received hang up notification from other peer");
      
        closeVideoCall();
        btnJoin.classList.remove('bg-gray-100','hover:bg-blue-800', 'focus:ring-4', 'focus:outline-none', 'focus:ring-blue-300')
        btnJoin.classList.remove('bg-red-700','hover:bg-red-800','focus:outline-none','text-white')
        btnJoin.innerHTML= `<svg role="status" class="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
            </svg>
            Waiting...`

            btnJoin.classList.add('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4')
            meetingState = "connecting"
      }
      
      // Hang up the call by closing our end of the connection, then
      // sending a "hang-up" message to the other peer (keep in mind that
      // the signaling is done on a different connection). This notifies
      // the other peer that the connection should be terminated and the UI
      // returned to the "no call in progress" state.
      
      function hangUpCall() {
        closeVideoCall();
      
        sendToServer({
          name: myUsername,
          target: targetUsername,
          targetChannel: peerChannel,
          type: "hang-up"
        });
      }
      
    
    
      async function createPeerConnection() {
        console.log("Setting up a connection...");
      
        // Create an RTCPeerConnection which knows to use our chosen
        // STUN server.
      
        myPeerConnection = new RTCPeerConnection()
        //     {
        //   iceServers: [     // Information about ICE servers - Use your own!
        //     {
        //       urls: "turn:" + myHostname,  // A TURN server
        //       username: "webrtc",
        //       credential: "turnserver"
        //     }
        //   ]
        // });

        myPeerConnection.addEventListener('datachannel', e => {
          myPeerConnection.dc = e.channel; //Gives you the data channel created by the offerer
          myPeerConnection.dc.addEventListener('open', () => {
              console.log('Channel Connection Opened!');
          })
  
          myPeerConnection.dc.addEventListener('message', dcOnMessage);
  
          mapPeers[targetUsername] = [myPeerConnection, myPeerConnection.dc]
        })
  


      
        // Set up event handlers for the ICE negotiation process.
      
        myPeerConnection.onicecandidate = handleICECandidateEvent;
        myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
        myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
        myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
        myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
        myPeerConnection.ontrack = handleTrackEvent;


        //Creating the datachannel to send the data

        var dc = myPeerConnection.createDataChannel("channel");
        dc.addEventListener('open', ()=>{
            console.log('Channel Connection Opened!');
        })

        dc.addEventListener('message',dcOnMessage);
        console.log('targetUsername: ', targetUsername)


      }
    
    
    
    
      async function handleNegotiationNeededEvent() {
        console.log("*** Negotiation needed");
      
        try {
          console.log("---> Creating offer");
          const offer = await myPeerConnection.createOffer();
      
          // If the connection hasn't yet achieved the "stable" state,
          // return to the caller. Another negotiationneeded event
          // will be fired when the state stabilizes.
      
          if (myPeerConnection.signalingState != "stable") {
            console.log("     -- The connection isn't stable yet; postponing...")
            return;
          }
      
          // Establish the offer as the local peer's current
          // description.
      
          console.log("---> Setting local description to the offer");
          await myPeerConnection.setLocalDescription(offer);
      
          // Send the offer to the remote peer.
      
          console.log("---> Sending the offer to the remote peer");
          sendToServer({
            name: myUsername,
            target: targetUsername,
            targetChannel: peerChannel,
            type: "video-offer",
            sdp: myPeerConnection.localDescription
          });
        } catch(err) {
          console.log("*** The following error occurred while handling the negotiationneeded event:");
          reportError(err);
        };
      }
    
    
    
    
      function handleTrackEvent(event) {
        console.log("*** Track event");
    console.log("Remote stream is: ", event.streams[0])
    document.getElementById("user-container-remote").classList.remove('hidden')
    document.getElementById("remote-video").srcObject = event.streams[0];
        // document.getElementById("hangup-button").disabled = false;


    meetingState = "connected"

    if(meetingState === 'connected'){
      btnJoin.classList.remove('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4','text-gray-900', 'hover:text-white')
      btnJoin.classList.add('bg-red-700','hover:bg-red-800','focus:outline-none','text-white')
      btnJoin.innerHTML = "End Call"

    }
      }
      
      // Handles |icecandidate| events by forwarding the specified
      // ICE candidate (created by our local ICE agent) to the other
      // peer through the signaling server.
      
      function handleICECandidateEvent(event) {
        if (event.candidate) {
          console.log("*** Outgoing ICE candidate: " + event.candidate.candidate);
      
          sendToServer({
            type: "new-ice-candidate",
            target: targetUsername,
            targetChannel: peerChannel,
            candidate: event.candidate
          });
        }
      }
      
      // Handle |iceconnectionstatechange| events. This will detect
      // when the ICE connection is closed, failed, or disconnected.
      //
      // This is called when the state of the ICE agent changes.
      
      function handleICEConnectionStateChangeEvent(event) {
        console.log("*** ICE connection state changed to " + myPeerConnection.iceConnectionState);
      
        switch(myPeerConnection.iceConnectionState) {
          case "closed":
          case "failed":
          case "disconnected":
            closeVideoCall();
            btnJoin.classList.remove('bg-gray-100','hover:bg-blue-800', 'focus:ring-4', 'focus:outline-none', 'focus:ring-blue-300')
            btnJoin.classList.remove('bg-red-700','hover:bg-red-800','focus:outline-none','text-white')
            btnJoin.innerHTML= `<svg role="status" class="inline mr-2 w-4 h-4 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2"/>
            </svg>
            Waiting...`

            btnJoin.classList.add('bg-yellow-100','hover:bg-yellow-800','focus:outline-none','mr-4')
            meetingState = "connecting"
            break;
        }
      }
      
      // Set up a |signalingstatechange| event handler. This will detect when
      // the signaling connection is closed.
      //
      // NOTE: This will actually move to the new RTCPeerConnectionState enum
      // returned in the property RTCPeerConnection.connectionState when
      // browsers catch up with the latest version of the specification!
      
      function handleSignalingStateChangeEvent(event) {
        console.log("*** WebRTC signaling state changed to: " + myPeerConnection.signalingState);
        switch(myPeerConnection.signalingState) {
          case "closed":
            closeVideoCall();
            break;
        }
      }
      
      // Handle the |icegatheringstatechange| event. This lets us know what the
      // ICE engine is currently working on: "new" means no networking has happened
      // yet, "gathering" means the ICE engine is currently gathering candidates,
      // and "complete" means gathering is complete. Note that the engine can
      // alternate between "gathering" and "complete" repeatedly as needs and
      // circumstances change.
      //
      // We don't need to do anything when this happens, but we log it to the
      // console so you can see what's going on when playing with the sample.
      
      function handleICEGatheringStateChangeEvent(event) {
        console.log("*** ICE gathering state changed to: " + myPeerConnection.iceGatheringState);
      }
    
    
    
    
    
      function closeVideoCall() {
        var localVideo = document.getElementById("local-video");
    var remoteVideo = document.getElementById("remote-video")
    
    console.log("Closing the call");
    
    // Close the RTCPeerConnection
    
    if (myPeerConnection) {
      console.log("--> Closing the peer connection");
      
      // Disconnect all our event listeners; we don't want stray events
      // to interfere with the hangup while it's ongoing.
  
      myPeerConnection.ontrack = null;
      myPeerConnection.onnicecandidate = null;
      myPeerConnection.oniceconnectionstatechange = null;
      myPeerConnection.onsignalingstatechange = null;
      myPeerConnection.onicegatheringstatechange = null;
      myPeerConnection.onnotificationneeded = null;
      
      // Stop all transceivers on the connection
      
      myPeerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });
      
      // Stop the webcam preview as well by pausing the <video>
      // element, then stopping each of the getUserMedia() tracks
      // on it.
      
      if(remoteVideo.srcObject){
        remoteVideo.srcObject = null
        document.getElementById("user-container-remote").classList.add('hidden')
      }
      // if (localVideo.srcObject) {
      //   console.log("Local video paused")
      //   localVideo.pause();
      //   localVideo.srcObject.getTracks().forEach(track => {
      //     track.stop();
      //   });
      // }
  
      // Close the peer connection
  
      myPeerConnection.close();
      myPeerConnection = null;
      webcamStream = null;
      mapPeers = {}
      
    }
}
      
      
    
    
      async function invite(peerUsername, newpeerChannel) {
        console.log("Starting to prepare an invitation");
        if (myPeerConnection) {
          alert("You can't start a call because you already have one open!");
        } else {
        //   var clickedUsername = evt.target.textContent;
      
        //   // Don't allow users to call themselves, because weird.
      
        //   if (clickedUsername === myUsername) {
        //     alert("I'm afraid I can't let you talk to yourself. That would be weird.");
        //     return;
        //   }
      
        //   // Record the username being called for future reference
      
        //   targetUsername = clickedUsername;
        //   log("Inviting user " + targetUsername);
        
        //   // Call createPeerConnection() to create the RTCPeerConnection.
        //   // When this returns, myPeerConnection is our RTCPeerConnection
        //   // and webcamStream is a stream coming from the camera. They are
        //   // not linked together in any way yet.
        
        //   log("Setting up connection to invite user: " + targetUsername);
        //   createPeerConnection();
        
        //   // Get access to the webcam stream and attach it to the
        //   // "preview" box (id "local_video").
        
          targetUsername = peerUsername;
          peerChannel = newpeerChannel
          console.log("Inviting user " + targetUsername);
        createPeerConnection();
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            document.getElementById("local-video").srcObject = webcamStream;
        } catch(err) {
            handleGetUserMediaError(err);
            return;
          }
      
          // Add the tracks from the stream to the RTCPeerConnection
      
          try {
            webcamStream.getTracks().forEach(
              transceiver = track => myPeerConnection.addTransceiver(track, {streams: [webcamStream]})
            );
          } catch(err) {
            handleGetUserMediaError(err);
          }
        }
      }
    
      
    
    
    
      async function handleVideoOfferMsg(msg) {
        targetUsername = msg.name;
        peerChannel = msg.targetChannel
      
        // If we're not already connected, create an RTCPeerConnection
        // to be linked to the caller.
      
        console.log("Received video chat offer from " + targetUsername);
        if (!myPeerConnection) {
          createPeerConnection();
        }
      
        // We need to set the remote description to the received SDP offer
        // so that our local WebRTC layer knows how to talk to the caller.
      
        var desc = new RTCSessionDescription(msg.sdp);
      
        // If the connection isn't stable yet, wait for it...
      
        if (myPeerConnection.signalingState != "stable") {
          console.log("  - But the signaling state isn't stable, so triggering rollback");
      
          // Set the local and remove descriptions for rollback; don't proceed
          // until both return.
          await Promise.all([
            myPeerConnection.setLocalDescription({type: "rollback"}),
            myPeerConnection.setRemoteDescription(desc)
          ]);
          return;
        } else {
          console.log ("  - Setting remote description");
          await myPeerConnection.setRemoteDescription(desc);
        }
      
        // Get the webcam stream if we don't already have it
      
        if (!webcamStream) {
          try {
            webcamStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
          } catch(err) {
            handleGetUserMediaError(err);
            return;
          }
      
          document.getElementById("local-video").srcObject = webcamStream;
      
          // Add the camera stream to the RTCPeerConnection
      
          try {
            webcamStream.getTracks().forEach(
              transceiver = track => myPeerConnection.addTransceiver(track, {streams: [webcamStream]})
            );
          } catch(err) {
            handleGetUserMediaError(err);
          }
        }
      

        myPeerConnection.addEventListener('datachannel', e=>{
          myPeerConnection.dc = e.channel; //Gives you the data channel created by the offerer
          myPeerConnection.dc.addEventListener('open', ()=>{
              console.log('Channel Connection Opened!');
          })
      
          myPeerConnection.dc.addEventListener('message',dcOnMessage);
    
          mapPeers[targetUsername] = [myPeerConnection,myPeerConnection.dc ]
          console.log("Map Peers is: ", mapPeers)
        });
    



        console.log("---> Creating and sending answer to caller");
      
        await myPeerConnection.setLocalDescription(await myPeerConnection.createAnswer());
      
        sendToServer({
          name: myUsername,
          target: targetUsername,
          targetChannel: peerChannel,
          type: "video-answer",
          sdp: myPeerConnection.localDescription
        });
      }
    
    
    
    
      async function handleVideoAnswerMsg(msg) {
        console.log("*** Call recipient has accepted our call");
      
        // Configure the remote description, which is the SDP payload
        // in our "video-answer" message.
      
        var desc = new RTCSessionDescription(msg.sdp);
        await myPeerConnection.setRemoteDescription(desc).catch(reportError);
        document.querySelector("#patientName").innerHTML = msg.name
      }
      
      // A new ICE candidate has been received from the other peer. Call
      // RTCPeerConnection.addIceCandidate() to send it along to the
      // local ICE framework.
      
      async function handleNewICECandidateMsg(msg) {
        var candidate = new RTCIceCandidate(msg.candidate);
      
        console.log("*** Adding received ICE candidate: " + JSON.stringify(candidate));
        try {
          await myPeerConnection.addIceCandidate(candidate)
        } catch(err) {
          reportError(err);
        }
      }
      
      // Handle errors which occur when trying to access the local media
      // hardware; that is, exceptions thrown by getUserMedia(). The two most
      // likely scenarios are that the user has no camera and/or microphone
      // or that they declined to share their equipment when prompted. If
      // they simply opted not to share their media, that's not really an
      // error, so we won't present a message in that situation.
      
      function handleGetUserMediaError(e) {
        console.log(e);
        switch(e.name) {
          case "NotFoundError":
            alert("Unable to open your call because no camera and/or microphone" +
                  "were found.");
            break;
          case "SecurityError":
          case "PermissionDeniedError":
            // Do nothing; this is the same as the user canceling the call.
            break;
          default:
            alert("Error opening your camera and/or microphone: " + e.message);
            break;
        }
      
        // Make sure we shut down our end of the RTCPeerConnection so we're
        // ready to try again.
      
        closeVideoCall();
      }
    
    
    
    
      function reportError(errMessage) {
        console.log(`Error ${errMessage.name}: ${errMessage.message}`);
      }
    
    
    
    
    
    
    
    
    
    //Relevant Functions 
    
    function sendToServer(msg) {
        const msgJSON = JSON.stringify(msg);
      
        chatSocket.send(msgJSON);
      }
    
    













// const FPS = 25;

// setInterval(() => {
//     var canvas = document.querySelector("#canvas")
//     context = canvas.getContext('2d')
//     width = 400;
//     height = 300;
//     context.drawImage(localVideo, 0, 0, width, height);
//     var data = canvas.toDataURL('image/jpeg', 0.5);
//     // console.log('Frame:',data)
//     console.log('Receiving frames')
//     context.clearRect(0, 0, width, height);
//     // photo.src = data
//     sendSignal("new-video", {
//         'video-stream': data
//     });
// }, 1000 / FPS);


// var btnSendMsg = document.querySelector('#btn-send-msg');

// btnSendMsg.addEventListener('click', sendMsgOnClick);

// var messageList = document.querySelector("#message-list")
// var messageInput = document.querySelector('#msg')

function sendMsgOnClick() {
    var message = messageInput.value;

    var li = document.createElement('li')
    li.appendChild(document.createTextNode('Me:' + message));
    messageList.appendChild(li)

    var dataChannels = getDataChannels();

    message = username + ': ' + message;

    for (index in dataChannels) {
        dataChannels[index].send(message);
    }

    messageInput.value = '';
}

// Doing real webrtc stuff


// Function to send signals. Message is a dictionary/javascript object
function sendSignal(action, message) {

    var jsonStr = JSON.stringify({
        'peer': username,
        'action': action,//type of action eg. new-peer, new-offer, new-answer
        'message': message
    });

    if (chatSocket)
        chatSocket.send(jsonStr)
}


function createOfferer(peerUsername, receiver_channel_name) {

    console.log("In createOfferer function")
    var peer = new RTCPeerConnection(null);

    // null because in this tutorial we want to only connect devices
    // in our local network.
    // If you want to connect to devices on the internet, you have to 
    // setup stun and turn servers and in that case you will supply a 
    // dictionary containing the turn and stun server credentials.

    // add our local audio and video tracks and add it to the peer 
    // connection so they can be streamed to the other peer


    // addLocalTracks(peer)

    //Creating the datachannel to send the data

    var dc = peer.createDataChannel("channel");
    dc.addEventListener('open', () => {
        console.log('Channel Connection Opened!');
    })

    dc.addEventListener('message', dcOnMessage);

    // var remoteVideo = createVideo(peerUsername);
    
    // setOnTrack(peer, remoteVideo);


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
        .then(() => {
            console.log('Local Description set successfully')
        })
}



// function createAnswerer(offer, peerUsername, receiver_channel_name) {
//     var peer = new RTCPeerConnection(null);


//     addLocalTracks(peer)

//     var remoteVideo = createVideo(peerUsername);

//     setOnTrack(peer, remoteVideo);


//     peer.addEventListener('datachannel', e => {
//         peer.dc = e.channel; //Gives you the data channel created by the offerer
//         peer.dc.addEventListener('open', () => {
//             console.log('Channel Connection Opened!');
//         })

//         peer.dc.addEventListener('message', dcOnMessage);

//         mapPeers[peerUsername] = [peer, peer.dc]
//     })


//     peer.addEventListener('iceconnectionstatechange', () => {
//         var iceConnectionState = peer.iceConnectionState;

//         if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
//             delete mapPeers[peerUsername]

//             if (iceConnectionState != 'closed') {
//                 peer.close()

//                 removeVideo(peerUsername)
//             }
//         }
//     })

//     peer.addEventListener('icecandidate', (event) => {
//         if (event.candidate) {
//             // console.log('New Ice candidate', JSON.stringify(peer.localDescription))
//             return;
//         }
//         //Sending SDP to peer
//         sendSignal('new-answer', {
//             'sdp': peer.localDescription,
//             'receiver_channel_name': receiver_channel_name,
//         })
//     })


//     peer.setRemoteDescription(offer)
//         .then(() => {
//             console.log("Remote Description Set Successfully for $s.", peerUsername)

//             return peer.createAnswer();

//         })
//         .then(a => {
//             console.log("Answer created!")

//             peer.setLocalDescription(a);
//         })
// }


function addLocalTracks(peer) {
    console.log("In add Local tracks")
    localStream.getTracks().forEach(track =>{
        peer.addTrack(track,localStream);
    })

    return;

}

var messageList = document.querySelector("#message-list")
function dcOnMessage(event) {
    var message = event.data

    var currentdate = new Date();

    var printnow = ` <div class="chat-message">
    <div class="flex items-end">
       <div class="flex flex-col space-y-2 text-sm font-semibold max-w-xs mx-2 order-2 items-start">
          <div><span
                class="px-4 py-2 rounded-lg inline-block break-words rounded-bl-none bg-gray-300 text-gray-600">${message}<span class="text-white-400 pl-1" style="font-size: 12px;"> <p class="text-right font-semibold">${currentdate.getHours()}:${currentdate.getMinutes()}</p></span></span></div>
                  </div>
                  <div class="overflow-hidden relative w-5 h-5 bg-white-100 order-1 rounded-full border border-gray-300 dark:bg-gray-600">
                     <svg class="absolute -left-[0.1em]  w-5 h-5  text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                           clip-rule="evenodd"></path>
                     </svg>
                  </div>
               </div>
            </div>`

    el.insertAdjacentHTML('beforeend', printnow);
    el.scrollTop = el.scrollHeight
    // var li = document.createElement('li')
    // li.appendChild(document.createTextNode(message))
    // messageList.appendChild(li)
}

//Adding video streams from other peers to your screen
function createVideo(peerUsername) {
    // var videoContainer = document.querySelector('#video-container');

    // var remoteVideo = document.createElement('video')

    // remoteVideo.id = peerUsername + '-video'

    // remoteVideo.autoplay = true;
    // remoteVideo.playsInline = true;

    // var videowrapper = document.createElement('div')

    // videoContainer.appendChild(videowrapper);
    // videowrapper.appendChild(remoteVideo)

    var peervideotag = document.createElement('video')
    peervideotag.autoplay = true
    peervideotag.playsInline = true
    peervideotag.id = peerUsername+'-video'
    peervideotag.style.width = 'auto'
    peervideotag.style.minWidth = '100%'
    peervideotag.style.height = 'auto'
    peervideotag.style.height = '100%'
    
    
    var all_content = document.createElement('div')
    var video_container = document.createElement('div')
    var video_player = document.createElement('div')
    var username_wrapper = document.createElement('div')
    video_container.className = 'video-container'
    video_container.id = 'user-container-'+peerUsername

    video_player.className = 'video-player'
    video_player.id = 'user-'+peerUsername
    


    video_player.appendChild(peervideotag)
    video_container.appendChild(video_player)
    username_wrapper.className="username-wrapper"
    username_wrapper.innerHTML= `<span class="user-name">${peerUsername}</span>`;

    video_container.appendChild(username_wrapper);
    all_content.appendChild(video_container);
    

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', all_content.innerHTML)

    return peervideotag;

}

function setOnTrack(peer, remoteVideo) {
    var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;
    peer.addEventListener('track', async (event) =>{
        remoteStream.addTrack(event.track, remoteStream)
    })
    
}



function removeVideo(peerUsername) {
    // var videoWrapper = video.parentNode;

    // videoWrapper.parentNode.removeChild(videoWrapper)

    console.log('Hello',document.getElementById(`user-container-${peerUsername}`))
}


function getDataChannels() {
    var dataChannels = [];

    for (peerUsername in mapPeers) {
        var dataChannel = mapPeers[peerUsername][1];

        dataChannels.push(dataChannel);
    }

    return dataChannels
}



function meetingProcedures(meetinguid){
    idbox = document.querySelector("#meetingID")
    idbox.value = meetinguid
    idbox.disabled = true

}


function showPatientVideo(serverframe){

    
    var pat_video_container=document.querySelector("#user-container-patient")
    var pat_video =document.querySelector("#patient-video")
    var local_video_container=document.querySelector("#user-container-local")
    if(pat_video_container.classList.contains('hidden')){
        pat_video_container.classList.remove('hidden')
        local_video_container.classList.add('hidden')
        
        
    }
    pat_video.src = serverframe
    



}