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
      dailySchedule: Array.isArray(dailySchedule) ? dailySchedule : [], // ✅ Ensure dailySchedule is always an array
      nutritionPlan,
      documents,
      progressTracking: [],
      feedback: [],
    });

    res.status(201).json({ message: "Program created successfully", program: newProgram });
  } catch (error) {
    res.status(500).json({ message: "Program creation failed", error: error.message });
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
    const userId = req.user.id;
    const programs = await Program.find({ assignedClients: userId });

    if (!programs.length) {
      return res.status(404).json({ message: "Kullanıcıya atanmış bir program bulunamadı." });
    }

    res.status(200).json({ programs });
  } catch (error) {
    res.status(500).json({ message: "Kullanıcının programlarını getirirken hata oluştu.", error: error.message });
  }
};

// 🟢 Get a single program by ID (FIXED)
const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id).populate("assignedClients", "name email");

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // ✅ Debugging: Check if dailySchedule exists
    if (!program.dailySchedule || !Array.isArray(program.dailySchedule)) {
      console.error("🚨 dailySchedule is missing or not an array:", program.dailySchedule);
    }

    res.status(200).json({ program });
  } catch (error) {
    res.status(500).json({ message: "Error fetching program details", error: error.message });
  }
};

// 🟢 Update a program (Prevent Overwriting dailySchedule)
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProgram = await Program.findById(id);

    if (!existingProgram) {
      return res.status(404).json({ message: "Program not found" });
    }

    const updatedProgram = await Program.findByIdAndUpdate(
      id,
      {
        ...req.body,
        dailySchedule: req.body.dailySchedule ?? existingProgram.dailySchedule, // ✅ Keep existing dailySchedule if not provided
      },
      { new: true }
    );

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
// 🟢 Get program videos (FIXED)
const getProgramVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // ✅ Ensure dailySchedule exists before using flatMap
    const videoUrls = (program.dailySchedule || []).flatMap(day =>
      (day.sessions || []).flatMap(session =>
        (session.exercises || []).flatMap(exercise =>
          Array.isArray(exercise.videoUrls) ? exercise.videoUrls.map(video => video.url) : []
        )
      )
    );

    res.status(200).json({ videos: videoUrls });
  } catch (error) {
    res.status(500).json({ message: "Error fetching videos", error: error.message });
  }
};





// ✅ DEBUG LOG TO VERIFY EXPORTS
console.log("✅ programController.js loaded! Exported functions:", module.exports);

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
    workoutDay.sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (!exercise.videoUrls) exercise.videoUrls = [];
        exercise.videoUrls.push({ url: videoUrl, description: "New Video" });
      });
    });
    

    res.status(200).json({ message: "Video link updated", program });
  } catch (error) {
    res.status(500).json({ message: "Error updating video link", error: error.message });
  }
};

// 🟢 Get session completion data (FIXED)
const getSessionCompletionData = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.findById(id);

    if (!program) return res.status(404).json({ message: "Program not found" });

    const userProgress = program.progressTracking.find(entry => entry.user?.toString() === req.user.id);
    const completedSessions = userProgress?.completedSessions || 0;
    const totalSessions = program.dailySchedule?.reduce(
      (total, day) => total + (day.sessions?.length || 0),
      0
    ) || 0;

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
// 🟢 Reschedule missed workout
const rescheduleWorkout = async (req, res) => {
  try {
    const { programId, missedDay, newDay } = req.body;
    const program = await Program.findById(programId);

    if (!program) return res.status(404).json({ message: "Program not found" });

    const missedIndex = program.missedWorkouts.findIndex(w => w.missedDay === missedDay);
    if (missedIndex === -1) {
      program.missedWorkouts.push({ missedDay, rescheduledTo: newDay, status: "Yeniden Planlandı" });
    } else {
      program.missedWorkouts[missedIndex].rescheduledTo = newDay;
      program.missedWorkouts[missedIndex].status = "Yeniden Planlandı";
    }

    await program.save();
    res.status(200).json({ message: `Missed workout rescheduled to day ${newDay}.` });
  } catch (error) {
    res.status(500).json({ message: "Error rescheduling workout", error: error.message });
  }
};

