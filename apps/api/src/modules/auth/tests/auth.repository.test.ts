import { describe, expect, it, vi } from "vitest";
import type { IAuthRepository } from "../repositories/auth.repository.js";
import type {
  FindOrganizationByNameQuery,
  FindOrganizationByCodeQuery,
  FindUserByEmailQuery,
  FindRoleByNameQuery,
  CreateOrganizationModel,
  CreateBranchModel,
  CreateUserModel,
  AssignRoleModel,
  CreateSessionModel,
  CreateAuditLogModel,
} from "../repositories/models/index.js";

type MockPrisma = {
  organization: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  branch: {
    create: ReturnType<typeof vi.fn>;
  };
  user: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  role: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  userRole: {
    create: ReturnType<typeof vi.fn>;
  };
  session: {
    create: ReturnType<typeof vi.fn>;
  };
  auditLog: {
    create: ReturnType<typeof vi.fn>;
  };
};

const createMockPrisma = (): MockPrisma => ({
  organization: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  branch: {
    create: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  role: {
    findFirst: vi.fn(),
  },
  userRole: {
    create: vi.fn(),
  },
  session: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
});

const createMockRepository = (prisma: MockPrisma): IAuthRepository => {
  const { AuthRepositoryImpl } = require("../repositories/auth.repository.impl.js");
  return new AuthRepositoryImpl(prisma as unknown as Parameters<typeof AuthRepositoryImpl>[0]);
};

describe("AuthRepository", () => {
  describe("findOrganizationByName", () => {
    it("should return organization when found", async () => {
      const prisma = createMockPrisma();
      prisma.organization.findFirst.mockResolvedValue({ id: "org-123", code: "ORG001" });

      const repository = createMockRepository(prisma);
      const result = await repository.findOrganizationByName({ name: "SmartShop" } as FindOrganizationByNameQuery);

      expect(result).toEqual({ id: "org-123", code: "ORG001" });
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { name: "SmartShop", deletedAt: null },
        select: { id: true, code: true },
      });
    });
  });

  describe("findOrganizationByCode", () => {
    it("should return organization when found", async () => {
      const prisma = createMockPrisma();
      prisma.organization.findFirst.mockResolvedValue({ id: "org-123", status: "ACTIVE" });

      const repository = createMockRepository(prisma);
      const result = await repository.findOrganizationByCode({ code: "ORG001" } as FindOrganizationByCodeQuery);

      expect(result).toEqual({ id: "org-123", status: "ACTIVE" });
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: { code: "ORG001", deletedAt: null },
        select: { id: true, status: true },
      });
    });
  });

  describe("findUserByEmail", () => {
    it("should return user when found", async () => {
      const prisma = createMockPrisma();
      prisma.user.findFirst.mockResolvedValue({ id: "user-123" });

      const repository = createMockRepository(prisma);
      const result = await repository.findUserByEmail({ organizationId: "org-123", email: "test@example.com" } as FindUserByEmailQuery);

      expect(result).toEqual({ id: "user-123" });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { organizationId: "org-123", email: "test@example.com", deletedAt: null },
        select: { id: true },
      });
    });
  });

  describe("findRoleByName", () => {
    it("should return role when found", async () => {
      const prisma = createMockPrisma();
      prisma.role.findFirst.mockResolvedValue({ id: "role-123" });

      const repository = createMockRepository(prisma);
      const result = await repository.findRoleByName({ name: "OWNER" } as FindRoleByNameQuery);

      expect(result).toEqual({ id: "role-123" });
      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: { name: "OWNER", deletedAt: null },
        select: { id: true },
      });
    });
  });

  describe("createOrganization", () => {
    it("should create organization and return id", async () => {
      const prisma = createMockPrisma();
      prisma.organization.create.mockResolvedValue({ id: "org-123" });

      const repository = createMockRepository(prisma);
      const result = await repository.createOrganization({
        name: "SmartShop",
        code: "SMART",
      } as CreateOrganizationModel);

      expect(result).toBe("org-123");
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: "SmartShop",
          code: "SMART",
        },
        select: { id: true },
      });
    });
  });

  describe("createBranch", () => {
    it("should create branch and return id", async () => {
      const prisma = createMockPrisma();
      prisma.branch.create.mockResolvedValue({ id: "branch-123" });

      const repository = createMockRepository(prisma);
      const result = await repository.createBranch({
        organizationId: "org-123",
        name: "Head Office",
        code: "HO-001",
        isHeadOffice: true,
      } as CreateBranchModel);

      expect(result).toBe("branch-123");
      expect(prisma.branch.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-123",
          name: "Head Office",
          code: "HO-001",
          isHeadOffice: true,
        },
        select: { id: true },
      });
    });
  });

  describe("createUser", () => {
    it("should create user and return id", async () => {
      const prisma = createMockPrisma();
      prisma.user.create.mockResolvedValue({ id: "user-123" });

      const repository = createMockRepository(prisma);
      const result = await repository.createUser({
        organizationId: "org-123",
        branchId: "branch-123",
        firstName: "Alex",
        lastName: "Kiprop",
        email: "alex@example.com",
        passwordHash: "hashed-password",
        isActive: true,
      } as CreateUserModel);

      expect(result).toBe("user-123");
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-123",
          branchId: "branch-123",
          firstName: "Alex",
          lastName: "Kiprop",
          email: "alex@example.com",
          passwordHash: "hashed-password",
          status: "ACTIVE",
        },
        select: { id: true },
      });
    });
  });

  describe("assignRole", () => {
    it("should assign role to user", async () => {
      const prisma = createMockPrisma();
      prisma.userRole.create.mockResolvedValue(undefined);

      const repository = createMockRepository(prisma);
      await repository.assignRole({ userId: "user-123", roleId: "role-123" } as AssignRoleModel);

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: "user-123", roleId: "role-123" },
      });
    });
  });
});
