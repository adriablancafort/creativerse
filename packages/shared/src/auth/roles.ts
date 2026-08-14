import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

export const statement = {
  ...defaultStatements,
  image: ["create", "read", "update", "delete"],
  video: ["create", "read", "update", "delete"],
}

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
  image: ["create", "read", "update", "delete"],
  video: ["create", "read", "update", "delete"],
})

export const admin = ac.newRole({
  ...adminAc.statements,
  image: ["create", "read", "update", "delete"],
  video: ["create", "read", "update", "delete"],
})

export const member = ac.newRole({
  ...memberAc.statements,
  image: ["read"],
  video: ["read"],
})

export const roles = { owner, admin, member }

export type RoleKeys = keyof typeof roles
