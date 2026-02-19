const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div className="dashboard-container">
            <div className="user-card">
                <h1>Welcome to GeoCivic</h1>
                {user ? (
                    <div>
                        <p>Logged in as: <strong style={{color: '#f8fafc'}}>{user.email}</strong></p>
                        <p>Role: <strong style={{color: '#60a5fa'}}>{user.role}</strong></p>
                    </div>
                ) : (
                    <p>No user data found.</p>
                )}
                <button 
                    onClick={() => {
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                    style={{ marginTop: '2rem' }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
