import dotenv from "dotenv";
dotenv.config();
import { Client } from "@hubspot/api-client";

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_API_KEY!,
});



/**
 * ===============================
 * Signup data (Step 1)
 * ===============================
 */
export interface SignupData {
  email: string;
  firstName: string;
  lastName: string;
  business_name?: string;
  vat_number?: string;
  country_?: string;
}

export class HubspotService {

  /**
   * 🔹 Remove undefined / null values
   */
  private static cleanProperties(
    data: Record<string, any>
  ): Record<string, string | number | boolean | null> {
    const cleaned: Record<string, any> = {};

    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        cleaned[key] = data[key];
      }
    }

    return cleaned;
  }

  /**
   * ===============================
   * 🔍 Find contact by email
   * ===============================
   */
  static async getContactByEmail(email: string) {
    const response = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [{ propertyName: "email", operator: "EQ", value: email }],
        },
      ],
      properties: [
        "email",
        "firstname",
        "lastname",
        "business_name",
        "vat_number",
        "country_",

        // Step 2 properties
        "vendor",
        "number_of_users",
        "recommended_cpu",
        "recommended_ram",
        "recommended_storage",
        "final_ram",
        "final_storage",
      ],
      limit: 1,
    } as any);

    return response.results?.[0] ?? null;
  }


  
  /**
   * ===============================
   * ✍️ Create or Update Lead (Signup)
   * ===============================
   */
  static async upsertLead(data: SignupData) {
    const properties = this.cleanProperties({
      email: data.email,
      firstname: data.firstName,
      lastname: data.lastName,
      lifecyclestage: "lead",

      business_name: data.business_name,
      vat_number: data.vat_number,
      country_: data.country_,
    });

    const existingContact = await this.getContactByEmail(data.email);

    if (existingContact) {
      return this.updateLead(existingContact.id, properties);
    }

    return hubspotClient.crm.contacts.basicApi.create({
      properties,
    } as any);
  }

  /**
   * ===============================
   * ✏️ Update by Contact ID
   * ===============================
   */
  static async updateLead(contactId: string, updates: Record<string, any>) {
    const properties = this.cleanProperties(updates);

    return hubspotClient.crm.contacts.basicApi.update(
      contactId,
      { properties } as any
    );
  }

  /**
   * ===============================
   * ✉️ Update by Email (helper)
   * ===============================
   */
  static async updateByEmail(email: string, updates: Record<string, any>) {
    const contact = await this.getContactByEmail(email);

    if (!contact) {
      throw new Error(`Contact with email ${email} not found`);
    }

    return this.updateLead(contact.id, updates);
  }
}
