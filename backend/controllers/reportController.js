import Report from '../models/Report.js';
import { computeCoachAnalytics } from '../services/coachAnalytics.js';

export const generateReport = async (req, res) => {
  try {
    const { type, filters } = req.body; // Type of report and optional filters
    const data = await computeCoachAnalytics(req.user._id);
    const report = await Report.create({
      coachId: req.user._id,
      type,
      filters,
      data,
    });
    res.status(201).json({ message: "Report generated successfully", data: report });
  } catch (error) {
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ coachId: req.user._id });
    res.status(200).json({ reports });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving reports", error: error.message });
  }
};
