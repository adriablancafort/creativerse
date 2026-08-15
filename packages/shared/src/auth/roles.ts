import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

export const statement = {
  ...defaultStatements,
  createImage: ["create", "read", "update", "delete"],
  createVideo: ["create", "read", "update", "delete"],
  enhance: ["create", "read", "update", "delete"],
}

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
  createImage: ["create", "read", "update", "delete"],
  createVideo: ["create", "read", "update", "delete"],
  enhance: ["create", "read", "update", "delete"],
})

export const admin = ac.newRole({
  ...adminAc.statements,
  createImage: ["create", "read", "update", "delete"],
  createVideo: ["create", "read", "update", "delete"],
  enhance: ["create", "read", "update", "delete"],
})

export const member = ac.newRole({
  ...memberAc.statements,
  createImage: ["read"],
  createVideo: ["read"],
  enhance: ["read"],
})

export const roles = { owner, admin, member }

export type RoleKeys = keyof typeof roles
