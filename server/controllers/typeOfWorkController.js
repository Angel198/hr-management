import TypeOfWork from "../models/TypeOfWork.js";

// Get all types of work
export const getAllTypesOfWork = async (req, res) => {
  try {
    const typesOfWork = await TypeOfWork.find().sort({ createdAt: -1 });
    res.json(typesOfWork);
  } catch (error) {
    console.error("Error fetching types of work:", error);
    res.status(500).json({ message: error.message || "Failed to fetch types of work" });
  }
};

// Get type of work by ID
export const getTypeOfWorkById = async (req, res) => {
  try {
    const { id } = req.params;
    const typeOfWork = await TypeOfWork.findById(id);
    if (!typeOfWork) {
      return res.status(404).json({ message: "Type of work not found" });
    }
    res.json(typeOfWork);
  } catch (error) {
    console.error("Error fetching type of work:", error);
    res.status(500).json({ message: error.message || "Failed to fetch type of work" });
  }
};

// Create new type of work
export const createTypeOfWork = async (req, res) => {
  try {
    const typeOfWorkData = req.body;
    
    // Check if code or name already exists
    if (typeOfWorkData.code) {
      const existingType = await TypeOfWork.findOne({ code: typeOfWorkData.code.toUpperCase() });
      if (existingType) {
        return res.status(400).json({ message: "Type of work code already exists" });
      }
      typeOfWorkData.code = typeOfWorkData.code.toUpperCase();
    }

    if (typeOfWorkData.name) {
      const existingType = await TypeOfWork.findOne({ name: typeOfWorkData.name.trim() });
      if (existingType) {
        return res.status(400).json({ message: "Type of work name already exists" });
      }
    }

    const typeOfWork = new TypeOfWork(typeOfWorkData);
    await typeOfWork.save();
    res.status(201).json(typeOfWork);
  } catch (error) {
    console.error("Error creating type of work:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Type of work code or name already exists" });
    }
    res.status(500).json({ message: error.message || "Failed to create type of work" });
  }
};

// Update type of work
export const updateTypeOfWork = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingType = await TypeOfWork.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingType) {
        return res.status(400).json({ message: "Type of work code already exists" });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // If name is being updated, check for duplicates
    if (updateData.name) {
      const existingType = await TypeOfWork.findOne({ 
        name: updateData.name.trim(),
        _id: { $ne: id }
      });
      if (existingType) {
        return res.status(400).json({ message: "Type of work name already exists" });
      }
    }

    const typeOfWork = await TypeOfWork.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!typeOfWork) {
      return res.status(404).json({ message: "Type of work not found" });
    }

    res.json(typeOfWork);
  } catch (error) {
    console.error("Error updating type of work:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Type of work code or name already exists" });
    }
    res.status(500).json({ message: error.message || "Failed to update type of work" });
  }
};

// Delete type of work
export const deleteTypeOfWork = async (req, res) => {
  try {
    const { id } = req.params;
    const typeOfWork = await TypeOfWork.findByIdAndDelete(id);
    if (!typeOfWork) {
      return res.status(404).json({ message: "Type of work not found" });
    }
    res.json({ message: "Type of work deleted successfully" });
  } catch (error) {
    console.error("Error deleting type of work:", error);
    res.status(500).json({ message: error.message || "Failed to delete type of work" });
  }
};

