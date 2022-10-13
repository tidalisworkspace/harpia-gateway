import express from "express";
import controller from "../controllers/hikvision-events.controller";

const router = express.Router();

router.post("/dao", controller.create);

export default router;
