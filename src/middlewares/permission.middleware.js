import { getPermissions } from "../services/permission.service.js";

export function attachPermissions(req, res, next) {
  if (req.user) {
    req.user.permissions = getPermissions(req.user.role);
  }
  next();
}
