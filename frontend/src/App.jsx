import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserApproval from './pages/admin/UserApproval';
import Documents from './pages/Documents';
import DocumentAnalysis from './pages/DocumentAnalysis';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ token });
        }
        setLoading(false);
    }, []);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />} />
                <Route path="/documents" element={user ? <Documents user={user} /> : <Navigate to="/login" />} />
                <Route path="/document/:id" element={user ? <DocumentAnalysis user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/user-approval" element={user ? <UserApproval user={user} /> : <Navigate to="/login" />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;
