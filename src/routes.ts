import { Router } from "express";
import { signup, checkEmail, saveSpecs } from "./controller";

const router = Router();

// Create new contact (signup)
router.post("/signup", signup);

// Check if email exists (used by Software & Server Setup page)
router.post("/check-email", checkEmail);

// Save software & server specs
router.post("/save-specs", saveSpecs);

export default router;
