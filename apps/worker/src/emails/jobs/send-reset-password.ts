export type SendResetPasswordPayload = {
  to: string
  name: string
  url: string
}

export async function sendResetPassword(payload: SendResetPasswordPayload) {
  // TODO: replace with email package sendRecoverPasswordEmail(payload)
  console.log("send-reset-password", payload)
}
