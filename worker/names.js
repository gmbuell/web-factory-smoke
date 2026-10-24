export function checkName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 100) {
    return { error: 'Name must be 1 to 100 characters' };
  }
  if (/^\d+$/.test(name)) {
    return { error: 'Name cannot be only digits' };
  }
  return { name };
}
