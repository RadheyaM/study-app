from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Book, StudySection, Sutra, Note, Term

class StudyPortalAPITests(APITestCase):

    def setUp(self):
        # Create a sample Book
        self.book = Book.objects.create(
            title="Yoga Sutras",
            author="Patanjali",
            description="Foundational text of Yoga"
        )
        
        # Create nested study sections
        self.section_chapter1 = StudySection.objects.create(
            book=self.book,
            title="Samadhi Pada",
            order=1
        )
        self.section_sub = StudySection.objects.create(
            book=self.book,
            title="Introduction to Concentration",
            parent=self.section_chapter1,
            order=1
        )
        
        # Create a sample Sutra
        self.sutra = Sutra.objects.create(
            section=self.section_chapter1,
            devanagari_text="अथ योगानुशासनम्",
            transliteration_text="atha yogānuśāsanam",
            english_translation="Now begins the instruction on Yoga.",
            order=1
        )

        # Create a sample Note
        self.note = Note.objects.create(
            sutra=self.sutra,
            title="Introductory exposition",
            content="This sutra marks the auspicious beginning of the text.",
            ref_sutra_devanagari="तस्य वाचकः प्रणवः",
            ref_sutra_transliteration="tasya vācakaḥ praṇavaḥ",
            ref_sutra_translation="His sound is Om."
        )

        # Create a Term
        self.term = Term.objects.create(
            sanskrit_term_devanagari="योग",
            sanskrit_term_iast="yoga",
            definition="Union or concentration of mind."
        )

    def test_get_books_list(self):
        url = reverse('book-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Yoga Sutras")

    def test_get_book_section_tree(self):
        # Test the custom detail action on BookViewSet: tree
        url = reverse('book-tree', args=[self.book.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only Samadhi Pada is root
        self.assertEqual(response.data[0]['title'], "Samadhi Pada")
        self.assertEqual(len(response.data[0]['subsections']), 1)  # Includes sub section
        self.assertEqual(response.data[0]['subsections'][0]['title'], "Introduction to Concentration")

    def test_create_sutra(self):
        url = reverse('sutra-list')
        data = {
            "section": self.section_chapter1.id,
            "devanagari_text": "योगश्चित्तवृत्तिनिरोधः",
            "transliteration_text": "yogaś-citta-vṛtti-nirodhaḥ",
            "english_translation": "Yoga is the inhibition of the modifications of the mind.",
            "order": 2
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_214_CREATED if hasattr(status, 'HTTP_214_CREATED') else status.HTTP_211_CREATED if hasattr(status, 'HTTP_211_CREATED') else status.HTTP_201_CREATED)
        self.assertEqual(Sutra.objects.count(), 2)

    def test_get_sutras_filtered_by_section(self):
        url = f"{reverse('sutra-list')}?section_id={self.section_chapter1.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['devanagari_text'], "अथ योगानुशासनम्")

    def test_create_note_with_reference_sutra(self):
        url = reverse('note-list')
        data = {
            "sutra": self.sutra.id,
            "title": "Vyasa Commentary note",
            "content": "Deep details regarding samadhi.",
            "ref_sutra_devanagari": "तदा द्रष्टुः स्वरूपेऽवस्थानम्",
            "ref_sutra_transliteration": "tadā draṣṭuḥ svarūpe'vasthānam",
            "ref_sutra_translation": "Then the seer abides in his own nature."
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_214_CREATED if hasattr(status, 'HTTP_214_CREATED') else status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 2)
        new_note = Note.objects.get(title="Vyasa Commentary note")
        self.assertEqual(new_note.ref_sutra_devanagari, "तदा द्रष्टुः स्वरूपेऽवस्थानम्")

    def test_term_search(self):
        # Search by IAST
        url = f"{reverse('term-list')}?q=yo"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['sanskrit_term_iast'], "yoga")

        # Search with no matches
        url = f"{reverse('term-list')}?q=purusa"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
