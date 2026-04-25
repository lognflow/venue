import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, Trash2 } from 'lucide-react';

const AdminPanel = () => {
    const [auditoriums, setAuditoriums] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    
    const [name, setName] = useState('');
    const [campus, setCampus] = useState('north');
    const [capacity, setCapacity] = useState('');
    const [amenities, setAmenities] = useState('');

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [audsRes, booksRes, logsRes] = await Promise.all([
                api.get('auditoriums/'),
                api.get('bookings/'),
                api.get('auditlogs/')
            ]);
            setAuditoriums(audsRes.data);
            setBookings(booksRes.data);
            setAuditLogs(logsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    const handleCreateAuditorium = async (e) => {
        e.preventDefault();
        try {
            await api.post('auditoriums/', {
                name, campus, capacity, amenities
            });
            setName(''); setCapacity(''); setAmenities('');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveAuditorium = async (id) => {
        if (window.confirm('Are you sure you want to remove this auditorium?')) {
            try {
                await api.delete(`auditoriums/${id}/`);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('Failed to delete auditorium. It might have existing bookings.');
            }
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`bookings/${id}/`, { status });
            fetchData();
        } catch (err) {
            if (err.response?.data?.message) {
                alert(err.response.data.message);
                fetchData();
            } else {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <nav className="nav-bar fade-in">
                <div className="nav-logo-container">
                    <img src="/logo.png" alt="NIE College Logo" />
                    <h1>Admin Panel - NIE Auditorium Booking</h1>
                </div>
                <button className="btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogOut size={18} /> Logout
                </button>
            </nav>

            <div className="admin-layout">
                <div className="glass-panel">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} /> Add Auditorium
                    </h2>
                    <form onSubmit={handleCreateAuditorium}>
                        <label>Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />

                        <label>Campus</label>
                        <select value={campus} onChange={e => setCampus(e.target.value)}>
                            <option value="north">North Campus</option>
                            <option value="south">South Campus</option>
                        </select>

                        <label>Capacity</label>
                        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />

                        <label>Amenities</label>
                        <textarea value={amenities} onChange={e => setAmenities(e.target.value)} required rows="3"></textarea>

                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create</button>
                    </form>

                    <h2 style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>Added Auditoriums</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Campus</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditoriums.map(aud => (
                                    <tr key={aud.id}>
                                        <td>{aud.name}</td>
                                        <td><span className="badge badge-pending">{aud.campus}</span></td>
                                        <td>
                                            <button onClick={() => handleRemoveAuditorium(aud.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-panel table-container">
                    <h2 style={{ marginBottom: '1.5rem' }}>Booking Requests (FCFS Order)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Submitted At</th>
                                <th>Requester</th>
                                <th>Event</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => {
                                const aud = auditoriums.find(a => a.id === b.auditorium);
                                const [year, month, day] = b.date.split('-');
                                const formattedDate = `${day}/${month}/${year}`;
                                const startTime = b.start_time.slice(0, 5);
                                const endTime = b.end_time.slice(0, 5);
                                
                                return (
                                    <tr key={b.id}>
                                        <td>{new Date(b.submitted_at).toLocaleString('en-GB')}</td>
                                        <td>
                                            <strong>{b.requester_name}</strong><br/>
                                            <small style={{ color: 'var(--text-muted)' }}>{b.requester_email}</small>
                                        </td>
                                        <td>
                                            <strong>{b.event_name}</strong><br/>
                                            <small style={{ color: 'var(--text-muted)' }}>{aud?.name} ({aud?.campus})</small>
                                        </td>
                                        <td>{formattedDate}<br/><small>{startTime} - {endTime}</small></td>
                                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                                        <td>
                                            {b.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleUpdateStatus(b.id, 'approved')} className="btn-success">Approve</button>
                                                    <button onClick={() => handleUpdateStatus(b.id, 'rejected')} className="btn-danger">Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="glass-panel table-container">
                <h2 style={{ marginBottom: '1.5rem' }}>Audit Logs</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Admin ID</th>
                            <th>Action</th>
                            <th>Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.performed_at).toLocaleString('en-GB')}</td>
                                <td>{log.admin}</td>
                                <td>{log.action}</td>
                                <td>{log.target_type} #{log.target_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanel;
