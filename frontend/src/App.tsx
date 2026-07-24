import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, FolderPlus, FileText, Search, Book as BookIcon, 
  Trash2, Edit, X 
} from 'lucide-react';
import { hkToDevanagari, hkToIast } from './sanscript';
import './index.css';

const API_BASE = 'http://localhost:8000/api';

interface Book {
  id: number;
  title: string;
  title_devanagari?: string | null;
  title_iast?: string | null;
  author?: string | null;
  description?: string | null;
}

interface Section {
  id: number;
  title: string;
  title_devanagari?: string | null;
  title_iast?: string | null;
  book: number;
  parent?: number | null;
  subsections?: Section[];
}

interface Sutra {
  id: number;
  section: number;
  devanagari_text: string;
  transliteration_text?: string;
  english_translation?: string;
  order: number;
}

interface Note {
  id: number;
  section?: number | null;
  sutra?: number | null;
  title: string;
  content: string;
  ref_sutra_devanagari?: string | null;
  ref_sutra_transliteration?: string | null;
  ref_sutra_translation?: string | null;
}

interface Term {
  id: number;
  sanskrit_term_devanagari: string;
  sanskrit_term_iast: string;
  definition: string;
  sutras: number[];
  notes: number[];
}

const getBookTitleDisplay = (book: Book | null): string => {
  if (!book) return '';
  if (book.title_iast) return book.title_iast;
  if (book.title_devanagari) return book.title_devanagari;
  return book.title;
};

const getSectionTitleDisplay = (sec: Section | null): string => {
  if (!sec) return '';
  if (sec.title_iast) return sec.title_iast;
  if (sec.title_devanagari) return sec.title_devanagari;
  return sec.title;
};

