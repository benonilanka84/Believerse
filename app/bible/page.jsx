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
  const [fontSize, setFontSize] = useState(18); // Increased default for better readability

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function shareVerse(verse) {
    const book = getCurrentBook();
    const text = `"${verse.text}" - ${book?.name} ${selectedChapter}:${verse.verse}`;
    
    if (typeof window !== 'undefined') {
      if (window.navigator && window.navigator.share) {
        window.navigator.share({ title: 'Bible Verse', text: text }).catch(console.error);
      } else {
        window.navigator.clipboard.writeText(text);
        alert('Verse copied to clipboard!');
      }
    }
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafd" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px", animation: "pulse 2s infinite" }}>📖</div>
          <p style={{ color: "#0b2e4a", fontSize: "18px", fontWeight: "600" }}>Loading the Word...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* HEADER SECTION - REFINED WITH THEME COLORS */}
        <div style={{ 
          background: "linear-gradient(135deg, #0b2e4a 0%, #1a4f7a 100%)", 
          padding: "40px", 
          borderRadius: "20px", 
          color: "white", 
          marginBottom: "25px", 
          boxShadow: "0 10px 30px rgba(11, 46, 74, 0.1)" 
        }}>
          <h1 style={{ margin: 0, fontSize: "2.5rem", letterSpacing: "-1px" }}>📖 Holy Bible</h1>
          <div style={{ width: "60px", height: "4px", background: "#d4af37", borderRadius: "2px", margin: "15px 0" }}></div>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "1.1rem" }}>"Thy word is a lamp unto my feet, and a light unto my path."</p>
        </div>

        {/* CONTROLS SECTION */}
        <div style={{ background: "white", padding: "25px", borderRadius: "16px", marginBottom: "25px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "250px 1fr auto", gap: "20px", alignItems: "center" }}>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)} 
              style={{ padding: "14px", borderRadius: "10px", border: "2px solid #e1e8ed", fontSize: "14px", fontWeight: "700", color: "#0b2e4a", outline: "none" }}
            >
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code}>{lang.flag} {lang.name}</option>
              ))}
            </select>

            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                placeholder="Search the Word..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                style={{ width: "100%", padding: "14px 50px 14px 20px", borderRadius: "10px", border: "2px solid #e1e8ed", fontSize: "15px", outline: "none" }} 
              />
              <button onClick={handleSearch} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "#0b2e4a", color: "white", border: "none", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" }}>🔍</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} style={{ width: "40px", height: "40px", background: "#f0f4f8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>A-</button>
              <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} style={{ width: "40px", height: "40px", background: "#f0f4f8", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>A+</button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: "20px", padding: "20px", background: "#f9fbfd", borderRadius: "12px", border: "1px solid #e1e8ed", maxHeight: "400px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <strong style={{ color: "#0b2e4a" }}>Found {searchResults.length} verses</strong>
                <button onClick={() => setSearchResults([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#666" }}>×</button>
              </div>
              {searchResults.map((result, i) => (
                <div key={i} onClick={() => goToVerse(result)} style={{ padding: "15px", marginBottom: "10px", background: "white", borderRadius: "10px", cursor: "pointer", border: "1px solid #eee", borderLeft: "4px solid #d4af37", transition: "transform 0.2s" }}>
                  <div style={{ fontWeight: "700", color: "#0b2e4a", marginBottom: "5px" }}>{result.bookname} {result.chapter}:{result.verse}</div>
                  <div style={{ color: "#5a7184", fontSize: "14px", lineHeight: "1.5" }}>{result.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN READER LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "25px", alignItems: "start" }}>
          
          {/* SIDEBAR WITH FIXED CHAPTER LIST */}
          <aside style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "calc(100vh - 250px)", overflowY: "auto", position: "sticky", top: "20px" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#0b2e4a", fontSize: "1.1rem", fontWeight: "800", textTransform: "uppercase" }}>Books</h3>
            {bibleData?.books?.map((book) => {
              const isSelected = selectedBook === book.id;
              return (
                <div key={book.id} style={{ marginBottom: "5px" }}>
                  <button 
                    onClick={() => { setSelectedBook(book.id); setSelectedChapter(1); }} 
                    style={{ width: "100%", textAlign: "left", padding: "12px 15px", background: isSelected ? "#0b2e4a" : "transparent", color: isSelected ? "white" : "#333", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: isSelected ? "700" : "500", transition: "all 0.2s" }}
                  >
                    {book.name}
                  </button>
                  
                  {/* RESTORED: NESTED CHAPTER NUMBERS GRID */}
                  {isSelected && (
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(5, 1fr)", 
                        gap: "6px", 
                        padding: "15px 10px", 
                        background: "#f8fafd", 
                        borderRadius: "0 0 10px 10px",
                        marginTop: "-5px",
                        borderBottom: "1px solid #e1e8ed"
                    }}>
                      {book.chapters.map((ch) => (
                        <button 
                          key={ch.chapter} 
                          onClick={() => { setSelectedChapter(ch.chapter); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          style={{ 
                            padding: "8px 0", 
                            borderRadius: "6px", 
                            border: "none", 
                            background: selectedChapter === ch.chapter ? "#d4af37" : "white",
                            color: selectedChapter === ch.chapter ? "white" : "#0b2e4a",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                          }}
                        >
                          {ch.chapter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* CONTENT AREA */}
          <main style={{ background: "white", borderRadius: "20px", padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            
            {/* Navigation Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", paddingBottom: "25px", borderBottom: "2px solid #f0f4f8" }}>
              <button onClick={handlePrevChapter} style={{ padding: "12px 20px", background: "#f0f4f8", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", color: "#0b2e4a" }}>← Prev</button>
              
              <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: 0, color: "#0b2e4a", fontSize: "2.2rem", fontWeight: "800" }}>
                  {getCurrentBook()?.name} {selectedChapter}
                </h2>
                <p style={{ margin: "5px 0 0 0", color: "#5a7184", fontSize: "14px", fontWeight: "600" }}>Chapter {selectedChapter} of {getCurrentBook()?.chapters.length}</p>
              </div>

              <button onClick={handleNextChapter} style={{ padding: "12px 20px", background: "#f0f4f8", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", color: "#0b2e4a" }}>Next →</button>
            </div>

            {/* Verses Display */}
            <div style={{ marginBottom: "40px" }}>
              {verses.map((verse) => (
                <div key={verse.verse} style={{ display: "flex", gap: "20px", marginBottom: "25px", padding: "10px", borderRadius: "12px", transition: "background 0.2s" }}>
                  <div style={{ color: "#d4af37", fontWeight: "800", fontSize: "16px", minWidth: "35px", flexShrink: 0, paddingTop: "4px" }}>{verse.verse}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: "#2c3e50", lineHeight: "1.9", fontSize: `${fontSize}px`, fontWeight: "400" }}>{verse.text}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", opacity: 0.6 }}>
                    <button onClick={() => toggleBookmark(verse)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} title="Bookmark">{isBookmarked(verse) ? "🔖" : "📑"}</button>
                    <button onClick={() => shareVerse(verse)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }} title="Share">📤</button>
                  </div>
                </div>
              ))}
            </div>

            <footer style={{ paddingTop: "30px", borderTop: "2px solid #f0f4f8", textAlign: "center" }}>
              <p style={{ color: "#5a7184", fontSize: "14px" }}>End of {getCurrentBook()?.name} Chapter {selectedChapter}</p>
            </footer>
          </main>
        </div>

        {/* BOOKMARKS SECTION */}
        {bookmarks.length > 0 && (
          <section style={{ background: "#0b2e4a", borderRadius: "20px", padding: "30px", marginTop: "40px", color: "white" }}>
            <h3 style={{ margin: "0 0 25px 0", color: "#d4af37", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🔖</span> My Recent Bookmarks ({bookmarks.length})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {bookmarks.slice(-6).reverse().map((bookmark) => (
                <div key={bookmark.id} style={{ padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "15px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "background 0.2s" }} onClick={() => { setSelectedBook(bookmark.bookid); setSelectedChapter(bookmark.chapter); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                  <div style={{ fontWeight: "700", color: "#d4af37", marginBottom: "10px" }}>{bookmark.bookname} {bookmark.chapter}:{bookmark.verse}</div>
                  <div style={{ color: "#e1e8ed", fontSize: "14px", lineHeight: "1.6", fontStyle: "italic" }}>"{bookmark.text.substring(0, 120)}..."</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}