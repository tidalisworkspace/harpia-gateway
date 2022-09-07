import express from "express";
import controller from "../controllers/hikvisionEvents.controller";

const router = express.Router();

router.post("/", controller.create);

export default router;
