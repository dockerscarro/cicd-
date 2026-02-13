import { Router } from "express";
import { signup, checkEmail, saveSpecs, sendOtp, verifyOtp } from "./controller";

const router = Router();

// Send OTP to email
router.post("/send-otp", sendOtp);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Create new contact (signup)
router.post("/signup", signup);

// Check if email exists (used by Software & Server Setup page)
router.post("/check-email", checkEmail);

// Save software & server specs
router.post("/save-specs", saveSpecs);

export default router;
