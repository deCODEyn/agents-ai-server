import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:idRoom/questions',
    {
      schema: {
        params: z.object({
          idRoom: z.string(),
        }),
        body: z.object({
          question: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const { idRoom } = request.params;
      const { question } = request.body;

      const result = await db
        .insert(schema.questions)
        .values({
          idRoom,
          question,
        })
        .returning();

      const insertedQuestion = result[0];

      if (!insertedQuestion) {
        throw new Error('Failed to create new Question.');
      }

      return reply.status(201).send({ idQuestion: insertedQuestion.id });
    }
  );
};
