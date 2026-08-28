import Program from '../models/Program.js';
import User from '../models/User.js';
import Event from '../models/Event.js'; // ✅ make sure the path/case matches your file name

import Progress from '../models/Progress.js';
import ProgramAssignment from '../models/ProgramAssignment.js'; // ← add this
import { sendProgramAssigned } from '../services/emailService.js';
import { notify } from '../utils/notify.js';

const toInt = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const parseHHmm = (hhmm = '18:00') => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim());
  if (!m) return { h: 18, m: 0 };
  return { h: Math.min(23, Math.max(0, Number(m[1]))), m: Math.min(59, Math.max(0, Number(m[2]))) };
};

// 🟢 Create a new program
const createProgram = async (req, res) => {
  try {
    const { name, description, duration, difficulty, nutritionPlan, dailySchedule, fitnessGoal } = req.body;
    const coachId = req.user._id;
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
    const userId = req.user._id;
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

// 🟢 Update workout video links
const updateWorkoutVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, videoUrl } = req.body;

    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const workoutDay = (program.dailySchedule || []).find(d => d.day === day);
    if (!workoutDay) return res.status(400).json({ message: "Invalid day" });

    // optional day-level field
    workoutDay.videoUrl = videoUrl;

    for (const session of workoutDay.sessions || []) {
      for (const exercise of session.exercises || []) {
        if (!Array.isArray(exercise.videoUrls)) exercise.videoUrls = [];
        exercise.videoUrls.push({ url: videoUrl, description: "New Video" });
      }
    }

    program.markModified('dailySchedule');
    await program.save();

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

    const list = Array.isArray(program.progressTracking) ? program.progressTracking : [];
    const userIdStr = req.user._id.toString();
    const userProgress = list.find(entry => entry?.user?.toString() === userIdStr);

    const completedSessions = userProgress?.completedSessions || 0;
    const totalSessions = (program.dailySchedule || []).reduce(
      (total, day) => total + ((day.sessions || []).length),
      0
    );

    res.status(200).json({ completedSessions, totalSessions });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving session data", error: error.message });
  }
};


