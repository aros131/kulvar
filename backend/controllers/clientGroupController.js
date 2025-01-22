const ClientGroup = require("../models/ClientGroup");

// Create a new client group
exports.createGroup = async (req, res) => {
  try {
    const { name, clientIds } = req.body;

    const group = new ClientGroup({
      name,
      coachId: req.user.id, // Ensure this is the logged-in coach
      clientIds, // Array of client IDs
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: "Failed to create client group.", error: err.message });
  }
};
// Get all client groups for a coach
exports.getGroups = async (req, res) => {
    try {
      const groups = await ClientGroup.find({ coachId: req.user.id }).populate("clientIds", "name email");
      res.json(groups);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch client groups.", error: err.message });
    }
  };
  // Update a client group
exports.updateGroup = async (req, res) => {
    try {
      const { name, clientIds } = req.body;
      const group = await ClientGroup.findById(req.params.id);
  
      if (!group) return res.status(404).json({ message: "Client group not found." });
  
      // Ensure the logged-in coach owns the group
      if (group.coachId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this group." });
      }
  
      group.name = name || group.name;
      group.clientIds = clientIds || group.clientIds;
  
      await group.save();
      res.json(group);
    } catch (err) {
      res.status(500).json({ message: "Failed to update client group.", error: err.message });
    }
  };
  // Delete a client group
exports.deleteGroup = async (req, res) => {
    try {
      const group = await ClientGroup.findById(req.params.id);
  
      if (!group) return res.status(404).json({ message: "Client group not found." });
  
      // Ensure the logged-in coach owns the group
      if (group.coachId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this group." });
      }
  
      await group.remove();
      res.json({ message: "Client group deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete client group.", error: err.message });
    }
  };
  