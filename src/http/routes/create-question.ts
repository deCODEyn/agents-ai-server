import { and, eq, sql } from 'drizzle-orm';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../../db/connection.ts';
import { schema } from '../../db/schema/index.ts';
import { generateAnswer, generateEmbeddings } from '../../services/gemini.ts';

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

      const embeddings = await generateEmbeddings(question);
      const embeddingsAsString = `[${embeddings.join(',')}]`;

      const chuncks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7`,
        })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.idRoom, idRoom),
            sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7`
          )
        )
        .orderBy(
          sql`${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector`
        )
        .limit(3);

      let answer: string | null = null;

      if (chuncks.length > 0) {
        const transcriptions = chuncks.map((chunck) => chunck.transcription);

        answer = await generateAnswer(question, transcriptions);
      }

      const result = await db
        .insert(schema.questions)
        .values({ idRoom, question, answer })
        .returning();

      const insertedQuestion = result[0];

      if (!insertedQuestion) {
        throw new Error('Failed to create new Question.');
      }

      return reply
        .status(201)
        .send({ idQuestion: insertedQuestion.id, answer });
    }
  );
};
