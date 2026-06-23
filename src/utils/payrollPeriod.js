export function getPayrollPeriod(date = new Date()) {
  const d = new Date(date);

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  let start, end;

  if (day >= 28) {
    start = new Date(Date.UTC(year, month, 28, 0, 0, 0));
    end = new Date(Date.UTC(year, month + 1, 27, 23, 59, 59, 999));
  } else {
    start = new Date(Date.UTC(year, month - 1, 28, 0, 0, 0));
    end = new Date(Date.UTC(year, month, 27, 23, 59, 59, 999));
  }

  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  return {
    id: `${endYear}-${String(endMonth + 1).padStart(2, "0")}`,
    label: `Cycle ${end.toLocaleString("en-US", {
      month: "long",
    })} ${endYear}`,
    start,
    end,
  };
}
