export const tStatus = (status) => ({
  pending: 'Ожидание',
  in_progress: 'В работе',
  done: 'Готово',
  running: 'Выполняется',
  success: 'Успешно',
  failed: 'Ошибка',
}[status] || status);

export const tPriority = (priority) => ({
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}[priority] || priority);

export const tEnvironment = (env) => ({
  development: 'Разработка',
  staging: 'Тестирование',
  production: 'Продакшн',
}[env] || env);

export const tRole = (role) => ({
  admin: 'Администратор',
  user: 'Пользователь',
}[role] || role);

export const pluralTasks = (count) => {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} задач`;
  if (n1 > 1 && n1 < 5) return `${count} задачи`;
  if (n1 === 1) return `${count} задача`;
  return `${count} задач`;
};

export const pluralDeployments = (count) => {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} развёртываний`;
  if (n1 > 1 && n1 < 5) return `${count} развёртывания`;
  if (n1 === 1) return `${count} развёртывание`;
  return `${count} развёртываний`;
};
