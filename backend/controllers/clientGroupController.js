const ClientGroup = require("../models/ClientGroup");
const User = require("../models/User");
exports.getClientDetails = async (req, res) => {
  try {
    const client = await User.findById(req.params.id).select("-password");
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: "Error fetching client details", error: error.message });
  }
};

exports.addClientToGroup = async (req, res) => {
  try {
      const groupId = req.params.id;
      const { clientId } = req.body;

      // Find the client
      const client = await User.findById(clientId);
      if (!client || client.role !== "user") {
          return res.status(404).json({ message: "Client not found or invalid role" });
      }

      // Add client to the group
      const group = await ClientGroup.findById(groupId);
      if (!group) {
          return res.status(404).json({ message: "Group not found" });
      }

      group.clientIds.push(clientId);
      await group.save();

      res.status(200).json({ message: "Client added to group successfully", group });
  } catch (error) {
      res.status(500).json({ message: "Error adding client to group", error: error.message });
  }
};
// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const coachId = req.user.id; // Extract coachId from the authenticated user

    const group = await ClientGroup.create({
      name: groupName,
      clientIds: members,
      coachId: coachId, // Add coachId to the group
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: "Failed to create group", error: error.message });
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

exports.getGroupById = async (req, res) => {
  try {
    const group = await ClientGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving group", error: error.message });
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
