import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Admin / Warden';
    if (role === 'staff') return 'Maintenance Staff';
    return 'Student';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">🏨</div>
        <span>HCMS</span>
      </div>

      {user && (
        <div className="navbar-right">
          <div className="navbar-user">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{getRoleLabel(user.role)}</div>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
