import type { RegisterCommand } from '../commands/register.command.js';
import type { RegisterResponse } from '../responses/register.response.js';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { IPasswordService } from '../../../shared/services/password/password.interface.js';
import type { IJwtService } from '../../../shared/services/jwt/jwt.interface.js';
import type { IOrganizationCodeService } from '../../../shared/services/organization-code/organization-code.interface.js';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { generateRequestId } from '../utils/request.js';

export class AuthService {
  constructor(
    private readonly _repository: IAuthRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _jwtService: IJwtService,
    private readonly _organizationCodeService: IOrganizationCodeService,
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async register(command: RegisterCommand): Promise<RegisterResponse> {
    const requestId = generateRequestId();

    const organizationCode = await this._organizationCodeService.generate(command.organizationName);

    const existingOrganization = await this._repository.findOrganizationByCode({ code: organizationCode });
    if (existingOrganization) {
      const error = new Error('Organization already exists.') as Error & { code: string; statusCode: number };
      error.code = 'ORGANIZATION_ALREADY_EXISTS';
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await this._passwordService.hash(command.plainPassword);

    let organizationId!: string;
    let userId!: string;

    await this._unitOfWork.execute(async (_tx: unknown) => {
      organizationId = await this._repository.createOrganization({
        name: command.organizationName,
        code: organizationCode,
      });

      const branchId = await this._repository.createBranch({
        organizationId,
        name: 'Head Office',
        code: 'HO-001',
        isHeadOffice: true,
      });

      const existingUser = await this._repository.findUserByEmail({
        organizationId,
        email: command.ownerEmail,
      });
      if (existingUser) {
        const error = new Error('Email already exists.') as Error & {
          code: string;
          statusCode: number;
        };
        error.code = 'EMAIL_EXISTS';
        error.statusCode = 409;
        throw error;
      }

      userId = await this._repository.createUser({
        organizationId,
        branchId,
        firstName: command.ownerFirstName,
        lastName: command.ownerLastName,
        email: command.ownerEmail,
        phone: command.ownerPhone,
        passwordHash,
        isActive: true,
      });

      const role = await this._repository.findRoleByName({ name: 'OWNER' });
      if (!role) {
        const error = new Error('OWNER role not found.') as Error & {
          code: string;
          statusCode: number;
        };
        error.code = 'ROLE_NOT_FOUND';
        error.statusCode = 500;
        throw error;
      }

      await this._repository.assignRole({
        userId,
        roleId: role.id,
      });

      const refreshToken = await this._jwtService.generateRefreshToken({
        userId,
        sessionId: 'temp',
      });
      const refreshTokenHash = await this._passwordService.hash(refreshToken);

      await this._repository.createSession({
        organizationId,
        userId,
        branchId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await this._repository.createAuditLog({
        organizationId,
        actorId: userId,
        action: 'CREATE',
        entity: 'Organization',
        entityId: organizationId,
        requestId,
      });
    });

    const accessToken = await this._jwtService.generateAccessToken({
      userId,
      organizationId,
      roles: ['OWNER'],
    });
    const refreshToken = await this._jwtService.generateRefreshToken({ userId, sessionId: 'temp' });

    return {
      organization: {
        id: organizationId,
        code: organizationCode,
        name: command.organizationName,
      },
      user: {
        id: userId,
        firstName: command.ownerFirstName,
        lastName: command.ownerLastName,
        email: command.ownerEmail,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    } as const;
  }

  async login(_data: { email: string; password: string }): Promise<never> {
    throw new Error('Not implemented');
  }

  async refresh(_refreshToken: string): Promise<never> {
    throw new Error('Not implemented');
  }

  async logout(_userId: string, _sessionId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
