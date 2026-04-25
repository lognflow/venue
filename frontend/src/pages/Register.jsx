import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        try {
            await api.post('auth/register/', { username, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="glass-panel fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <div className="nav-logo-container" style={{ justifyContent: 'center', marginBottom: '1.5rem', flexDirection: 'column' }}>
                <img src="/logo.png" alt="NIE College Logo" style={{ height: '80px' }} />
                <h1 style={{ fontSize: '1.5rem', marginTop: '1rem', textAlign: 'center' }}>NIE Auditorium Booking</h1>
            </div>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primary)' }}>Create Account</h2>
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleRegister}>
                <label>Username</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                />
                <label>Email (@nie.ac.in only)</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="student@nie.ac.in" 
                    required 
                />
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Register</button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
            </p>
        </div>
    );
};

export default Register;
