import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle, XCircle, Clock,
    Search, Filter, ArrowLeft, MoreVertical, ExternalLink
} from 'lucide-react';

const Documents = ({ user }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, processing, completed, failed

    const fetchDocuments = async () => {
        try {
            const res = await axios.get('http://localhost:8000/my-documents', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setDocuments(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch documents", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        // Poll for updates if there are processing documents
        const interval = setInterval(() => {
            const hasProcessing = documents.some(doc => doc.status === 'processing');
            if (hasProcessing) fetchDocuments();
        }, 5000);
        return () => clearInterval(interval);
    }, [user.token, documents.length]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await axios.post('http://localhost:8000/upload-document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                }
            });
            fetchDocuments();
        } catch (err) {
            alert(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || doc.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', textDecoration: 'none', marginBottom: '24px', fontWeight: '500' }}>
                <ArrowLeft size={20} />
                Back to Dashboard
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>My Documents</h1>
                    <p style={{ color: '#94a3b8' }}>Upload and manage your compliance analysis reports</p>
                </div>

                <label style={{
                    cursor: 'pointer',
                    padding: '12px 24px',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
                    transition: 'all 0.2s'
                }}>
                    {uploading ? <Clock className="animate-spin" size={20} /> : <Upload size={20} />}
                    {uploading ? 'Processing...' : 'Upload Document'}
                    <input type="file" hidden onChange={handleFileUpload} accept=".pdf,.docx,.txt" disabled={uploading} />
                </label>
            </div>

            {/* Controls */}
            <div className="glass" style={{ padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
                    <FilterButton active={filter === 'processing'} onClick={() => setFilter('processing')}>Processing</FilterButton>
                    <FilterButton active={filter === 'escalated'} onClick={() => setFilter('escalated')}>Escalated</FilterButton>
                    <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed</FilterButton>
                    <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')}>Approved</FilterButton>
                    <FilterButton active={filter === 'rejected'} onClick={() => setFilter('rejected')}>Rejected</FilterButton>
                </div>
            </div>

            {/* Documents Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading your documents...</p>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="glass" style={{ padding: '80px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <FileText size={48} color="#475569" style={{ marginBottom: '20px' }} />
                    <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>No documents found</h3>
                    <p style={{ color: '#94a3b8' }}>{searchTerm ? "No documents match your search" : "Upload your first document to get started"}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredDocs.map((doc, idx) => (
                        <DocumentCard key={doc.id} doc={doc} index={idx} />
                    ))}
                </div>
            )}

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const FilterButton = ({ children, active, onClick }) => (
    <button onClick={onClick} style={{
        padding: '8px 16px',
        borderRadius: '8px',
        background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
        border: '1px solid',
        borderColor: active ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
        color: active ? '#818cf8' : '#94a3b8',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }}>{children}</button>
);

const DocumentCard = ({ doc, index }) => {
    const isCompleted = ['completed', 'approved', 'rejected', 'escalated'].includes(doc.status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="glass"
            style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                    <FileText size={24} />
                </div>
                <StatusBadge status={doc.status} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.filename}
            </h3>

            <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>•</span>
                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isCompleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: `3px solid ${doc.status === 'rejected' || doc.status === 'escalated' ? '#ef4444' : '#10b981'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: doc.status === 'rejected' || doc.status === 'escalated' ? '#ef4444' : '#10b981'
                        }}>
                            {doc.compliance_score}%
                        </div>
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>Score</span>
                    </div>
                ) : (
                    <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>Analysis {doc.status}...</span>
                    </div>
                )}

                {isCompleted && (
                    <Link
                        to={`/document/${doc.id}`}
                        style={{
                            padding: '10px 16px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '10px',
                            color: '#818cf8',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        View
                        <ExternalLink size={14} />
                    </Link>
                )}
            </div>
        </motion.div>
    );
};

const StatusBadge = ({ status }) => {
    const configs = {
        completed: { icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        approved: { icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', label: 'Approved' },
        rejected: { icon: <XCircle size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Rejected' },
        escalated: { icon: <AlertCircle size={14} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Escalated' },
        processing: { icon: <Clock size={14} />, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
        failed: { icon: <XCircle size={14} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
    };
    const config = configs[status] || configs.processing;
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: config.bg,
            color: config.color,
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        }}>
            {config.icon}
            {config.label || status}
        </div>
    );
};


export default Documents;
