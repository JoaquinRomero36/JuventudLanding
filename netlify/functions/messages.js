const { getDb, requireUser, ok, fail } = require('./db');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const user = requireUser(context);
    const method = event.httpMethod;

    if (method === 'GET') {
      const messages = await db.message.findMany({
        where: { parentId: null },
        include: {
          user: { select: { fullName: true } },
          _count: { select: { likes: true, replies: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      const data = await Promise.all(messages.map(async msg => {
        const userLiked = !!(await db.messageLike.findFirst({
          where: { messageId: msg.id, userId: user.id }
        }));
        const replies = await db.message.findMany({
          where: { parentId: msg.id },
          include: {
            user: { select: { fullName: true } },
            _count: { select: { likes: true } }
          },
          orderBy: { createdAt: 'asc' }
        });
        const repliesData = await Promise.all(replies.map(async r => ({
          id: r.id, content: r.content, userId: r.userId,
          fullName: r.user.fullName,
          createdAt: r.createdAt,
          likesCount: r._count.likes,
          userLiked: !!(await db.messageLike.findFirst({
            where: { messageId: r.id, userId: user.id }
          }))
        })));
        return {
          id: msg.id, content: msg.content, userId: msg.userId,
          fullName: msg.user.fullName,
          createdAt: msg.createdAt,
          likesCount: msg._count.likes,
          userLiked,
          replies: repliesData
        };
      }));
      return ok(data);
    }

    if (method === 'POST') {
      const { content, parentId } = JSON.parse(event.body);
      const msg = await db.message.create({
        data: { content, parentId: parentId || null, userId: user.id }
      });
      return ok(msg);
    }

    if (method === 'DELETE') {
      const { id } = event.queryStringParameters;
      const msg = await db.message.findUnique({ where: { id } });
      if (!msg) return fail(404, 'Mensaje no encontrado');
      const profile = await db.profile.findUnique({ where: { id: user.id } });
      if (msg.userId !== user.id && (!profile || profile.role !== 'admin')) {
        return fail(403, 'No tenés permiso para eliminar');
      }
      await db.message.delete({ where: { id } });
      return ok({ deleted: true });
    }

    return fail(405, 'Método no permitido');
  } catch (err) {
    return fail(400, err.message);
  }
};
