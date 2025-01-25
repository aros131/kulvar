const ClientGroup = require("../models/ClientGroup");

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    const group = new ClientGroup({
      coachId: req.user.id, // Requires protect middleware
      groupName,
      members, // List of client IDs
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Failed to create group", error: err.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await ClientGroup.find({ coachId: req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups", error: err.message });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await ClientGroup.findById(req.params.id);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.coachId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this group" });
    }

    await group.remove();
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete group", error: err.message });
  }
};
