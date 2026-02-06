import type { Request, Response } from "express";
import { HubspotService } from "./hubspotService.ts";


/**
 * SIGNUP
 * Creates a new lead ONLY if email does not exist
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const exists = await HubspotService.emailExists(email);

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hubspotResult = await HubspotService.createLead(req.body);

    
    res.json({
      success: true,
      message: "Contact created successfully",
      hubspotResult,
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
 * CHECK EMAIL
 * Used by Software & Server Setup page
 */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const exists = await HubspotService.emailExists(email);

    res.json({
      success: true,
      exists,
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
 * SAVE SOFTWARE / SERVER SPECS
 */
export const saveSpecs = async (req: Request, res: Response) => {
  const { email, vendor, number_of_users } = req.body;

  if (!email || !vendor || !number_of_users) {
    return res.status(400).json({
      success: false,
      message: "Email, vendor and number_of_users are required",
    });
  }

  try {
    const contact = await HubspotService.getContactByEmail(email);

    if (!contact || !contact.id) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const hubspotResult = await HubspotService.updateLead(
      contact.id,
      { vendor, number_of_users }
    );

    res.json({
      success: true,
      message: "Software & server specs saved successfully 🚀",
      hubspotResult,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



