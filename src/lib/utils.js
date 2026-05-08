/**
 * Parse a subject field that may be a plain string ("Guitar") or a
 * JSON-encoded array ('["Guitar","Vocals"]') into a display string.
 */
export function parseSubject(subject) {
    if (!subject) return '';
    if (subject.startsWith('[')) {
        try {
            return JSON.parse(subject).join(' · ');
        } catch {
            return subject;
        }
    }
    return subject;
}

/**
 * Parse a subject field into an array of strings.
 * Plain string → ['Guitar']
 * JSON array  → ['Guitar', 'Vocals']
 */
export function parseSubjectList(subject) {
    if (!subject) return [];
    if (subject.startsWith('[')) {
        try {
            return JSON.parse(subject);
        } catch {
            return [subject];
        }
    }
    return [subject];
}
