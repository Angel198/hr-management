import Client from "../models/Client.js";

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: error.message || "Failed to fetch clients" });
  }
};

// Get client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ message: error.message || "Failed to fetch client" });
  }
};

// Create new client
export const createClient = async (req, res) => {
  try {
    const clientData = req.body;
    
    // Check if code already exists
    if (clientData.code) {
      const existingClient = await Client.findOne({ code: clientData.code.toUpperCase() });
      if (existingClient) {
        return res.status(400).json({ message: "Client code already exists" });
      }
      clientData.code = clientData.code.toUpperCase();
    }

    const client = new Client(clientData);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Client code or name already exists" });
    }
    res.status(500).json({ message: error.message || "Failed to create client" });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingClient = await Client.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingClient) {
        return res.status(400).json({ message: "Client code already exists" });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    const client = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Client code or name already exists" });
    }
    res.status(500).json({ message: error.message || "Failed to update client" });
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: error.message || "Failed to delete client" });
  }
};

