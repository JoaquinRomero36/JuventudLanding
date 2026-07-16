const { getDb, requireAdmin, requireUser, ok, fail } = require('./db');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      const events = await db.event.findMany({
        include: { _count: { select: { regs: true } } },
        orderBy: { date: 'asc' }
      });
      const data = events.map(e => ({
        ...e,
        registrationCount: e._count.regs,
        _count: undefined
      }));
      return ok(data);
    }

    if (method === 'POST') {
      const admin = await requireAdmin(db, context);
      const { title, description, date, time, location, maxParticipants } = JSON.parse(event.body);
      const ev = await db.event.create({
        data: {
          title, description,
          date: new Date(date),
          time, location,
          maxParticipants: maxParticipants || 0,
          createdBy: admin.user.id
        }
      });
      return ok(ev);
    }

    if (method === 'PUT') {
      const admin = await requireAdmin(db, context);
      const { id, title, description, date, time, location, maxParticipants } = JSON.parse(event.body);
      const ev = await db.event.update({
        where: { id },
        data: {
          title, description,
          date: new Date(date),
          time, location,
          maxParticipants: maxParticipants || 0
        }
      });
      return ok(ev);
    }

    if (method === 'DELETE') {
      const admin = await requireAdmin(db, context);
      const { id } = event.queryStringParameters;
      await db.event.delete({ where: { id } });
      return ok({ deleted: true });
    }

    return fail(405, 'Método no permitido');
  } catch (err) {
    return fail(400, err.message);
  }
};
