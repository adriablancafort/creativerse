import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

export const statement = {
  ...defaultStatements,
}

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
})

export const admin = ac.newRole({
  ...adminAc.statements,
})

export const member = ac.newRole({
  ...memberAc.statements,
})

export const roles = { owner, admin, member }

export type RoleKeys = keyof typeof roles