const assignProgramToClients = async (req, res) => {
  try {
    const { programId } = req.params; // 🔥 get from URL params
    const { clientIds } = req.body;   // ✅ keep clientIds in body

    if (!programId || !clientIds || !Array.isArray(clientIds)) {
      return res.status(400).json({ message: "programId and clientIds (array) are required" });
    }

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // ✅ Validate all client IDs
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
      assignedClients: [] // Remove clients when cloning
    });

    res.status(201).json({ message: "Program cloned successfully!", program: clonedProgram });
  } catch (error) {
    res.status(500).json({ message: "Error cloning program", error: error.message });
  }
};
// 🟢 Track session completion for a user (FIXED)
const completeSession = async (req, res) => {
  try {
    const { programId } = req.params;
    const { sessionName } = req.body;
    const userId = req.user?._id;

    if (!programId || !sessionName || !userId) {
      return res.status(400).json({ message: "Program ID, session name, and user ID are required." });
    }

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found." });

    if (!Array.isArray(program.progressTracking)) {
      program.progressTracking = []; // Ensure progressTracking is initialized
    }

    let userProgress = program.progressTracking.find(entry => entry.user?.toString() === userId?.toString());

    if (!userProgress) {
      userProgress = { user: userId, completedSessions: 0, progressPercentage: 0 };
      program.progressTracking.push(userProgress);
    }

    // ✅ Increment completed sessions
    userProgress.completedSessions += 1;

    // ✅ Calculate total sessions dynamically
    const totalSessions = program.dailySchedule?.reduce(
      (total, day) => total + (day.sessions?.length || 0),
      0
    ) || 0;

    userProgress.progressPercentage = (userProgress.completedSessions / totalSessions) * 100;

    await program.save();
    res.status(200).json({ message: "Session marked as completed successfully!", progress: userProgress });
  } catch (error) {
    res.status(500).json({ message: "Error marking session as completed", error: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { programId } = req.params;
    const { comment, rating } = req.body;

    if (!programId) {
      return res.status(400).json({ message: "Program ID is required." });
    }

    // Find the program
    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    // Add feedback to the program
    program.feedback.push({
      userId: req.user._id,
      comment,
      rating,
    });

    // Save the updated program
    await program.save();

    // Return success message with updated program
    const updatedProgram = await Program.findById(programId).populate("feedback.userId", "name email");
    return res.status(201).json({
      message: "Feedback submitted successfully!",
      program: updatedProgram, // Include the updated program here
    });
  } catch (error) {
    console.error("Error submitting feedback:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🟢 Get assigned clients
const getAssignedClients = async (req, res) => {
  try {
    const { programId } = req.params;
    const program = await Program.findById(programId).populate("assignedClients", "name email");

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.status(200).json({ assignedClients: program.assignedClients });
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned clients", error: error.message });
  }
};

const resetProgress = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOneAndUpdate(
      { programId, userId },
      { completedSessions: [] },
      { new: true }
    );
    program.progressTracking = program.progressTracking.map(entry => 
      entry.user.toString() === userId.toString()
        ? { ...entry, completedSessions: 0, progressPercentage: 0 }
        : entry
    );
    await program.save();
    

    if (!progress) {
      return res.status(404).json({ message: "Progress not found for this program." });
    }

    res.status(200).json({ message: "Progress reset successfully", progress });
  } catch (error) {
    res.status(500).json({ message: "Error resetting progress", error: error.message });
  }
};
const updateAdaptiveAdjustments = async (req, res) => {
  try {
    const { programId } = req.params;
    const { fatigueLevel, notes } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ programId, userId });

    if (!progress) {
      progress = new Progress({ programId, userId, fatigueAdjustments: [] });
    }

    progress.fatigueAdjustments.push({ fatigueLevel, notes, date: new Date() });

    await progress.save();

    res.status(200).json({ message: "Fatigue adjustments updated", progress });
  } catch (error) {
    res.status(500).json({ message: "Error updating fatigue adjustments", error: error.message });
  }
};
const getProgramFeedback = async (req, res) => {
  try {
    const { programId } = req.params;

    // Ensure programId exists
    if (!programId) {
      return res.status(400).json({ message: "Program ID is required" });
    }

    // Fetch the program
    const program = await Program.findById(programId).populate("feedback.userId", "name email"); // Adjust population fields as needed

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Return the feedback array
    return res.status(200).json(program.feedback || []);
  } catch (error) {
    console.error("Error fetching program feedback:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🟢 Get program progress for a user
const getUserProgress = async (req, res) => {
  const { programId } = req.params;

  try {
    if (!programId) {
      return res.status(400).json({ message: "Program ID is required." });
    }

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    if (!Array.isArray(program.progressTracking)) {
      program.progressTracking = [];
    }

    let userProgress = program.progressTracking.find(
      (entry) => entry.userId?.toString() === req.user._id.toString()
    );

    if (!userProgress) {
      userProgress = {
        userId: req.user._id,
        completedSessions: 0,
        progressPercentage: 0,
      };

      program.progressTracking.push(userProgress);
      await program.save();
    }

    const totalSessions = program.dailySchedule?.reduce(
      (total, day) => total + (day.sessions?.length || 0),
      0
    ) || 0;
    
    const completedSessions = program.progressTracking.reduce(
      (total, entry) => total + (entry.completedSessions || 0),
      0
    );
    
    res.status(200).json({ completedSessions, totalSessions });
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching user progress", error: error.message });
  }
};


const trackSessionCompletion = async (req, res) => {
  try {
    const { programId, session } = req.body;
    const userId = req.user.id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    if (!Array.isArray(program.progressTracking)) {
      program.progressTracking = [];
    }

    let userProgress = program.progressTracking.find((entry) => entry.user?.toString() === userId.toString());

    if (!userProgress) {
      userProgress = { user: userId, completedSessions: 0, progressPercentage: 0 };
      program.progressTracking.push(userProgress);
    }

    userProgress.completedSessions += 1;

    const totalSessions = program.dailySchedule?.reduce(
      (sum, day) => sum + (day.sessions?.length || 0),
      0
    ) || 0;

    userProgress.progressPercentage =
      totalSessions > 0 ? (userProgress.completedSessions / totalSessions) * 100 : 0;

    await program.save();
    res.status(200).json({ message: "Session completion tracked", progress: userProgress });
  } catch (error) {
    res.status(500).json({ message: "Error tracking session completion", error: error.message });
  }
};
// 🟢 Get combined program media (documents + video URLs)
const getProgramMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const program = await Program.findById(id);

    if (!program) {
      return res.status(404).json({ message: "Program bulunamadı." });
    }

    const videos = program.videos || [];
    const pdfs = program.pdfs || [];

    res.status(200).json({ videos, pdfs });
  } catch (error) {
    res.status(500).json({ message: "Program medyası alınırken hata oluştu.", error: error.message });
  }
};

// 🟢 Get adaptive adjustments for a user in a program
const getAdaptiveAdjustments = async (req, res) => {
  try {
    const { programId } = req.params;
    const userId = req.user.id;

    const progress = await require("../models/Progress").findOne({ programId, userId });

    if (!progress) {
      return res.status(404).json({ message: "No adaptive data found" });
    }

    res.status(200).json({ fatigueAdjustments: progress.fatigueAdjustments || [] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching adaptive adjustments", error: error.message });
  }
};
const getCoachPrograms = async (req, res) => {
  try {
    const coachId = req.user.id; // ✅ pull from auth middleware
const programs = await Program.find({ coachId: coachId });

    res.json({ programs });
  } catch (error) {
    console.error("Error fetching coach programs:", error);
    res.status(500).json({ error: "Server error" });
  }
};
const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "user" }).select("-password");
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Kullanıcılar alınamadı", error });
  }
};

