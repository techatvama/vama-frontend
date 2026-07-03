// Mirrors the backend password policy in security.py so the UI can validate
// before submitting and show live strength feedback.
export const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function passwordErrors(password) {
    return PASSWORD_RULES.filter((r) => !r.test(password || ''));
}

export function isPasswordValid(password) {
    return passwordErrors(password).length === 0;
}
