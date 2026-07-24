from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=255)
    title_devanagari = models.CharField(max_length=255, blank=True, null=True)
    title_iast = models.CharField(max_length=255, blank=True, null=True)
    author = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title_iast if self.title_iast else self.title


class StudySection(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=255)
    title_devanagari = models.CharField(max_length=255, blank=True, null=True)
    title_iast = models.CharField(max_length=255, blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subsections'
    )
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.book.title} - {self.title}"


class Sutra(models.Model):
    section = models.ForeignKey(StudySection, on_delete=models.CASCADE, related_name='sutras')
    devanagari_text = models.TextField()
    transliteration_text = models.TextField(blank=True, null=True)  # IAST
    english_translation = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        # Short preview of Devanagari or first 30 chars
        preview = self.devanagari_text[:30] if self.devanagari_text else "Sutra"
        return f"{self.section.title} - {preview}..."


class Note(models.Model):
    # A note can belong directly to a section or specifically to a single Sutra
    section = models.ForeignKey(
        StudySection,
        on_delete=models.CASCADE,
        related_name='notes',
        null=True,
        blank=True
    )
    sutra = models.ForeignKey(
        Sutra,
        on_delete=models.CASCADE,
        related_name='notes',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(help_text="Personal commentary or observations (Markdown supported)")
    
    # Reference Sutra fields (Optional, matching the main Sutra structure)
    ref_sutra_devanagari = models.TextField(blank=True, null=True)
    ref_sutra_transliteration = models.TextField(blank=True, null=True)
    ref_sutra_translation = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or f"Note on {self.sutra or self.section}"


class Term(models.Model):
    sanskrit_term_devanagari = models.CharField(max_length=255)
    sanskrit_term_iast = models.CharField(max_length=255)
    definition = models.TextField()
    
    # Associations for index linking
    sutras = models.ManyToManyField(Sutra, blank=True, related_name='associated_terms')
    notes = models.ManyToManyField(Note, blank=True, related_name='associated_terms')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sanskrit_term_iast} ({self.sanskrit_term_devanagari})"
