import { CLIENT_URL } from '@env';

export type MessageTextSegment = {
  type: 'text' | 'link';
  content: string;
  url?: string;
};

export type MessageRenderSegment =
  | { type: 'text'; content: string }
  | { type: 'link'; content: string; url: string }
  | { type: 'mention'; label: string; userId?: string }
  | { type: 'newline' };

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/gi;
const ANCHOR_REGEX = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;

export const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const MENTION_TRIGGER_REGEX = /(?:^|\s)@([\w.\-_]*)$/;

/** Returns the active @mention query at the cursor, if any. */
export const getActiveMention = (
  text: string,
  cursorPos: number,
): { query: string; pos: number } | null => {
  const beforeCursor = text.slice(0, Math.max(0, cursorPos));
  const match = beforeCursor.match(MENTION_TRIGGER_REGEX);
  if (!match) {
    return null;
  }

  return {
    query: match[1] ?? '',
    pos: cursorPos,
  };
};

const stripHtmlTags = (text: string): string => text.replace(/<[^>]*>/g, '');

const prepareMessageHtmlForRender = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '');

const appendTextSegments = (
  segments: MessageRenderSegment[],
  content: string,
) => {
  if (!content) {
    return;
  }

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line) {
      segments.push({ type: 'text', content: line });
    }
    if (index < lines.length - 1) {
      segments.push({ type: 'newline' });
    }
  });
};

/** Parses message HTML into renderable text, links, mentions, and line breaks. */
export const parseMessageHtmlForRender = (
  html: string,
): MessageRenderSegment[] => {
  if (!html) {
    return [];
  }

  const prepared = prepareMessageHtmlForRender(html);
  const parts = prepared.split(/(<span[^>]*>.*?<\/span>)/gi);
  const segments: MessageRenderSegment[] = [];

  parts.forEach(part => {
    if (!part) {
      return;
    }

    if (part.startsWith('<span')) {
      const labelMatch = part.match(/data-label="([^"]*)"/);
      const idMatch = part.match(/data-id="([^"]*)"/);
      segments.push({
        type: 'mention',
        label: labelMatch?.[1] || '',
        userId: idMatch?.[1],
      });
      return;
    }

    parseMessageTextWithLinks(part).forEach(segment => {
      if (segment.type === 'link' && segment.url) {
        segments.push({
          type: 'link',
          content: segment.content,
          url: segment.url,
        });
        return;
      }

      appendTextSegments(segments, segment.content);
    });
  });

  return segments;
};

/** Builds web-compatible HTML from plain text, preserving line breaks as paragraphs. */
export const buildMessageHtml = (content: string): string => {
  if (!content) {
    return '<p></p>';
  }

  return content
    .split('\n')
    .map(line => `<p>${line}</p>`)
    .join('');
};

const trimTrailingUrlPunctuation = (url: string): string =>
  url.replace(/[.,;:!?)}\]]+$/, '');

const parsePlainTextUrls = (text: string): MessageTextSegment[] => {
  const cleaned = decodeHtmlEntities(stripHtmlTags(text));
  if (!cleaned) {
    return [];
  }

  const segments: MessageTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: cleaned.slice(lastIndex, match.index),
      });
    }

    const rawUrl = match[1];
    const url = trimTrailingUrlPunctuation(rawUrl);
    segments.push({ type: 'link', content: url, url });
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < cleaned.length) {
    segments.push({ type: 'text', content: cleaned.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: cleaned }];
};

/** Parses a message fragment (outside mention spans) into plain text and link segments. */
export const parseMessageTextWithLinks = (
  text: string,
): MessageTextSegment[] => {
  if (!text) {
    return [];
  }

  const segments: MessageTextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  ANCHOR_REGEX.lastIndex = 0;
  while ((match = ANCHOR_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(...parsePlainTextUrls(text.slice(lastIndex, match.index)));
    }

    const url = match[1];
    const label = decodeHtmlEntities(stripHtmlTags(match[2])).trim() || url;
    segments.push({ type: 'link', content: label, url });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(...parsePlainTextUrls(text.slice(lastIndex)));
  }

  return segments.length > 0 ? segments : parsePlainTextUrls(text);
};

const MENTION_SPAN_REGEX = /<span[^>]*data-label="([^"]*)"[^>]*>.*?<\/span>/gi;

/** Plain-text message body for clipboard (mentions as @label, HTML stripped). */
export const getPlainMessageText = (html: string): string => {
  if (!html) {
    return '';
  }

  return decodeHtmlEntities(
    html
      .replace(MENTION_SPAN_REGEX, '@$1')
      .replace(ANCHOR_REGEX, (_, url: string, label: string) => {
        const text = stripHtmlTags(label).trim();
        return text || url;
      })
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Single-line preview text for chat lists (HTML stripped, entities decoded). */
export const formatPreviewMessage = (html: string): string =>
  getPlainMessageText(html).replace(/\s+/g, ' ').trim();

export type MessageShareContext = 'dm' | 'group_dm' | 'channel';

type BuildMessageShareLinkParams = {
  threadId: string;
  channelId: string;
  orgSlug?: string;
  context?: MessageShareContext;
};

/** Deep link to a message, aligned with Zedu web org-scoped routes. */
export const buildMessageShareLink = ({
  threadId,
  channelId,
  orgSlug,
  context = 'dm',
}: BuildMessageShareLinkParams): string => {
  const baseUrl = (CLIENT_URL || 'https://zedu.chat').replace(/\/$/, '');
  const pathSegment =
    context === 'channel'
      ? 'channels'
      : context === 'group_dm'
      ? 'group-dms'
      : 'dms';

  if (orgSlug) {
    return `${baseUrl}/${encodeURIComponent(
      orgSlug,
    )}/${pathSegment}/${channelId}?thread_id=${threadId}`;
  }

  return `${baseUrl}/client/${pathSegment}/${channelId}?thread_id=${threadId}`;
};
