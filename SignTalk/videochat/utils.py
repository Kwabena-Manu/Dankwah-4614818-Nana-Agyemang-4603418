import time
import io
from PIL import Image
import base64,cv2
import numpy as np
import cv2
import numpy as np
import mediapipe as mp
from matplotlib import pyplot as plt
import time 
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import json
import os
import string
import random
from user.models import Doctor,Sessions,MeetingIDs
from channels.db import database_sync_to_async
from django.conf import settings
from moviepy.editor import VideoFileClip, concatenate_videoclips

from PyDictionary import PyDictionary

dictionary = PyDictionary()



mp_holistic = mp.solutions.holistic # Holistic model: To extract keypoints 
mp_drawing = mp.solutions.drawing_utils # Drawing utilities: To draw the lines on the frames



def mediapipe_detection(image,model):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) #Color conversion from bgr to rgb
    image.flags.writeable = False                  #Image is no longer writeable. This makes the image lighter
    results = model.process(image)                 #Make predictions on the image with respect to the keypoints
    image.flags.writeable = True                   #Image is now writeable 
    image = cv2.cvtColor(image,cv2.COLOR_RGB2BGR) #Color conversion from rgb to bgr
    return image,results


def draw_landmarks(image,results):
    mp_drawing.draw_landmarks(image,results.face_landmarks,mp_holistic.FACEMESH_CONTOURS)
    mp_drawing.draw_landmarks(image,results.pose_landmarks,mp_holistic.POSE_CONNECTIONS)
    mp_drawing.draw_landmarks(image,results.left_hand_landmarks,mp_holistic.HAND_CONNECTIONS)
    mp_drawing.draw_landmarks(image,results.right_hand_landmarks,mp_holistic.HAND_CONNECTIONS)
    
    
def draw_styled_landmarks(image,results):
    # Draw face connections
    mp_drawing.draw_landmarks(image,results.face_landmarks,mp_holistic.FACEMESH_CONTOURS
                              ,mp_drawing.DrawingSpec(color=(66,192,245), thickness=1, circle_radius=1)
                              ,mp_drawing.DrawingSpec(color=(38,141,201), thickness=1, circle_radius=1)
                              )
    # Draw pose connections
    mp_drawing.draw_landmarks(image,results.pose_landmarks,mp_holistic.POSE_CONNECTIONS
                              ,mp_drawing.DrawingSpec(color=(255,170,13), thickness=2, circle_radius=4)
                              ,mp_drawing.DrawingSpec(color=(17,130,59), thickness=2, circle_radius=2)
                              )
    # Draw left_hand_connections
    mp_drawing.draw_landmarks(image,results.left_hand_landmarks,mp_holistic.HAND_CONNECTIONS
                              ,mp_drawing.DrawingSpec(color=(120,52,144), thickness=2, circle_radius=4)
                              ,mp_drawing.DrawingSpec(color=(146,0,162), thickness=2, circle_radius=2)
                              )
    # Draw right_hand_connections
    mp_drawing.draw_landmarks(image,results.right_hand_landmarks,mp_holistic.HAND_CONNECTIONS
                              ,mp_drawing.DrawingSpec(color=(123,110,112), thickness=2, circle_radius=4)
                              ,mp_drawing.DrawingSpec(color=(100,467,121), thickness=2, circle_radius=2)
                              )
    
    
    
def extract_keypoints(results):
    pose = np.array([[res.x,res.y,res.z,res.visibility] for res in results.pose_landmarks.landmark]).flatten() if results.pose_landmarks else np.zeros(33*4)
    # face = np.array([[res.x,res.y,res.z] for res in results.face_landmarks.landmark]).flatten() if results.face_landmarks else np.zeros(468*3)
    lh = np.array([[res.x,res.y,res.z] for res in results.left_hand_landmarks.landmark]).flatten() if results.left_hand_landmarks else np.zeros(21*3)
    rh = np.array([[res.x,res.y,res.z] for res in results.right_hand_landmarks.landmark]).flatten() if results.right_hand_landmarks else np.zeros(21*3)
    
    # return np.concatenate([pose,face,lh,rh])
    return np.concatenate([pose,lh,rh])

def makeprediction(frame):
    sequence = []
    sentence = []
    predictions = []
    threshold = 0.5
    actions = settings.SIGN_LABELS
    model = settings.SIGN_MODEL
    
    
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
    

        # Make detections
        image, results = mediapipe_detection(frame, holistic)
        # print(results)
        
        # Draw landmarks
        draw_styled_landmarks(image, results)
        
        # 2. Prediction logic
        keypoints = extract_keypoints(results)
        sequence.append(keypoints)
        sequence = sequence[-25:]
        
        if len(sequence) == 25:
            res = model.predict(np.expand_dims(sequence, axis=0))[0]
            # print(actions[np.argmax(res)])
            predictions.append(np.argmax(res))
            
            
        #3. Viz logic
            if np.unique(predictions[-10:])[0]==np.argmax(res): 
                if res[np.argmax(res)] > threshold: 
                    
                    if len(sentence) > 0: 
                        if actions[np.argmax(res)] != sentence[-1]:
                            sentence.append(actions[np.argmax(res)])
                    else:
                        sentence.append(actions[np.argmax(res)])

            if len(sentence) > 5: 
                sentence = sentence[-5:]
                print(sentence)

            # Viz probabilities
            # image = prob_viz(res, actions, image)
            
    #     cv2.rectangle(image, (0,0), (640, 40), (245, 117, 16), -1)
    #     cv2.putText(image, ' '.join(sentence), (3,30), 
    #                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        
    #     # Show to screen
    #     cv2.imshow('OpenCV Feed', image)

    #     # Break gracefully
    #     if cv2.waitKey(10) & 0xFF == ord('q'):
    #         break
    # cap.release()
    # cv2.destroyAllWindows()
    
    
    
