// OWNER: Celestin
//
// Create and edit services.
//
// The form checks the same four rules the server checks. When the server
// refuses anyway, its message is shown above the form: that is the one that
// counts, and seeing it is how we know the two agree.

import { useCallback, useEffect, useState } from 'react';

import { getServices, createService, updateService, setServiceOpen } from '../api/client';
import { isRequired, maxLength, isPositiveNumber, isOneOf, collectErrors } from '../utils/validation';

const NAME_MAX = 100;
const PRIORITIES = ['low', 'medium', 'high'];

const BLANK = { name: '', description: '', expectedDuration: '', priority: 'medium' };

export default function ServiceManagement({ account }) {
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);   // null means creating
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() =>
    getServices()
      .then((data) => { setServices(data); setServerError(''); })
      .catch((e) => setServerError(e.message))
      .finally(() => setLoading(false)), []);

  useEffect(() => { load(); }, [load]);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      expectedDuration: String(service.expectedDuration),
      priority: service.priority,
    });
    setErrors({});
    setServerError('');
    setNotice('');
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setNotice('');

    const found = collectErrors({
      name: isRequired(form.name, 'Service name') ?? maxLength(form.name, NAME_MAX, 'Service name'),
      description: isRequired(form.description, 'Description'),
      expectedDuration: isPositiveNumber(form.expectedDuration, 'Expected duration'),
      priority: isOneOf(form.priority, PRIORITIES, 'Priority'),
    });

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const fields = { ...form, expectedDuration: Number(form.expectedDuration) };

    setBusy(true);
    try {
      if (editingId) {
        await updateService(editingId, fields, account.id);
        setNotice(`Updated ${fields.name}.`);
      } else {
        await createService(fields, account.id);
        setNotice(`Created ${fields.name}.`);
      }
      reset();
      await load();
    } catch (e) {
      setServerError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (service) => {
    try {
      await setServiceOpen(service.id, !service.isOpen, account.id);
      await load();
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (loading) return <div className="shell"><p className="muted">Loading…</p></div>;

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Services</h1>
          <p>{services.length} set up. Changes take effect for students straight away.</p>
        </div>
      </div>

      {serverError && <p className="error" role="alert">{serverError}</p>}
      {notice && <p className="muted" role="status">{notice}</p>}

      <div className="split">
        <section className="stack">
          {services.map((service) => (
            <article key={service.id} className="card">
              <div className="card-head">
                <h3>{service.name}</h3>
                <span className={`badge badge-${service.priority}`}>{service.priority}</span>
              </div>

              <p className="muted">{service.description}</p>
              <p className="faint">
                {service.expectedDuration} min per visit · {service.waiting} waiting
              </p>

              <div className="card-head" style={{ marginBottom: 0 }}>
                <span className={`badge ${service.isOpen ? 'badge-open' : 'badge-closed'}`}>
                  {service.isOpen ? 'Open' : 'Closed'}
                </span>
                <div className="btn-row">
                  <button type="button" onClick={() => startEdit(service)}>Edit</button>
                  <button type="button" onClick={() => handleToggle(service)}>
                    {service.isOpen ? 'Close' : 'Open'}
                  </button>
                </div>
              </div>
            </article>
          ))}

          {services.length === 0 && (
            <div className="empty"><p>No services yet. Add the first one.</p></div>
          )}
        </section>

        <aside>
          <form className="card" onSubmit={handleSubmit} noValidate>
            <h2>{editingId ? 'Edit service' : 'New service'}</h2>

            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={update('name')}
                aria-invalid={errors.name ? 'true' : undefined}
              />
              {errors.name
                ? <span className="error">{errors.name}</span>
                : <span className="hint">{NAME_MAX} characters or fewer.</span>}
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={update('description')}
                aria-invalid={errors.description ? 'true' : undefined}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="field">
              <label htmlFor="expectedDuration">Expected duration (minutes)</label>
              <input
                id="expectedDuration"
                inputMode="numeric"
                value={form.expectedDuration}
                onChange={update('expectedDuration')}
                aria-invalid={errors.expectedDuration ? 'true' : undefined}
              />
              {errors.expectedDuration
                ? <span className="error">{errors.expectedDuration}</span>
                : <span className="hint">Used to estimate everyone's wait.</span>}
            </div>

            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={form.priority} onChange={update('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create service'}
              </button>
              {editingId && (
                <button type="button" className="btn-quiet" onClick={reset}>Cancel</button>
              )}
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}