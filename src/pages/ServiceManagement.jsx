// OWNER: Celestin
// Create and edit services, with the validation the assignment requires.

import { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { PRIORITIES } from '../data/mockData';
import { isRequired, maxLength, isPositiveNumber, firstError } from '../utils/validation';

const NAME_MAX = 100;
const BLANK = { name: '', description: '', expectedDuration: '', priority: 'medium' };

export default function ServiceManagement({ services, setServices, setEntries }) {
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState('');

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setSaved('');
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
    setErrors({});
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      expectedDuration: String(service.expectedDuration),
      priority: service.priority,
    });
    setErrors({});
    setSaved('');
  };

  const remove = (service) => {
    setServices(services.filter((s) => s.id !== service.id));
    // Anyone queued for a deleted service loses their place.
    setEntries((current) => current.filter((e) => e.serviceId !== service.id));
    if (editingId === service.id) reset();
    setSaved(`${service.name} deleted.`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const found = {
      name: firstError(
        isRequired(form.name, 'Service name'),
        maxLength(form.name, NAME_MAX, 'Service name'),
      ),
      description: isRequired(form.description, 'Description'),
      expectedDuration: isPositiveNumber(form.expectedDuration, 'Duration'),
    };

    const real = Object.fromEntries(
      Object.entries(found).filter(([, message]) => message !== null),
    );

    if (Object.keys(real).length > 0) {
      setErrors(real);
      return;
    }

    const clean = {
      name: form.name.trim(),
      description: form.description.trim(),
      expectedDuration: Number(form.expectedDuration),
      priority: form.priority,
    };

    if (editingId) {
      setServices(services.map((s) => (s.id === editingId ? { ...s, ...clean } : s)));
      setSaved(`${clean.name} updated.`);
    } else {
      setServices([...services, { ...clean, id: `s${Date.now()}`, isOpen: true }]);
      setSaved(`${clean.name} created.`);
    }

    reset();
  };

  return (
    <div className="shell">
      <div className="page-head">
        <div>
          <h1>Services</h1>
          <p>Define what people can queue for, and how long each visit usually takes.</p>
        </div>
      </div>

      <div className="split">
        <section className="stack">
          {services.length === 0 ? (
            <div className="empty">No services yet. Create one using the form.</div>
          ) : (
            services.map((service) => (
              <article className="card" key={service.id}>
                <div className="card-head">
                  <h3>{service.name}</h3>
                  <StatusBadge value={service.priority} />
                </div>
                <p className="muted" style={{ margin: '.2rem 0 .6rem' }}>
                  {service.description}
                </p>
                <div className="card-head" style={{ marginBottom: 0 }}>
                  <span className="faint">{service.expectedDuration} min per visit</span>
                  <div className="btn-row">
                    <button type="button" onClick={() => startEdit(service)}>Edit</button>
                    <button type="button" className="btn-danger" onClick={() => remove(service)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <aside>
          <form className="card" onSubmit={handleSubmit} noValidate>
            <h2>{editingId ? 'Edit service' : 'New service'}</h2>

            <div className="field">
              <label htmlFor="svc-name">Service name</label>
              <input
                id="svc-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name
                ? <span className="error">{errors.name}</span>
                : <span className="hint">{form.name.length}/{NAME_MAX} characters</span>}
            </div>

            <div className="field">
              <label htmlFor="svc-desc">Description</label>
              <textarea
                id="svc-desc"
                value={form.description}
                onChange={update('description')}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="field">
              <label htmlFor="svc-duration">Expected duration (minutes)</label>
              <input
                id="svc-duration"
                type="number"
                min="1"
                step="1"
                value={form.expectedDuration}
                onChange={update('expectedDuration')}
                aria-invalid={Boolean(errors.expectedDuration)}
              />
              {errors.expectedDuration && (
                <span className="error">{errors.expectedDuration}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="svc-priority">Priority level</label>
              <select id="svc-priority" value={form.priority} onChange={update('priority')}>
                {PRIORITIES.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn-primary">
                {editingId ? 'Save changes' : 'Create service'}
              </button>
              {editingId && (
                <button type="button" className="btn-quiet" onClick={reset}>Cancel</button>
              )}
            </div>

            {saved && <p className="hint" style={{ marginTop: '.8rem' }}>{saved}</p>}
          </form>
        </aside>
      </div>
    </div>
  );
}