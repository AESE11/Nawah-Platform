export function formatEgpAmount(value: number | string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCoursePrice(
  value: number | string,
  locale: "ar" | "en",
) {
  const amount = formatEgpAmount(value);

  return locale === "ar"
    ? `سعر الدورة: ${amount} جنيه مصري`
    : `Course price: ${amount} Egyptian pounds`;
}

export function formatEgpCurrency(
  value: number | string,
  locale: "ar" | "en",
) {
  const amount = formatEgpAmount(value);

  return locale === "ar"
    ? `${amount} جنيه مصري`
    : `${amount} Egyptian pounds`;
}