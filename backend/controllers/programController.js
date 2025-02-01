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
 // 🟢 Multi-client 
exports.assignProgramToClients = async (req, res) => {
  try {
    const { programId, clientIds } = req.body;

    // Ensure program exists
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Add new clients (prevent duplicates)
    program.assignedClients = [...new Set([...program.assignedClients, ...clientIds])];

    await program.save();
    res.status(200).json({ message: "Program assigned successfully", program });
  } catch (error) {
    res.status(500).json({ message: "Error assigning program", error: error.message });
  }

  // clone
};
exports.cloneProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Clone the program
    const clonedProgram = new Program({
      name: program.name + " (Copy)",
      description: program.description,
      duration: program.duration,
      coachId: program.coachId,
      difficulty: program.difficulty,
      dailySchedule: program.dailySchedule,
      visibility: "private", // Make cloned programs private by default
    });

    await clonedProgram.save();
    res.status(201).json({ message: "Program cloned successfully", clonedProgram });
  } catch (error) {
    res.status(500).json({ message: "Error cloning program", error: error.message });
  }
};
//tracking
exports.trackSessionCompletion = async (req, res) => {
  try {
    const { programId, clientId, sessionId, feedback } = req.body;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Update or add session tracking
    const sessionIndex = program.sessionTracking.findIndex(
      (session) => session.clientId.toString() === clientId && session.sessionId === sessionId
    );

    if (sessionIndex >= 0) {
      program.sessionTracking[sessionIndex].completed = true;
      program.sessionTracking[sessionIndex].feedback = feedback;
      program.sessionTracking[sessionIndex].dateCompleted = new Date();
    } else {
      program.sessionTracking.push({
        clientId,
        sessionId,
        completed: true,
        feedback,
        dateCompleted: new Date(),
      });
    }

    await program.save();
    res.status(200).json({ message: "Session tracked successfully", program });
  } catch (error) {
    res.status(500).json({ message: "Error tracking session", error: error.message });
  }
};
