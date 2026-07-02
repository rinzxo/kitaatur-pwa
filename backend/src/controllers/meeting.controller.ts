import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function createMeetingMinutes(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const userId = req.user?.id;
  const { session_id, title, content } = req.body;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Hanya Ketua dan Sekretaris yang bisa membuat notulensi' });
  }

  try {
    let ai_summary = null;

    if (content && apiKey) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Tolong rapihkan dan buat ringkasan notulensi rapat profesional dari teks kasar berikut. Gunakan bahasa Indonesia yang formal, buat poin-poin yang jelas, dan tambahkan kesimpulan tindakan (action items) jika ada: \n\n"${content}"`;
        const result = await model.generateContent(prompt);
        ai_summary = result.response.text();
      } catch (aiErr) {
        console.error('Error generating AI summary:', aiErr);
        // We don't fail the request if AI fails, just save without summary
      }
    }

    // @ts-ignore - Bypass TS cache issue for newly generated Prisma model
    const meeting = await prisma.meeting_minutes.create({
      data: {
        organization_id: orgMemberContext.organizationId,
        session_id: session_id || null,
        title: title || 'Notulensi Rapat',
        content,
        ai_summary,
        created_by: userId
      }
    });

    return res.status(201).json(meeting);
  } catch (err) {
    console.error('Error creating meeting minutes:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getMeetingMinutes(req: any, res: Response) {
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' });
  }

  try {
    // @ts-ignore - Bypass TS cache issue for newly generated Prisma model
    const minutes = await prisma.meeting_minutes.findMany({
      where: {
        organization_id: orgMemberContext.organizationId
      },
      include: {
        author: {
          select: { full_name: true, email: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.status(200).json(minutes);
  } catch (err) {
    console.error('Error fetching meeting minutes:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
