const { getDb, requireUser, requireAdmin, ok, fail } = require('./db');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  const db = getDb();
  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      const user = getUser(context);
      const { onlyApproved } = event.queryStringParameters;
      const where = onlyApproved === 'true'
        ? { approved: true }
        : user
          ? { OR: [{ approved: true }, { uploadedBy: user.id }] }
          : { approved: true };
      const photos = await db.photo.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      return ok(photos);
    }

    if (method === 'POST') {
      const authUser = requireUser(context);
      const { file, fileName, description } = JSON.parse(event.body);

      const ext = fileName.split('.').pop() || 'jpg';
      const key = `${authUser.id}/${Date.now()}.${ext}`;
      const buffer = Buffer.from(file, 'base64');

      const store = getStore('photos');
      await store.set(key, buffer, { metadata: { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` } });

      const url = `/.netlify/blobs/photos/${key}`;

      const photo = await db.photo.create({
        data: { url, description: description || '', uploadedBy: authUser.id }
      });
      return ok(photo);
    }

    if (method === 'PUT') {
      const admin = await requireAdmin(db, context);
      const { id } = JSON.parse(event.body);
      const photo = await db.photo.update({
        where: { id },
        data: { approved: true }
      });
      return ok(photo);
    }

    if (method === 'DELETE') {
      const admin = await requireAdmin(db, context);
      const { id } = event.queryStringParameters;
      const photo = await db.photo.findUnique({ where: { id } });
      if (photo) {
        const store = getStore('photos');
        const key = photo.url.split('/photos/')[1];
        if (key) await store.delete(key).catch(() => {});
      }
      await db.photo.delete({ where: { id } });
      return ok({ deleted: true });
    }

    return fail(405, 'Método no permitido');
  } catch (err) {
    return fail(400, err.message);
  }
};

function getUser(context) {
  const user = context.clientContext && context.clientContext.user;
  return user ? { id: user.sub, email: user.email } : null;
}
