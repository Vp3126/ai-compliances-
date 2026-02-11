import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock, Mail, User, ArrowLeft, Shield, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UserApproval.css';

const UserApproval = ({ user }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

    useEffect(() => {
        fetchAllUsers();
    }, []);



    const fetchAllUsers = async () => {
        try {
            console.log('🔍 Fetching users...');
            console.log('Token:', user?.token ? 'Present' : 'Missing');

            // Direct backend URL to bypass Vite proxy issues
            const apiUrl = 'http://127.0.0.1:8000/admin/all-users';
            console.log('Full URL:', apiUrl);

            const res = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            console.log('✅ Response:', res.data);
            setAllUsers(res.data);
        } catch (err) {
            console.error('❌ Failed to fetch users:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await axios.post('/api/admin/approve-user',
                { user_id: userId, action: 'approve' },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            // Update the user in the list
            setAllUsers(allUsers.map(u =>
                u.id === userId ? { ...u, status: 'approved' } : u
            ));
        } catch (err) {
            alert('Failed to approve user');
        }
    };

    const handleReject = async (userId) => {
        try {
            await axios.post('/api/admin/approve-user',
                { user_id: userId, action: 'reject' },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            // Update the user in the list
            setAllUsers(allUsers.map(u =>
                u.id === userId ? { ...u, status: 'rejected' } : u
            ));
        } catch (err) {
            alert('Failed to reject user');
        }
    };

    const filteredUsers = allUsers.filter(u => {
        if (filter === 'all') return true;
        return u.status === filter;
    });

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: <Clock size={14} /> },
            approved: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: <CheckCircle size={14} /> },
            rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: <XCircle size={14} /> }
        };
        const style = styles[status] || styles.pending;

        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: style.bg,
                color: style.color,
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
            }}>
                {style.icon}
                {status}
            </div>
        );
    };

    const getRoleBadge = (role) => {
        const isAdmin = role === 'admin';
        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: isAdmin ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                color: isAdmin ? '#6366f1' : '#94a3b8',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
            }}>
                {isAdmin && <Shield size={14} />}
                {role}
            </div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', padding: '40px' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366f1', textDecoration: 'none', marginBottom: '30px' }}>
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>User Management</h1>
                <p style={{ color: '#94a3b8' }}>Manage all users and their access permissions</p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: filter === f ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: filter === f ? '#818cf8' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: filter === f ? '600' : '400',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {f} ({allUsers.filter(u => f === 'all' || u.status === f).length})
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                    <User size={48} color="#94a3b8" style={{ margin: '0 auto 20px' }} />
                    <h3 style={{ marginBottom: '10px' }}>No Users Found</h3>
                    <p style={{ color: '#94a3b8' }}>No users match the selected filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {filteredUsers.map((userData, index) => (
                        <motion.div
                            key={userData.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass"
                            style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: userData.role === 'admin' ? '#6366f1' : '#475569',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '18px',
                                        color: 'white'
                                    }}>
                                        {userData.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{userData.full_name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
                                            <Mail size={14} />
                                            {userData.email}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {getRoleBadge(userData.role)}
                                    {getStatusBadge(userData.status)}
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        Registered: {new Date(userData.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {userData.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleApprove(userData.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#10b981',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                                    >
                                        <UserCheck size={18} /> Approve
                                    </button>

                                    <button
                                        onClick={() => handleReject(userData.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            border: '1px solid #ef4444',
                                            background: 'transparent',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                                    >
                                        <UserX size={18} /> Reject
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserApproval;
