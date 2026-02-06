import type { Request, Response } from "express";
import { HubspotService } from "./hubspotService.js";



/**
 * ===============================
 * Signup
 * ===============================
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const result = await HubspotService.upsertLead(req.body);

    res.json({
      success: true,
      message: "Contact created or updated",
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ===============================
 * Save software + server specs (FINAL STEP)
 * ===============================
 */
export const saveSpecs = async (req: Request, res: Response) => {
  const {
    email,
    vendor,
    number_of_users,
    recommended_cpu,
    recommended_ram,
    recommended_storage,
    final_ram,
    final_storage,
  } = req.body;

  if (!email || !vendor) {
    return res.status(400).json({
      success: false,
      message: "Email and vendor are required",
    });
  }

  try {
    const contact = await HubspotService.getContactByEmail(email);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const result = await HubspotService.updateLead(contact.id, {
      vendor,
      number_of_users,
      recommended_cpu,
      recommended_ram,
      recommended_storage,
      final_ram,
      final_storage,
    });

    res.json({
      success: true,
      message: "Software & server specs saved 🚀",
      result,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/**
 * Save software updates for a lead
 */
export const saveSoftware = async (req: Request, res: Response) => {
  const { email, vendor } = req.body;

  if (!email || !vendor) {
    return res.status(400).json({
      success: false,
      message: "Email and vendor are required"
    });
  }

  try {
    // 1️⃣ Find the contact by email
    const contact = await HubspotService.getContactByEmail(email);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    // 2️⃣ Update vendor property
    const result = await HubspotService.updateLead(contact.id, { vendor });

    res.json({
      success: true,
      message: "Software saved successfully 🎉",
      result
    });
  } catch (err: any) {
    res.status(err.code || 500).json({
      success: false,
      message: err.body?.message || err.message
    });
  }
};



