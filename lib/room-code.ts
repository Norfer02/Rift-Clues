export function generateRoomCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return Array.from({ length: 6 }, () => {
    const index = Math.floor(Math.random() * alphabet.length);
    return alphabet[index];
  }).join("");
}
