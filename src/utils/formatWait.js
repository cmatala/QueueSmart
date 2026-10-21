// OWNER: Megan
// Formats a wait in minutes for display. Same wording as the server's formatWait.
// The server calculates the minutes; this only turns the number into text.

export function formatWait(minutes) {
  if (!minutes || minutes <= 0) return 'Next up';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}