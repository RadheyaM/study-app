from django.contrib import admin
from .models import Book, StudySection, Sutra, Note, Term

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at')
    search_fields = ('title', 'author')

@admin.register(StudySection)
class StudySectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'book', 'parent', 'order')
    list_filter = ('book',)
    search_fields = ('title',)

@admin.register(Sutra)
class SutraAdmin(admin.ModelAdmin):
    list_display = ('id', 'section', 'order', 'devanagari_text')
    list_filter = ('section__book', 'section')
    search_fields = ('devanagari_text', 'transliteration_text', 'english_translation')

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'sutra', 'created_at')
    list_filter = ('section__book', 'section', 'sutra')
    search_fields = ('title', 'content', 'ref_sutra_devanagari')

@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ('sanskrit_term_iast', 'sanskrit_term_devanagari')
    search_fields = ('sanskrit_term_iast', 'sanskrit_term_devanagari', 'definition')