export default function App() {
  // Navigation & Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [sutras, setSutras] = useState<Sutra[]>([]);
  const [activeSutra, setActiveSutra] = useState<Sutra | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  // UI Control States
  const [showBookModal, setShowBookModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSutraModal, setShowSutraModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTermIndex, setShowTermIndex] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [termSearch, setTermSearch] = useState('');

  // Transliteration Tool Helper States
  const [hkHelperInput, setHkHelperInput] = useState('');
  const [hkHelperDev, setHkHelperDev] = useState('');
  const [hkHelperIast, setHkHelperIast] = useState('');

  // New Record Form States
  const [newBook, setNewBook] = useState({ title: '', title_devanagari: '', title_iast: '', author: '', description: '' });
  const [newSection, setNewSection] = useState({ title: '', title_devanagari: '', title_iast: '', parent: '' as string | number });
  const [newSutra, setNewSutra] = useState({ devanagari_text: '', transliteration_text: '', english_translation: '', order: 0 });
  const [newNote, setNewNote] = useState({ 
    title: '', content: '', 
    ref_sutra_devanagari: '', ref_sutra_transliteration: '', ref_sutra_translation: '' 
  });
  const [newTerm, setNewTerm] = useState({ sanskrit_term_devanagari: '', sanskrit_term_iast: '', definition: '' });

  // Edit Section States
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editSectionTitleDev, setEditSectionTitleDev] = useState('');
  const [editSectionTitleIast, setEditSectionTitleIast] = useState('');
  const [editSectionParent, setEditSectionParent] = useState<string | number>('');

  // Edit Book States
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookTitleDev, setEditBookTitleDev] = useState('');
  const [editBookTitleIast, setEditBookTitleIast] = useState('');
  const [editBookAuthor, setEditBookAuthor] = useState('');
  const [editBookDescription, setEditBookDescription] = useState('');

  // Edit Sutra States
  const [editingSutra, setEditingSutra] = useState<Sutra | null>(null);
  const [showEditSutraModal, setShowEditSutraModal] = useState(false);
  const [editSutraDevanagari, setEditSutraDevanagari] = useState('');
  const [editSutraTransliteration, setEditSutraTransliteration] = useState('');
  const [editSutraTranslation, setEditSutraTranslation] = useState('');
  const [editSutraOrder, setEditSutraOrder] = useState<number>(0);

  // Helper to flatten the section tree
  const getFlatSections = (sectionsList: Section[]): Section[] => {
    const flat: Section[] = [];
    const traverse = (list: Section[]) => {
      for (const s of list) {
        flat.push(s);
        if (s.subsections && s.subsections.length > 0) {
          traverse(s.subsections);
        }
      }
    };
    traverse(sectionsList);
    return flat;
  };

  // Load Initial Data
  useEffect(() => {
    fetchBooks();
    fetchTerms();
  }, []);

  // Sync active book tree
  useEffect(() => {
    if (activeBook) {
      fetchSectionTree(activeBook.id);
      setActiveSection(null);
      setSutras([]);
      setActiveSutra(null);
      setNotes([]);
    }
  }, [activeBook]);

  // Sync active section elements
  useEffect(() => {
    if (activeSection) {
      fetchSutras(activeSection.id);
      fetchSectionNotes(activeSection.id);
      setActiveSutra(null);
    }
  }, [activeSection]);

  // Sync active sutra notes
  useEffect(() => {
    if (activeSutra) {
      fetchSutraNotes(activeSutra.id);
    }
  }, [activeSutra]);

  // Update Transliteration Helper
  useEffect(() => {
    setHkHelperDev(hkToDevanagari(hkHelperInput));
    setHkHelperIast(hkToIast(hkHelperInput));
  }, [hkHelperInput]);

  // API Call Helpers
  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/books/`);
      const data = await res.json();
      setBooks(data);
      if (data.length > 0 && !activeBook) {
        setActiveBook(data[0]);
      }
    } catch (e) {
      console.error("Error fetching books", e);
    }
  };

  const fetchSectionTree = async (bookId: number) => {
    try {
      const res = await fetch(`${API_BASE}/books/${bookId}/tree/`);
      const data = await res.json();
      setSections(data);
    } catch (e) {
      console.error("Error fetching section tree", e);
    }
  };

  const fetchSutras = async (sectionId: number) => {
    try {
      const res = await fetch(`${API_BASE}/sutras/?section_id=${sectionId}`);
      const data = await res.json();
      setSutras(data);
      if (data.length > 0) {
        setActiveSutra(data[0]);
      } else {
        setActiveSutra(null);
      }
    } catch (e) {
      console.error("Error fetching sutras", e);
    }
  };

  const fetchSectionNotes = async (sectionId: number) => {
    try {
      const res = await fetch(`${API_BASE}/notes/?section_id=${sectionId}`);
      const data = await res.json();
      setNotes(data);
    } catch (e) {
      console.error("Error fetching section notes", e);
    }
  };

  const fetchSutraNotes = async (sutraId: number) => {
    try {
      const res = await fetch(`${API_BASE}/notes/?sutra_id=${sutraId}`);
      const data = await res.json();
      setNotes(data);
    } catch (e) {
      console.error("Error fetching sutra notes", e);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await fetch(`${API_BASE}/terms/`);
      const data = await res.json();
      setTerms(data);
    } catch (e) {
      console.error("Error fetching terms", e);
    }
  };

  // Submit Operations
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: newBook.title || newBook.title_iast || newBook.title_devanagari,
        title_devanagari: newBook.title_devanagari,
        title_iast: newBook.title_iast,
        author: newBook.author,
        description: newBook.description
      };
      const res = await fetch(`${API_BASE}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setBooks([...books, data]);
      setActiveBook(data);
      setShowBookModal(false);
      setNewBook({ title: '', title_devanagari: '', title_iast: '', author: '', description: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditBookClick = () => {
    if (!activeBook) return;
    setEditBookTitle(activeBook.title);
    setEditBookTitleDev(activeBook.title_devanagari || '');
    setEditBookTitleIast(activeBook.title_iast || '');
    setEditBookAuthor(activeBook.author || '');
    setEditBookDescription(activeBook.description || '');
    setShowEditBookModal(true);
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook) return;
    try {
      const payload = {
        title: editBookTitle || editBookTitleIast || editBookTitleDev,
        title_devanagari: editBookTitleDev,
        title_iast: editBookTitleIast,
        author: editBookAuthor,
        description: editBookDescription
      };
      const res = await fetch(`${API_BASE}/books/${activeBook.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setBooks(books.map(b => b.id === activeBook.id ? data : b));
      setActiveBook(data);
      setShowEditBookModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook) return;
    try {
      const payload = {
        title: newSection.title || newSection.title_iast || newSection.title_devanagari,
        title_devanagari: newSection.title_devanagari,
        title_iast: newSection.title_iast,
        book: activeBook.id,
        parent: newSection.parent ? Number(newSection.parent) : null
      };
      await fetch(`${API_BASE}/sections/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchSectionTree(activeBook.id);
      setShowSectionModal(false);
      setNewSection({ title: '', title_devanagari: '', title_iast: '', parent: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSectionClick = (section: Section) => {
    setEditingSection(section);
    setEditSectionTitle(section.title);
    setEditSectionTitleDev(section.title_devanagari || '');
    setEditSectionTitleIast(section.title_iast || '');
    setEditSectionParent(section.parent || '');
    setShowEditSectionModal(true);
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !activeBook) return;
    try {
      const payload = {
        title: editSectionTitle || editSectionTitleIast || editSectionTitleDev,
        title_devanagari: editSectionTitleDev,
        title_iast: editSectionTitleIast,
        book: activeBook.id,
        parent: editSectionParent ? Number(editSectionParent) : null
      };
      await fetch(`${API_BASE}/sections/${editingSection.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchSectionTree(activeBook.id);
      setShowEditSectionModal(false);
      setEditingSection(null);
      if (activeSection?.id === editingSection.id) {
        setActiveSection({ 
          ...activeSection, 
          title: payload.title,
          title_devanagari: editSectionTitleDev,
          title_iast: editSectionTitleIast,
          parent: editSectionParent ? Number(editSectionParent) : null 
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this section? This will delete all its subsections, sutras, and notes!")) return;
    try {
      await fetch(`${API_BASE}/sections/${id}/`, { method: 'DELETE' });
      if (activeBook) {
        fetchSectionTree(activeBook.id);
      }
      if (activeSection?.id === id) {
        setActiveSection(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSutra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSection) return;
    try {
      const payload = {
        ...newSutra,
        section: activeSection.id
      };
      const res = await fetch(`${API_BASE}/sutras/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSutras([...sutras, data]);
      if (!activeSutra) setActiveSutra(data);
      setShowSutraModal(false);
      setNewSutra({ devanagari_text: '', transliteration_text: '', english_translation: '', order: sutras.length + 1 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSutraClick = () => {
    if (!activeSutra) return;
    setEditingSutra(activeSutra);
    setEditSutraDevanagari(activeSutra.devanagari_text);
    setEditSutraTransliteration(activeSutra.transliteration_text || '');
    setEditSutraTranslation(activeSutra.english_translation || '');
    setEditSutraOrder(activeSutra.order || 0);
    setShowEditSutraModal(true);
  };

  const handleEditSutra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSutra || !activeSection) return;
    try {
      const payload = {
        section: activeSection.id,
        devanagari_text: editSutraDevanagari,
        transliteration_text: editSutraTransliteration,
        english_translation: editSutraTranslation,
        order: editSutraOrder
      };
      const res = await fetch(`${API_BASE}/sutras/${editingSutra.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSutras(sutras.map(s => s.id === editingSutra.id ? data : s));
      setActiveSutra(data);
      setShowEditSutraModal(false);
      setEditingSutra(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSection) return;
    try {
      const payload = {
        ...newNote,
        section: activeSutra ? null : activeSection.id,
        sutra: activeSutra ? activeSutra.id : null
      };
      const res = await fetch(`${API_BASE}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setNotes([...notes, data]);
      setShowNoteModal(false);
      setNewNote({ title: '', content: '', ref_sutra_devanagari: '', ref_sutra_transliteration: '', ref_sutra_translation: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newTerm,
        sutras: activeSutra ? [activeSutra.id] : [],
        notes: []
      };
      const res = await fetch(`${API_BASE}/terms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setTerms([...terms, data]);
      setShowTermModal(false);
      setNewTerm({ sanskrit_term_devanagari: '', sanskrit_term_iast: '', definition: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSutra = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Sutra?")) return;
    try {
      await fetch(`${API_BASE}/sutras/${id}/`, { method: 'DELETE' });
      setSutras(sutras.filter(s => s.id !== id));
      if (activeSutra?.id === id) {
        setActiveSutra(sutras[0] || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Note?")) return;
    try {
      await fetch(`${API_BASE}/notes/${id}/`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Sidebar tree rendering
  const renderSectionTree = (sectionsList: Section[], depth = 0) => {
    return sectionsList.map((sec) => (
      <div key={sec.id} style={{ marginLeft: `${depth * 12}px` }} className="section-tree-item">
        <div className={`section-item-row ${activeSection?.id === sec.id ? 'active' : ''}`}>
          <button 
            onClick={() => setActiveSection(sec)}
            className="sidebar-section-btn"
          >
            <FolderPlus size={16} className="icon-sep" />
            <span className="section-title-txt">{getSectionTitleDisplay(sec)}</span>
          </button>
          <div className="section-item-actions">
            <button 
              className="action-icon-btn" 
              onClick={(e) => {
                e.stopPropagation();
                handleEditSectionClick(sec);
              }}
              title="Rename / Move Section"
            >
              <Edit size={14} />
            </button>
            <button 
              className="action-icon-btn delete-action" 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSection(sec.id);
              }}
              title="Delete Section"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {sec.subsections && sec.subsections.length > 0 && (
          <div className="nested-sections-container">
            {renderSectionTree(sec.subsections, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Filtered terms
  const filteredTerms = terms.filter(t => 
    t.sanskrit_term_iast.toLowerCase().includes(termSearch.toLowerCase()) ||
    t.sanskrit_term_devanagari.includes(termSearch) ||
    t.definition.toLowerCase().includes(termSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* HEADER BAR */}
      <header className="main-header">
        <div className="header-branding">
          <BookOpen className="logo-icon" />
          <h1>Sanskrit Study Portal</h1>
        </div>

        <div className="header-controls">
          {/* Book Switcher */}
          <div className="book-switcher">
            <BookIcon size={18} className="control-icon" />
            <select 
              value={activeBook?.id || ''} 
              onChange={(e) => {
                const book = books.find(b => b.id === Number(e.target.value));
                if (book) setActiveBook(book);
              }}
              className="book-select"
            >
              <option value="" disabled>Select Work...</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{getBookTitleDisplay(b)}</option>
              ))}
            </select>
            {activeBook && (
              <button className="add-btn-small" style={{ backgroundColor: 'var(--text-secondary)', marginRight: '4px' }} onClick={handleEditBookClick} title="Rename / Edit Book">
                <Edit size={16} />
              </button>
            )}
            <button className="add-btn-small" onClick={() => setShowBookModal(true)} title="Add New Book">
              <Plus size={16} />
            </button>
          </div>

          <button className="term-index-toggle-btn" onClick={() => setShowTermIndex(!showTermIndex)}>
            <Search size={16} className="icon-sep" />
            Term Index ({terms.length})
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="workspace-body">
        
        {/* SIDEBAR: SECTIONS */}
        <aside className="sidebar-pane">
          <div className="pane-header-with-action">
            <h3>Chapters & Sections</h3>
            <button className="add-action-btn" onClick={() => setShowSectionModal(true)} title="Add Chapter/Section">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="sidebar-tree-content">
            {sections.length > 0 ? (
              renderSectionTree(sections)
            ) : (
              <p className="empty-state-text">No study sections added yet. Click the '+' icon above to start.</p>
            )}
          </div>

          {/* Quick Transliteration Helper Drawer at bottom of sidebar */}
          <div className="hk-transliterator-helper">
            <h4>⌨️ HK Transliteration Helper</h4>
            <input 
              type="text" 
              placeholder="Type HK here (e.g. yoga...)" 
              value={hkHelperInput}
              onChange={(e) => setHkHelperInput(e.target.value)}
              className="helper-input-field"
            />
            {hkHelperInput && (
              <div className="helper-previews">
                <div className="preview-row">
                  <span className="preview-label">Devanāgarī:</span>
                  <span className="preview-value devanagari-font">{hkHelperDev}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">IAST:</span>
                  <span className="preview-value">{hkHelperIast}</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN DISPLAY AREA (GITA SUPER SITE FORMAT) */}
        <main className="main-reading-pane">
          
          {activeSection ? (
            <div className="section-view-container">
              
              {/* Section Header */}
              <div className="section-main-heading">
                <h2>{getSectionTitleDisplay(activeSection)}</h2>
                <button className="add-sutra-btn" onClick={() => setShowSutraModal(true)}>
                  <Plus size={16} className="icon-sep" />
                  Add Sutra
                </button>
              </div>

              {/* Sutras Slider / Tabs (Gita-style navigation) */}
              {sutras.length > 0 && (
                <div className="sutras-horizontal-selector">
                  {sutras.map((s, idx) => (
                    <button 
                      key={s.id}
                      onClick={() => setActiveSutra(s)}
                      className={`sutra-tab-btn ${activeSutra?.id === s.id ? 'active' : ''}`}
                    >
                      Sūtra {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* ACTIVE SUTRA CONTAINER */}
              {activeSutra ? (
                <div className="sutra-central-card">
                  
                  {/* Sutra Main Panel (Gita Super Site Inspired) */}
                  <div className="sutra-primary-display">
                    <div className="sutra-display-header">
                      <span className="sutra-number-badge">Sūtra #{sutras.indexOf(activeSutra) + 1}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="delete-icon-btn" style={{ color: 'var(--text-secondary)' }} onClick={handleEditSutraClick} title="Edit Sutra">
                          <Edit size={16} />
                        </button>
                        <button className="delete-icon-btn" onClick={() => handleDeleteSutra(activeSutra.id)} title="Delete Sutra">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="sutra-content-layers">
                      {/* Devanagari Block */}
                      <div className="devanagari-layer devanagari-font">
                        {activeSutra.devanagari_text}
                      </div>

                      {/* Transliteration Block */}
                      {activeSutra.transliteration_text && (
                        <div className="transliteration-layer">
                          {activeSutra.transliteration_text}
                        </div>
                      )}

                      {/* English Translation Block */}
                      {activeSutra.english_translation && (
                        <div className="translation-layer">
                          <p className="translation-title">English Translation</p>
                          <p className="translation-body">{activeSutra.english_translation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMMENTARIES & PERSONAL NOTES (Below the primary text block) */}
                  <div className="commentaries-and-notes-wrapper">
                    <div className="notes-header-row">
                      <h3>Commentary & Notes</h3>
                      <button className="add-note-btn" onClick={() => setShowNoteModal(true)}>
                        <Plus size={14} className="icon-sep" /> Add Note
                      </button>
                    </div>

                    {notes.length > 0 ? (
                      <div className="notes-list-stack">
                        {notes.map((n) => (
                          <div key={n.id} className="note-card-item">
                            <div className="note-item-header">
                              <h4>{n.title || 'Untitled Observation'}</h4>
                              <button className="delete-icon-btn-small" onClick={() => handleDeleteNote(n.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            <div className="note-item-content">
                              {n.content}
                            </div>

                            {/* Optional Reference Sutra embedded in Note */}
                            {n.ref_sutra_devanagari && (
                              <div className="embedded-reference-sutra">
                                <span className="ref-badge">Cross-Reference Sutra</span>
                                <div className="ref-devanagari devanagari-font">{n.ref_sutra_devanagari}</div>
                                {n.ref_sutra_transliteration && (
                                  <div className="ref-transliteration">{n.ref_sutra_transliteration}</div>
                                )}
                                {n.ref_sutra_translation && (
                                  <div className="ref-translation">"{n.ref_sutra_translation}"</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-notes-hint">No notes added to this sūtra yet. Share your reflections by clicking 'Add Note'.</p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="no-sutra-placeholder">
                  <FileText size={48} className="placeholder-icon" />
                  <p>No sūtras added to this section yet.</p>
                  <button className="accent-action-btn" onClick={() => setShowSutraModal(true)}>
                    <Plus size={16} className="icon-sep" /> Create First Sūtra
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="welcome-workspace-screen">
              <div className="welcome-box">
                <BookOpen size={64} className="welcome-icon" />
                <h2>Select or Create a Chapter</h2>
                <p>Welcome to your personal Sanskrit Study Workspace. To get started, select a chapter from the sidebar or create a new study project.</p>
                {activeBook ? (
                  <button className="accent-action-btn" onClick={() => setShowSectionModal(true)}>
                    <Plus size={16} className="icon-sep" /> Create First Section
                  </button>
                ) : (
                  <button className="accent-action-btn" onClick={() => setShowBookModal(true)}>
                    <Plus size={16} className="icon-sep" /> Create Study Book
                  </button>
                )}
              </div>
            </div>
          )}

        </main>

        {/* TERM INDEX DRAWER */}
        {showTermIndex && (
          <aside className="term-index-drawer">
            <div className="drawer-header">
              <h3>Sanskrit Glossaries</h3>
              <button className="close-btn" onClick={() => setShowTermIndex(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-search-bar">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search terms..." 
                value={termSearch}
                onChange={(e) => setTermSearch(e.target.value)}
              />
            </div>

            <button className="add-term-full-btn" onClick={() => setShowTermModal(true)}>
              <Plus size={16} className="icon-sep" /> Create New Term
            </button>

            <div className="drawer-terms-list">
              {filteredTerms.length > 0 ? (
                filteredTerms.map((t) => (
                  <div key={t.id} className="term-dictionary-card">
                    <div className="term-card-titles">
                      <span className="term-iast">{t.sanskrit_term_iast}</span>
                      <span className="term-devanagari devanagari-font">{t.sanskrit_term_devanagari}</span>
                    </div>
                    <p className="term-definition-body">{t.definition}</p>
                  </div>
                ))
              ) : (
                <p className="empty-drawer-hint">No dictionary terms match your search.</p>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL POPUPS */}
      {/* ========================================================= */}

      {/* 1. BOOK MODAL */}
      {showBookModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Add Study Work / Book</h2>
              <button className="close-btn" onClick={() => setShowBookModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBook} className="modal-form">
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Type title in HK: e.g. yoga sUtrANi..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBook({
                      ...newBook,
                      title: val,
                      title_devanagari: hkToDevanagari(val),
                      title_iast: hkToIast(val)
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Title (Default / IAST) *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Yoga Sutras, yoga-sūtrāṇi..." 
                  value={newBook.title_iast || newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value, title_iast: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Title in Devanāgarī (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. योगसूत्राणि" 
                  value={newBook.title_devanagari}
                  onChange={(e) => setNewBook({ ...newBook, title_devanagari: e.target.value })}
                  className="devanagari-font"
                />
              </div>
              <div className="form-group">
                <label>Author / Commentator</label>
                <input 
                  type="text" 
                  placeholder="e.g. Patanjali, Vyasa..." 
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={3} 
                  placeholder="Notes about the edition, commentaries studied, etc."
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1B. EDIT BOOK MODAL */}
      {showEditBookModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Study Work / Book</h2>
              <button className="close-btn" onClick={() => setShowEditBookModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditBook} className="modal-form">
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Type title in HK to rename..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditBookTitle(val);
                    setEditBookTitleDev(hkToDevanagari(val));
                    setEditBookTitleIast(hkToIast(val));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Title (Default / IAST) *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Yoga Sutras, yoga-sūtrāṇi..." 
                  value={editBookTitleIast || editBookTitle}
                  onChange={(e) => {
                    setEditBookTitle(e.target.value);
                    setEditBookTitleIast(e.target.value);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Title in Devanāgarī (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. योगसूत्राणि" 
                  value={editBookTitleDev}
                  onChange={(e) => setEditBookTitleDev(e.target.value)}
                  className="devanagari-font"
                />
              </div>
              <div className="form-group">
                <label>Author / Commentator</label>
                <input 
                  type="text" 
                  placeholder="e.g. Patanjali, Vyasa..." 
                  value={editBookAuthor}
                  onChange={(e) => setEditBookAuthor(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={3} 
                  placeholder="Notes about the edition, commentaries studied, etc."
                  value={editBookDescription}
                  onChange={(e) => setEditBookDescription(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowEditBookModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SECTION MODAL */}
      {showSectionModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Add Study Section</h2>
              <button className="close-btn" onClick={() => setShowSectionModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSection} className="modal-form">
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Type section title in HK: e.g. samAdhipAdaH..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewSection({
                      ...newSection,
                      title: val,
                      title_devanagari: hkToDevanagari(val),
                      title_iast: hkToIast(val)
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Section Title (Default / IAST) *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Samadhi Pada, Chapter 1..." 
                  value={newSection.title_iast || newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value, title_iast: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Title in Devanāgarī (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. समाधिपादः" 
                  value={newSection.title_devanagari}
                  onChange={(e) => setNewSection({ ...newSection, title_devanagari: e.target.value })}
                  className="devanagari-font"
                />
              </div>
              <div className="form-group">
                <label>Parent Section (Optional - for nested subsections)</label>
                <select 
                  value={newSection.parent}
                  onChange={(e) => setNewSection({ ...newSection, parent: e.target.value })}
                >
                  <option value="">None (Top-Level)</option>
                  {getFlatSections(sections).map(s => (
                    <option key={s.id} value={s.id}>{getSectionTitleDisplay(s)}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowSectionModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Create Section</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2B. EDIT SECTION MODAL */}
      {showEditSectionModal && editingSection && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Study Section</h2>
              <button className="close-btn" onClick={() => { setShowEditSectionModal(false); setEditingSection(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSection} className="modal-form">
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Type title in HK to rename..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditSectionTitle(val);
                    setEditSectionTitleDev(hkToDevanagari(val));
                    setEditSectionTitleIast(hkToIast(val));
                  }}
                />
              </div>
              <div className="form-group">
                <label>Section Title (Default / IAST) *</label>
                <input 
                  type="text" required
                  placeholder="e.g. Samadhi Pada, Chapter 1..." 
                  value={editSectionTitleIast || editSectionTitle}
                  onChange={(e) => {
                    setEditSectionTitle(e.target.value);
                    setEditSectionTitleIast(e.target.value);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Title in Devanāgarī (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. समाधिपादः" 
                  value={editSectionTitleDev}
                  onChange={(e) => setEditSectionTitleDev(e.target.value)}
                  className="devanagari-font"
                />
              </div>
              <div className="form-group">
                <label>Parent Section (Optional - for nested subsections)</label>
                <select 
                  value={editSectionParent}
                  onChange={(e) => setEditSectionParent(e.target.value)}
                >
                  <option value="">None (Top-Level)</option>
                  {getFlatSections(sections)
                    .filter(s => s.id !== editingSection.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>{getSectionTitleDisplay(s)}</option>
                    ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => { setShowEditSectionModal(false); setEditingSection(null); }}>Cancel</button>
                <button type="submit" className="btn-pri">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SUTRA MODAL */}
      {showSutraModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-large">
            <div className="modal-header">
              <h2>Create New Sūtra</h2>
              <button className="close-btn" onClick={() => setShowSutraModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSutra} className="modal-form">
              
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional - supports multi-line)</label>
                <textarea 
                  rows={4}
                  placeholder="Type in HK format here to instantly auto-populate Devanāgarī and IAST below: e.g. atha yogAnuSAsanam..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewSutra({
                      ...newSutra,
                      devanagari_text: hkToDevanagari(val),
                      transliteration_text: hkToIast(val)
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label>Devanāgarī Script *</label>
                <textarea 
                  rows={3} required
                  placeholder="अथ योगानुशासनम्" 
                  value={newSutra.devanagari_text}
                  onChange={(e) => setNewSutra({ ...newSutra, devanagari_text: e.target.value })}
                  className="devanagari-font"
                />
              </div>

              <div className="form-group">
                <label>IAST Diacritics Transliteration</label>
                <textarea 
                  rows={3}
                  placeholder="atha yogānuśāsanam" 
                  value={newSutra.transliteration_text}
                  onChange={(e) => setNewSutra({ ...newSutra, transliteration_text: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>English Translation</label>
                <textarea 
                  rows={4}
                  placeholder="Now begins the instruction on Yoga." 
                  value={newSutra.english_translation}
                  onChange={(e) => setNewSutra({ ...newSutra, english_translation: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowSutraModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Save Sūtra</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3B. EDIT SUTRA MODAL */}
      {showEditSutraModal && editingSutra && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-large">
            <div className="modal-header">
              <h2>Edit Sūtra</h2>
              <button className="close-btn" onClick={() => { setShowEditSutraModal(false); setEditingSutra(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSutra} className="modal-form">
              
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional - supports multi-line)</label>
                <textarea 
                  rows={4}
                  placeholder="Type in HK format here to instantly auto-populate Devanāgarī and IAST below: e.g. atha yogAnuSAsanam..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditSutraDevanagari(hkToDevanagari(val));
                    setEditSutraTransliteration(hkToIast(val));
                  }}
                />
              </div>

              <div className="form-group">
                <label>Devanāgarī Script *</label>
                <textarea 
                  rows={3} required
                  placeholder="अथ योगानुशासनम्" 
                  value={editSutraDevanagari}
                  onChange={(e) => setEditSutraDevanagari(e.target.value)}
                  className="devanagari-font"
                />
              </div>

              <div className="form-group">
                <label>IAST Diacritics Transliteration</label>
                <textarea 
                  rows={3}
                  placeholder="atha yogānuśāsanam" 
                  value={editSutraTransliteration}
                  onChange={(e) => setEditSutraTransliteration(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>English Translation</label>
                <textarea 
                  rows={4}
                  placeholder="Now begins the instruction on Yoga." 
                  value={editSutraTranslation}
                  onChange={(e) => setEditSutraTranslation(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => { setShowEditSutraModal(false); setEditingSutra(null); }}>Cancel</button>
                <button type="submit" className="btn-pri">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. NOTE MODAL */}
      {showNoteModal && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-large">
            <div className="modal-header">
              <h2>Add Commentary / Note</h2>
              <button className="close-btn" onClick={() => setShowNoteModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddNote} className="modal-form">
              
              <div className="form-group">
                <label>Note Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vyasa's exposition of Chitta..." 
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Commentary Body *</label>
                <textarea 
                  rows={4} required
                  placeholder="Write your study notes and analysis..." 
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
              </div>

              {/* Reference Sutra Section (Matching main Sutra structure) */}
              <div className="reference-sutra-collapsible-form">
                <h3>📖 Add Reference Sūtra (Optional)</h3>
                <p className="field-subtitle">If you are referencing another work, you can add structured scripture fields below.</p>
                
                {/* HK helper trigger inside form */}
                <input 
                  type="text"
                  placeholder="Type reference in HK format to auto-populate fields..."
                  className="hk-ref-helper-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewNote({
                      ...newNote,
                      ref_sutra_devanagari: hkToDevanagari(val),
                      ref_sutra_transliteration: hkToIast(val)
                    });
                  }}
                />

                <div className="ref-sutra-fields-grid">
                  <div className="form-group">
                    <label>Reference Devanāgarī</label>
                    <input 
                      type="text" 
                      placeholder="e.g. तस्य वाचकः प्रणवः" 
                      value={newNote.ref_sutra_devanagari}
                      onChange={(e) => setNewNote({ ...newNote, ref_sutra_devanagari: e.target.value })}
                      className="devanagari-font"
                    />
                  </div>
                  <div className="form-group">
                    <label>Reference IAST</label>
                    <input 
                      type="text" 
                      placeholder="e.g. tasya vācakaḥ praṇavaḥ" 
                      value={newNote.ref_sutra_transliteration}
                      onChange={(e) => setNewNote({ ...newNote, ref_sutra_transliteration: e.target.value })}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Reference Translation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. His word is Om." 
                      value={newNote.ref_sutra_translation}
                      onChange={(e) => setNewNote({ ...newNote, ref_sutra_translation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowNoteModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TERM MODAL */}
      {showTermModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Define New Sanskrit Term</h2>
              <button className="close-btn" onClick={() => setShowTermModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTerm} className="modal-form">
              
              <div className="form-group">
                <label>Harvard-Kyoto Typing Assistant (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Type term in HK: e.g. puruSa..." 
                  className="assistant-input"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTerm({
                      ...newTerm,
                      sanskrit_term_devanagari: hkToDevanagari(val),
                      sanskrit_term_iast: hkToIast(val)
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label>Term in Devanāgarī *</label>
                <input 
                  type="text" required
                  placeholder="पुरुष" 
                  value={newTerm.sanskrit_term_devanagari}
                  onChange={(e) => setNewTerm({ ...newTerm, sanskrit_term_devanagari: e.target.value })}
                  className="devanagari-font"
                />
              </div>

              <div className="form-group">
                <label>Term in IAST Transliteration *</label>
                <input 
                  type="text" required
                  placeholder="puruṣa" 
                  value={newTerm.sanskrit_term_iast}
                  onChange={(e) => setNewTerm({ ...newTerm, sanskrit_term_iast: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Definition & Philosophical Context *</label>
                <textarea 
                  rows={4} required
                  placeholder="Enter the philosophical meaning, etymology, and definitions..." 
                  value={newTerm.definition}
                  onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-sec" onClick={() => setShowTermModal(false)}>Cancel</button>
                <button type="submit" className="btn-pri">Save Term</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
