// Unambiguous uppercase characters for easy reading on phone screens (omits I, O, Z, 0, 1)
const ROOM_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTVWXY";
const ROOM_CODE_LENGTH = 4;
const VALID_CODE_REGEX = new RegExp(`^[${ROOM_CODE_CHARACTERS}]{${ROOM_CODE_LENGTH}}$`);

/**
 * Generates a random 4-character room code.
 */
export function generateRoomCode(): string {
  let result = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length);
    result += ROOM_CODE_CHARACTERS[randomIndex];
  }
  return result;
}

/**
 * Validates whether a given string is a valid room code.
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== "string") {
    return false;
  }
  return VALID_CODE_REGEX.test(code.trim().toUpperCase());
}
