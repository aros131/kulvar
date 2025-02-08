const Program = require("../models/Program");
const User = require("../models/User");

// 🟢 Create a new program
const createProgram = async (req, res) => {
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
const getProgramVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // Extract all video URLs from daily schedule
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

// 🟢 Get all programs
const getPrograms = async (req, res) => {
  try {
    const programs = await Program.find();
    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching programs", error: error.message });
  }
};
// 🟢 Get all programs assigned to a user
const getUserPrograms = async (req, res) => {
  try {
    const userId = req.user.id; // Ensure `req.user.id` is populated by the `protect` middleware.
    const programs = await Program.find({ assignedClients: userId }); // Check assigned programs

    if (!programs || programs.length === 0) {
      return res.status(404).json({ message: "Kullanıcıya atanmış bir program bulunamadı." });
    }

    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Kullanıcının programlarını getirirken hata oluştu.", error: error.message });
  }
};

// 🟢 Get a single program by ID
const getProgramById = async (req, res) => {
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

// 🟢 Update a program
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProgram = await Program.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ message: "Program updated successfully", program: updatedProgram });
  } catch (error) {
    res.status(500).json({ message: "Error updating program", error: error.message });
  }
};

// 🟢 Delete a program
const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProgram = await Program.findByIdAndDelete(id);
    if (!deletedProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting program", error: error.message });
  }
};

// 🟢 Update program documents
const updateProgramDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    let documents = [];
    if (req.files) {
      documents = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
      }));
    }

    program.documents = [...program.documents, ...documents];
    await program.save();

    res.status(200).json({ message: "Documents updated successfully", program });
  } catch (error) {
    res.status(500).json({ message: "Error updating documents", error: error.message });
  }
};

// 🟢 Update workout video links
const updateWorkoutVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, videoUrl } = req.body;

    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const workoutDay = program.dailySchedule.find(d => d.day === day);
    if (!workoutDay) return res.status(400).json({ message: "Invalid day" });

    workoutDay.videoUrl = videoUrl;
    await program.save();

    res.status(200).json({ message: "Video link updated", program });
  } catch (error) {
    res.status(500).json({ message: "Error updating video link", error: error.message });
  }
};

// 🟢 Get session completion data
const getSessionCompletionData = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const completedSessions = program.progressTracking.completedSessions;
    const totalSessions = program.progressTracking.totalSessions;

    res.status(200).json({ completedSessions, totalSessions });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving session data", error: error.message });
  }
};

// 🟢 Submit session feedback
const submitSessionFeedback = async (req, res) => {
  try {
    const { programId, session, feedback } = req.body;
    const userId = req.user.id;

    const program = await Program.findByIdAndUpdate(
      programId,
      { $push: { sessionFeedback: { session, userId, feedback, date: new Date() } } },
      { new: true }
    );

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    res.status(201).json({ message: "Session feedback submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};

// 🟢 Get program documents
const getProgramDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ documents: program.documents });
  } catch (error) {
    res.status(500).json({ message: "Error fetching program documents", error: error.message });
  }
};
const rescheduleWorkout = async (req, res) => {
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
const assignProgramToClients = async (req, res) => {
  try {
    const { programId, clientIds } = req.body;
    const program = await Program.findById(programId);

    if (!program) return res.status(404).json({ message: "Program not found" });

    // ✅ Check if all client IDs exist
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
const cloneProgram = async (req, res) => {
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
const trackSessionCompletion = async (req, res) => {
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
const submitFeedback = async (req, res) => {
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

// ✅ EXPORT ALL FUNCTIONS **(FIXED)**
module.exports = {
  createProgram,
  getPrograms,
  getUserPrograms, 
  getProgramById,
  updateProgram,
  deleteProgram,
  assignProgramToClients,
  cloneProgram,
  trackSessionCompletion,
  submitFeedback,
  getProgramDocuments,
  updateProgramDocuments,
  updateWorkoutVideo,
  getSessionCompletionData,
  getProgramVideos,  // ✅ Added
  submitSessionFeedback, // ✅ Added
  rescheduleWorkout  // ✅ Added
};


// ✅ DEBUG LOG TO VERIFY EXPORTS
console.log("✅ programController.js loaded! Exported functions:", module.exports);
