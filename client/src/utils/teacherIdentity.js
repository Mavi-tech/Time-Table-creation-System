const TITLE_PREFIX = /^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i;

function normalizeTeacherToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(TITLE_PREFIX, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTeacherToken(teacherToken, userTokens) {
  if (!teacherToken) return false;
  return userTokens.some(userToken => {
    if (!userToken) return false;
    if (teacherToken === userToken) return true;
    if (teacherToken.length > 3 && userToken.length > 3) {
      return teacherToken.includes(userToken) || userToken.includes(teacherToken);
    }
    return false;
  });
}

export async function resolveTeacherIdForUser(user, api) {
  if (!user) return '';

  if (user.linkedId) {
    try {
      const response = await api.getTeachers();
      if ((response.data || []).some(t => t.id === user.linkedId)) {
        return user.linkedId;
      }
    } catch {
      return user.linkedId;
    }
  }

  try {
    const response = await api.getTeachers();
    const teachers = response.data || [];
    const userTokens = [
      normalizeTeacherToken(user.username),
      normalizeTeacherToken(user.name),
      normalizeTeacherToken((user.email || '').split('@')[0]),
      String(user.linkedId || '').trim(),
    ].filter(Boolean);

    const matchedTeacher = teachers.find(teacher => {
      const teacherTokens = [
        normalizeTeacherToken(teacher.id),
        normalizeTeacherToken(teacher.name),
        normalizeTeacherToken(teacher.email),
        normalizeTeacherToken((teacher.email || '').split('@')[0]),
      ].filter(Boolean);

      return teacherTokens.some(token => matchesTeacherToken(token, userTokens));
    });

    return matchedTeacher?.id || user.linkedId || '';
  } catch {
    return user.linkedId || '';
  }
}