import "reflect-metadata";
import { container } from "tsyringe";
import { TOKENS } from "./tokens.js";
import { PasswordService } from "../services/password/password.service.js";
import { JwtService } from "../services/jwt/jwt.service.js";
import { OrganizationCodeService } from "../services/organization-code/organization-code.service.js";
import { UnitOfWork } from "../database/unit-of-work.js";
import { AuthRepositoryImpl } from "../../modules/auth/repositories/auth.repository.impl.js";

export function registerDependencies() {
  container.registerSingleton(TOKENS.PasswordService, PasswordService);
  container.registerSingleton(TOKENS.JwtService, JwtService);
  container.registerSingleton(TOKENS.OrganizationCodeService, OrganizationCodeService);
  container.registerSingleton(TOKENS.UnitOfWork, UnitOfWork);
  container.registerSingleton(TOKENS.AuthRepository, AuthRepositoryImpl);
}

export { container };
