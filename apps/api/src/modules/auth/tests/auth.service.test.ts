import { describe, expect, it, vi } from 'vitest';
import type { IAuthRepository } from '../repositories/auth.repository.js';
import type { RegisterCommand } from '../commands/register.command.js';
import type { IPasswordService } from '../../../shared/services/password/password.interface.js';
import type { IJwtService } from '../../../shared/services/jwt/jwt.interface.js';
import type { IOrganizationCodeService } from '../../../shared/services/organization-code/organization-code.interface.js';
import type { IUnitOfWork } from '../../../shared/database/unit-of-work.js';
import { AuthService } from '../services/auth.service.js';

const createMockRepository = (overrides: Partial<IAuthRepository> = {}): IAuthRepository => ({
  findOrganizationByName: vi.fn(),
  findOrganizationByCode: vi.fn(),
  findUserByEmail: vi.fn(),
  findRoleByName: vi.fn(),
  createOrganization: vi.fn(),
  createBranch: vi.fn(),
  createUser: vi.fn(),
  assignRole: vi.fn(),
  createSession: vi.fn(),
  createAuditLog: vi.fn(),
  updateLastLogin: vi.fn(),
  findUserByOrganizationAndEmail: vi.fn(),
  findSessionById: vi.fn(),
  updateSessionRefreshToken: vi.fn(),
  revokeSession: vi.fn(),
  findUserById: vi.fn(),
  findUserWithRolesById: vi.fn(),
  ...overrides,
});

const createMockPasswordService = (): IPasswordService => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn().mockResolvedValue(true),
});

const createMockJwtService = (): IJwtService => ({
  generateAccessToken: vi.fn().mockResolvedValue('access-token'),
  generateRefreshToken: vi.fn().mockResolvedValue('refresh-token'),
  verifyAccessToken: vi
    .fn()
    .mockResolvedValue({ userId: 'user-123', organizationId: 'org-123', roles: ['OWNER'] }),
  verifyRefreshToken: vi
    .fn()
    .mockResolvedValue({ userId: 'user-123', sessionId: 'session-123', jti: 'jti-123' }),
});

const createMockOrganizationCodeService = (): IOrganizationCodeService => ({
  generate: vi.fn().mockResolvedValue('ORG001'),
});

const createMockUnitOfWork = (): IUnitOfWork => ({
  execute: vi.fn().mockImplementation(async (operation) => operation({} as unknown)),
});

const createCommand = (): RegisterCommand => ({
  organizationName: 'SmartShop Demo Ltd.',
  ownerFirstName: 'Alex',
  ownerLastName: 'Kiprop',
  ownerEmail: 'alex@smartshop.test',
  ownerPhone: '+254700000001',
  plainPassword: 'StrongPassword123!',
});

describe('AuthService.register', () => {
  it('should register a new organization', async () => {
    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    const result = await service.register(createCommand());

    expect(result.organization.id).toBe('org-123');
    expect(result.organization.name).toBe('SmartShop Demo Ltd.');
    expect(result.organization.code).toBeDefined();
    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('alex@smartshop.test');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should register a new organization', async () => {
    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    const result = await service.register(createCommand());

    expect(result.organization.id).toBe('org-123');
    expect(result.organization.name).toBe('SmartShop Demo Ltd.');
    expect(result.organization.code).toBeDefined();
    expect(result.user.id).toBe('user-123');
    expect(result.user.email).toBe('alex@smartshop.test');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should throw error when organization exists', async () => {
    const service = new AuthService(
      createMockRepository({
        findOrganizationByCode: vi.fn().mockResolvedValue({ id: 'org-123', status: 'ACTIVE' }),
      }),
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await expect(service.register(createCommand())).rejects.toThrow('Organization already exists.');
  });

  it('should throw error when email already exists', async () => {
    const service = new AuthService(
      createMockRepository({
        findOrganizationByCode: vi.fn().mockResolvedValue(null),
        createOrganization: vi.fn().mockResolvedValue('org-123'),
        createBranch: vi.fn().mockResolvedValue('branch-123'),
        findUserByEmail: vi.fn().mockResolvedValue({ id: 'user-123' }),
      }),
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await expect(service.register(createCommand())).rejects.toThrow('Email already exists.');
  });

  it('should rollback transaction when repository fails', async () => {
    const unitOfWork = createMockUnitOfWork();
    unitOfWork.execute = vi.fn().mockRejectedValue(new Error('Database error'));

    const service = new AuthService(
      createMockRepository({
        findOrganizationByCode: vi.fn().mockResolvedValue(null),
      }),
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      unitOfWork,
    );

    await expect(service.register(createCommand())).rejects.toThrow('Database error');
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
  });

  it('should hash password before creating user', async () => {
    const hashSpy = vi.fn().mockResolvedValue('hashed-password');
    const passwordService: IPasswordService = {
      hash: hashSpy,
      verify: vi.fn().mockResolvedValue(true),
    };

    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      passwordService,
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await service.register(createCommand());

    expect(hashSpy).toHaveBeenCalledWith('StrongPassword123!');
    expect(repository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'hashed-password',
      }),
    );
  });

  it('should create head office branch', async () => {
    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await service.register(createCommand());

    expect(repository.createBranch).toHaveBeenCalledWith({
      organizationId: 'org-123',
      name: 'Head Office',
      code: 'HO-001',
      isHeadOffice: true,
    });
  });

  it('should assign OWNER role to user', async () => {
    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await service.register(createCommand());

    expect(repository.findRoleByName).toHaveBeenCalledWith({ name: 'OWNER' });
    expect(repository.assignRole).toHaveBeenCalledWith({
      userId: 'user-123',
      roleId: 'role-123',
    });
  });

  it('should create session and audit log', async () => {
    const repository = createMockRepository({
      findOrganizationByCode: vi.fn().mockResolvedValue(null),
      createOrganization: vi.fn().mockResolvedValue('org-123'),
      createBranch: vi.fn().mockResolvedValue('branch-123'),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn().mockResolvedValue('user-123'),
      findRoleByName: vi.fn().mockResolvedValue({ id: 'role-123' }),
      assignRole: vi.fn().mockResolvedValue(undefined),
      createSession: vi.fn().mockResolvedValue('session-123'),
      createAuditLog: vi.fn().mockResolvedValue(undefined),
    });

    const service = new AuthService(
      repository,
      createMockPasswordService(),
      createMockJwtService(),
      createMockOrganizationCodeService(),
      createMockUnitOfWork(),
    );

    await service.register(createCommand());

    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-123',
        userId: 'user-123',
        branchId: 'branch-123',
      }),
    );

    expect(repository.updateSessionRefreshToken).toHaveBeenCalledWith(
      'session-123',
      'hashed-password',
    );

    expect(repository.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-123',
        actorId: 'user-123',
        action: 'CREATE',
        entity: 'Organization',
        entityId: 'org-123',
      }),
    );
  });
});
