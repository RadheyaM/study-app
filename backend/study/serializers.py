from rest_framework import serializers
from .models import Book, StudySection, Sutra, Note, Term

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

class StudySectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySection
        fields = '__all__'

# Recursive serializer for rendering the tree structure in the sidebar
class StudySectionTreeSerializer(serializers.ModelSerializer):
    subsections = serializers.SerializerMethodField()

    class Meta:
        model = StudySection
        fields = ['id', 'title', 'book', 'parent', 'order', 'subsections']

    def get_subsections(self, obj):
        children = obj.subsections.all()
        return StudySectionTreeSerializer(children, many=True, context=self.context).data

class SutraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sutra
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'

class TermSerializer(serializers.ModelSerializer):
    sutras = serializers.PrimaryKeyRelatedField(many=True, queryset=Sutra.objects.all(), required=False)
    notes = serializers.PrimaryKeyRelatedField(many=True, queryset=Note.objects.all(), required=False)

    class Meta:
        model = Term
        fields = '__all__'
