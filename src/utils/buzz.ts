export const extractBuzzCodeFromInput = (input: string): string | null => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return null;
  }

  const compactInput = trimmedInput.replace(/\s+/g, '');
  const buzzLinkMatch = compactInput.match(
    /(?:https?:\/\/)?[^\s/]+\/(?:[^\s/]+\/)?buzz\/([^/?#\s]+)/i,
  );

  if (buzzLinkMatch?.[1]) {
    return decodeURIComponent(buzzLinkMatch[1]).trim();
  }

  const buzzPathMatch = compactInput.match(/\/buzz\/([^/?#\s]+)/i);

  if (buzzPathMatch?.[1]) {
    return decodeURIComponent(buzzPathMatch[1]).trim();
  }

  return trimmedInput;
};
