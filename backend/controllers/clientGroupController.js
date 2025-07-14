const ClientGroup = require("../models/ClientGroup");
const User = require("../models/User");

const getClientDetails = async (req, res) => {
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

const addClientToGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { clientId } = req.body;

    const client = await User.findById(clientId);
    if (!client || client.role !== "user") {
      return res.status(404).json({ message: "Client not found or invalid role" });
    }

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

const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    const coachId = req.user.id;

    const group = await ClientGroup.create({
      name: groupName,
      clientIds: members,
      coachId,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: "Failed to create group", error: error.message });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await ClientGroup.find({ coachId: req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups", error: err.message });
  }
};

const getGroupById = async (req, res) => {
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

const deleteGroup = async (req, res) => {
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

const removeClientFromGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { clientId } = req.body;

    const group = await ClientGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.clientIds = group.clientIds.filter(id => id.toString() !== clientId);
    await group.save();

    res.status(200).json({ message: "Client removed from group", group });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove client", error: err.message });
  }
};

const searchGroupClients = async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || "";

    const groups = await ClientGroup.find({ coachId: req.user.id }).populate("clientIds", "name email");

    const allClients = groups.flatMap(g => g.clientIds);

    const filtered = allClients.filter(c =>
      c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
    );

    res.status(200).json({ clients: filtered });
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

const getAllGroupClients = async (req, res) => {
  try {
    const groups = await ClientGroup.find({ coachId: req.user.id }).populate("clientIds", "name email");
    const clients = groups.flatMap(group => group.clientIds);
    res.status(200).json({ clients });
  } catch (error) {
    res.status(500).json({ message: "Error fetching group clients", error: error.message });
  }
};

const searchClients = async (req, res) => {
  const query = req.query.q;

  try {
    const users = await User.find({
      role: "user",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("_id name email");

    res.status(200).json({ clients: users });
  } catch (err) {
    res.status(500).json({ message: "Client search failed", error: err.message });
  }
};

module.exports = {
  getClientDetails,
  addClientToGroup,
  createGroup,
  getGroups,
  getGroupById,
  deleteGroup,
  removeClientFromGroup,
  searchGroupClients,
  getAllGroupClients,
  searchClients,
};
