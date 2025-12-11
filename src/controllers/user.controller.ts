import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search
    ? {
        OR: [
          { firstName: { contains: String(search), mode: 'insensitive' as const } },
          { lastName: { contains: String(search), mode: 'insensitive' as const } },
          { email: { contains: String(search), mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users.map((user: typeof users[0]) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, firstName, lastName, roleId, isActive } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      roleId: roleId || user.roleId,
      isActive: isActive !== undefined ? isActive : user.isActive,
    },
    include: { role: true },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: updatedUser.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role.name,
      isActive: updatedUser.isActive,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete by deactivating
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'User',
      entityId: user.id,
    },
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

// @desc    Get all roles
// @route   GET /api/users/roles
// @access  Private/Admin
export const getRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
  });

  res.json({
    success: true,
    data: roles,
  });
});

// @desc    Create a new role
// @route   POST /api/users/roles
// @access  Private/Admin
export const createRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, permissionIds } = req.body;

  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { name },
  });

  if (existingRole) {
    throw new AppError('Role with this name already exists', 400);
  }

  const role = await prisma.role.create({
    data: {
      name,
      description,
      permissions: permissionIds ? { connect: permissionIds.map((id: string) => ({ id })) } : undefined,
    },
    include: { permissions: true },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Role',
      entityId: role.id,
      details: { name: role.name },
    },
  });

  res.status(201).json({
    success: true,
    data: role,
  });
});

// @desc    Update a role
// @route   PUT /api/users/roles/:id
// @access  Private/Admin
export const updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, permissionIds } = req.body;

  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  const updatedRole = await prisma.role.update({
    where: { id: req.params.id },
    data: {
      name: name || role.name,
      description: description !== undefined ? description : role.description,
      permissions: permissionIds ? { set: permissionIds.map((id: string) => ({ id })) } : undefined,
    },
    include: { permissions: true },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Role',
      entityId: updatedRole.id,
      details: { changes: req.body },
    },
  });

  res.json({
    success: true,
    data: updatedRole,
  });
});

// @desc    Delete a role
// @route   DELETE /api/users/roles/:id
// @access  Private/Admin
export const deleteRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  if (role._count.users > 0) {
    throw new AppError('Cannot delete role with assigned users', 400);
  }

  await prisma.role.delete({
    where: { id: req.params.id },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Role',
      entityId: role.id,
    },
  });

  res.json({
    success: true,
    message: 'Role deleted successfully',
  });
});

// @desc    Get all permissions
// @route   GET /api/users/permissions
// @access  Private/Admin
export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const permissions = await prisma.permission.findMany();

  res.json({
    success: true,
    data: permissions,
  });
});

// @desc    Get audit logs
// @route   GET /api/users/audit-logs
// @access  Private/Admin
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, userId, entity, action } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (userId) where.userId = String(userId);
  if (entity) where.entity = String(entity);
  if (action) where.action = String(action);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});
