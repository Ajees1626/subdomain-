/**
 * Staff / employee login — placeholder until a dedicated workspace ships.
 */
export function EmployeePage({ user, onLogout }) {
  return (
    <div className="employee-page">
      <header className="employee-page-head">
        <p className="employee-page-kicker">Pixdot · Staff</p>
        <h1 className="employee-page-title">Hello, {user?.username ?? 'team'}</h1>
        <p className="employee-page-lead">
          The staff workspace is not wired in this build yet. Use an admin account for full service tools, or
          contact Pixdot for access.
        </p>
        <button type="button" className="px-btn px-btn--outline" onClick={onLogout}>
          Log out
        </button>
      </header>
    </div>
  )
}
