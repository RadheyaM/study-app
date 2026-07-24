from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, StudySectionViewSet, SutraViewSet, NoteViewSet, TermViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'sections', StudySectionViewSet)
router.register(r'sutras', SutraViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'terms', TermViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
