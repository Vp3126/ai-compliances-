import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldAlert, LogOut, Upload, Search, BarChart3, Users, Menu, X, CheckCircle3, AlertCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';


const Dashboard = ({ user, setUser }) => {
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        avgScore: 0,
        recentCount: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Profile
                const profileRes = await axios.get('/api/me', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setProfile(profileRes.data);

                // Fetch Documents
                const docsRes = await axios.get('/api/my-documents', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const docs = docsRes.data;
                setDocuments(docs);

                const pendingValue = docs.filter(d => d.status === 'processing').length;
                const escalated = docs.filter(d => d.status === 'escalated');
                const completed = docs.filter(d => d.status === 'completed' || d.status === 'approved');
                const totalScore = completed.reduce((acc, curr) => acc + (curr.compliance_score || 0), 0);
                const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;

                // Recent activity in last 24h
                const recent = docs.filter(d => {
                    const uploadDate = new Date(d.uploaded_at);
                    const now = new Date();
                    return (now - uploadDate) < (24 * 60 * 60 * 1000);
                }).length;

                setStats({
                    total: docs.length,
                    pending: pendingValue,
                    escalated: escalated.length,
                    avgScore: avgScore,
                    recentCount: recent
                });
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };
        fetchData();


        // Refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user.token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            {/* Mobile Menu Button - unchanged */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mobile-menu-btn"
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    background: 'rgba(99, 102, 241, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'none',
                    color: 'white'
                }}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Overlay (Mobile) - unchanged */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="sidebar-overlay"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 998,
                            display: 'none'
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - unchanged */}
            <motion.aside
                initial={false}
                animate={{ x: sidebarOpen ? 0 : '-100%' }}
                className="dashboard-sidebar glass"
                style={{
                    width: '280px',
                    margin: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 999
                }}
            >
                <div style={{ padding: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert color="#6366f1" size={32} />
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>AI Compliance</h1>
                </div>

                <nav style={{ flex: 1, padding: '0 20px' }}>
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                    <NavItem to="/documents" icon={<FileText size={20} />} label="Documents" />
                    <NavItem to="/dashboard" icon={<BarChart3 size={20} />} label="Audit Logs" />

                    {profile?.role === 'admin' && (
                        <>
                            <div style={{ margin: '20px 16px 10px', fontSize: '12px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Admin</div>
                            <NavItem to="/admin/user-approval" icon={<Users size={20} />} label="User Management" />
                        </>
                    )}
                </nav>

                {/* User Profile - unchanged */}
                <div className="glass" style={{ margin: '20px', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }}>
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {profile?.full_name || 'User'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
                                {profile?.role || 'user'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="dashboard-main" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="dashboard-header" style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p style={{ color: '#94a3b8' }}>Here's what's happening with your compliance review</p>
                    </div>

                    {/* Stats Grid - Using real stats */}
                    <div className="stats-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <StatCard
                            title="Total Documents"
                            value={stats.total}
                            change={stats.total > 0 ? "" : "0%"}
                            positive={true}
                            icon={<FileText size={24} />}
                        />
                        <StatCard
                            title="Pending Review"
                            value={stats.pending}
                            change={stats.pending > 0 ? "Analyzing..." : "Clear"}
                            positive={stats.pending === 0}
                            icon={<ShieldAlert size={24} />}
                        />
                        <StatCard
                            title="Escalated (High Risk)"
                            value={stats.escalated || 0}
                            change={stats.escalated > 0 ? "Action Required" : "No Alerts"}
                            positive={stats.escalated === 0}
                            icon={<AlertCircle size={24} />}
                        />
                        <StatCard
                            title="Approved (Human)"
                            value={documents.filter(d => d.status === 'approved').length}
                            change="Verified"
                            positive={true}
                            icon={<CheckCircle3 size={24} />}
                        />
                    </div>

                    {/* Escalation Alert Banner */}
                    <AnimatePresence>
                        {stats.escalated > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="glass"
                                style={{
                                    marginBottom: '30px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '20px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    padding: '12px',
                                    background: '#ef4444',
                                    borderRadius: '12px',
                                    color: 'white',
                                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                                }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '16px' }}>
                                        {stats.escalated} Document(s) require immediate compliance review!
                                    </h4>
                                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                                        Documents with compliance scores under 70% have been flagged for manual intervention.
                                    </p>
                                </div>
                                <Link to="/documents" style={{
                                    background: 'white',
                                    color: '#0f172a',
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    Review Now
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Analytics Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', height: '350px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Compliance Score Distribution</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={documents.filter(d => d.status === 'completed' || d.status === 'approved').slice(-7)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="filename" hide />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#6366f1' }}
                                    />
                                    <Bar dataKey="compliance_score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="glass" style={{ padding: '24px', borderRadius: '20px', height: '350px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Document Status</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Approved', value: documents.filter(d => d.status === 'approved').length },
                                            { name: 'Pending', value: documents.filter(d => d.status === 'processing' || d.status === 'completed').length },
                                            { name: 'Rejected', value: documents.filter(d => d.status === 'rejected').length }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#6366f1" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions - unchanged */}
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Quick Actions</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px'
                        }}>
                            <Link to="/documents" style={{ textDecoration: 'none' }}>
                                <ActionButton icon={<Upload size={20} />} label="Upload Document" />
                            </Link>
                            <Link to="/documents" style={{ textDecoration: 'none' }}>
                                <ActionButton icon={<Search size={20} />} label="Search Documents" />
                            </Link>
                            <Link to="/documents" style={{ textDecoration: 'none' }}>
                                <ActionButton icon={<BarChart3 size={20} />} label="View Reports" />
                            </Link>
                            <Link to="/documents" style={{ textDecoration: 'none' }}>
                                <ActionButton icon={<FileText size={20} />} label="Recent Files" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Documents - Fixed with real data */}
                    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Documents</h3>
                            <Link to="/documents" style={{ fontSize: '14px', color: '#6366f1', textDecoration: 'none' }}>View All</Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {documents.length === 0 ? (
                                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                                    No documents analyzed yet. <br />
                                    <Link to="/documents" style={{ color: '#6366f1', textDecoration: 'none' }}>Upload one now</Link>
                                </div>
                            ) : (
                                documents.slice(0, 5).map((doc, idx) => (
                                    <Link key={doc.id} to={`/document/${doc.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="glass" style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: '#6366f1' }}>
                                                <FileText size={20} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '600', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {doc.filename}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {new Date(doc.uploaded_at).toLocaleDateString()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: doc.status === 'completed' || doc.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: doc.status === 'completed' || doc.status === 'approved' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {doc.status === 'completed' || doc.status === 'approved' ? `${doc.compliance_score}%` : 'Processing'}
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                </motion.div>
            </main>

            <style>{`
                /* Mobile Styles */
                @media (max-width: 768px) {
                    .mobile-menu-btn {
                        display: block !important;
                    }
                    
                    .dashboard-sidebar {
                        position: fixed !important;
                        top: 0;
                        left: 0;
                        height: 100vh;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                    
                    .sidebar-overlay {
                        display: block !important;
                    }
                    
                    .dashboard-main {
                        padding: 80px 16px 16px !important;
                    }
                    
                    .dashboard-header h2 {
                        font-size: 22px !important;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                /* Tablet Styles */
                @media (min-width: 769px) and (max-width: 1024px) {
                    .dashboard-sidebar {
                        width: 240px !important;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                
                /* Desktop Styles */
                @media (min-width: 1025px) {
                    .mobile-menu-btn {
                        display: none !important;
                    }
                    
                    .dashboard-sidebar {
                        position: relative !important;
                        transform: translateX(0) !important;
                    }
                }
            `}</style>
        </div >
    );
};

// NavItem Component
const NavItem = ({ to, icon, label, active }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: active ? '#6366f1' : '#94a3b8',
            textDecoration: 'none',
            transition: 'all 0.2s',
            fontWeight: active ? '600' : '500'
        }}
    >
        {icon}
        <span>{label}</span>
    </Link>
);

// StatCard Component
const StatCard = ({ title, value, change, positive, icon }) => (
    <motion.div
        whileHover={{
            y: -8,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(99, 102, 241, 0.3)'
        }}
        className="glass"
        style={{
            padding: '24px',
            borderRadius: '20px',
            cursor: 'default',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.1)'
            }}>
                {icon}
            </div>
            <span style={{
                fontSize: '13px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: positive ? '#10b981' : '#ef4444',
                fontWeight: '700'
            }}>
                {change}
            </span>
        </div>
        <div style={{ fontSize: '34px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>{title}</div>
    </motion.div>
);

// ActionButton Component
const ActionButton = ({ icon, label }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{
                scale: 1.03,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                borderColor: 'rgba(99, 102, 241, 0.5)'
            }}
            whileTap={{ scale: 0.97 }}
            style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: isHovered ? '#fff' : '#f8fafc',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left'
            }}
        >
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isHovered ? '#6366f1' : 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isHovered ? 'white' : '#6366f1',
                transition: 'all 0.3s ease',
                boxShadow: isHovered ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
            }}>
                {React.cloneElement(icon, { size: 22 })}
            </div>
            <span style={{ flex: 1 }}>{label}</span>
        </motion.button>
    );
};

export default Dashboard;
