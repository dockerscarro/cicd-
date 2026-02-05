import { Router } from "express";
import { signup, saveSpecs } from "./controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/save-specs", saveSpecs);

export default router;
