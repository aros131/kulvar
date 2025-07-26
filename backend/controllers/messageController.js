import Message from '../models/Message.js';

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
    });
    res.status(201).json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ senderId: req.user.id }, { recipientId: req.user.id }] });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving messages", error: error.message });
  }
};
