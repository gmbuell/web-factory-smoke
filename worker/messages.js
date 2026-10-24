export function checkMessage(value) {
  if (value === undefined || value === null) {
    return { message: null };
  }
  if (typeof value !== 'string') {
    return { error: 'Message must be text' };
  }
  const message = value.trim();
  if (message.length > 140) {
    return { error: 'Message must be 140 characters or fewer' };
  }
  return { message: message || null };
}
