// Clipboard writes run only inside the visitor's explicit Share action.
export async function copyText(value) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch { /* Denied clipboard access: try the selection-based fallback. */ }
    const previous = document.activeElement;
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    field.setAttribute('aria-label', 'Share URL');
    field.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.append(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    let copied = false;
    try { copied = Boolean(document.execCommand?.('copy')); } catch { /* Manual copy remains available. */ }
    field.remove();
    previous?.focus();
    return copied;
}
export async function shareOrCopy(payload) {
    if (typeof navigator.share === 'function') {
        try { await navigator.share(payload); return 'shared'; }
        catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
    }
    return await copyText(payload.url) ? 'copied' : 'manual';
}
