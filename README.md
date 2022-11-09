# Dankwah-4614818-Nana-Agyemang-4603418
Final project for Computer Science department, KNUST (2022)



SIGN TALK: A DEEP LEARNING SOLUTION FOR SIGN LANGUAGE TRANSLATION

The aim of SignTalk is to facilitate the communication between a deaf or mute patient and a doctor. SignTalk uses computer
vision to extract signs from videos taken from the common webcam on a computer or the camera of any camera-enabled device 
of the patient performing sign language and translate it by passing it through a pretrained word-level sign language 
translation ML model. SignTalk also has support for translation from speech to sign language which will aid Doctors to speak 
with their deaf or mute patients effectively. SignTalk is built on webRTC that allows patient and doctor to share their 
webcam feed in real-time whilst allowing features like chat functionality.


DEPENDENCIES
SignTalk is a web application built using Python's Django framework,Tailwind, Bootstrap, HTML, CSS and JavaScript.
Its features need the packages below to operate:
1. tensorflow == 2.9.1
2. channels==3.0.5
3. channels-redis==3.4.1
4. keytotext==2.3.2
5. mediapipe==0.8.10
6. moviepy==1.0.3
7. opencv-python==4.6.0.66
8. Pattern==3.6
9. Pillow==9.1.1
10.Django==4.0.6
11.Gramformer


SETUP
1. To get this project up and running, you should have installed Python 3.8 on your computer. It is advised you create a 
virtual envronment to store all the project's dependencies. Go to the root directory of the project and execute this:
	
	python -m venv signtalkvenv

2. Once this is done you, you can activate virtual environment using this command:

	signtalkvenv\Script\activate

3. You can now install all the dependencies in the virtual environment by making sure the root folder has the
requirements.txt file and using this command:

	python -m pip install -r requirements.txt

4. Download the file, here: https://www.kaggle.com/datasets/utsavk02/wlasl-complete/download?datasetVersionNumber=1
   and upzip it to the SignTalk/videochat folder

5. You can now run the project by using this command:
	
	python manage.py runserver
