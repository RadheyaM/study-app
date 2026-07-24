from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Book, StudySection, Sutra, Note, Term
from .serializers import (
    BookSerializer, 
    StudySectionSerializer, 
    StudySectionTreeSerializer,
    SutraSerializer, 
    NoteSerializer, 
    TermSerializer
)

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    # Action to fetch nested tree of sections for this book
    @action(detail=True, methods=['get'])
    def tree(self, request, pk=None):
        book = self.get_object()
        root_sections = book.sections.filter(parent__isnull=True).order_by('order', 'created_at')
        serializer = StudySectionTreeSerializer(root_sections, many=True)
        return Response(serializer.data)


class StudySectionViewSet(viewsets.ModelViewSet):
    queryset = StudySection.objects.all()
    serializer_class = StudySectionSerializer

    def get_queryset(self):
        queryset = StudySection.objects.all()
        book_id = self.request.query_params.get('book_id', None)
        if book_id is not None:
            queryset = queryset.filter(book_id=book_id)
        return queryset


class SutraViewSet(viewsets.ModelViewSet):
    queryset = Sutra.objects.all()
    serializer_class = SutraSerializer

    def get_queryset(self):
        queryset = Sutra.objects.all()
        section_id = self.request.query_params.get('section_id', None)
        if section_id is not None:
            queryset = queryset.filter(section_id=section_id)
        return queryset


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

    def get_queryset(self):
        queryset = Note.objects.all()
        sutra_id = self.request.query_params.get('sutra_id', None)
        section_id = self.request.query_params.get('section_id', None)
        if sutra_id is not None:
            queryset = queryset.filter(sutra_id=sutra_id)
        elif section_id is not None:
            queryset = queryset.filter(section_id=section_id)
        return queryset


class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all()
    serializer_class = TermSerializer

    def get_queryset(self):
        queryset = Term.objects.all()
        q = self.request.query_params.get('q', None)
        if q is not None:
            queryset = queryset.filter(
                Q(sanskrit_term_devanagari__icontains=q) | 
                Q(sanskrit_term_iast__icontains=q) |
                Q(definition__icontains=q)
            )
        return queryset
