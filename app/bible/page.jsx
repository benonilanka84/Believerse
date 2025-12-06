"use client";

import { useState, useEffect } from "react";

export default function BiblePage() {
  const [bibleData, setBibleData] = useState(null);
  const [selectedTranslation, setSelectedTranslation] = useState("en-kjv");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const translations = [
    { code: "en-kjv", name: "English (KJV)", flag: "🇬🇧" },
    { code: "hi-irv", name: "हिंदी (IRV)", flag: "🇮🇳" },
    { code: "ta-irv", name: "தமிழ் (IRV)", flag: "🇮🇳" },
    { code: "te-irv", name: "తెలుగు (IRV)", flag: "🇮🇳" },
    { code: "ml-irv", name: "മലയാളം (IRV)", flag: "🇮🇳" },
    { code: "kn-irv", name: "ಕನ್ನಡ (IRV)", flag: "🇮🇳" }
  ];

  useEffect(() => {
    loadBible(selectedTranslation);
  }, [selectedTranslation]);

  async function loadBible(translation) {
    setLoading(true);
    try {
      const response = await fetch(`/bible/${translation}.json`);
      const data = await response.json();
      setBibleData(data);
      
      if (!selectedBook && data.books.length > 0) {
        setSelectedBook(data.books[0]);
        setSelectedChapter(1);
      }
    } catch (error) {
      console.error("Error loading Bible:", error);
      alert(`Failed to load ${translation}. Please check if the file exists in /public/bible/`);
    }
    setLoading(false);
  }

  function handleBookSelect(book) {
    setSelectedBook(book);
    setSelectedChapter(1);
    setSearchResults([]);
  }

  function handleSearch() {
    if (!searchQuery.trim() || !bibleData) return;

    const results = [];
    const query = searchQuery.toLowerCase();

    bibleData.books.forEach(book => {
      book.chapters.forEach(chapter => {
        chapter.verses.forEach(verse => {
          if (verse.text.toLowerCase().includes(query)) {
            results.push({
              book: book.name,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text
            });
          }
        });
      });
    });

    setSearchResults(results);
  }

  const currentChapter = selectedBook?.chapters.find(c => c.chapter === selectedChapter);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #2e8b57 0%, #1d5d3a 100%)",
          padding: "20px 30px",
          borderRadius: "16px",
          color: "white",
          marginBottom: "20px"
        }}>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>📖 Holy Bible</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
            Read God's Word in multiple languages
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth > 768 ? "repeat(auto-fit, minmax(200px, 1fr))" : "1fr",
          gap: "15px",
          marginBottom: "20px"
        }}>
          
          {/* Translation Selector */}
          <div style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              fontSize: "14px",
              color: "#333"
            }}>
              Translation
            </label>
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {translations.map(t => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              fontSize: "14px",
              color: "#333"
            }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          {/* Search */}
          <div style={{
            background: "white",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            gridColumn: window.innerWidth > 768 ? "span 2" : "auto"
          }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              fontSize: "14px",
              color: "#333"
            }}>
              Search Scripture
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for verses..."
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: "10px 24px",
                  background: "#2e8b57",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{
            textAlign: "center",
            padding: "60px",
            background: "white",
            borderRadius: "12px"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>📖</div>
            <p>Loading Bible...</p>
          </div>
        ) : searchResults.length > 0 ? (
          /* Search Results */
          <div style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ margin: 0, color: "#0b2e4a" }}>
                Search Results ({searchResults.length})
              </h3>
              <button
                onClick={() => setSearchResults([])}
                style={{
                  padding: "8px 16px",
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            </div>

            {searchResults.map((result, i) => (
              <div
                key={i}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  borderLeft: "4px solid #2e8b57"
                }}
              >
                <div style={{
                  fontSize: "12px",
                  color: "#2e8b57",
                  fontWeight: "600",
                  marginBottom: "5px"
                }}>
                  {result.book} {result.chapter}:{result.verse}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.8"
                }}>
                  {result.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Bible Reader */
          <div style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth > 768 ? "250px 1fr" : "1fr",
            gap: "20px"
          }}>
            
            {/* Books Sidebar */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              maxHeight: window.innerWidth > 768 ? "80vh" : "300px",
              overflowY: "auto"
            }}>
              <h3 style={{
                margin: "0 0 15px 0",
                color: "#0b2e4a",
                fontSize: "18px"
              }}>
                Books
              </h3>
              {bibleData?.books.map((book, i) => (
                <div
                  key={i}
                  onClick={() => handleBookSelect(book)}
                  style={{
                    padding: "10px",
                    marginBottom: "5px",
                    background: selectedBook?.name === book.name ? "#e8f5e9" : "transparent",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: selectedBook?.name === book.name ? "600" : "normal",
                    color: selectedBook?.name === book.name ? "#2e8b57" : "#333"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBook?.name !== book.name) {
                      e.target.style.background = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBook?.name !== book.name) {
                      e.target.style.background = "transparent";
                    }
                  }}
                >
                  {book.name}
                </div>
              ))}
            </div>

            {/* Chapter Content */}
            <div style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
              {selectedBook ? (
                <>
                  {/* Chapter Header */}
                  <div style={{
                    marginBottom: "25px",
                    paddingBottom: "15px",
                    borderBottom: "2px solid #e0e0e0"
                  }}>
                    <h2 style={{
                      margin: "0 0 10px 0",
                      color: "#0b2e4a",
                      fontSize: "24px"
                    }}>
                      {selectedBook.name} - Chapter {selectedChapter}
                    </h2>

                    {/* Chapter Navigation */}
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap"
                    }}>
                      {selectedBook.chapters.map((ch, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedChapter(ch.chapter)}
                          style={{
                            padding: "8px 12px",
                            background: selectedChapter === ch.chapter ? "#2e8b57" : "#f0f0f0",
                            color: selectedChapter === ch.chapter ? "white" : "#333",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: selectedChapter === ch.chapter ? "600" : "normal"
                          }}
                        >
                          {ch.chapter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verses */}
                  <div>
                    {currentChapter?.verses.map((verse, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: "15px",
                          padding: "10px",
                          borderRadius: "8px",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9f9f9"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#2e8b57",
                          marginRight: "10px"
                        }}>
                          {verse.verse}
                        </span>
                        <span style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: "2",
                          color: "#333"
                        }}>
                          {verse.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "30px",
                    paddingTop: "20px",
                    borderTop: "2px solid #e0e0e0"
                  }}>
                    <button
                      onClick={() => selectedChapter > 1 && setSelectedChapter(selectedChapter - 1)}
                      disabled={selectedChapter === 1}
                      style={{
                        padding: "12px 24px",
                        background: selectedChapter === 1 ? "#e0e0e0" : "#2e8b57",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: selectedChapter === 1 ? "not-allowed" : "pointer",
                        fontWeight: "600"
                      }}
                    >
                      ← Previous
                    </button>

                    <button
                      onClick={() => selectedChapter < selectedBook.chapters.length && setSelectedChapter(selectedChapter + 1)}
                      disabled={selectedChapter === selectedBook.chapters.length}
                      style={{
                        padding: "12px 24px",
                        background: selectedChapter === selectedBook.chapters.length ? "#e0e0e0" : "#2e8b57",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: selectedChapter === selectedBook.chapters.length ? "not-allowed" : "pointer",
                        fontWeight: "600"
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "60px",
                  color: "#999"
                }}>
                  <div style={{ fontSize: "4rem", marginBottom: "15px" }}>📖</div>
                  <p>Select a book to start reading</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}