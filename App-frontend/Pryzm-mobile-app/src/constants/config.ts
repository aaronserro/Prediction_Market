export const API_BASE_URL = "https://api.pryzm.ca";

const fixtureDataValue = process.env.EXPO_PUBLIC_FIXTURE_DATA?.trim().toLowerCase();

// Default to fixtures to preserve the existing local-development experience.
// Only explicit "false" disables fixtures; invalid values are treated as unset.
export const FIXTURE_DATA_ENABLED = fixtureDataValue !== "false";