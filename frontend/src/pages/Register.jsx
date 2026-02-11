import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Lock } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError('Registration failed. Email might already exist.');
        }
    };

    if (success) {
        return (
            <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass"
                    style={{ padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center' }}
                >
                    <div style={{ color: '#10b981', fontSize: '48px', marginBottom: '20px' }}>✓</div>
                    <h2 style={{ marginBottom: '10px' }}>Registration Successful!</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                        Your account has been created and is <strong>pending admin approval</strong>.
                        You will be able to log in once an administrator activates your account.
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Redirecting to login...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass"
                style={{ padding: '40px', width: '100%', maxWidth: '450px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Shield size={48} color="#6366f1" style={{ marginBottom: '10px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Create Account</h2>
                    <p style={{ color: '#94a3b8' }}>Join the AI Compliance Platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            color: '#ef4444',
                            marginBottom: '15px',
                            textAlign: 'center',
                            padding: '10px',
                            background: 'rgba(239,68,68,0.1)',
                            borderRadius: '8px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: '20px' }}>
                        Register Now
                    </button>

                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>
                        Already have an account? <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>Sign In</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
