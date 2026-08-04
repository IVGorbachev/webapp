import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI } from '../utils/api';
import { tStatus, tPriority, pluralTasks } from '../utils/i18n';
import { PlusIcon, EditIcon, TrashIcon, XIcon, TaskIcon } from '../components/Icons';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const STATUS_OPTIONS = ['pending', 'in_progress', 'done'];

const TaskModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Название обязательно'); return; }
    setLoading(true);
    try {
      if (task) {
        await tasksAPI.update(task.id, form);
      } else {
        await tasksAPI.create(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось сохранить задачу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Редактировать задачу' : 'Новая задача'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Название *</label>
              <input
                className={`form-control ${!form.title && error ? 'error' : ''}`}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Что нужно сделать?"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Дополнительные детали..."
                rows={3}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Приоритет</label>
                <select
                  className="form-control"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{tPriority(p)}</option>
                  ))}
                </select>
              </div>
              {task && (
                <div className="form-group">
                  <label className="form-label">Статус</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{tStatus(s)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : null}
                {task ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data.tasks);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту задачу?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(t => t.filter(task => task.id !== id));
      setTotal(n => n - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusToggle = async (task) => {
    const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'pending';
    try {
      const res = await tasksAPI.update(task.id, { status: next });
      setTasks(t => t.map(x => x.id === task.id ? res.data.task : x));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            {pluralTasks(total)}
          </span>
        </div>
        <select
          className="form-control"
          style={{ width: 160 }}
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
        </select>
        <select
          className="form-control"
          style={{ width: 160 }}
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
        >
          <option value="">Все приоритеты</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{tPriority(p)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setModalOpen(true); }}>
          <PlusIcon />
          Новая задача
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <TaskIcon size={48} />
            <h3>Задачи не найдены</h3>
            <p>Создайте первую задачу, чтобы начать</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Приоритет</th>
                  <th>Статус</th>
                  <th>Создана</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{tPriority(task.priority)}</span></td>
                    <td>
                      <button
                        className={`badge badge-${task.status}`}
                        style={{ cursor: 'pointer', border: 'none', background: undefined }}
                        onClick={() => handleStatusToggle(task)}
                        title="Нажмите для смены статуса"
                      >
                        {tStatus(task.status)}
                      </button>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                      {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditTask(task); setModalOpen(true); }}
                          title="Редактировать"
                        >
                          <EditIcon size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(task.id)}
                          title="Удалить"
                          style={{ color: 'var(--red)' }}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <TaskModal
          task={editTask}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
          onSave={() => { setModalOpen(false); setEditTask(null); loadTasks(); }}
        />
      )}
    </div>
  );
};

export default Tasks;
