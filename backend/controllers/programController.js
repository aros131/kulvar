const Program = require("../models/Program");

// 🟢 Create a new program
exports.createProgram = async (req, res) => {
  try {
    const { name, description, duration, difficulty, nutritionPlan, dailySchedule } = req.body;
    const coachId = req.user.id;
    let documents = [];

    if (req.files) {
      documents = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
      }));
    }

    const newProgram = await Program.create({
      name,
      description,
      duration,
      difficulty,
      coachId,
      dailySchedule: JSON.parse(dailySchedule),
      nutritionPlan,
      documents,
    });
    const schedule = typeof dailySchedule === "string" ? JSON.parse(dailySchedule) : dailySchedule;


    res.status(201).json({ message: "Program başarıyla oluşturuldu", program: newProgram });
  } catch (error) {
    res.status(500).json({ message: "Program oluşturulamadı", error: error.message });
  }
};

// 🟢 Get all programs for the logged-in coach
exports.getPrograms = async (req, res) => {
  try {
    const coachId = req.user.id;
    const programs = await Program.find({ coachId }).sort({ createdAt: -1 });
    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Programlar yüklenemedi", error: error.message });
  }
};


// 🟢 Update a program
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProgram = await Program.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProgram) {
      return res.status(404).json({ message: "Program bulunamadı" });
    }

    res.status(200).json({ message: "Program başarıyla güncellendi", program: updatedProgram });
  } catch (error) {
    res.status(500).json({ message: "Program güncellenirken hata oluştu", error: error.message });
  }
};

// 🟢 Delete a program
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProgram = await Program.findByIdAndDelete(id);

    if (!deletedProgram) {
      return res.status(404).json({ message: "Program bulunamadı" });
    }

    res.status(200).json({ message: "Program başarıyla silindi" });
  } catch (error) {
    res.status(500).json({ message: "Program silinirken hata oluştu", error: error.message });
  }
};
