function Header() {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">RentOS</div>

        <div className="topbar-subtitle">
          Sistema de gestión para Rent Cars
        </div>
      </div>

      <div className="topbar-user">
        <div className="user-avatar">A</div>

        <div className="user-info">
          <strong>Administrador</strong>
          <span>Administrador del sistema</span>
        </div>
      </div>
    </header>
  );
}

export default Header;