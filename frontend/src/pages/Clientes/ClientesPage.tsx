function ClientesPage() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Clientes</h1>

          <p>
            Administra los clientes registrados en RentOS.
          </p>
        </div>

        <button className="primary-button">
          + Nuevo cliente
        </button>
      </div>

      <div className="content-panel">
        <div className="empty-state">
          <div className="empty-state-icon">
            👥
          </div>

          <strong>
            Gestión de clientes
          </strong>

          <span>
            Aquí conectaremos los clientes con el backend.
          </span>
        </div>
      </div>
    </section>
  );
}

export default ClientesPage;
