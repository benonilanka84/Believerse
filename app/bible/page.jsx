"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BiblePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-kjv');
  const [bibleData, setBibleData] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  // --- NEW: STATE FOR QUICK CHAPTER PICKER ---
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  const languages = {
    'en-kjv': { name: 'English (KJV)', flag: '🇬🇧', file: 'en-kjv.json' },
    'hi-irv': { name: 'हिंदी (Hindi IRV)', flag: '🇮🇳', file: 'hi-irv.json' },
    'te-irv': { name: 'తెలుగు (Telugu IRV)', flag: '🇮🇳', file: 'te-irv.json' },
    'ml-irv': { name: 'മലയാളം (Malayalam IRV)', flag: '🇮🇳', file: 'ml-irv.json' },
    'ta-irv': { name: 'தமிழ் (Tamil IRV)', flag: '🇮🇳', file: 'ta-irv.json' },
    'kn-irv': { name: 'ಕನ್ನಡ (Kannada IRV)', flag: '🇮🇳', file: 'kn-irv.json' }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(`bible_bookmarks_${data.user.id}`);
          if (saved) setBookmarks(JSON.parse(saved));
        }
      }
    }
    loadUser();
  }, [mounted]);

  useEffect(() => {
    if (mounted) loadBibleData();
  }, [selectedLanguage, mounted]);

  async function loadBibleData() {
    setLoading(true);
    try {
      const response = await fetch(`/bible/${languages[selectedLanguage].file}`);
      if (!response.ok) throw new Error(`Failed to load Bible`);
      
      const data = await response.json();
      setBibleData(data);
      
      if (!selectedBook && data.books && data.books.length > 0) {
        setSelectedBook(data.books[0].id);
        setSelectedChapter(1);
        loadVerses(data, data.books[0].id, 1);
      } else if (selectedBook) {
        loadVerses(data, selectedBook, selectedChapter);
      }
    } catch (error) {
      console.error('Error loading Bible data:', error);
    } finally {
      setLoading(false);
    }
  }

  function loadVerses(data, bookId, chapterNum) {
    if (!data || !data.books) return;
    const book = data.books.find(b => b.id === bookId);
    if (!book) return;
    const chapter = book.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) return;
    setVerses(chapter.verses || []);
  }

  useEffect(() => {
    if (bibleData && selectedBook && mounted) {
      loadVerses(bibleData, selectedBook, selectedChapter);
    }
  }, [selectedBook, selectedChapter, bibleData, mounted]);

  function toggleBookmark(verse) {
    if (!user || typeof window === 'undefined') return;
    
    const bookmarkId = `${selectedBook}-${selectedChapter}-${verse.verse}`;
    const book = getCurrentBook();
    const bookmark = {
      id: bookmarkId,
      bookid: selectedBook,
      bookname: book?.name || selectedBook,
      chapter: selectedChapter,
      verse: verse.verse,
      text: verse.text,
      timestamp: new Date().toISOString()
    };
    
    let newBookmarks;
    if (bookmarks.some(b => b.id === bookmarkId)) {
      newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    } else {
      newBookmarks = [...bookmarks, bookmark];
    }
    
    setBookmarks(newBookmarks);
    localStorage.setItem(`bible_bookmarks_${user.id}`, JSON.stringify(newBookmarks));
  }

  function isBookmarked(verse) {
    const bookmarkId = `${selectedBook}-${selectedChapter}-${verse.verse}`;
    return bookmarks.some(b => b.id === bookmarkId);
  }

  function handleSearch() {
    if (!searchQuery.trim() || !bibleData) return;
    const query = searchQuery.toLowerCase();
    const results = [];
    
    bibleData.books.forEach(book => {
      book.chapters.forEach(chapter => {
        chapter.verses.forEach(verse => {
          if (verse.text.toLowerCase().includes(query)) {
            results.push({
              bookid: book.id,
              bookname: book.name,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text
            });
          }
        });
      });
    });
    setSearchResults(results.slice(0, 50));
  }

  function goToVerse(result) {
    setSelectedBook(result.bookid);
    setSelectedChapter(result.chapter);
    setSearchQuery('');
    setSearchResults([]);
  }

  const getCurrentBook = () => bibleData?.books?.find(b => b.id === selectedBook);

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const currentBookIndex = bibleData.books.findIndex(b => b.id === selectedBook);
      if (currentBookIndex > 0) {
        const prevBook = bibleData.books[currentBookIndex - 1];
        setSelectedBook(prevBook.id);
        setSelectedChapter(prevBook.chapters.length);
      }
    }
  };

  const handleNextChapter = () => {
    const book = getCurrentBook();
    if (book && selectedChapter < book.chapters.length) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const currentBookIndex = bibleData.books.findIndex(b => b.id === selectedBook);
      if (currentBookIndex < bibleData.books.length - 1) {
        const nextBook = bibleData.books[currentBookIndex + 1];
        setSelectedBook(nextBook.id);
        setSelectedChapter(1);
      }
    }
  };

  function shareVerse(verse) {
    const book = getCurrentBook();
    const text = `"${verse.text}" - ${book?.name} ${selectedChapter}:${verse.verse}`;
    
    if (typeof window !== 'undefined') {
      if (window.navigator && window.navigator.share) {
        window.navigator.share({
          title: 'Bible Verse',
          text: text
        }).catch(console.error);
      } else if (window.navigator && window.navigator.clipboard) {
        window.navigator.clipboard.writeText(text);
        alert('Verse copied to clipboard!');
      }
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#b4dcff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>📖</div>
          <p style={{ color: "#0b2e4a", fontSize: "18px" }}>Loading Bible...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", background: "#b4dcff", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)", padding: "30px", borderRadius: "16px", color: "white", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <h1 style={{ margin: 0, fontSize: "2.2rem" }}>📖 Holy Bible</h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "1.1rem" }}>Read the Word of God in your language</p>
        </div>

        {/* Controls */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "15px", alignItems: "center", marginBottom: "15px" }}>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>{lang.flag} {lang.name}</option>
              ))}
            </select>

            <div style={{ position: "relative" }}>
              <input type="text" placeholder="Search verses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} style={{ width: "100%", padding: "12px 45px 12px 15px", borderRadius: "8px", border: "2px solid #e0e0e0", fontSize: "14px" }} />
              <button onClick={handleSearch} style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", background: "#2e8b57", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>🔍</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} style={{ padding: "8px 12px", background: "#f0f0f0", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>A-</button>
              <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} style={{ padding: "8px 12px", background: "#f0f0f0", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>A+</button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "8px", maxHeight: "300px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ color: "#0b2e4a" }}>Found {searchResults.length} verses</strong>
                <button onClick={() => setSearchResults([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
              </div>
              {searchResults.map((result, i) => (
                <div key={i} onClick={() => goToVerse(result)} style={{ padding: "10px", marginBottom: "8px", background: "white", borderRadius: "6px", cursor: "pointer", borderLeft: "3px solid #2e8b57" }}>
                  <div style={{ fontWeight: "600", color: "#2e8b57", marginBottom: "5px", fontSize: "13px" }}>{result.bookname} {result.chapter}:{result.verse}</div>
                  <div style={{ color: "#666", fontSize: "14px" }}>{result.text.substring(0, 150)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reader Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
          
          {/* Sidebar */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", maxHeight: "calc(100vh - 300px)", overflowY: "auto", position: "sticky", top: "20px" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#0b2e4a" }}>Books</h3>
            {bibleData?.books?.map((book) => (
              <button key={book.id} onClick={() => { setSelectedBook(book.id); setSelectedChapter(1); }} style={{ width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: "4px", background: selectedBook === book.id ? "#2e8b57" : "transparent", color: selectedBook === book.id ? "white" : "#333", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: selectedBook === book.id ? "600" : "normal", transition: "all 0.2s" }}>
                {book.name}
              </button>
            ))}
          </div>

          {/* Reader Content */}
          <div style={{ background: "white", borderRadius: "12px", padding: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            
            {/* --- UPDATED: CHAPTER NAV WITH INSTANT PICKER --- */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #f0f0f0", position: 'relative' }}>
              <button onClick={handlePrevChapter} style={{ padding: "10px 20px", background: "#f0f0f0", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>← Previous</button>
              
              <div style={{ textAlign: "center", position: 'relative' }}>
                <h2 
                  onClick={() => setShowChapterPicker(!showChapterPicker)}
                  style={{ margin: 0, color: "#0b2e4a", fontSize: "28px", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {getCurrentBook()?.name} {selectedChapter} <span style={{fontSize: '18px'}}>{showChapterPicker ? '▲' : '▼'}</span>
                </h2>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>Chapter {selectedChapter} of {getCurrentBook()?.chapters.length}</p>

                {/* Instant Chapter Picker Overlay */}
                {showChapterPicker && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "white",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    borderRadius: "12px",
                    padding: "20px",
                    zIndex: 100,
                    marginTop: "10px",
                    width: "280px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                    maxHeight: "250px",
                    overflowY: "auto",
                    border: '1px solid #eee'
                  }}>
                    {Array.from({ length: getCurrentBook()?.chapters.length || 0 }, (_, i) => i + 1).map((chapter) => (
                      <button
                        key={chapter}
                        onClick={() => {
                          setSelectedChapter(chapter);
                          setShowChapterPicker(false);
                        }}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: selectedChapter === chapter ? "none" : "1px solid #eee",
                          background: selectedChapter === chapter ? "#2e8b57" : "white",
                          color: selectedChapter === chapter ? "white" : "#333",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        {chapter}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleNextChapter} style={{ padding: "10px 20px", background: "#f0f0f0", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Next →</button>
            </div>

            {/* Verses */}
            <div style={{ marginBottom: "30px" }}>
              {verses.map((verse) => (
                <div key={verse.verse} style={{ display: "flex", gap: "15px", marginBottom: "20px", padding: "15px", borderRadius: "8px", transition: "background 0.2s" }}>
                  <div style={{ color: "#2e8b57", fontWeight: "bold", fontSize: "14px", minWidth: "30px", flexShrink: 0 }}>{verse.verse}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: "#333", lineHeight: "1.8", fontSize: `${fontSize}px` }}>{verse.text}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => toggleBookmark(verse)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>{isBookmarked(verse) ? "🔖" : "📑"}</button>
                    <button onClick={() => shareVerse(verse)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>📤</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Chapter Jump List at bottom */}
            <div style={{ paddingTop: "20px", borderTop: "2px solid #f0f0f0" }}>
              <p style={{ color: "#666", marginBottom: "15px", fontSize: "14px" }}>Quick jump:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(45px, 1fr))", gap: "8px" }}>
                {Array.from({ length: getCurrentBook()?.chapters.length || 0 }, (_, i) => i + 1).map((chapter) => (
                  <button key={chapter} onClick={() => setSelectedChapter(chapter)} style={{ padding: "10px", background: selectedChapter === chapter ? "#2e8b57" : "#f0f0f0", color: selectedChapter === chapter ? "white" : "#333", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: selectedChapter === chapter ? "600" : "normal" }}>
                    {chapter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <div style={{ background: "white", borderRadius: "12px", padding: "25px", marginTop: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0b2e4a" }}>🔖 My Bookmarks ({bookmarks.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
              {bookmarks.slice(-10).reverse().map((bookmark) => (
                <div key={bookmark.id} style={{ padding: "15px", background: "#f9f9f9", borderRadius: "8px", borderLeft: "3px solid #2e8b57", cursor: "pointer" }} onClick={() => { setSelectedBook(bookmark.bookid); setSelectedChapter(bookmark.chapter); }}>
                  <div style={{ fontWeight: "600", color: "#2e8b57", marginBottom: "8px", fontSize: "14px" }}>{bookmark.bookname} {bookmark.chapter}:{bookmark.verse}</div>
                  <div style={{ color: "#666", fontSize: "14px", lineHeight: "1.6" }}>{bookmark.text.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}