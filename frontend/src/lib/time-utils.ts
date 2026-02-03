/**
 * Time Utilities
 * Format time differences in human-readable format
 */

/**
 * Format time difference as "X days Y hours Z minutes ago"
 * Shows most significant units only (max 2 units)
 */
export function formatTimeAgo(date: Date | string | null): string {
  if (!date) {
    return 'Unknown';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  
  if (diffMs < 0) {
    return 'Just now'; // Future date shouldn't happen, but handle gracefully
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Less than 1 minute
  if (minutes < 1) {
    return `${seconds}s ago`;
  }

  // Less than 1 hour
  if (hours < 1) {
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (days < 1) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m ago`;
    }
    return `${hours}h ago`;
  }

  // 1 day or more
  const remainingHours = hours % 24;
  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h ago`;
  }
  return `${days}d ago`;
}

/**
 * Format time until a future date as "Ends in X days Y hours Z minutes"
 */
export function formatTimeUntil(date: Date | string | null): string {
  if (!date) {
    return 'Unknown';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return 'Ended';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Less than 1 minute
  if (minutes < 1) {
    return `Ends in ${seconds}s`;
  }

  // Less than 1 hour
  if (hours < 1) {
    return `Ends in ${minutes}m`;
  }

  // Less than 1 day
  if (days < 1) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `Ends in ${hours}h ${remainingMinutes}m`;
    }
    return `Ends in ${hours}h`;
  }

  // 1 day or more
  const remainingHours = hours % 24;
  if (remainingHours > 0) {
    return `Ends in ${days}d ${remainingHours}h`;
  }
  return `Ends in ${days}d`;
}

/**
 * Format timestamp with detailed breakdown (days, hours, minutes)
 * Used for wallet creation dates where precision matters
 */
export function formatDetailedTimeAgo(date: Date | string | null): string {
  if (!date) {
    return 'Unknown';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  
  if (diffMs < 0) {
    return 'Just now';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Less than 1 minute
  if (minutes < 1) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }

  // Less than 1 hour
  if (hours < 1) {
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} ago`;
  }

  // Less than 1 day
  if (days < 1) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ago`;
  }

  // 1 day or more
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  
  let result = `${days} day${days !== 1 ? 's' : ''}`;
  
  if (remainingHours > 0) {
    result += ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }
  
  if (remainingMinutes > 0 && days < 7) { // Only show minutes if less than a week
    result += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
  
  return `${result} ago`;
}
