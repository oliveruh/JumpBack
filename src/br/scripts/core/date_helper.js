export const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString + 'T00:00:00Z'); // Ensure UTC context
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
}