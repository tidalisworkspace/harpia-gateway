import express from "express";
import controller from "../controllers/intelbrasEvents.controller";

const router = express.Router();

router.post("/", controller.create);

export default router;
