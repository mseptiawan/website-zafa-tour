export const ROLES = {
  DIREKTUR_UTAMA: "DIREKTUR_UTAMA",
  MANAGER_ADMINISTRASI: "MANAGER_ADMINISTRASI",
  MANAGER_HAJI_UMRAH: "MANAGER_HAJI_UMRAH",
  MANAGER_KEUANGAN: "MANAGER_KEUANGAN",
};

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  ANNOUNCEMENT_DESKTOP: 9,
  ANNOUNCEMENT_MOBILE: 5,
  ASSIGNMENT_DEFAULT: 7,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIMETYPES: [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const MODULES = {
  ASSIGNMENT: "assignment",
  LEAVE: "leave",
  PERMIT: "permit",
  OVERTIME: "overtime",
  ANNOUNCEMENT: "announcement",
  LOAN: "loan",
  TRIP: "trip",
};

export const NOTIF_CATEGORIES = {
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  DANGER: "danger",
};
