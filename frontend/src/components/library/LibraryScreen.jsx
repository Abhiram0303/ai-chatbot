import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation, 
  Download, 
  Trash2, 
  Loader2, 
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserFiles, uploadUserFile, deleteUserFile } from '../../services/storageFirestore';

/**
 * LibraryScreen Component
 * Manages user uploaded files, documents, and assets using Firebase Storage & Firestore.
 * Displays file table with real upload, search, filter, download, and delete.
 */
export default function LibraryScreen() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const fileInputRef = useRef(null);

  const filters = ['All', 'Documents', 'Images', 'Spreadsheets', 'Presentations', 'Generated'];

  // Load files from Firestore on mount/user change
  useEffect(() => {
    async function loadLibrary() {
      if (user?.uid) {
        setLoading(true);
        const userFiles = await getUserFiles(user.uid);
        setFiles(userFiles);
        setLoading(false);
      } else {
        setFiles([]);
        setLoading(false);
      }
    }
    loadLibrary();
  }, [user?.uid]);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !user?.uid) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const newFileItem = await uploadUserFile(user.uid, selectedFile, (pct) => {
        setUploadProgress(Math.round(pct));
      });

      setFiles((prev) => [newFileItem, ...prev]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileItem) => {
    if (!user?.uid) return;
    try {
      await deleteUserFile(user.uid, fileItem);
      setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
    } catch (err) {
      console.error('File deletion failed:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    const t = (type || '').toUpperCase();
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(t)) return ImageIcon;
    if (['CSV', 'XLS', 'XLSX'].includes(t)) return FileSpreadsheet;
    if (['PPT', 'PPTX'].includes(t)) return Presentation;
    return FileText;
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    const t = (f.type || '').toUpperCase();
    if (activeFilter === 'Documents' && ['PDF', 'DOC', 'DOCX', 'TXT'].includes(t)) return true;
    if (activeFilter === 'Images' && ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(t)) return true;
    if (activeFilter === 'Spreadsheets' && ['CSV', 'XLS', 'XLSX'].includes(t)) return true;
    if (activeFilter === 'Presentations' && ['PPT', 'PPTX'].includes(t)) return true;
    if (activeFilter === 'Generated' && f.isGenerated) return true;
    return false;
  });

  return (
    <div className="nova-workspace-body library-page-container">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="library-header-row">
        <div>
          <div className="explore-badge">
            <Sparkles size={14} style={{ color: '#10b981' }} />
            <span>ASSETS & FILES</span>
          </div>
          <h1 className="explore-title">My Library</h1>
          <p className="explore-subtitle">Your uploaded files, generated content and saved assets</p>
        </div>

        <button
          className="btn-auth-primary"
          style={{ width: 'auto', padding: '10px 18px', fontSize: '0.85rem' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="auth-spinner" />
              <span>Uploading {uploadProgress}%</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Upload file</span>
            </>
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="templates-controls" style={{ marginTop: '24px' }}>
        <div className="templates-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="templates-search-input"
            placeholder="Search your files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="templates-category-pills">
          {filters.map((flt) => (
            <button
              key={flt}
              className={`category-pill ${activeFilter === flt ? 'active' : ''}`}
              onClick={() => setActiveFilter(flt)}
            >
              {flt}
            </button>
          ))}
        </div>
      </div>

      {/* File Table / Mobile Cards / Empty State */}
      {loading ? (
        <div className="library-loading-state">
          <Loader2 size={24} className="auth-spinner" />
          <span>Loading assets...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="library-empty-state">
          <div className="library-empty-icon">
            <FolderOpen size={36} style={{ color: '#64748b' }} />
          </div>
          <h3>No files yet</h3>
          <p>Upload a document or file to start building your NOVA library.</p>
          <button
            className="btn-topbar-signin"
            style={{ marginTop: '16px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            <span>Upload your first file</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile File Cards (Phone & Small Screens) */}
          <div className="library-mobile-cards">
            {filteredFiles.map((fileItem) => {
              const Icon = getFileIcon(fileItem.type);
              return (
                <div key={`m-${fileItem.id}`} className="library-file-card">
                  <div className="library-card-header">
                    <div className="file-name-cell">
                      <div className="file-icon-box">
                        <Icon size={16} />
                      </div>
                      <div className="library-card-info">
                        <span className="file-name-text">{fileItem.name}</span>
                        <span className="library-card-meta">
                          {fileItem.type} • {formatFileSize(fileItem.size)} • {new Date(fileItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="library-card-actions">
                    {fileItem.downloadURL && fileItem.downloadURL !== '#' && (
                      <a
                        href={fileItem.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="library-card-btn"
                        title="Download file"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      className="library-card-btn delete"
                      onClick={() => handleDeleteFile(fileItem)}
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="library-table-wrapper">
            <table className="library-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((fileItem) => {
                  const Icon = getFileIcon(fileItem.type);
                  return (
                    <tr key={fileItem.id}>
                      <td>
                        <div className="file-name-cell">
                          <div className="file-icon-box">
                            <Icon size={16} />
                          </div>
                          <span className="file-name-text">{fileItem.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="file-type-badge">{fileItem.type}</span>
                      </td>
                      <td>{formatFileSize(fileItem.size)}</td>
                      <td>{new Date(fileItem.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="file-actions-cell">
                          {fileItem.downloadURL && fileItem.downloadURL !== '#' && (
                            <a
                              href={fileItem.downloadURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-action-btn"
                              title="Download file"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            className="file-action-btn delete"
                            onClick={() => handleDeleteFile(fileItem)}
                            title="Delete file"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
