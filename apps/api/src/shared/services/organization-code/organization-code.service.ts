import { injectable } from "tsyringe";
import type { IOrganizationCodeService } from "./organization-code.interface.js";

@injectable()
export class OrganizationCodeService implements IOrganizationCodeService {
  async generate(organizationName: string): Promise<string> {
    const base = organizationName
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.slice(0, 6).toUpperCase())
      .join("-")
      .slice(0, 20);

    return `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}