def frametransform(image):
    return image 


def test_return(base64_string):
    # idx = base64_string.find('base64,')
    # base64_string = base64_string[idx+7:]

    # sbuf = io.BytesIO()

    # sbuf.write(base64.b64decode(base64_string, ' /'))

    # pimg = Image.open(sbuf)

    # pImg = (cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR))

    pImg= readb64(base64_string)
    imgencode = cv2.imencode('.jpeg', pImg,[cv2.IMWRITE_JPEG_QUALITY,40])[1]

    # Base64 encode for sending
    stringData = base64.b64encode(imgencode).decode('utf-8')
    b64_src = 'data:image/jpeg;base64,'
    stringData = b64_src +stringData

    return stringData



def readb64(base64_string):
    idx = base64_string.find('base64,')
    base64_string = base64_string[idx+7:]

    sbuf = io.BytesIO()

    sbuf.write(base64.b64decode(base64_string, ' /'))

    pimg = Image.open(sbuf)

    pImg = (cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR))

    
    pImg = applymedaipipe(pImg)
    
    # cv2.imshow('test_image',pImg)
    
    # cv2.waitKey(0)
    
    return pImg


def applymedaipipe(cv2Image):
    holistic = mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    image, results = mediapipe_detection(cv2Image,holistic)
    
    
    # Draw landmarks 
    draw_styled_landmarks(image,results)
    
    # cv2.imshow('Mediapipe transform', image)
    # cv2.waitKey(0)
    
    return image




def createUID():
    chars = list(set(string.ascii_uppercase + string.digits).difference('LIO01'))
    return ''.join(random.choices(chars, k=12))

@database_sync_to_async
def retrieveDoctor(email):
   doctor = Doctor.objects.get(email=email)
   print(doctor)
   return doctor
   

@database_sync_to_async  
def retrieveMeetingID(newuid):
    meeting = MeetingIDs.objects.get(meetingid=newuid)
    return meeting



@database_sync_to_async
def add_meetingID(doctor,newuid):
    newMeetingID = MeetingIDs.objects.create(Doctor=doctor,meetingid=newuid)
    return newMeetingID.save()
    
    
    
@database_sync_to_async
def getDocName(meetingID):
    Meeting = MeetingIDs.objects.get(meetingid = meetingID)
    doctor = Meeting.Doctor
    
    return f"{doctor.first_name} {doctor.last_name}"



def concatVideos(video_list):
    VIDEO_PATH = r"videos"
    final_video = VideoFileClip(VIDEO_PATH+'/'+video_list[0]+'.mp4')
    for index in range(1,len(video_list)):
        interim_video = VideoFileClip(VIDEO_PATH+'/'+video_list[index]+'.mp4')
        final_video = concatenate_videoclips([final_video,interim_video])
    
    print(type(final_video))
    
    video_frames = final_video.iter_frames()
    
    # for value in video_frames:
    #     print(type(value))
    # img = Image.fromarray(clip.get_frame(1))
    # img.show()
    print(type(video_frames))   
    return video_frames


def numpyTobase64(imgnumpy):
    img = cv2.cvtColor(imgnumpy, cv2.COLOR_BGR2RGB)
    imgencode = cv2.imencode('.jpeg', img,[cv2.IMWRITE_JPEG_QUALITY,40])[1]

    # Base64 encode for sending
    stringData = base64.b64encode(imgencode).decode('utf-8')
    b64_src = 'data:image/jpeg;base64,'
    stringData = b64_src +stringData
    
    return stringData



import requests
from bs4 import BeautifulSoup

def synonyms(term):
    response = requests.get('https://www.thesaurus.com/browse/{}'.format(term))
    soup = BeautifulSoup(response.text, 'lxml')
    soup.find('section', {'class': 'css-17ofzyv e1ccqdb60'})
    return [span.text for span in soup.findAll('a', {'class': 'css-1kg1yv8 eh475bn0'})] # 'css-1gyuw4i eh475bn0' for less relevant synonyms


def sentenceToVideoList(sentence_words):
    video_chain = []
    for word in sentence_words:
        print("Current word: ", word)
        if word.lower() in settings.VIDEO_DICT:
            video_chain.append(random.choice(settings.VIDEO_DICT[word.lower()]))
        else:
            print("In the synonyms")
            word_synonyms = synonyms(word.lower())
            print(f'Synonym of word {word.lower()} is: ',word_synonyms)
            if len(word_synonyms) != 0:
                print("In the synonyms section")
                for syn in word_synonyms:
                    print("In the synonyms")
                    if syn.lower() in settings.VIDEO_DICT:
                        print(f"Synonym of {word.lower()} used is: ", syn.lower())
                        video_chain.append(random.choice(settings.VIDEO_DICT[word.lower()]))
                        break
                if len(video_chain) == 0:
                    for letter in word.lower():
                        if letter.lower()  in settings.VIDEO_DICT:
                            print(f"{letter.lower()} [{video_chain}]")    
                            video_chain.append(random.choice(settings.VIDEO_DICT[letter.lower()]))
            else:
                print("Skipped to using letters")
                for letter in word.lower():
                    if letter.lower()  in settings.VIDEO_DICT:
                        print(f"{letter.lower()} [{video_chain}]")    
                        video_chain.append(random.choice(settings.VIDEO_DICT[letter.lower()]))
    print("Video Chain is:", video_chain)
    return video_chain