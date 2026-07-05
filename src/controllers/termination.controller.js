import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { getApprovalWorkspaceData, executeApprovePHK } from "../services/termination.service.js";

export const listPendingApprovals = asyncHandler(async (req, res) => {
  const { pendingList, historyList, stats } = await getApprovalWorkspaceData();

  res.render("admin/manage-center", {
    ...buildRenderData(req, {
      title: "Persetujuan PHK",
      pendingList,
      historyList,
      stats,
    }),
  });
});

export const approvePHK = asyncHandler(async (req, res) => {
  const { terminationId } = req.params;

  const adminUserId = req.session.user?._id;

  await executeApprovePHK(terminationId, adminUserId);

  req.flash("success", "Status pegawai berhasil diubah menjadi Non-Aktif.");
  res.redirect("/terminations/pending");
});
