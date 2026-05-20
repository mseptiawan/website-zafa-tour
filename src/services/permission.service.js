export function getPermissions(role) {
  const permissions = {
    // =========================
    // CUTI
    // =========================
    leave_request: false,
    leave_my: false,
    leave_approval: false,
    leave_all: false,

    // =========================
    // LEMBUR
    // =========================
    overtime_request: false,
    overtime_my: false,
    overtime_approval: false,
    overtime_approval_history: false,

    // =========================
    // DINAS LUAR / TRIP
    // =========================
    trip_request: false,
    trip_my: false,
    trip_approval: false,

    // =========================
    // KLAIM BEBAN
    // =========================
    claim_request: false,
    claim_approval: false,

    // =========================
    // KASBON
    // =========================
    kasbon_request: false,
    kasbon_approval: false,
    // =========================
    // ABSENSI
    // =========================
    attendance_input: false,
    attendance_view_my: false,
    attendance_view_all: false,

    attendance_correction_view_my: false,
    attendance_correction_approval: false,
    attendance_correction_request: false,

    // =========================
    // TASK
    // =========================
    task_create: false,
    task_view_my: false,
    task_view_all: false,

    // =========================
    // PAYROLL
    // =========================
    payroll_view: false,
    payroll_process: false,

    // =========================
    // PENGUMUMAN
    // =========================
    announcement_create: false,
    announcement_view: true,

    // =========================
    // ADMIN / MASTER DATA
    // =========================
    employee_manage: false,

    report_kpi: false,
    report_leave: false,
    report_overtime: false,
    report_attendance: false,

    assignment_my: false,
    assignment_all: false,

    finance_request: false,
    finance_history: false,
  };

  switch (role) {
    // =========================
    // STAFF (KARYAWAN)
    // =========================
    case "STAFF":
      permissions.leave_request = true;
      permissions.leave_my = true;

      permissions.overtime_request = true;
      permissions.overtime_my = true;

      permissions.trip_request = true;
      permissions.trip_my = true;

      permissions.claim_request = true;

      permissions.kasbon_request = true;

      permissions.attendance_input = true;
      permissions.attendance_view_my = true;
      permissions.attendance_correction_view_my = true;
      permissions.attendance_correction_request = true;

      permissions.task_create = true;
      permissions.task_view_my = true;
      permissions.assignment_my = true;

      break;

    case "KEUANGAN":
      permissions.leave_request = true;
      permissions.leave_my = true;

      permissions.overtime_request = true;
      permissions.overtime_my = true;

      permissions.trip_request = true;
      permissions.trip_my = true;

      permissions.claim_request = true;

      permissions.kasbon_request = true;

      permissions.attendance_input = true;
      permissions.attendance_view_my = true;
      permissions.attendance_correction_view_my = true;
      permissions.attendance_correction_request = true;

      permissions.task_create = true;
      permissions.task_view_my = true;
      permissions.assignment_my = true;

      permissions.finance_request = true;
      permissions.finance_history = true;

      break;

    // =========================
    // MANAGER
    // =========================
    case "MANAGER":
      permissions.leave_request = true;
      permissions.leave_my = true;
      permissions.leave_all = true;
      permissions.leave_approval = true;

      permissions.overtime_request = true;
      permissions.overtime_my = true;
      permissions.overtime_approval = true;
      permissions.overtime_approval_history = true;

      permissions.trip_request = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;

      permissions.claim_approval = true;

      permissions.kasbon_approval = true;

      permissions.attendance_view_all = true;
      permissions.attendance_correction_view_my = true;
      permissions.attendance_correction_request = true;

      permissions.task_view_all = true;

      permissions.payroll_view = true;

      permissions.announcement_create = true;

      permissions.report_kpi = true;
      permissions.report_leave = true;
      permissions.report_overtime = true;
      permissions.report_attendance = true;
      permissions.assignment_my = true;
      permissions.finance_history = true;

      break;

    // =========================
    // HR
    // =========================
    case "HR":
      permissions.leave_request = true;
      permissions.leave_my = true;
      permissions.leave_all = true;

      permissions.leave_approval = true;

      permissions.overtime_request = true;
      permissions.overtime_my = true;

      permissions.trip_request = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;

      permissions.claim_approval = true;

      permissions.kasbon_request = true;
      permissions.kasbon_approval = true;

      permissions.attendance_view_all = true;
      permissions.attendance_correction_approval = true;

      permissions.payroll_process = true;
      permissions.payroll_view = true;

      permissions.employee_manage = true;

      permissions.announcement_create = true;
      permissions.report_kpi = true;
      permissions.report_leave = true;
      permissions.report_overtime = true;
      permissions.report_attendance = true;

      permissions.assignment_my = true;
      permissions.finance_history = true;

      break;

    // =========================
    // GENERAL MANAGER / PIMPINAN
    // =========================
    case "MANAGER":
    case "HR":
    case "PIMPINAN":
      permissions.leave_approval = true;

      permissions.trip_approval = true;

      permissions.claim_approval = true;

      permissions.kasbon_approval = true;

      permissions.payroll_view = true;

      permissions.announcement_create = true;

      permissions.report_kpi = true;
      permissions.report_leave = true;
      permissions.report_overtime = true;
      permissions.report_attendance = true;

      permissions.finance_history = true;
      permissions.assignment_all = true;

      break;

    // =========================
    // DEFAULT
    // =========================
    default:
      break;
  }

  return permissions;
}
