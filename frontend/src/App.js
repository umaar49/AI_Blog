import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function BlogApp() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [blogContent, setBlogContent] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("aiBlogHistory");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("aiBlogHistory", JSON.stringify(history));
  }, [history]);

  const handleNewDraft = () => {
    setSelectedBlog(null);
    setBlogContent("");
    setBlogTitle("");
    setTopic("");
    // Small delay then focus the input
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        input.disabled = false;
        input.focus();
      }
    }, 100);
  };

  const generateBlog = async () => {
    if (!topic.trim()) { alert("Please enter a topic."); return; }
    setLoading(true);
    setBlogContent("");
    setBlogTitle("");
    setSelectedBlog(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      if (response.ok) {
        const data = await response.json();
        setBlogTitle(data.blog_title);
        setBlogContent(data.content);
        const newEntry = {
          id: Date.now(),
          title: data.blog_title,
          content: data.content,
          topic: topic,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
        };
        setHistory(prev => [newEntry, ...prev]);
        setTopic("");
      } else {
        alert("Failed to generate blog. Check your backend.");
      }
    } catch (err) {
      alert("Backend server is offline.");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = (e, id) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedBlog?.id === id) handleNewDraft();
  };

  const convertMarkdown = (md) => {
    return md
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre style="background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;margin:16px 0;font-family:monospace;white-space:pre-wrap;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      })
      .replace(/^### (.+)$/gm, '<h3 style="color:#333;font-size:1.2em;margin-top:20px;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color:#111;font-size:1.5em;margin-top:30px;border-bottom:1px solid #eee;padding-bottom:6px;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:2em;border-bottom:2px solid #333;padding-bottom:10px;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="color:#555;">$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace;">$1</code>')
      .replace(/!\[(.+?)\]\(images\/(.+?)\)/g, `<figure style="margin:20px 0;"><img src="${API_BASE_URL}/images/$2" alt="$1" style="max-width:100%;border-radius:8px;display:block;"/><figcaption ...>$1</figcaption></figure>`)
      .replace(/^- (.+)$/gm, '<li style="margin:6px 0;color:#333;">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul style="padding-left:24px;margin:12px 0;">$1</ul>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #38bdf8;margin:16px 0;padding:10px 16px;background:#eff6ff;color:#555;border-radius:0 8px 8px 0;">$1</blockquote>')
      .replace(/\n\n(.+)/g, '<p style="color:#333;line-height:1.8;margin-bottom:12px;">$1</p>');
  };

  const downloadPDF = (content, title) => {
    const htmlContent = convertMarkdown(content);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html><html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; font-size: 16px; line-height: 1.8; color: #222; padding: 0 20px; }
          @media print { body { margin: 20px; } pre { white-space: pre-wrap; word-wrap: break-word; } }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = () => {
            const images = document.querySelectorAll('img');
            if (images.length === 0) { setTimeout(() => { window.print(); }, 500); }
            else {
              let loaded = 0;
              images.forEach(img => { img.onload = img.onerror = () => { loaded++; if (loaded === images.length) setTimeout(() => { window.print(); }, 500); }; });
              setTimeout(() => { window.print(); }, 5000);
            }
          };
        </script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const displayContent = selectedBlog ? selectedBlog.content : blogContent;
  const displayTitle = selectedBlog ? selectedBlog.title : blogTitle;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { width: 0%; } to { width: 100%; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-fade { animation: fadeIn 0.5s ease-out forwards; }
        .spinner { display: inline-block; animation: spin 1s linear infinite; font-size: 2rem; margin-bottom: 10px; }
        button { transition: all 0.2s ease-in-out; }
        button:hover { filter: brightness(1.1); }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .history-item:hover { background: rgba(255,255,255,0.05) !important; cursor: pointer; }
        .delete-btn { opacity: 0; transition: opacity 0.2s; }
        .history-item:hover .delete-btn { opacity: 1; }
        input:focus { border-color: rgba(56,189,248,0.6) !important; outline: none; }

        .markdown-body { color: #cbd5e1; }
        .markdown-body h1 { font-size: 2em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; color: #f8fafc; margin: 0 0 20px 0; }
        .markdown-body h2 { font-size: 1.5em; color: #38bdf8; margin-top: 32px; margin-bottom: 14px; font-weight: 600; }
        .markdown-body h3 { font-size: 1.2em; color: #7dd3fc; margin-top: 24px; margin-bottom: 10px; }
        .markdown-body p { color: #cbd5e1; line-height: 1.85; margin-bottom: 14px; font-size: 1rem; }
        .markdown-body strong { color: #f1f5f9; font-weight: 600; }
        .markdown-body em { color: #94a3b8; font-style: italic; }
        .markdown-body ul, .markdown-body ol { color: #cbd5e1; padding-left: 24px; margin-bottom: 14px; }
        .markdown-body li { margin: 8px 0; line-height: 1.7; }
        .markdown-body a { color: #38bdf8; text-decoration: underline; }
        .markdown-body code { background: rgba(0,0,0,0.35); color: #38bdf8; padding: 3px 7px; border-radius: 5px; font-size: 0.88em; font-family: 'Fira Code', monospace; }
        .markdown-body pre { background: #020617 !important; border: 1px solid #1e293b; border-radius: 10px; overflow-x: auto; margin: 20px 0; }
        .markdown-body pre code { background: none !important; color: #e2e8f0; padding: 0; font-size: 13px; }
        .markdown-body img { max-width: 100%; border-radius: 10px; margin: 24px 0; display: block; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .markdown-body blockquote { border-left: 3px solid #38bdf8; margin: 18px 0; padding: 12px 18px; background: rgba(56,189,248,0.05); border-radius: 0 10px 10px 0; color: #94a3b8; }
        .markdown-body hr { border: none; border-top: 1px solid #1e293b; margin: 24px 0; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        .markdown-body th { background: #1e293b; color: #38bdf8; padding: 10px 14px; text-align: left; }
        .markdown-body td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #94a3b8; }
      `}</style>

      {/* ── Floating open button — only visible when sidebar is CLOSED ── */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={styles.floatingOpenBtn}
          title="Open History"
        >
          ☰
        </button>
      )}

      {/* ── Sidebar ── */}
      <div
        className="sidebar"
        style={{
          ...styles.sidebar,
          width: isSidebarOpen ? '280px' : '0px',
          overflow: isSidebarOpen ? 'auto' : 'hidden',
        }}
      >
        {/* Sidebar header — hamburger lives here when open */}
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* ── Hamburger inside sidebar header ── */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={styles.hamburgerInside}
              title="Close History"
            >
              ☰
            </button>
            <span style={styles.sidebarTitle}>History</span>
          </div>
          <span style={styles.sidebarCount}>{history.length}</span>
        </div>

        {history.length === 0 ? (
          <div style={styles.emptyHistory}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗒️</div>
            No blogs yet.<br />Start writing!
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => { setSelectedBlog(item); setBlogContent(""); setTopic(item.topic); }}
              style={{
                ...styles.historyItem,
                background: selectedBlog?.id === item.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                borderLeft: selectedBlog?.id === item.id ? '3px solid #38bdf8' : '3px solid transparent',
              }}
            >
              <div style={styles.historyItemTitle}>{item.title}</div>
              <div style={styles.historyItemMeta}>🕐 {item.date} · {item.time}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadPDF(item.content, item.title); }}
                  style={styles.historyBtn}
                >⬇️ PDF</button>
                <button
                  className="delete-btn"
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  style={{ ...styles.historyBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Main ── */}
      <div style={styles.main}>
        <div style={styles.card} className="animate-fade">

          <h1 style={styles.title}>AI Blog Writer Agent</h1>
          <p style={styles.subtitle}>Transform your ideas into structured, professional technical articles.</p>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              type="text"
              placeholder="Enter topic (e.g., Quantum Computing Basics...)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && generateBlog()}
              style={styles.input}
              disabled={loading} 
            />
            <button
              onClick={generateBlog}
              disabled={loading}
              style={{ ...styles.generateBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? "Generating..." : "Generate Blog"}
            </button>
          </div>

          {/* Loader */}
          {loading && (
            <div style={styles.loaderBox}>
              <div className="spinner">⚙️</div>
              <div style={{ color: '#e2e8f0', fontWeight: '500', marginBottom: '12px' }}>Crafting your article...</div>
              <div style={styles.progressBar}>
                <div style={{ height: '100%', backgroundColor: '#38bdf8', borderRadius: '10px', animation: 'slideIn 2.5s ease-in-out infinite alternate' }} />
              </div>
            </div>
          )}

          {/* Output */}
          {displayContent && !loading && (
            <div style={styles.outputSection} className="animate-fade">
              <div style={styles.headerRow}>
                <h3 style={styles.blogTitleText}>
                  {displayTitle}
                  {selectedBlog && <span style={styles.historyBadge}>Archived</span>}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleNewDraft} style={styles.newDraftBtn}>✨ New Draft</button>
                  <button onClick={() => downloadPDF(displayContent, displayTitle)} style={styles.downloadBtn}>⬇️ Export PDF</button>
                </div>
              </div>

              <div style={styles.markdownBox}>
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ borderRadius: '10px', fontSize: '13px', margin: '16px 0' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code style={{ background: 'rgba(0,0,0,0.35)', color: '#38bdf8', padding: '3px 7px', borderRadius: '5px', fontSize: '0.88em' }} {...props}>
                            {children}
                          </code>
                        );
                      },
                      img({ src, alt }) {
                        const fullSrc = src.startsWith('http') ? src : `${API_BASE_URL}/${src}`;
                        return (
                          <img
                            src={fullSrc}
                            alt={alt}
                            style={{ maxWidth: '100%', borderRadius: '10px', margin: '24px 0', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                          />
                        );
                      },
                    }}
                  >
                    {displayContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!displayContent && !loading && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✍️</div>
              <div style={{ color: '#64748b', fontSize: '1.05rem' }}>Enter a topic above to generate an article.</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    fontFamily: '"Inter", system-ui, sans-serif',
    display: 'flex',
    overflow: 'hidden',
  },

  // ── Floating button — only when sidebar is closed ──
  floatingOpenBtn: {
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 1000,
    background: 'rgba(30,41,59,0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f8fafc',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },

  // ── Hamburger button inside sidebar header ──
  hamburgerInside: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '6px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  },

  // ── Sidebar ──
  sidebar: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    height: '100vh',
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 16px 14px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
  },
  sidebarTitle: { color: '#f8fafc', fontWeight: '600', fontSize: '14px' },
  sidebarCount: {
    background: '#1e293b',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  emptyHistory: { color: '#475569', fontSize: '13px', padding: '40px 20px', textAlign: 'center', lineHeight: '1.8' },
  historyItem: { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.15s' },
  historyItemTitle: { color: '#e2e8f0', fontSize: '13px', fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  historyItemMeta: { color: '#475569', fontSize: '11px', marginBottom: '6px' },
  historyBtn: { background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' },

  // ── Main ──
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    height: '100vh',
    padding: '60px 24px 60px 24px',
  },
  card: {
    backgroundColor: 'rgba(30,41,59,0.45)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    padding: '48px',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '860px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  title: { color: '#f8fafc', marginBottom: '10px', fontSize: '2.2rem', fontWeight: '800', textAlign: 'center', letterSpacing: '-0.5px' },
  subtitle: { color: '#64748b', fontSize: '1rem', marginBottom: '36px', textAlign: 'center' },
  inputRow: { display: 'flex', gap: '12px', marginBottom: '24px' },
  input: { flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.25)', color: '#f8fafc', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
  generateBtn: { backgroundColor: '#38bdf8', color: '#0f172a', padding: '0 28px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(56,189,248,0.25)' },
  loaderBox: { margin: '32px 0', textAlign: 'center', background: 'rgba(56,189,248,0.04)', padding: '28px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.15)' },
  progressBar: { height: '5px', width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', marginTop: '12px' },
  outputSection: { marginTop: '36px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '16px' },
  blogTitleText: { color: '#f8fafc', fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  historyBadge: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid rgba(245,158,11,0.2)' },
  newDraftBtn: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  downloadBtn: { background: '#f8fafc', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700' },
  markdownBox: { padding: '4px 0', maxHeight: '65vh', overflowY: 'auto' },
  emptyState: { marginTop: '60px', textAlign: 'center' },
};

export default BlogApp;