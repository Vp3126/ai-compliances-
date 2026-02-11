import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Shield, Brain, CheckSquare,
    Download, Clock, User, AlertCircle
} from 'lucide-react';

const DocumentAnalysis = ({ user }) => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [decisionComment, setDecisionComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchAnalysis = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/document/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setDoc(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch analysis", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, [id, user.token]);

    const handleDecision = async (decision) => {
        if (!window.confirm(`Are you sure you want to mark this document as ${decision.toUpperCase()}?`)) return;

        setSubmitting(true);
        try {
            await axios.post(`http://localhost:8000/document/${id}/decide`, {
                decision,
                comment: decisionComment
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            alert("Decision recorded successfully!");
            fetchAnalysis();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to record decision");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        </div>
    );

    if (!doc) return <div style={{ textAlign: 'center', padding: '100px' }}>Analysis not found</div>;

    const agentsList = [
        {
            id: 'preprocessing',
            name: 'Preprocessing Curator',
            icon: <FileText size={24} />,
            color: '#3b82f6',
            content: doc.analysis?.preprocessing
        },
        {
            id: 'risk',
            name: 'Risk Auditor',
            icon: <Shield size={24} />,
            color: '#ef4444',
            content: doc.analysis?.risk_assessment
        },
        {
            id: 'reasoning',
            name: 'Reasoning Analyst',
            icon: <Brain size={24} />,
            color: '#f59e0b',
            content: doc.analysis?.reasoning_analysis
        },
        {
            id: 'decision',
            name: 'Decision Maker',
            icon: <CheckSquare size={24} />,
            color: '#10b981',
            content: doc.analysis?.final_decision
        }
    ];

    return (
        <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>
                    <ArrowLeft size={20} />
                    Back to Documents
                </Link>
                <div style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    background: doc.status === 'approved' ? 'rgba(16, 185, 129, 0.1)'
                        : doc.status === 'escalated' ? 'rgba(245, 158, 11, 0.1)'
                            : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(99, 102, 241, 0.1)',
                    color: doc.status === 'approved' ? '#10b981'
                        : doc.status === 'escalated' ? '#f59e0b'
                            : doc.status === 'rejected' ? '#ef4444'
                                : '#6366f1',
                    textTransform: 'uppercase',
                    border: '1px solid currentColor'

                }}>
                    Status: {doc.status}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '32px', marginBottom: '32px' }}>
                {/* Header Section */}
                <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: '#6366f1' }}>
                                    <FileText size={32} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{doc.filename}</h1>
                                    <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {doc.uploaded_by}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(doc.uploaded_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await axios.get(`http://localhost:8000/document/${id}/export`, {
                                            headers: { Authorization: `Bearer ${user.token}` }
                                        });
                                        const blob = new Blob([res.data.content], { type: 'text/plain' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = res.data.filename;
                                        a.click();
                                    } catch (err) {
                                        alert("Export failed");
                                    }
                                }}
                                className="glass"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    fontWeight: '600'
                                }}
                            >
                                <Download size={20} color="#6366f1" />
                                Download Report
                            </button>

                            <div style={{ textAlign: 'center', minWidth: '150px' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    border: '6px solid #10b981',
                                    margin: '0 auto 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{doc.compliance_score}%</span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}>Overall Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Human Decision Panel */}
                    <div className="glass" style={{ padding: '24px', borderRadius: '24px', position: 'sticky', top: '20px', height: 'fit-content' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckSquare size={20} color="#6366f1" />
                            Final Decision
                        </h3>

                        {doc.human_decision ? (
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)' }}>
                                <div style={{
                                    color: doc.human_decision.decision === 'approved' ? '#10b981' : '#ef4444',
                                    fontWeight: '800',
                                    fontSize: '18px',
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                    textAlign: 'center'
                                }}>
                                    {doc.human_decision.decision}
                                </div>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', fontStyle: 'italic' }}>
                                    "{doc.human_decision.comment || 'No comments provided.'}"
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                    By: {doc.human_decision.decided_by}<br />
                                    On: {new Date(doc.human_decision.decided_at).toLocaleString()}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Review the AI findings and provide a final compliance decision.</p>
                                <textarea
                                    value={decisionComment}
                                    onChange={(e) => setDecisionComment(e.target.value)}
                                    placeholder="Add review comments..."
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '14px',
                                        marginBottom: '16px',
                                        resize: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button
                                        onClick={() => handleDecision('approved')}
                                        disabled={submitting}
                                        style={{
                                            padding: '12px',
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        Approve Document
                                    </button>
                                    <button
                                        onClick={() => handleDecision('rejected')}
                                        disabled={submitting}
                                        style={{
                                            padding: '12px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            opacity: submitting ? 0.7 : 1
                                        }}
                                    >
                                        Reject Document
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {agentsList.map((agent, index) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass"
                            style={{ padding: '24px', borderRadius: '20px', height: 'fit-content' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ padding: '10px', background: `${agent.color}20`, borderRadius: '10px', color: agent.color }}>
                                    {agent.icon}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{agent.name}</h3>
                            </div>

                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '16px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                color: '#e2e8f0',
                                whiteSpace: 'pre-wrap',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {agent.content || "No data available."}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Full Text Preview */}
                <div className="glass" style={{ marginTop: '32px', padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={20} color="#6366f1" />
                        Document Text Preview
                    </h3>
                    <div style={{
                        padding: '20px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '16px',
                        fontSize: '14px',
                        color: '#94a3b8',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}>
                        {doc.text_preview}...
                    </div>
                </div>


                <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
            </div>
        </div>
    );
};

export default DocumentAnalysis;
