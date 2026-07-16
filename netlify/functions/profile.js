const { getDb, requireUser, ok, fail } = require('./db');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const user = requireUser(context);

    if (event.httpMethod === 'GET') {
      let profile = await db.profile.findUnique({ where: { id: user.id } });
      if (!profile) {
        profile = await db.profile.create({
          data: { id: user.id, fullName: user.email.split('@')[0], role: 'user' }
        });
      }
      return ok({ user: { id: user.id, email: user.email }, profile });
    }

    if (event.httpMethod === 'POST') {
      const { fullName } = JSON.parse(event.body);
      let profile = await db.profile.findUnique({ where: { id: user.id } });
      if (!profile) {
        const existingAdmin = await db.profile.findFirst({ where: { role: 'admin' } });
        profile = await db.profile.create({
          data: { id: user.id, fullName: fullName || user.email.split('@')[0], role: existingAdmin ? 'user' : 'admin' }
        });
      } else {
        profile = await db.profile.update({
          where: { id: user.id },
          data: { fullName: fullName || profile.fullName }
        });
      }
      return ok({ user: { id: user.id, email: user.email }, profile });
    }

    return fail(405, 'Método no permitido');
  } catch (err) {
    return fail(400, err.message);
  }
};
