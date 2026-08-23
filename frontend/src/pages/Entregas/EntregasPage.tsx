function EntregasPage() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Entregas</h1>

          <p>
            Controla las entregas y devoluciones de vehículos.
          </p>
        </div>

        <button className="primary-button" type="button">
          + Registrar entrega
        </button>
      </div>

      <div className="content-panel">
        <div className="empty-state">
          <div className="empty-state-icon">
            🔑
          </div>

          <strong>
            Gestión de entregas
          </strong>

          <span>
            Aquí conectaremos las entregas con el backend.
          </span>
        </div>
      </div>
    </section>
  );
}

export default EntregasPage;