# Session Architecture & Source Information Flow

## 🔒 Question 1: Are PDFs Shared Between Sessions?

### **Answer: NO - Sessions are COMPLETELY ISOLATED**

Each session has its own separate vector database collection. PDFs uploaded in one session are **NOT** accessible to other sessions.

### How Session Isolation Works:

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

Session A (session_id: "abc123...")
├── ChromaDB Collection: "tutor_session_abc123..."
├── Documents: [document1.pdf, document2.pdf]
└── Vector Embeddings: Only for Session A's documents

Session B (session_id: "xyz789...")
├── ChromaDB Collection: "tutor_session_xyz789..."
├── Documents: [document3.pdf]
└── Vector Embeddings: Only for Session B's documents

❌ NO CROSS-CONTAMINATION
✅ Each session is completely independent
```

### Code Evidence:

**1. Collection Creation (vector_manager.py:19-22)**
```python
def _get_collection_name(self, session_id: str) -> str:
    # Each session gets its own collection
    return f"tutor_session_{session_id}"
```

**2. Document Storage (vector_manager.py:40-71)**
```python
def add_documents(self, session_id: str, texts: List[str], metadatas: List[Dict]):
    collection = self.get_collection(session_id)  # Gets session-specific collection
    # Documents are added ONLY to this session's collection
    collection.add(ids=batch_ids, embeddings=batch_embeddings, ...)
```

**3. Search Isolation (vector_manager.py:100-126)**
```python
def search(self, session_id: str, query: str, ...):
    collection = self.get_collection(session_id)  # Only searches THIS session's collection
    results = collection.query(...)  # Cannot access other sessions' data
```

### Frontend Session Management:

**Session Storage (app.js:328-343)**
```javascript
// Session ID stored in browser's localStorage
localStorage.setItem('smart_tutor_session_id', sessionId);

// Each browser tab/window gets its own session
// If you open a new tab, it creates a NEW session
// If you refresh, it reuses the SAME session
```

### What This Means:

1. **Same Browser, Different Tabs**: Each tab gets a different session ID → Different document sets
2. **Same Browser, Same Tab**: Refreshing reuses the session → Same documents persist
3. **Different Browsers**: Completely separate sessions → No document sharing
4. **New Session Button**: Clears localStorage → Creates entirely new session

---

## 📄 Question 2: Where Do Page Sources Come From?

### **Answer: Backend extracts and provides source information**

The backend extracts filename and page number during PDF processing and includes it in every chat response.

### Complete Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCE INFORMATION FLOW                   │
└─────────────────────────────────────────────────────────────┘

1. PDF UPLOAD
   └─> PDFProcessingService.process_files()
       ├─> Extracts text from each page
       ├─> Creates chunks with metadata:
       │   {
       │     "source": "filename.pdf",    ← Filename
       │     "page": 5,                    ← Page number
       │     "keywords": "...",
       │     "document_id": "..."
       │   }
       └─> Returns: {texts, metadatas}

2. STORAGE
   └─> VectorStoreManager.add_documents()
       └─> Stores in ChromaDB with metadata attached
           └─> Each chunk remembers its source file and page

3. SEARCH
   └─> User asks question
       └─> VectorStoreManager.search_parallel()
           ├─> Finds relevant chunks
           └─> Returns chunks WITH metadata:
               {
                 "content": "chunk text...",
                 "metadata": {
                   "source": "filename.pdf",  ← Still here!
                   "page": 5                   ← Still here!
                 }
               }

4. RESPONSE FORMATTING
   └─> main.py chat endpoint (line 175-178)
       └─> Formats as ContextChunk:
           ContextChunk(
             content="...",
             source="filename.pdf",  ← From metadata
             page=5                   ← From metadata
           )

5. FRONTEND DISPLAY
   └─> app.js addMessage() function
       └─> Displays sources in collapsible section:
           "Sources (3)"
           ├─> filename.pdf - Page 5
           ├─> filename.pdf - Page 12
           └─> another_file.pdf - Page 3
```

### Code Evidence:

**1. PDF Processing (pdf_processor.py:54-83)**
```python
for page_num, page in enumerate(doc):
    page_number = page_num + 1  # Page numbers start at 1
    
    page_text = page.get_text("text").strip()
    chunks = self.splitter.split_text(page_text)
    
    for chunk in chunks:
        all_metadatas.append({
            "source": filename,        # ← Filename stored here
            "page": page_number,        # ← Page number stored here
            "document_id": document_id,
            "keywords": page_keywords,
        })
```

**2. Backend Response (main.py:175-178)**
```python
formatted_chunks = [
    ContextChunk(
        content=c["content"], 
        source=c["metadata"]["source"],  # ← Extracted from metadata
        page=c["metadata"]["page"]      # ← Extracted from metadata
    )
    for c in raw_chunks
]

return ChatResponse(
    query=query, 
    answer=answer, 
    context=formatted_chunks  # ← Frontend receives this
)
```

**3. Frontend Display (app.js:350-380)**
```javascript
// Sources are displayed if context exists
if (context && context.length > 0) {
    messageHTML += `
        <div class="message-sources">
            <div class="sources-header">
                Sources (${context.length})
            </div>
            <div class="sources-list">
                ${context.map(c => `
                    <div class="source-item">
                        ${c.source} - Page ${c.page}  ← Displayed here
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
```

### Schema Definition (schemas.py:6-9)
```python
class ContextChunk(BaseModel):
    content: str
    source: str    # ← Filename
    page: int      # ← Page number
```

---

## 🎯 Summary

### Session Isolation:
- ✅ **Each session is completely isolated**
- ✅ **Documents uploaded in Session A are NOT accessible in Session B**
- ✅ **Each session has its own ChromaDB collection**
- ✅ **Session ID determines which collection to use**

### Source Information:
- ✅ **Backend extracts source info during PDF processing**
- ✅ **Filename and page number stored in metadata**
- ✅ **Backend includes sources in chat response**
- ✅ **Frontend displays sources from backend response**

### Why This Design?

1. **Privacy**: Users' documents are isolated from each other
2. **Scalability**: Each session can be managed independently
3. **Traceability**: Sources help users verify AI answers
4. **Accountability**: Users know which document/page provided the answer

---

## 🔍 Debugging Tips

### Check Session Isolation:
```javascript
// In browser console
console.log('Session ID:', localStorage.getItem('smart_tutor_session_id'));

// Different tabs = Different session IDs = Different documents
```

### Check Source Information:
```javascript
// In browser console, after sending a chat message
// The response object contains:
{
  query: "your question",
  answer: "AI response",
  context: [
    {
      content: "chunk text...",
      source: "filename.pdf",  // ← Check this
      page: 5                   // ← Check this
    }
  ]
}
```

### Backend Logs:
```bash
# Check backend logs to see:
# - Which session is being accessed
# - Which collection is being queried
# - What metadata is being returned
```

---

**Last Updated**: Based on current codebase analysis
