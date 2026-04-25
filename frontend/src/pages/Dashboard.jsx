import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Bell } from 'lucide-react';

const Dashboard = () => {
    const [auditoriums, setAuditoriums] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const [selectedAuditorium, setSelectedAuditorium] = useState('');
    const [eventName, setEventName] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');

    const navigate = useNavigate();

    const [allApprovedBookings, setAllApprovedBookings] = useState([]);

    const [calendarDate, setCalendarDate] = useState(new Date());
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
    
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const fetchData = async () => {
        try {
            const [audsRes, booksRes, notifsRes, approvedRes] = await Promise.all([
                api.get('auditoriums/'),
                api.get('bookings/'),
                api.get('notifications/'),
                api.get('bookings/approved/')
            ]);
            setAuditoriums(audsRes.data);
            setBookings(booksRes.data);
            setNotifications(notifsRes.data);
            setAllApprovedBookings(approvedRes.data);
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

    const handleBooking = async (e) => {
        e.preventDefault();
        setBookingError('');
        setBookingSuccess('');
        try {
            await api.post('bookings/', {
                auditorium: selectedAuditorium,
                event_name: eventName,
                date,
                start_time: startTime,
                end_time: endTime
            });
            setBookingSuccess('Booking request submitted successfully!');
            fetchData();
        } catch (err) {
            setBookingError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit booking.');
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const toggleNotifications = async () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications && unreadCount > 0) {
            try {
                await api.post('notifications/mark_all_read/');
                setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <nav className="nav-bar fade-in">
                <div className="nav-logo-container">
                    <img src="/logo.png" alt="NIE College Logo" />
                    <h1>NIE Auditorium Booking</h1>
                </div>
                <div className="nav-links">
                    <button className="btn-secondary" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={toggleNotifications}>
                        <Bell size={18} />
                        Notifications
                        {unreadCount > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{unreadCount}</span>}
                    </button>
                    <button className="btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </nav>

            {showNotifications && (
                <div className="glass-panel" style={{ position: 'absolute', right: '2rem', top: '5rem', width: '350px', zIndex: 10, padding: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Notifications</h3>
                    {notifications.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notifications</p> : null}
                    {notifications.map(n => (
                        <div key={n.id} className={`notification-item ${n.is_read ? '' : 'unread'}`}>
                            <p style={{ fontSize: '0.9rem' }}>{n.message}</p>
                            <small style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</small>
                        </div>
                    ))}
                </div>
            )}

            <div className="dashboard-layout">
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Available Auditoriums</h2>
                    <div className="card-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {auditoriums.map(aud => (
                            <div key={aud.id} className="card">
                                <h3>{aud.name} <span className="badge badge-pending" style={{ float: 'right' }}>{aud.campus.toUpperCase()}</span></h3>
                                <p><strong>Capacity:</strong> {aud.capacity}</p>
                                <p><strong>Amenities:</strong> {aud.amenities}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Book an Auditorium</h2>
                        {bookingError && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{bookingError}</div>}
                        {bookingSuccess && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{bookingSuccess}</div>}
                        <form onSubmit={handleBooking}>
                            <label>Auditorium</label>
                            <select value={selectedAuditorium} onChange={e => setSelectedAuditorium(e.target.value)} required>
                                <option value="">Select Auditorium...</option>
                                {auditoriums.map(aud => (
                                    <option key={aud.id} value={aud.id}>{aud.name} ({aud.campus})</option>
                                ))}
                            </select>

                            <label>Event Name</label>
                            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} required />

                            <label>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Start Time</label>
                                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>End Time</label>
                                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Submit Request</button>
                        </form>
                    </div>

                    <div className="glass-panel">
                        <h2 style={{ marginBottom: '1.5rem' }}>My Bookings</h2>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Venue</th>
                                        <th>Event</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Status</th>
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
                                                <td>{aud?.name} ({aud?.campus})</td>
                                                <td>{b.event_name}</td>
                                                <td>{formattedDate}</td>
                                                <td>{startTime} - {endTime}</td>
                                                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ marginTop: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Confirmed bookings
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>&lt;</button>
                                <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)', minWidth: '120px', textAlign: 'center' }}>
                                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>&gt;</button>
                            </div>
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} style={{ fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.9rem', paddingBottom: '0.5rem' }}>{d}</div>
                            ))}
                            {calendarDays.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} />;
                                
                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const bookingsForDay = allApprovedBookings.filter(b => b.date === dateStr);
                                
                                if (bookingsForDay.length > 0) {
                                    return (
                                        <div key={idx} style={{ 
                                            padding: '0.5rem', 
                                            background: 'var(--primary)', 
                                            color: 'white', 
                                            borderRadius: '0.25rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: '40px',
                                            fontWeight: 'bold',
                                            cursor: 'help'
                                        }} title={bookingsForDay.map(b => `${b.event_name} - ${b.start_time}`).join('\n')}>
                                            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {bookingsForDay.map((b, i) => {
                                                    const aud = auditoriums.find(a => a.id === b.auditorium);
                                                    return <span key={i}>{aud ? aud.name.charAt(0).toUpperCase() : '?'}</span>
                                                })}
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div key={idx} style={{ 
                                        padding: '0.5rem', 
                                        background: '#f8fafc', 
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.25rem',
                                        minHeight: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
