console.log("✅ programController.js is loaded");
const Program = require("../models/Program");
const User = require("../models/User");

module.exports = require("./programController");
// 🟢 Create a new program
exports.createProgram = async (req, res) => {
  try {
    const { name, description, duration, difficulty, nutritionPlan, dailySchedule, fitnessGoal } = req.body;
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
      fitnessGoal,
      coachId,
      dailySchedule,
      nutritionPlan,
      documents,
      progressTracking: {
        totalSessions: dailySchedule.length,
        completedSessions: 0,
        completionRate: 0
      },
      feedback: [],
    });

    res.status(201).json({ message: "Program created successfully", program: newProgram });
  } catch (error) {
    res.status(500).json({ message: "Program creation failed", error: error.message });
  }
};

// 🟢 Get all programs
exports.getPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching programs", error: error.message });
  }
};

// 🟢 Get a single program by ID
exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id).populate("assignedClients", "name email");

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ program });
  } catch (error) {
    res.status(500).json({ message: "Error fetching program details", error: error.message });
  }
};

// 🟢 Assign program to multiple clients
exports.assignProgramToClients = async (req, res) => {
  try {
    const { programId, clientIds } = req.body;
    const program = await Program.findById(programId);

    if (!program) return res.status(404).json({ message: "Program not found" });

    const validClients = await User.find({ _id: { $in: clientIds }, role: "user" });
    if (validClients.length !== clientIds.length) {
      return res.status(400).json({ message: "Invalid client IDs found" });
    }

    program.assignedClients = [...new Set([...program.assignedClients, ...clientIds])];
    await program.save();

    res.status(200).json({ message: "Program successfully assigned!", program });
  } catch (error) {
    res.status(500).json({ message: "Program assignment error", error: error.message });
  }
};

// 🟢 Clone a program
exports.cloneProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const originalProgram = await Program.findById(programId);

    if (!originalProgram) return res.status(404).json({ message: "Original program not found" });

    const clonedProgram = await Program.create({
      ...originalProgram.toObject(),
      _id: undefined,
      name: `${originalProgram.name} (Copy)`,
      createdAt: new Date(),
    });

    res.status(201).json({ message: "Program cloned successfully!", program: clonedProgram });
  } catch (error) {
    res.status(500).json({ message: "Error cloning program", error: error.message });
  }
};

// 🟢 Track Session Completion
exports.trackSessionCompletion = async (req, res) => {
  try {
    const { programId, session } = req.body;
    const userId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    program.progressTracking.completedSessions += 1;
    program.progressTracking.completionRate =
      (program.progressTracking.completedSessions / program.progressTracking.totalSessions) * 100;

    await program.save();
    res.status(200).json({ message: "Session completion tracked", program });
  } catch (error) {
    res.status(500).json({ message: "Error tracking session completion", error: error.message });
  }
};

// 🟢 Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { programId, message, rating } = req.body;
    const userId = req.user.id;

    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Invalid rating (1-5)" });

    const program = await Program.findByIdAndUpdate(
      programId,
      { $push: { feedback: { userId, comment: message, rating, createdAt: new Date() } } },
      { new: true }
    );

    res.status(201).json({ message: "Feedback submitted successfully!", program });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

// 🟢 Get program videos
exports.getProgramVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    const videoUrls = program.dailySchedule.flatMap(day =>
      day.sessions.flatMap(session =>
        session.exercises.flatMap(exercise =>
          exercise.videoUrls ? exercise.videoUrls.map(video => video.url) : []
        )
      )
    );

    res.status(200).json({ videos: videoUrls });
  } catch (error) {
    res.status(500).json({ message: "Error fetching videos", error: error.message });
  }
};

// 🟢 Reschedule a missed workout
exports.rescheduleWorkout = async (req, res) => {
  try {
    const { programId, missedDay, newDay } = req.body;
    const program = await Program.findById(programId);

    if (!program) return res.status(404).json({ message: "Program not found" });

    if (!program.missedWorkouts) {
      program.missedWorkouts = [];
    }

    const missedIndex = program.missedWorkouts.findIndex(w => w.missedDay === missedDay);
    if (missedIndex === -1) {
      program.missedWorkouts.push({ missedDay, rescheduledTo: newDay });
    } else {
      program.missedWorkouts[missedIndex].rescheduledTo = newDay;
    }

    await program.save();
    res.status(200).json({ message: `Missed workout rescheduled to day ${newDay}.` });
  } catch (error) {
    res.status(500).json({ message: "Error rescheduling workout", error: error.message });
  }
};

// ✅ Export all functions
module.exports = {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  assignProgramToClients,
  trackSessionCompletion,
  submitFeedback,
  getProgramDocuments,
  updateProgramDocuments,
  updateWorkoutVideo,
  getSessionCompletionData,
  getProgramVideos,
  submitSessionFeedback,
  rescheduleWorkout
};