import base64
from sqlite3 import IntegrityError
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.generic.websocket import async_to_sync
import json
# from .utils import  readb64, test_return, frametransform
from .utils import createUID, frametransform, readb64,retrieveDoctor, retrieveMeetingID,add_meetingID,getDocName,concatVideos,numpyTobase64
from .utils import sentenceToVideoList
from user.models import Doctor,MeetingIDs,Sessions
from django.conf import settings
import random
from time import sleep



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        
        # self.room_group_name = 'Test'
        
        # await self.channel_layer.group_add(
        #     self.room_group_name,
        #     self.channel_name
        # )
        await self.accept()
        self.send(text_data= json.dumps({
            'type': 'Connected',
            'message': "You are connected"
        }))
        
        
        
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        
        await self.send(text_data= json.dumps({
            'type': 'Disconnected',
            'message': 'You are disconnected'
        }))
        
        print("Disconnected", self.channel_name)
        
        
        
        
    async def receive(self,text_data):
        user_data = json.loads(text_data)
        # message = user_data['message']
        # print('User_data:',user_data)
        message_type = user_data['type']
        
        if(message_type == 'new-meeting'):
            print(user_data)
            email = user_data['email']
            doctor =await retrieveDoctor(email)
            print(type(doctor))
            print("I am here 1")
            newuid = createUID()
            
            # meetingID = retrieveMeetingID(newuid)
            # print("I am here 2")
            # while meetingID is None:
            #     newuid = createUID()
            #     print('New Uid:',newuid)
            #     meetingID = retrieveMeetingID(newuid)
            # print("I am here 3")
            self.room_group_name = newuid
        
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            print("I am here 4")
            # Adding the UID and the Session to the database
           
            newmeeting = await add_meetingID(doctor,newuid)  
            print('I am here 5')
            # print(newmeeting)
            user_data['type'] = 'new-meeting'
            user_data['uid'] = newuid
            print(user_data)
            await self.send(text_data= json.dumps(user_data))
            
            return
                
                
        if message_type == 'doctor-message':
            receiver_channel_name = user_data['targetChannel']
            sentence_words = user_data['message'].split()
            print(sentence_words)
            print(settings.VIDEO_DICT['hello'])
            video_chain = sentenceToVideoList(sentence_words)
            final_video_frames = concatVideos(video_chain)
            count = 0
            for frame in final_video_frames:
                count+=1
                frame_64 = numpyTobase64(frame)
                user_data['message_video_frame'] = frame_64
                # print(f"Receiver name is {user_data['target']} with channel name {user_data['targetChannel']}")
                print("Count is: ", count )
                await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send_sdp',
                    'group_message': user_data
                }
            )   
                sleep(0.1)
            user_data['type'] = "end-video"
            await self.channel_layer.send(
            receiver_channel_name,
            {
                'type': 'send_sdp',
                'group_message': user_data
            }
        )   
                
            return
            
            
        
        if (message_type == 'video-offer') or (message_type == 'video-answer') or (message_type == 'new-ice-candidate') or (message_type == 'hang-up'):
            print("Message Type is:",message_type)
            # print("Message info: ",user_data['message'])
            receiver_channel_name = user_data['targetChannel']

            
            user_data['targetChannel'] = self.channel_name
            
            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send_sdp',
                    'group_message': user_data
                }
            )   
        
            return
        
        if (message_type == 'new-video'):
            print(user_data['type'])
            user_data['targetChannel'] = self.channel_name
            video_stream = user_data['video-stream'] 
            newimage = frametransform(video_stream)
            # frame = test_return(video_stream)
            frame = readb64(video_stream)
            
            user_data['server_frame'] = newimage
            
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_sdp',
                'group_message': user_data
            }
        )
            
            # await self.send(text_data=json.dumps(user_data))
            
            
            
            return;
           
            
            
            
        self.room_group_name = str(user_data['doctor'])
        user_data['drName'] = await getDocName(self.room_group_name)
        print('Dr name: ',user_data['drName'])
        print("Room group name: ", self.room_group_name)
        user_data['targetChannel'] = self.channel_name
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        print("------------Successfully added patient to group---------------")
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_sdp',
                'group_message': user_data
            }
        )
        
        return
        
        
        
    
    async def send_sdp(self,event):
        user_data = event['group_message']
        
        # print('User data being sent is', user_data)
        await self.send(text_data=json.dumps(user_data))
         
        