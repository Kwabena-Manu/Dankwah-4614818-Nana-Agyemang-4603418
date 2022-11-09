from django.urls import path
from . import views
urlpatterns = [
    path('',views.index, name='index'),
    path('patient', views.patient, name='patient'),
    path('doctor',views.doctor, name='doctor')
]
