/**
 * GET /api/looker/status
 * Check if Looker Studio API is configured and available
 */
export default defineEventHandler(async (event) => {
  const enabled = isLookerApiEnabled(event)
  return {
    enabled,
    message: enabled
      ? 'Looker Studio API is configured and ready'
      : 'Looker Studio API is not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY in .env',
  }
})
