from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
# Create your views here.


def index(request):
    if request.user.is_authenticated:
        logout(request)
    return render(request, 'videochat/index.html')
    # return render(request, 'videochat/room.html')
def patient(request):
    return render(request,'videochat/room.html')
@login_required
def doctor(request):
    return render(request,'videochat/room1.html')