import Holiday from "../models/calender/Holiday.model.js";

export const getHolidaysPage = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    res.render("leave/manage-calendar", {
      title: "Kelola Kalender",
      user: req.user,
      holidays,
      selectedYear,
      currentTab: "calendar",
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, endDate, type, isDeductLeave, isRecurring, description } = req.body;

    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();

    await Holiday.create({
      name,
      date: parsedDate,
      endDate: endDate ? new Date(endDate) : null,
      type,
      isDeductLeave: isDeductLeave === "true",
      isRecurring: isRecurring === "true",
      description,
      year,
    });

    res.redirect("/leave/manage-calendar");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Hari libur berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
