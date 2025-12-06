"use client";
import { useState, useEffect } from "react";

export default function BibleWidget() {
  const [loading, setLoading] = useState(true);
  const [bibleData, setBibleData] = useState(null);
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(1);
  const [verseText, setVerseText] = useState("");

  // Load KJV by default for the widget
  useEffect(() => {
    fetch('/bible/en-kjv.json')
      .then(res => res.json())
      .then(data => {
        setBibleData(data);
        if (data.books?.length > 0) {
          setBook(data.books[0]); // Genesis
          loadVerse(data.books[0], 1, 1);
        }
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  function loadVerse(selectedBook, chapterNum, verseNum) {
    const chap = selectedBook.chapters.find(c => c.chapter === parseInt(chapterNum));
    const v = chap?.verses.find(v => v.verse === parseInt(verseNum));
    setVerseText(v ? v.text : "Verse not found.");
  }

  if (loading) return <div className="panel-card">Loading Word...</div>;

  return (
    <div className="panel-card" style={{borderLeft: "4px solid #0b2e4a"}}>
      <h3 style={{display:'flex', alignItems:'center', gap:'10px', margin:'0 0 15px 0'}}>
        📖 Quick Bible
      </h3>
      
      {/* Navigation */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', marginBottom:'10px'}}>
        <select 
          onChange={(e) => {
            const newBook = bibleData.books.find(b => b.id === e.target.value);
            setBook(newBook);
            setChapter(1);
            loadVerse(newBook, 1, 1);
          }}
          style={{padding:'5px', borderRadius:'4px', border:'1px solid #ddd'}}
        >
          {bibleData?.books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select 
          value={chapter}
          onChange={(e) => {
            setChapter(e.target.value);
            loadVerse(book, e.target.value, 1);
          }}
          style={{padding:'5px', borderRadius:'4px', border:'1px solid #ddd'}}
        >
          {book && Array.from({length: book.chapters.length}, (_, i) => (
            <option key={i+1} value={i+1}>Ch {i+1}</option>
          ))}
        </select>
      </div>

      {/* Reader */}
      <div style={{
        background:'#f8f9fa', 
        padding:'10px', 
        borderRadius:'8px', 
        fontSize:'14px', 
        lineHeight:'1.5',
        maxHeight:'150px',
        overflowY:'auto',
        borderLeft:'3px solid #2e8b57'
      }}>
        <strong>{book?.name} {chapter}:1</strong> <br/>
        {verseText}
      </div>
      
      <div style={{textAlign:'right', marginTop:'5px'}}>
        <a href="/bible" style={{fontSize:'12px', color:'#2e8b57', fontWeight:'bold', textDecoration:'none'}}>Open Full Bible →</a>
      </div>
    </div>
  );
}