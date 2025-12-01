from django.urls import path
from .views import RegisterView ,LoginView,OwnerDashboardView,OwnerRegisterView


urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('owner/dashboard/', OwnerDashboardView.as_view()),
    path('register/owner/', OwnerRegisterView.as_view(), name='owner-register'),
    
]
