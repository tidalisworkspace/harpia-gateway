import express from "express";
import controller from "../controllers/alphadigi-heartbeat.controller";

const router = express.Router();

router.post("/", controller.heartbeat);

export default router;
