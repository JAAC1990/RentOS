function PagosPage() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Pagos</h1>

          <p>
            Consulta y administra los pagos de los contratos.
          </p>
        </div>

        <button className="primary-button" type="button">
          + Registrar pago
        </button>
      </div>

      <div className="content-panel">
        <div className="empty-state">
          <div className="empty-state-icon">
            💳
          </div>

          <strong>
            Gestión de pagos
          </strong>

          <span>
            Aquí conectaremos los pagos con el backend.
          </span>
        </div>
      </div>
    </section>
  );
}

export default PagosPage;