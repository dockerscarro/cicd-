import type { Request, Response } from "express";
import { HubspotService } from "./hubspotService";
import nodemailer from "nodemailer";

/* ------------------------------------------------------------------
   Allowed email domains (MUST match frontend)
------------------------------------------------------------------ */
const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com",
  "aol.com","protonmail.com","zoho.com","mail.com","gmx.com",
  "yandex.com","live.com","msn.com","comcast.net","verizon.net",
  "att.net","me.com","mac.com","fastmail.com","hushmail.com",
  "tutanota.com","rediffmail.com","qq.com","naver.com","daum.net",
  "hanmail.net","seznam.cz","orange.fr","wanadoo.fr","laposte.net",
  "bluewin.ch","telia.com","btinternet.com","virginmedia.com","shaw.ca","rogers.com"
]);

/* ------------------------------------------------------------------
   Allowed software vendors (checkbox values)
------------------------------------------------------------------ */
const ALLOWED_VENDORS = new Set(["E-Soft","BTMS","Pastel"]);

/* ------------------------------------------------------------------
   OTP Storage & Nodemailer
------------------------------------------------------------------ */
const otpStore = new Map<string, string>(); // in-memory store, replace with DB/Redis in prod

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------ */
const normalizeEmail = (email: string) => email.toLowerCase().trim();
const isValidEmail = (email: string) => {
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) return false;
  const domain = email.split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.has(domain);
};
const isValidVat = (vat: string) => /^[A-Za-z0-9]+$/.test(vat);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ------------------------------------------------------------------
   SEND OTP
------------------------------------------------------------------ */
export const sendOtp = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    email = normalizeEmail(email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Invalid or unsupported email domain" });

    const otp = generateOTP();
    otpStore.set(email, otp);

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
    });

    setTimeout(() => otpStore.delete(email), 5 * 60 * 1000); // 5 min expiry

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Failed to send OTP" });
  }
};

/* ------------------------------------------------------------------
   VERIFY OTP
------------------------------------------------------------------ */
export const verifyOtp = (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const storedOtp = otpStore.get(email);
    if (storedOtp && storedOtp === otp) {
      otpStore.delete(email);
      return res.json({ success: true, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "OTP verification failed" });
  }
};

/* ------------------------------------------------------------------
   SIGNUP
------------------------------------------------------------------ */
export const signup = async (req: Request, res: Response) => {
  try {
    let { email, firstName, lastName, business_name, vat_number, country_ } = req.body;

    if (!email || !email.trim()) return res.status(400).json({ success: false, message: "Email is required" });

    email = normalizeEmail(email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Email must be from a supported provider" });
    if (!firstName || !firstName.trim()) return res.status(400).json({ success: false, message: "First name is required" });
    if (!lastName || !lastName.trim()) return res.status(400).json({ success: false, message: "Last name is required" });
    if (!business_name || !business_name.trim()) return res.status(400).json({ success: false, message: "Business name is required" });
    if (!country_ || !country_.trim()) return res.status(400).json({ success: false, message: "Country is required" });
    if (vat_number && !isValidVat(vat_number)) return res.status(400).json({ success: false, message: "VAT number can contain only letters and numbers" });

    const exists = await HubspotService.emailExists(email);
    if (exists) return res.status(409).json({ success: false, message: "Email already exists" });

    const hubspotResult = await HubspotService.createLead({ email, firstName, lastName, business_name, vat_number, country_, user_status: "signup page" });

    return res.json({ success: true, message: "Contact created successfully", hubspotResult });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

/* ------------------------------------------------------------------
   CHECK EMAIL
------------------------------------------------------------------ */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: "Email is required" });

    email = normalizeEmail(email);
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Invalid or unsupported email domain" });

    const exists = await HubspotService.emailExists(email);
    return res.json({ success: true, exists });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------
   SAVE SOFTWARE / SERVER SPECS
------------------------------------------------------------------ */
export const saveSpecs = async (req: Request, res: Response) => {
  let { email, vendor, number_of_users } = req.body;
  if (!email || !vendor || !number_of_users) return res.status(400).json({ success: false, message: "Email, vendor and number_of_users are required" });

  email = normalizeEmail(email);

  if (!Array.isArray(vendor) || vendor.length === 0) return res.status(400).json({ success: false, message: "At least one software must be selected" });

  for (const v of vendor) {
    if (!ALLOWED_VENDORS.has(v)) return res.status(400).json({ success: false, message: `Invalid software selected: ${v}` });
  }

  const vendorString = vendor.join(", ");
  const users = Number(number_of_users);
  if (!Number.isInteger(users) || users <= 0) return res.status(400).json({ success: false, message: "Number of users must be a valid positive number" });

  try {
    const contact = await HubspotService.getContactByEmail(email);
    if (!contact || !contact.id) return res.status(404).json({ success: false, message: "Contact not found" });

    const hubspotResult = await HubspotService.updateLead(contact.id, { vendor: vendorString, number_of_users: users, user_status: "submitted" });

    return res.json({ success: true, message: "Software & server specs saved successfully 🚀", hubspotResult });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};
