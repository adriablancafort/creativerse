import { createAuthClient } from "better-auth/client"
import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins"

import { ac, admin, member, owner } from "@workspace/shared/auth/roles"
import { env } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: env.API_URL,
  plugins: [
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
    lastLoginMethodClient(),
  ],
})

export const {
  accountInfo,
  changeEmail,
  changePassword,
  clearLastUsedLoginMethod,
  deleteUser,
  getAccessToken,
  getLastUsedLoginMethod,
  getSession,
  isLastUsedLoginMethod,
  linkSocial,
  listAccounts,
  listSessions,
  organization,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  revokeSessions,
  sendVerificationEmail,
  signIn,
  signOut,
  signUp,
  unlinkAccount,
  updateSession,
  updateUser,
  verifyEmail,
} = authClient
