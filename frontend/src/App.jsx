import { useEffect, useState } from "react";
import { api } from "./api";

const emptyLeave = { leaveType: "Casual Leave", fromDate: "", toDate: "", reason: "" };

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("staffsync_user")); } catch { return null; }
  });
  const [page, setPage] = useState("Dashboard");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [training, setTraining] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "Employee", department: "General", designation: "Employee" });
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "" });
  const [trainingForm, setTrainingForm] = useState({ title: "", description: "", date: "" });
  const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", password: "", role: "Employee", department: "General", designation: "Employee" });

  const role = user?.role || "Employee";
  const isHR = role === "HR";
  const isManager = role === "Manager";
  const canReview = isHR || isManager;

  function flash(message, isError = false) {
    setNotice(isError ? "" : message);
    setError(isError ? message : "");
    setTimeout(() => { setNotice(""); setError(""); }, 4500);
  }

  async function loadData() {
    if (!user) return;
    try {
      const [a, b, c, d] = await Promise.all([
        api("/announcements"), api("/training"), api("/attendance/mine"), api("/leaves/mine")
      ]);
      setAnnouncements(a); setTraining(b); setMyAttendance(c); setMyLeaves(d);
      if (canReview) {
        const [e, f, g] = await Promise.all([api("/employees"), api("/attendance"), api("/leaves")]);
        setEmployees(e); setAttendance(f); setLeaves(g);
      } else {
        setEmployees([]); setAttendance([]); setLeaves([]);
      }
    } catch (err) { flash(err.message, true); }
  }

  useEffect(() => { loadData(); }, [user]);

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(authForm) });
      localStorage.setItem("staffsync_token", result.token);
      localStorage.setItem("staffsync_user", JSON.stringify(result.user));
      setUser(result.user); setPage("Dashboard"); flash(`Welcome, ${result.user.name}!`);
    } catch (err) { flash(err.message, true); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("staffsync_token"); localStorage.removeItem("staffsync_user");
    setUser(null); setPage("Dashboard");
  }

  async function runAction(action, successMessage) {
    setBusy(true);
    try { await action(); await loadData(); flash(successMessage); }
    catch (err) { flash(err.message, true); }
    finally { setBusy(false); }
  }

  async function markAttendance() {
    await runAction(() => api("/attendance/mark", { method: "POST", body: "{}" }), "Attendance marked successfully.");
  }

  async function submitLeave(event) {
    event.preventDefault();
    await runAction(async () => {
      await api("/leaves", { method: "POST", body: JSON.stringify(leaveForm) });
      setLeaveForm(emptyLeave);
    }, "Leave request submitted.");
  }

  async function reviewLeave(id, status) {
    await runAction(() => api(`/leaves/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }), `Leave ${status.toLowerCase()}.`);
  }

  async function createAnnouncement(event) {
    event.preventDefault();
    await runAction(async () => {
      await api("/announcements", { method: "POST", body: JSON.stringify(announcementForm) });
      setAnnouncementForm({ title: "", message: "" });
    }, "Announcement published.");
  }

  async function createTraining(event) {
    event.preventDefault();
    await runAction(async () => {
      await api("/training", { method: "POST", body: JSON.stringify(trainingForm) });
      setTrainingForm({ title: "", description: "", date: "" });
    }, "Training program created.");
  }

  async function createEmployee(event) {
    event.preventDefault();
    await runAction(async () => {
      // HR can add a user through the registration endpoint in this demo.
      await api("/auth/register", { method: "POST", body: JSON.stringify(employeeForm) });
      setEmployeeForm({ name: "", email: "", password: "", role: "Employee", department: "General", designation: "Employee" });
    }, "Employee account created.");
  }

  async function deleteAnnouncement(id) {
    await runAction(() => api(`/announcements/${id}`, { method: "DELETE" }), "Announcement deleted.");
  }

  async function deleteTraining(id) {
    await runAction(() => api(`/training/${id}`, { method: "DELETE" }), "Training program deleted.");
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-art">
          <div className="brand-mark">S</div>
          <p className="eyebrow">PEOPLE FIRST. WORK SMARTER.</p>
          <h1>Good work starts with great people.</h1>
          <p className="auth-copy">A simpler place to manage your people, attendance, leave, and team development.</p>
          <div className="mini-stats"><div><strong>One place</strong><span>For your HR tasks</span></div><div><strong>Three roles</strong><span>One connected team</span></div></div>
        </div>
        <div className="auth-panel">
          <div className="auth-card">
            <div className="brand-name"><span className="brand-dot">S</span> StaffSync</div>
            <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="muted">{authMode === "login" ? "Sign in to continue to your workspace." : "Set up an account for your project demo."}</p>
            <form onSubmit={submitAuth} className="form-stack">
              {authMode === "register" && <>
                <Field label="Full name"><input className="form-control" required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="e.g. Arshi Kaushal" /></Field>
                <div className="two-col">
                  <Field label="Department"><input className="form-control" value={authForm.department} onChange={e => setAuthForm({ ...authForm, department: e.target.value })} required /></Field>
                  <Field label="Designation"><input className="form-control" value={authForm.designation} onChange={e => setAuthForm({ ...authForm, designation: e.target.value })} required /></Field>
                </div>
                <Field label="Demo role">
                  <select className="form-select" value={authForm.role} onChange={e => setAuthForm({ ...authForm, role: e.target.value })}>
                    <option>Employee</option><option>Manager</option><option>HR</option>
                  </select>
                </Field>
                <div className="role-warning">For demonstration only: role selection is open. Restrict role assignment before production deployment.</div>
              </>}
              <Field label="Email address"><input className="form-control" type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@company.com" /></Field>
              <Field label="Password"><input className="form-control" type="password" minLength="6" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 6 characters" /></Field>
              {error && <Alert error>{error}</Alert>}
              <button className="btn btn-primary btn-lg w-100" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"} <span className="ms-2">→</span></button>
            </form>
            <p className="switch-auth">{authMode === "login" ? "New to StaffSync?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }} className="text-button">{authMode === "login" ? "Create account" : "Sign in"}</button></p>
          </div>
        </div>
      </div>
    );
  }

  const nav = [
    ["Dashboard", "▦", true],
    ["Employees", "♙", canReview],
    ["Attendance", "◷", true],
    ["Leave", "▤", true],
    ["Announcements", "◉", true],
    ["Training", "✧", true]
  ].filter(item => item[2]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const markedToday = myAttendance.some(item => item.dateKey === todayKey);
  const pendingCount = leaves.filter(item => item.status === "Pending").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-name sidebar-brand"><span className="brand-dot">S</span> StaffSync</div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(([label, icon]) => <button key={label} className={`nav-link ${page === label ? "active" : ""}`} onClick={() => setPage(label)}><span className="nav-icon">{icon}</span>{label}{label === "Leave" && canReview && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon">?</div><strong>Need a hand?</strong><p>Ask your HR team for help with your workspace.</p></div>
          <div className="sidebar-user"><div className="avatar">{user.name?.charAt(0).toUpperCase()}</div><div className="user-meta"><strong>{user.name}</strong><span>{user.role}</span></div><button className="logout-button" title="Log out" onClick={logout}>↗</button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><div className="breadcrumb">Workspace <span>/</span> {page}</div><h1>{page === "Dashboard" ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}` : page}</h1></div>
          <div className="topbar-right"><div className="today-chip"><span>◷</span> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div><div className="avatar top-avatar">{user.name?.charAt(0).toUpperCase()}</div></div>
        </header>

        {(notice || error) && <div className="page-alert"><Alert error={!!error}>{error || notice}</Alert></div>}

        {page === "Dashboard" && <div className="page-content">
          <div className="welcome-banner"><div><span className="banner-kicker">YOUR WORKSPACE</span><h2>Everything in sync.</h2><p>Here’s a snapshot of what’s happening across your workday.</p></div><div className="banner-art"><div className="banner-circle">✓</div><div className="banner-orbit orbit-one"></div><div className="banner-orbit orbit-two"></div></div></div>
          <div className="stat-grid">
            <Stat label={canReview ? "Team members" : "My attendance days"} value={canReview ? employees.length : myAttendance.length} detail={canReview ? "People in your workspace" : "Days marked present"} icon="♙" color="blue"/>
            <Stat label="Leave requests" value={canReview ? leaves.length : myLeaves.length} detail={canReview ? `${pendingCount} waiting for review` : "Your submitted requests"} icon="▤" color="purple"/>
            <Stat label="Announcements" value={announcements.length} detail="Company updates" icon="◉" color="orange"/>
            <Stat label="Training programs" value={training.length} detail="Learning opportunities" icon="✧" color="green"/>
          </div>
          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-heading"><div><h3>Quick actions</h3><p>Common tasks, right at your fingertips.</p></div></div>
              <div className="quick-actions">
                <button onClick={() => setPage("Attendance")} className="quick-action"><span className="quick-icon icon-blue">◷</span><span><strong>Mark attendance</strong><small>Record today's attendance</small></span><b>→</b></button>
                <button onClick={() => setPage("Leave")} className="quick-action"><span className="quick-icon icon-purple">▤</span><span><strong>Request leave</strong><small>Plan time away from work</small></span><b>→</b></button>
                <button onClick={() => setPage("Announcements")} className="quick-action"><span className="quick-icon icon-orange">◉</span><span><strong>Company updates</strong><small>See the latest news</small></span><b>→</b></button>
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading"><div><h3>Latest announcements</h3><p>Updates from your organization.</p></div><button className="text-button" onClick={() => setPage("Announcements")}>View all →</button></div>
              {announcements.length ? announcements.slice(0, 3).map(item => <div className="feed-item" key={item._id}><span className="feed-dot"></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div></div>) : <Empty title="No announcements yet" text="Company updates will appear here."/>}
            </section>
          </div>
        </div>}

        {page === "Employees" && <div className="page-content">
          {isHR && <section className="panel mb-4"><div className="panel-heading"><div><h3>Add an employee</h3><p>Create an employee login for your demo.</p></div></div><form onSubmit={createEmployee} className="form-grid">
            <Field label="Full name"><input className="form-control" required value={employeeForm.name} onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}/></Field>
            <Field label="Email"><input className="form-control" type="email" required value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}/></Field>
            <Field label="Temporary password"><input className="form-control" type="password" minLength="6" required value={employeeForm.password} onChange={e => setEmployeeForm({ ...employeeForm, password: e.target.value })}/></Field>
            <Field label="Department"><input className="form-control" required value={employeeForm.department} onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}/></Field>
            <Field label="Designation"><input className="form-control" required value={employeeForm.designation} onChange={e => setEmployeeForm({ ...employeeForm, designation: e.target.value })}/></Field>
            <Field label="Role"><select className="form-select" value={employeeForm.role} onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}><option>Employee</option><option>Manager</option><option>HR</option></select></Field>
            <div className="form-actions"><button className="btn btn-primary" disabled={busy}>Create account</button></div>
          </form></section>}
          <section className="panel"><div className="panel-heading"><div><h3>People directory</h3><p>{employees.length} people in the directory</p></div></div>
            {employees.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Role</th></tr></thead><tbody>{employees.map(e => <tr key={e._id}><td><div className="table-person"><div className="avatar small-avatar">{e.name[0]}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.department}</td><td>{e.designation}</td><td><span className="role-pill">{e.role}</span></td></tr>)}</tbody></table></div> : <Empty title="No employees to display" text="Create accounts to populate the directory."/>}
          </section>
        </div>}

        {page === "Attendance" && <div className="page-content">
          <section className="attendance-hero panel"><div className="attendance-copy"><span className="banner-kicker">DAILY CHECK-IN</span><h2>{markedToday ? "You're checked in!" : "Ready to start your day?"}</h2><p>{markedToday ? "Your attendance has been recorded for today." : "Mark yourself present to record today's attendance."}</p><button className="btn btn-primary" disabled={busy || markedToday} onClick={markAttendance}>{markedToday ? "✓ Attendance marked" : "Mark present →"}</button></div><div className="attendance-symbol">{markedToday ? "✓" : "◷"}</div></section>
          <section className="panel"><div className="panel-heading"><div><h3>My attendance history</h3><p>Your recent attendance records.</p></div><span className="count-chip">{myAttendance.length} records</span></div>
            {myAttendance.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Date</th><th>Marked at</th><th>Status</th></tr></thead><tbody>{myAttendance.map(a => <tr key={a._id}><td>{a.dateKey}</td><td>{new Date(a.markedAt).toLocaleTimeString()}</td><td><Status value={a.status}/></td></tr>)}</tbody></table></div> : <Empty title="No attendance records" text="Use the button above to mark attendance."/>}
          </section>
          {canReview && <section className="panel mt-4"><div className="panel-heading"><div><h3>Team attendance</h3><p>Latest records for your team.</p></div></div>{attendance.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Employee</th><th>Date</th><th>Status</th></tr></thead><tbody>{attendance.map(a => <tr key={a._id}><td>{a.user?.name || "Unknown"}</td><td>{a.dateKey}</td><td><Status value={a.status}/></td></tr>)}</tbody></table></div> : <Empty title="No team records" text="Attendance records will appear here."/>}</section>}
        </div>}

        {page === "Leave" && <div className="page-content">
          <section className="panel mb-4"><div className="panel-heading"><div><h3>{canReview ? "Leave requests" : "Request time off"}</h3><p>{canReview ? "Review and manage requests from your team." : "Submit a request and track its approval status."}</p></div></div>
            {!canReview && <form onSubmit={submitLeave} className="form-grid">
              <Field label="Leave type"><select className="form-select" value={leaveForm.leaveType} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}><option>Casual Leave</option><option>Sick Leave</option><option>Earned Leave</option><option>Other</option></select></Field>
              <Field label="From date"><input className="form-control" type="date" required min={todayKey} value={leaveForm.fromDate} onChange={e => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}/></Field>
              <Field label="To date"><input className="form-control" type="date" required min={leaveForm.fromDate || todayKey} value={leaveForm.toDate} onChange={e => setLeaveForm({ ...leaveForm, toDate: e.target.value })}/></Field>
              <div className="full-span"><Field label="Reason"><textarea className="form-control" rows="3" required value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Briefly explain your request"/></Field></div>
              <div className="form-actions"><button className="btn btn-primary" disabled={busy}>Submit leave request</button></div>
            </form>}
          </section>
          <section className="panel"><div className="panel-heading"><div><h3>{canReview ? "Requests to review" : "My leave history"}</h3><p>{canReview ? `${leaves.length} requests total` : `${myLeaves.length} requests submitted`}</p></div></div>
            {(canReview ? leaves : myLeaves).length ? <div className="table-responsive"><table className="table align-middle"><thead><tr>{canReview && <th>Employee</th>}<th>Type / dates</th><th>Reason</th><th>Status</th>{canReview && <th>Actions</th>}</tr></thead><tbody>{(canReview ? leaves : myLeaves).map(l => <tr key={l._id}>{canReview && <td><strong>{l.user?.name || "Employee"}</strong><small className="d-block text-secondary">{l.user?.department}</small></td>}<td><strong>{l.leaveType}</strong><small className="d-block text-secondary">{l.fromDate} → {l.toDate}</small></td><td className="reason-cell">{l.reason}</td><td><Status value={l.status}/></td>{canReview && <td>{l.status === "Pending" ? <div className="action-buttons"><button className="btn btn-sm btn-success" onClick={() => reviewLeave(l._id, "Approved")}>Approve</button><button className="btn btn-sm btn-outline-danger" onClick={() => reviewLeave(l._id, "Rejected")}>Reject</button></div> : <span className="text-secondary">Reviewed</span>}</td>}</tr>)}</tbody></table></div> : <Empty title="No leave requests yet" text={canReview ? "New team requests will appear here." : "Your submitted requests will appear here."}/>}
          </section>
        </div>}

        {page === "Announcements" && <div className="page-content">
          {isHR && <section className="panel mb-4"><div className="panel-heading"><div><h3>Publish an announcement</h3><p>Share important news with your organization.</p></div></div><form onSubmit={createAnnouncement} className="form-stack"><Field label="Title"><input className="form-control" required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="e.g. Holiday schedule"/></Field><Field label="Message"><textarea className="form-control" rows="3" required value={announcementForm.message} onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })} placeholder="Write your announcement..."/></Field><div><button className="btn btn-primary" disabled={busy}>Publish announcement</button></div></form></section>}
          <div className="announcement-grid">{announcements.map(item => <article className="panel announcement-card" key={item._id}><div className="announcement-top"><span className="announcement-icon">◉</span>{isHR && <button className="icon-button danger" title="Delete announcement" onClick={() => deleteAnnouncement(item._id)}>×</button>}</div><h3>{item.title}</h3><p>{item.message}</p><div className="announcement-footer"><span>By {item.createdBy?.name || "HR Team"}</span><span>{formatDate(item.createdAt)}</span></div></article>)}</div>
          {!announcements.length && <section className="panel"><Empty title="Nothing announced yet" text="Company updates will appear here when HR publishes them." /></section>}
        </div>}

        {page === "Training" && <div className="page-content">
          {(isHR || isManager) && <section className="panel mb-4"><div className="panel-heading"><div><h3>Create a training program</h3><p>Help your team grow its skills.</p></div></div><form onSubmit={createTraining} className="form-grid"><Field label="Program title"><input className="form-control" required value={trainingForm.title} onChange={e => setTrainingForm({ ...trainingForm, title: e.target.value })} placeholder="e.g. Communication skills"/></Field><Field label="Date"><input className="form-control" type="date" required value={trainingForm.date} onChange={e => setTrainingForm({ ...trainingForm, date: e.target.value })}/></Field><div className="full-span"><Field label="Description"><textarea className="form-control" rows="3" required value={trainingForm.description} onChange={e => setTrainingForm({ ...trainingForm, description: e.target.value })} placeholder="What will participants learn?"/></Field></div><div className="form-actions"><button className="btn btn-primary" disabled={busy}>Create program</button></div></form></section>}
          <div className="training-grid">{training.map(item => <article className="panel training-card" key={item._id}><div className="training-icon">✧</div><div className="training-date">{item.date}</div><h3>{item.title}</h3><p>{item.description}</p><div className="training-bottom"><span>Organized by {item.createdBy?.name || "Team"}</span>{(isHR || isManager) && <button className="text-button danger-text" onClick={() => deleteTraining(item._id)}>Remove</button>}</div></article>)}</div>
          {!training.length && <section className="panel"><Empty title="No training programs" text="Upcoming training opportunities will appear here." /></section>}
        </div>}
        <footer className="page-footer">© {new Date().getFullYear()} StaffSync <span>People operations, made simpler.</span></footer>
      </main>
    </div>
  );
}

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Alert({ children, error = false }) { return <div className={`alert ${error ? "alert-danger" : "alert-success"} py-2 mb-0`}>{children}</div>; }
function Stat({ label, value, detail, icon, color }) { return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>; }
function Status({ value }) { const cls = value === "Approved" || value === "Present" ? "success" : value === "Rejected" ? "danger" : "pending"; return <span className={`status-pill ${cls}`}><i></i>{value}</span>; }
function Empty({ title, text }) { return <div className="empty-state"><div className="empty-icon">⌁</div><strong>{title}</strong><p>{text}</p></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""; }

export default App;
