const { getDb, requireUser, ok, fail } = require('./db');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const user = requireUser(context);
    const method = event.httpMethod;

    if (method === 'GET') {
      const regs = await db.registration.findMany({
        where: { userId: user.id },
        select: { eventId: true }
      });
      return ok(regs.map(r => r.eventId));
    }

    if (method === 'POST') {
      const { eventId } = JSON.parse(event.body);
      const ev = await db.event.findUnique({ where: { id: eventId } });
      if (!ev) return fail(404, 'Evento no encontrado');
      if (ev.maxParticipants > 0) {
        const count = await db.registration.count({ where: { eventId } });
        if (count >= ev.maxParticipants) return fail(400, 'Evento completo');
      }
      const reg = await db.registration.create({
        data: { eventId, userId: user.id }
      });
      return ok(reg);
    }

    if (method === 'DELETE') {
      const { eventId } = event.queryStringParameters;
      await db.registration.deleteMany({
        where: { eventId, userId: user.id }
      });
      return ok({ deleted: true });
    }

    return fail(405, 'Método no permitido');
  } catch (err) {
    return fail(400, err.message);
  }
};
