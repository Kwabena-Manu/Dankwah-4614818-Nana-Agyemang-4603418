from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


class Doctor(AbstractUser):
    pass
    
    class Meta:
        verbose_name_plural = "Doctors"
    def __str__(self):
        return self.username



class Sessions(models.Model):
    Doctor = models.ForeignKey(Doctor, on_delete= models.CASCADE,related_name='sessions')
    meetingid = models.TextField(blank=False,null=False)
    patient = models.TextField(blank=False,null=False)
    date_added = models.DateTimeField(auto_now_add=True)
    
    
class MeetingIDs(models.Model):
    Doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="meetingID")
    meetingid = models.TextField(blank=False,null=False)
    data_added = models.DateField(auto_now_add=True)