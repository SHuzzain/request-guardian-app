import dayjs from "dayjs";

export function formatChatTimestamp(timestamp?: string | Date): string {
  if (!timestamp) return "";

  const date = dayjs(timestamp);
  const now = dayjs();

  if (date.isSame(now, "day")) {
    return `Today ${date.format("h:mm A")}`;
  }

  if (date.isSame(now.subtract(1, "day"), "day")) {
    return `Yesterday ${date.format("h:mm A")}`;
  }

  return `${date.format("D MMM, h:mm A")}`; // e.g. 10 Oct, 9:05 PM
}
