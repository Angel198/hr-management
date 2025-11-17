import express from "express";
import {
  getAllTypesOfWork,
  getTypeOfWorkById,
  createTypeOfWork,
  updateTypeOfWork,
  deleteTypeOfWork,
} from "../controllers/typeOfWorkController.js";

const router = express.Router();

router.get("/", getAllTypesOfWork);
router.get("/:id", getTypeOfWorkById);
router.post("/", createTypeOfWork);
router.put("/:id", updateTypeOfWork);
router.delete("/:id", deleteTypeOfWork);

export default router;

