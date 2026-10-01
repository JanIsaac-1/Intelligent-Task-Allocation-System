from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, AgentProfileViewSet, TaskViewSet,
    PerformanceLogViewSet, api_login, api_register, api_logout, parse_cv_pdf
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'agents', AgentProfileViewSet, basename='agent')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'logs', PerformanceLogViewSet, basename='log')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', api_login, name='api_login'),
    path('auth/register/', api_register, name='api_register'),
    path('auth/logout/', api_logout, name='api_logout'),

    # PDF Document parsing endpoint
    path('parse-cv/', parse_cv_pdf, name='parse_cv_pdf'),

    # ViewSet CRUD routes
    path('', include(router.urls)),
]
