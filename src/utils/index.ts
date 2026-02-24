import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

// --- HELPER: FORMAT PHONE NUMBER ---
export const formatPhoneNumber = (phone: string) => {
  if (!phone) return "";
  // 1. Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // 2. Handle 10-digit raw numbers (e.g., 9001234567)
  //    or 11-digit numbers starting with 7/8 (e.g., 79001234567)
  const match = cleaned.match(/^(\d{0,1})(\d{3})(\d{3})(\d{2})(\d{2})$/);

  // If we have a full match (10 or 11 digits)
  if (cleaned.length >= 10) {
    // Extract the last 10 digits to ensure we ignore any leading +7/8 prefix from backend
    const tail = cleaned.slice(-10);
    const p1 = tail.substring(0, 3);
    const p2 = tail.substring(3, 6);
    const p3 = tail.substring(6, 8);
    const p4 = tail.substring(8, 10);

    return `+7 ${p1} ${p2} ${p3}-${p4}`;
  }

  return phone; // Return original if format doesn't match
};

export const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today) return "Сегодня";
  if (date.toDateString() === yesterday.toDateString()) return "Вчера";

  return format(date, "d MMMM", { locale: ru });
};