const assignProgramToGroup = async (req, res) => {
  try {
    const { programId, groupId } = req.body;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const group = await ClientGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const validClients = await User.find({ _id: { $in: group.clientIds }, role: "user" });

    program.assignedClients = [...new Set([...program.assignedClients, ...validClients.map(c => c._id)])];
    await program.save();

    res.status(200).json({ message: "Program assigned to group", program });
  } catch (err) {
    res.status(500).json({ message: "Error assigning to group", error: err.message });
  }
};
const unassignClient = async (req, res) => {
  try {
    const { programId } = req.params;
    const { clientId } = req.body;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    program.assignedClients = program.assignedClients.filter(
      id => id.toString() !== clientId
    );
    await program.save();

    res.status(200).json({ message: "Client unassigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unassigning client", error: error.message });
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
  submitFeedback,
  getProgramDocuments,
  updateProgramDocuments,
  updateWorkoutVideo,
  getSessionCompletionData,
  getProgramVideos, // ✅ Ensure this is included
  submitSessionFeedback, // ✅ Added
  rescheduleWorkout,
  getAssignedClients,
  resetProgress,
  updateAdaptiveAdjustments,
  getProgramFeedback,
  getUserProgress,
  completeSession,
  trackSessionCompletion,
  getAdaptiveAdjustments,
  getProgramMedia,
  getCoachPrograms,
  getAllClients,
  assignProgramToGroup,
  unassignClient


};


// ✅ DEBUG LOG TO VERIFY EXPORTS
console.log("✅ programController.js loaded! Exported functions:", module.exports);
