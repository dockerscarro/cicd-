import dotenv from "dotenv";
dotenv.config();

import { Client } from "@hubspot/api-client";

/* ------------------------------------------------------------------
   HubSpot Client
------------------------------------------------------------------ */
const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY!,
});

/* ------------------------------------------------------------------
   Signup payload interface
------------------------------------------------------------------ */
export interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  business_name?: string;
  vat_number?: string;
  country_?: string;
}

/* ------------------------------------------------------------------
   HubSpot Service
------------------------------------------------------------------ */
export class HubspotService {
  /**
   * Clean properties before sending to HubSpot:
   * - removes undefined
   * - removes null
   * - removes empty strings
   *
   * HubSpot silently drops invalid values otherwise
   */
  private static cleanProperties(
    data: Record<string, unknown>
  ): Record<string, string | number | boolean> {
    const cleaned: Record<string, any> = {};

    for (const key in data) {
      const value = data[key];

      if (
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
      ) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /* ------------------------------------------------------------------
     🔍 Check if email exists
  ------------------------------------------------------------------ */
  static async emailExists(email: string): Promise<boolean> {
    const response =
      await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
        limit: 1,
      } as any);

    return response.total > 0;
  }

  /* ------------------------------------------------------------------
     🔎 Get contact by email
  ------------------------------------------------------------------ */
  static async getContactByEmail(email: string) {
    const response =
      await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
        limit: 1,
      } as any);

    return response.results?.[0] ?? null;
  }

  /* ------------------------------------------------------------------
     🆕 Create lead (Signup step)
  ------------------------------------------------------------------ */
  static async createLead(data: SignupData & { user_status?: string }) {
    const properties = this.cleanProperties({
      email: data.email,
      firstname: data.firstName,
      lastname: data.lastName,
      lifecyclestage: "lead",
      business_name: data.business_name,
      vat_number: data.vat_number,
      country_: data.country_,
      user_status: data.user_status // <-- added
    });

    return hubspotClient.crm.contacts.basicApi.create({ properties } as any);
  }


  /* ------------------------------------------------------------------
     ✏️ Update existing lead (Software / Server step)
     - vendor: string (comma-separated)
     - number_of_users: number
  ------------------------------------------------------------------ */
  static async updateLead(
    contactId: string,
    updates: {
      vendor?: string;
      number_of_users?: number;
      user_status?: string; // <-- added
    }
  ) {
    if (!contactId) {
      throw new Error("HubSpot contact ID is required");
    }

    const properties = this.cleanProperties({
      vendor: updates.vendor,
      number_of_users: updates.number_of_users,
      user_status: updates.user_status // <-- added
    });

    return hubspotClient.crm.contacts.basicApi.update(contactId, { properties } as any);
  }

}
