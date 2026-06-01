import Loan from "../models/loan/Loan.model.js";

export async function getTotalMonthlyDeduction(employeeId) {
  const activeLoans = await Loan.find({
    employeeId,
    status: { $in: ["PENDING", "APPROVED"] },
  });

  return activeLoans.reduce((sum, loan) => {
    return sum + (loan.monthlyDeduction || 0);
  }, 0);
}
