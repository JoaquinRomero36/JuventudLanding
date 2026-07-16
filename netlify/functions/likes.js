const { getDb, requireUser, ok, fail } = require('./db');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const user = requireUser(context);
    if (event.httpMethod !== 'POST') return fail(405, 'Método no permitido');

    const { messageId } = JSON.parse(event.body);
    const existing = await db.messageLike.findFirst({
      where: { messageId, userId: user.id }
    });

    if (existing) {
      await db.messageLike.delete({ where: { id: existing.id } });
      return ok({ liked: false });
    } else {
      await db.messageLike.create({
        data: { messageId, userId: user.id }
      });
      return ok({ liked: true });
    }
  } catch (err) {
    return fail(400, err.message);
  }
};
