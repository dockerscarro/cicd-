import dotenv from "dotenv";
dotenv.config();

import { Client } from "@hubspot/api-client";

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY!,
});

export interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  business_name?: string;
  vat_number?: string;
  country_?: string;
}

export class HubspotService {

  private static cleanProperties(
    data: Record<string, any>
  ): Record<string, string | number | boolean> {
    const cleaned: Record<string, any> = {};
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        cleaned[key] = data[key];
      }
    }
    return cleaned;
  }

  // 🔍 Check if email exists (used by frontend)
  static async emailExists(email: string): Promise<boolean> {
    const response = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: "email", operator: "EQ", value: email },
          ],
        },
      ],
      limit: 1,
    } as any);

    return response.total > 0;
  }

  // 🔎 Get contact by email
  static async getContactByEmail(email: string) {
    const response = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: "email", operator: "EQ", value: email },
          ],
        },
      ],
      limit: 1,
    } as any);

    return response.results?.[0] ?? null;
  }

  // 🆕 Create lead (signup step)
  static async createLead(data: SignupData) {
    const properties = this.cleanProperties({
      email: data.email,
      firstname: data.firstName,
      lastname: data.lastName,
      lifecyclestage: "lead",
      business_name: data.business_name,
      vat_number: data.vat_number,
      country_: data.country_,
    });

    return hubspotClient.crm.contacts.basicApi.create(
      { properties } as any
    );
  }

  // ✏️ Update existing contact
  static async updateLead(
    contactId: string,
    updates: Record<string, any>
  ) {
    if (!contactId) {
      throw new Error("HubSpot contact ID is required");
    }

    const properties = this.cleanProperties(updates);

    return hubspotClient.crm.contacts.basicApi.update(
      contactId,
      { properties } as any
    );
  }
}
