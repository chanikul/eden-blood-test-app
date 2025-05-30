export function extractFirstName(fullName: string): string {
  return fullName.split(' ')[0] || '';
}

export function extractLastName(fullName: string): string {
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
