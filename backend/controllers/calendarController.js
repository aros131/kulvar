const Calendar = require("../models/Calendar");

exports.addEvent = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const event = await Calendar.create({ userId: req.user.id, title, date, description });
    res.status(201).json({ message: "Event added successfully", data: event });
  } catch (error) {
    res.status(500).json({ message: "Error adding event", error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Calendar.find({ userId: req.user.id });
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving events", error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Calendar.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: "Event updated successfully", data: updatedEvent });
  } catch (error) {
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Calendar.findByIdAndDelete(id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error: error.message });
  }
};