// 🟢 Submit session feedback
const submitSessionFeedback = async (req, res) => {
  try {
    const { programId, session, feedback } = req.body;
    const userId = req.user._id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found." });

    if (!Array.isArray(program.feedback)) program.feedback = [];
    program.feedback.push({
      userId,
      comment: feedback,
      rating: undefined,
      session,
      createdAt: new Date(),
    });

    await program.save();
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
    const { userIds } = req.body;   // ✅ keep userIds in body

    if (!programId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "programId and userIds (array) are required" });
    }

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    // ✅ Validate all client IDs
    const validClients = await User.find({ _id: { $in: userIds }, role: "user" });
    if (validClients.length !== userIds.length) {
      return res.status(400).json({ message: "Invalid client IDs found" });
    }

    const newlyAssigned = validClients.filter(
      (c) => !program.assignedClients.map(String).includes(String(c._id))
    );

    program.assignedClients = [...new Set([...program.assignedClients.map(String), ...userIds])];
    await program.save();

    const coach = await User.findById(req.user._id).select('name').lean();

    // Auto-generate calendar events for newly assigned clients
    const days = Array.isArray(program.dailySchedule) ? program.dailySchedule : [];
    const fallbackTime = program.defaultTimeOfDay || '18:00';
    const { h: defH, m: defM } = parseHHmm(fallbackTime);
    const programDefaultDur = toInt(program.defaultDurationMin, 60);
    const startDate = new Date(); startDate.setHours(0, 0, 0, 0);

    for (const client of newlyAssigned) {
      // Create assignment record
      const assignment = await ProgramAssignment.create({
        userId: client._id,
        programId: program._id,
        startDate,
        timezone: 'Europe/Istanbul',
        defaultTimeOfDay: fallbackTime,
        status: 'active',
      });

      // Generate events
      const ops = [];
      for (let d = 0; d < days.length; d++) {
        const sessions = Array.isArray(days[d]?.sessions) ? days[d].sessions : [];
        const baseDate = new Date(startDate); baseDate.setDate(baseDate.getDate() + d);
        for (let i = 0; i < sessions.length; i++) {
          const s = sessions[i] || {};
          const sid = String(s.sessionId || s._id || s.id || `${d}-${i}`);
          const title = s.name || `Seans ${i + 1}`;
          const t = typeof s.timeOfDay === 'string' ? parseHHmm(s.timeOfDay) : { h: defH, m: defM };
          const dur = toInt(s.durationMin, programDefaultDur);
          const st = new Date(baseDate); st.setHours(toInt(t.h, defH), toInt(t.m, defM), 0, 0);
          const en = new Date(st); en.setMinutes(en.getMinutes() + dur);
          const externalKey = `${assignment._id}:${d}:${i}`;
          ops.push({
            updateOne: {
              filter: { userId: client._id, programId: program._id, assignmentId: assignment._id, externalKey },
              update: {
                $setOnInsert: { userId: client._id, programId: program._id, assignmentId: assignment._id, externalKey, source: 'program', status: 'planned' },
                $set: { sessionId: sid, title, start: st, end: en, timezone: 'Europe/Istanbul' },
              },
              upsert: true,
            },
          });
        }
      }
      if (ops.length) await Event.bulkWrite(ops, { ordered: false });

      sendProgramAssigned({
        clientName: client.name,
        clientEmail: client.email,
        coachName: coach?.name || 'Koçun',
        programName: program.name,
      }).catch(() => {});

      // Bildirim: kullanıcıya yeni program atandı
      await notify({
        recipientId: client._id,
        senderId: req.user._id,
        type: 'program_assigned',
        message: `Koçun sana yeni bir program atadı: "${program.name}"`,
      });
    }

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
    const userId = req.user._id;

    const progress = await Progress.findOneAndUpdate(
      { programId, userId },
      { completedSessions: [] },
      { new: true }
    );

    if (!progress) {
      return res.status(404).json({ message: "Progress not found for this program." });
    }

    const program = await Program.findById(programId);
    if (program) {
      const list = Array.isArray(program.progressTracking) ? program.progressTracking : [];
      const next = list.map((entry) =>
        entry?.user?.toString() === userId.toString()
          ? { ...entry.toObject?.() ?? entry, completedSessions: 0, progressPercentage: 0 }
          : entry
      );
      program.progressTracking = next;
      await program.save();
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
    const userId = req.user._id;

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

const trackSessionCompletion = async (req, res) => {
  try {
    const { programId } = req.body;
    const userId = req.user._id;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    if (!Array.isArray(program.progressTracking)) program.progressTracking = [];

    // ensure an entry for this user
    let row = program.progressTracking.find(e => e?.user?.toString() === userId.toString());
    if (!row) {
      row = { user: userId, completedSessions: 0, progressPercentage: 0 };
      program.progressTracking.push(row);
    }

    // increment and recompute percentage
    row.completedSessions = (row.completedSessions || 0) + 1;
    const totalSessions = (program.dailySchedule || []).reduce(
      (acc, d) => acc + ((d.sessions || []).length),
      0
    );
    row.progressPercentage = totalSessions > 0
      ? Math.round((row.completedSessions / totalSessions) * 100)
      : 0;

    program.markModified('progressTracking');
    await program.save();

    res.status(200).json({ message: "Session completion tracked", progress: row });
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
    const userId = req.user._id;

    const progress = await Progress.findOne({ programId, userId });

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
    const coachId = req.user._id;
    const programs = await Program.find({ coachId })
      .populate("assignedClients", "name email profilePicture");
    res.json({ programs });
  } catch (error) {
    console.error("Error fetching coach programs:", error);
    res.status(500).json({ error: "Server error" });
  }
};
const getAllClients = async (req, res) => {
  try {
    const coachId = req.user._id;
    const programs = await Program.find({ coachId }).select('assignedClients').lean();
    const clientIds = [...new Set(programs.flatMap(p => p.assignedClients.map(id => id.toString())))];
    const clients = await User.find({ _id: { $in: clientIds }, role: "user" }).select("-password");
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

    const validClients = await User.find({ _id: { $in: group.userIds }, role: "user" });

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
    const { userId } = req.body;

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    program.assignedClients = program.assignedClients.filter(
      id => id.toString() !== userId
    );
    await program.save();

    res.status(200).json({ message: "Client unassigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unassigning client", error: error.message });
  }
};

const startProgram = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programId } = req.params;
    const { startDate, defaultTimeOfDay, timezone = 'Europe/Istanbul' } = req.body || {};

    if (!programId) return res.status(400).json({ message: 'programId missing' });
    if (!startDate) return res.status(400).json({ message: 'startDate missing' });

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid startDate' });

    // 1) Reuse existing active assignment if one exists (idempotent)
    let assignment = await ProgramAssignment.findOne({ userId, programId, status: 'active' });
    const isNew = !assignment;
    if (!assignment) assignment = await ProgramAssignment.create({
      userId,
      programId,
      startDate: start,
      timezone,
      defaultTimeOfDay: defaultTimeOfDay || program.defaultTimeOfDay || '18:00',
      status: 'active',
    });

    // 2) Materialize events from dailySchedule
    const days = Array.isArray(program?.dailySchedule) ? program.dailySchedule : [];
    const ops = [];

    const fallbackTime = defaultTimeOfDay || program.defaultTimeOfDay || '18:00';
    const { h: defH, m: defM } = parseHHmm(fallbackTime);
    const programDefaultDur = toInt(program?.defaultDurationMin, 60);

    for (let d = 0; d < days.length; d++) {
      const dayDef = days[d] || {};
      const sessions = Array.isArray(dayDef.sessions) ? dayDef.sessions : [];

      const baseDate = new Date(start.getTime());
      baseDate.setHours(0, 0, 0, 0);
      baseDate.setDate(baseDate.getDate() + d); // Day 1 = start, Day 2 = +1 …

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i] || {};
        const sid   = String(s.sessionId || s._id || s.id || `${d}-${i}`);
        const title = s.name || `Seans ${i + 1}`;
        const t     = typeof s.timeOfDay === 'string' ? parseHHmm(s.timeOfDay) : { h: defH, m: defM };
        const dur   = toInt(s.durationMin, programDefaultDur);

        const st = new Date(baseDate);
        st.setHours(toInt(t.h, defH), toInt(t.m, defM), 0, 0);
        const en = new Date(st);
        en.setMinutes(en.getMinutes() + dur);

        // idempotency per assignment + day + session
        const externalKey = `${assignment._id}:${d}:${i}`;

        ops.push({
          updateOne: {
            filter: { userId, programId, assignmentId: assignment._id, externalKey },
            update: {
              $setOnInsert: {
                userId,
                programId,
                assignmentId: assignment._id,
                externalKey,
                source: 'program',
                status: 'planned',
              },
              $set: {
                sessionId: sid,
                title,
                start: st,
                end: en,
                timezone,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length) await Event.bulkWrite(ops, { ordered: false }); // ✅ use Event model

    return res.status(201).json({
      message: 'Program started and events generated',
      assignment: {
        id: assignment._id,
        startDate: assignment.startDate,
        timezone: assignment.timezone,
      },
      assignmentId: String(assignment._id),
      generatedEvents: ops.length,
    });
  } catch (error) {
    console.error('startProgram error:', error);
    return res.status(500).json({ message: 'Error starting program', error: error.message });
  }
};

// ✅ EXPORT ALL FUNCTIONS **(FIXED)**
export {
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
  
  completeSession,
  trackSessionCompletion,
  getAdaptiveAdjustments,
  getProgramMedia,
  getCoachPrograms,
  getAllClients,
  assignProgramToGroup,
  unassignClient,
  startProgram


};


// ✅ DEBUG LOG TO VERIFY EXPORTS
