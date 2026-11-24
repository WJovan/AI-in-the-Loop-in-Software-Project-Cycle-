export const AI_REQUEST_TIMEOUT_MS = 60000;

export const CATEGORIES = [
  { id: 'allowed', label: 'AI Allowed', short: 'Allowed' },
  { id: 'limited', label: 'AI Limited', short: 'Limited' },
  { id: 'not_allowed', label: 'AI Not Allowed', short: 'Not Allowed' },
];

export const STARTER_ACTIVITIES = [
  { id: 'brainstorm', title: 'Brainstorming', description: 'Generate initial ideas for a group assignment' },
  { id: 'coding', title: 'Writing code', description: 'Generate or modify implementation code' },
  { id: 'debug', title: 'Debugging', description: 'Find and understand errors' },
  { id: 'report', title: 'Final report', description: 'Draft or edit the submission' },
];

export const createProject = (name = 'Programming Group Assignment', memberA = 'Student A', memberB = 'Student B') => ({
  name: name.trim(),
  members: [memberA.trim(), memberB.trim()],
  activities: STARTER_ACTIVITIES.map(x => ({ ...x })),
  preferences: [{}, {}],
  agreement: {},
  createdAt: new Date().toISOString(),
});

export function getComparison(project) {
  return project.activities.map(activity => {
    const a = project.preferences[0][activity.id];
    const b = project.preferences[1][activity.id];
    const bothSubmitted = !!(a?.category && b?.category);
    return {
      activity,
      a,
      b,
      complete: bothSubmitted,
      disagrees: bothSubmitted && a.category !== b.category,
      final: project.agreement[activity.id],
    };
  });
}

export function getStats(project) {
  const rows = getComparison(project);
  return {
    total: rows.length,
    compared: rows.filter(x => x.complete).length,
    disagreements: rows.filter(x => x.disagrees).length,
    resolved: rows.filter(x => x.final?.category).length,
  };
}

export function isValidProject(data) {
  return !!(data && typeof data.name === 'string' && Array.isArray(data.members) && data.members.length === 2 && Array.isArray(data.activities) && Array.isArray(data.preferences) && data.preferences.length === 2 && data.agreement && typeof data.agreement === 'object');
}

export function getAgreementText(project) {
  const rows = getComparison(project);
  return [`AI BOUNDARY AGREEMENT`, `Project: ${project.name}`, `Members: ${project.members.join(' & ')}`, '', ...rows.flatMap(({activity, final}) => [`${activity.title}: ${CATEGORIES.find(x => x.id === final?.category)?.label || 'Not decided'}`, ...(final?.condition ? [`Condition: ${final.condition}`] : []), '']), 'Agreements must be reviewed and accepted by both members.'];
}
