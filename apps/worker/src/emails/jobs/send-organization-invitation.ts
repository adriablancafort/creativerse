export type SendOrganizationInvitationPayload = {
  to: string
  url: string
  organizationName: string
}

export async function sendOrganizationInvitation(
  payload: SendOrganizationInvitationPayload
) {
  // TODO: replace with email package sendOrganizationInvitationEmail(payload)
  console.log("send-organization-invitation", payload)
}
