export function computeSuspiciousLoginScore(activityLogs, now = Date.now()) {
    if (activityLogs.length === 0)
        return 20;
    const distinctIps = new Set(activityLogs.map((log) => log.ipAddress?.trim()).filter(Boolean)).size;
    const distinctDevices = new Set(activityLogs.map((log) => log.device?.trim()).filter(Boolean)).size;
    const recentLogins = activityLogs.filter((log) => {
        const ageMs = now - log.loginTime.getTime();
        return ageMs <= 1000 * 60 * 60 * 24 * 14;
    }).length;
    let score = 15;
    score += Math.min(distinctIps * 10, 35);
    score += Math.min(distinctDevices * 8, 20);
    score += recentLogins >= 10 ? 20 : recentLogins >= 5 ? 10 : 0;
    return Math.min(100, Math.max(0, score));
}
