export function formatDateLabel(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return ""; // sécurité si date invalide

  const now = new Date();

  // Normaliser (en supprimant les heures)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  // ✔ Aujourd'hui → "HH:MM"
  if (target.getTime() === today.getTime()) {
    return `${hours}:${mins}`;
  }

  // ✔ Hier → "hier"
  if (target.getTime() === yesterday.getTime()) {
    return `hier ${hours}:${mins}`;
  }

  // ✔ Autre → "jj/mm/aaaa"
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();

  return `${d}/${m}/${y} ${hours}:${mins}`;
}

export function truncateWords(text) {
  const maxLength = 30;
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitialAllNames(name) {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
