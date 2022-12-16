import express from "express";
import controller from "../controllers/alphadigi-push.controller";

const router = express.Router();

router.post("/", controller.push);

export default router;
