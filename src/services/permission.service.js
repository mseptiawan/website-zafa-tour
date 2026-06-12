export function getPermissions(role) {
  const permissions = {
    employee_list: false,
    employee_add: false,
    employee_manage: false,

    structure_manage: false,

    loan_new: false,
    loan_my: false,
    loan_manage_center: false,
    loan_disbursement: false,

    kpi_create: false,
    kpi_list: false,

    assignment_new: false,
    assignment_my: false,
    assignment_all: false,

    leave_new: false,
    leave_my: false,
    leave_delegation: false,
    leave_manage: false,

    permit_new: false,
    permit_my: false,
    permit_approval: false,

    phk: false,

    overtime_new: false,
    overtime_my: false,
    overtime_approval: false,
    overtime_verify: false,

    attendance_new: false,
    attendance_my: false,
    attendance_all: false,

    trip_new: false,
    trip_my: false,
    trip_approval: false,
    trip_verify: false,
    trip_history: false,

    sales_new: false,
    sales_my: false,

    announcement_new: true,
    announcement_all: true,

    claim_new: false,
    claim_my: false,
    claim_approval: false,
    claim_verify: false,
    claim_category_manage: false,

    daily_log_create: false,

    payroll_view: false,
    payroll_process: false,
    payroll_manage: false,
    payroll_component_manage: false,
    payroll_history: false,
    payroll_finance_approval: false,
  };

  switch (role) {
    case "PEGAWAI":
      permissions.loan_new = true;
      permissions.loan_my = true;

      permissions.assignment_my = true;

      permissions.leave_new = true;
      permissions.leave_my = true;
      permissions.leave_delegation = true;

      permissions.permit_new = true;
      permissions.permit_my = true;

      permissions.overtime_new = true;

      permissions.overtime_my = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.trip_new = true;
      permissions.trip_my = true;

      permissions.sales_new = true;
      permissions.sales_my = true;

      permissions.daily_log_create = true;

      permissions.claim_new = true;
      permissions.claim_my = true;

      permissions.payroll_view = true;

      break;

    case "MANAGER_KEUANGAN":
      permissions.employee_list = true;
      permissions.kpi_list = true;

      permissions.loan_new = true;
      permissions.loan_my = true;
      permissions.loan_disbursement = true;

      permissions.assignment_new = true;

      permissions.assignment_my = true;
      permissions.assignment_all = true;

      permissions.leave_new = true;
      permissions.leave_my = true;
      permissions.leave_delegation = true;

      permissions.permit_new = true;
      permissions.permit_my = true;
      permissions.permit_approval = true;

      permissions.overtime_new = true;
      permissions.overtime_my = true;
      permissions.overtime_approval = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.trip_new = true;
      permissions.trip_my = true;
      permissions.trip_verify = true;
      permissions.trip_history = true;
      permissions.trip_approval = true;

      permissions.sales_new = true;
      permissions.sales_my = true;

      permissions.daily_log_create = true;

      permissions.claim_new = true;
      permissions.claim_my = true;
      permissions.claim_verify = true;

      permissions.payroll_view = true;
      permissions.payroll_finance_approval = true;

      break;

    case "MANAGER_ADMINISTRASI":
      permissions.employee_list = true;

      permissions.loan_new = true;
      permissions.loan_my = true;

      permissions.kpi_list = true;

      permissions.assignment_new = true;
      permissions.assignment_my = true;
      permissions.assignment_all = true;

      permissions.leave_new = true;
      permissions.leave_my = true;
      permissions.leave_delegation = true;
      permissions.leave_manage = true;

      permissions.permit_new = true;
      permissions.permit_my = true;
      permissions.permit_approval = true;

      permissions.overtime_new = true;
      permissions.overtime_my = true;
      permissions.overtime_approval = true;
      permissions.overtime_verify = true;
      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.trip_new = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;

      permissions.sales_new = true;
      permissions.sales_my = true;

      permissions.daily_log_create = true;

      permissions.claim_new = true;
      permissions.claim_my = true;
      permissions.claim_approval = true;

      permissions.payroll_view = true;

      break;

    case "MANAGER_HAJI_UMRAH":
      permissions.employee_list = true;

      permissions.loan_new = true;
      permissions.loan_my = true;

      permissions.kpi_list = true;

      permissions.assignment_new = true;
      permissions.assignment_my = true;
      permissions.assignment_all = true;

      permissions.leave_new = true;
      permissions.leave_my = true;
      permissions.leave_delegation = true;
      permissions.leave_manage = true;

      permissions.permit_new = true;
      permissions.permit_my = true;
      permissions.permit_approval = true;

      permissions.overtime_new = true;
      permissions.overtime_my = true;
      permissions.overtime_approval = true;
      permissions.overtime_verify = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;
      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.trip_new = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;

      permissions.sales_new = true;
      permissions.sales_my = true;

      permissions.daily_log_create = true;

      permissions.claim_new = true;
      permissions.claim_my = true;
      permissions.claim_approval = true;

      permissions.payroll_view = true;

      break;

    case "WAKIL_DIREKTUR":
      permissions.employee_list = true;
      permissions.employee_add = true;

      permissions.structure_manage = true;

      permissions.loan_new = true;
      permissions.loan_my = true;
      permissions.loan_manage_center = true;

      permissions.kpi_create = true;
      permissions.kpi_list = true;
      permissions.assignment_new = true;

      permissions.assignment_my = true;
      permissions.assignment_all = true;

      permissions.leave_new = true;
      permissions.leave_my = true;
      permissions.leave_delegation = true;
      permissions.leave_manage = true;

      permissions.permit_new = true;
      permissions.permit_my = true;
      permissions.permit_approval = true;

      permissions.overtime_new = true;
      permissions.overtime_my = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;

      permissions.attendance_new = true;
      permissions.attendance_my = true;
      permissions.attendance_all = true;

      permissions.trip_new = true;
      permissions.trip_my = true;
      permissions.trip_approval = true;

      permissions.sales_new = true;
      permissions.sales_my = true;

      permissions.daily_log_create = true;

      permissions.claim_new = true;
      permissions.claim_my = true;
      permissions.claim_category_manage = true;

      permissions.employee_manage = true;

      permissions.payroll_view = true;
      permissions.payroll_manage = true;
      permissions.payroll_component_manage = true;
      permissions.payroll_history = true;
      permissions.payroll_finance_approval = true;

      break;

    case "DIREKTUR_UTAMA":
      permissions.employee_list = true;
      permissions.phk = true;

      permissions.loan_manage_center = true;

      permissions.kpi_list = true;

      permissions.assignment_new = true;
      permissions.assignment_all = true;

      permissions.permit_approval = true;

      permissions.trip_approval = true;
      permissions.trip_history = true;

      permissions.claim_approval = true;

      permissions.payroll_history = true;

      break;

    default:
      break;
  }

  return permissions;
}
