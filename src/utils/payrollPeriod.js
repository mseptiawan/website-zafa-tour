export function getPayrollPeriod(date = new Date()) {
  const d = new Date(date);

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  let start, end;

  if (day >= 27) {
    // Periode bulan berikutnya
    start = new Date(Date.UTC(year, month, 27, 0, 0, 0));
    end = new Date(Date.UTC(year, month + 1, 28, 23, 59, 59, 999));
  } else {
    // Masih periode sebelumnya
    start = new Date(Date.UTC(year, month - 1, 27, 0, 0, 0));
    end = new Date(Date.UTC(year, month, 28, 23, 59, 59, 999));
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

export function generatePayrollPeriods(before = 6, after = 3, baseDate = new Date()) {
  const periods = [];

  for (let i = -before; i <= after; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + i);

    periods.push(getPayrollPeriod(date).id);
  }

  return [...new Set(periods)].sort((a, b) => b.localeCompare(a));
}

export function getPayrollPeriodById(periodId) {
  const [year, month] = periodId.split("-").map(Number);

  const start = new Date(Date.UTC(year, month - 2, 27, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, 28, 23, 59, 59, 999));

  return {
    id: periodId,
    start,
    end,
  };
}
