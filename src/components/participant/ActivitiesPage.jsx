export default function ActivitiesPage() {
    const sectionStyle = {
        background: 'rgba(0,15,30,0.5)', border: '1px solid rgba(0,255,255,0.12)',
        borderRadius: '8px', padding: '25px', marginBottom: '25px',
    };

    const headingStyle = {
        fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem',
        color: '#0ff', letterSpacing: '0.1em', marginBottom: '15px',
        textShadow: '0 0 8px rgba(0,255,255,0.3)',
    };

    const textStyle = {
        fontFamily: "'Rajdhani', sans-serif", fontSize: '1rem',
        color: 'rgba(255,255,255,0.8)', lineHeight: '1.6',
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: "'Rajdhani', sans-serif", color: '#fff' }}>
            <h2 style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: '#0ff',
                letterSpacing: '0.1em', marginBottom: '25px',
                textShadow: '0 0 8px rgba(0,255,255,0.3)',
            }}>
                ACTIVITIES & FUN ZONE
            </h2>

            {/* Activities Schedule */}
            <div style={sectionStyle}>
                <h3 style={headingStyle}>FUN ACTIVITIES</h3>
                {[
                    { time: '09:00 AM', activity: 'Ice Breaker — Team Introductions', desc: 'Get to know fellow participants with a quick intro round.' },
                    { time: '12:30 PM', activity: 'Tech Quiz Challenge', desc: 'Test your knowledge with a rapid-fire quiz. Prizes for top 3!' },
                    { time: '03:00 PM', activity: 'Code Golf', desc: 'Solve challenges in the fewest characters possible.' },
                    { time: '06:00 PM', activity: 'Lightning Talks', desc: 'Share a 5-minute talk on any tech topic you love.' },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: 'flex', gap: '15px', padding: '12px 0',
                        borderBottom: '1px solid rgba(0,255,255,0.06)',
                    }}>
                        <div style={{
                            fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem',
                            color: '#0ff', whiteSpace: 'nowrap', minWidth: '80px', paddingTop: '3px',
                        }}>
                            {item.time}
                        </div>
                        <div>
                            <div style={{ ...textStyle, color: '#fff', fontWeight: 600 }}>{item.activity}</div>
                            <div style={{ ...textStyle, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Emergency Contacts */}
            <div style={sectionStyle}>
                <h3 style={headingStyle}>EMERGENCY CONTACTS</h3>
                {[
                    { name: 'Event Coordinator', phone: '+91 98765 43210' },
                    { name: 'Technical Support', phone: '+91 87654 32109' },
                    { name: 'Venue Security', phone: '+91 76543 21098' },
                ].map((c, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                        borderBottom: '1px solid rgba(0,255,255,0.06)',
                    }}>
                        <span style={textStyle}>{c.name}</span>
                        <span style={{ ...textStyle, color: '#0ff' }}>{c.phone}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
