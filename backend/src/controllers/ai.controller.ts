import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/db';

export const generateFinancialInsight = async (req: Request, res: Response) => {
  try {
    const { orgIdOrSlug } = req.params;
    const { currentStats, balance, categoryBreakdown } = req.body;

    const org = await prisma.organizations.findFirst({
      where: {
        OR: [
          { id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined },
          { slug: orgIdOrSlug }
        ]
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash which is the active model in this environment
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Limit category breakdown to top 5
    const topCategories = categoryBreakdown.slice(0, 5);

    const prompt = `Anda adalah seorang ahli penasihat keuangan untuk organisasi.
Berdasarkan data keuangan bulan ini untuk organisasi bernama "${org.name}", berikan satu paragraf analisis singkat dan saran strategis (2-3 kalimat). 
Gunakan bahasa Indonesia yang natural, santai, tapi profesional. Jangan gunakan format markdown (tanpa bintang, tanpa bold).

Data Bulan Ini:
- Total Pemasukan: Rp ${currentStats.income}
- Total Pengeluaran: Rp ${currentStats.expense}
- Saldo/Selisih: Rp ${balance} (${balance < 0 ? 'Defisit' : balance > 0 ? 'Surplus' : 'Seimbang'})

Pengeluaran Tertinggi Berdasarkan Kategori:
${topCategories.map((c: any) => `- ${c[0]}: Rp ${c[1].expense}`).join('\n')}

Berikan rekomendasi praktis tentang apa yang harus mereka lakukan berdasarkan angka di atas.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ insight: text.trim() });

  } catch (error) {
    console.error('Error generating AI insight:', error);
    res.status(500).json({ error: 'Failed to generate AI insight' });
  }
};

export const generateAttendanceInsight = async (req: Request, res: Response) => {
  try {
    const { leaderboard, redZone } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const leaderboardStr = leaderboard && leaderboard.length > 0 
      ? leaderboard.map((s: any, i: number) => `${i+1}. ${s.profile?.full_name || 'Tanpa Nama'} (${s._count.id}x hadir)`).join('\n')
      : 'Belum ada data';
      
    const redZoneStr = redZone && redZone.length > 0
      ? redZone.map((s: any, i: number) => `${i+1}. ${s.profile?.full_name || 'Tanpa Nama'} (${s._count.id}x bermasalah)`).join('\n')
      : 'Belum ada data';

    const prompt = `Anda adalah asisten cerdas penganalisa data HR/Presensi.
Berikut adalah data presensi anggota bulan ini:

Top Kehadiran (Rajin):
${leaderboardStr}

Zona Merah (Sering Bolos/Terlambat/Izin):
${redZoneStr}

Tugas Anda:
Berikan output berupa JSON murni TANPA markdown block (jangan gunakan \`\`\`json). Output harus berisi dua key:
1. "summary": Tuliskan rapor kedisiplinan (1 paragraf santai tapi profesional) yang merangkum seberapa disiplin tim bulan ini. Puji yang rajin, dan mention yang bermasalah.
2. "pattern": Tuliskan pola/prediksi (1 paragraf) tentang siapa yang perlu ditegur atau diapresiasi, dan berikan peringatan dini jika ada nama yang sama terus-menerus bermasalah.

Format output wajib:
{
  "summary": "...",
  "pattern": "..."
}`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(text.trim());
    } catch (e) {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Error generating attendance insight:', error);
    res.status(500).json({ error: 'Failed to generate attendance insight' });
  }
};

export const validateProofWithAI = async (req: Request, res: Response) => {
  try {
    const { orgIdOrSlug } = req.params;
    const { attendanceId } = req.body;

    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { profile: true }
    });

    if (!attendance || !attendance.proof_url) {
      return res.status(400).json({ error: 'Attendance record or proof URL not found' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    // Fetch the image
    const imageResponse = await fetch(attendance.proof_url);
    if (!imageResponse.ok) {
       return res.status(400).json({ error: 'Failed to download proof image from URL' });
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const prompt = `Anda adalah asisten cerdas penganalisa dokumen untuk organisasi. 
Tugas Anda adalah memvalidasi gambar bukti surat izin atau keterangan sakit yang dikirimkan oleh anggota bernama "${attendance.profile?.full_name || 'Tanpa Nama'}".

Pertanyaan yang harus Anda jawab:
1. Apakah gambar ini terlihat seperti surat resmi (surat dokter/rumah sakit, surat keterangan sakit, surat izin resmi) atau hanya gambar sembarangan/palsu?
2. Berikan ringkasan singkat dari isi surat tersebut (misal: "Surat istirahat sakit dari Klinik/RS untuk tanggal tertentu").
3. Berikan penilaian tingkat kepercayaan validitas surat ini (Tinggi, Sedang, Rendah).

Gunakan format JSON murni TANPA markdown block (jangan gunakan \`\`\`json). Output harus persis:
{
  "is_valid": true,
  "summary": "Ringkasan isi gambar",
  "confidence": "Tinggi"
}`;

    let result;
    // Try gemini-1.5-flash first (most stable for multimodal image analysis)
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await model.generateContent([
        prompt,
        { inlineData: { data: buffer.toString("base64"), mimeType } }
      ]);
    } catch (e1) {
      try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        result = await model2.generateContent([
          prompt,
          { inlineData: { data: buffer.toString("base64"), mimeType } }
        ]);
      } catch (e2) {
        const model3 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        result = await model3.generateContent([
          prompt,
          { inlineData: { data: buffer.toString("base64"), mimeType } }
        ]);
      }
    }

    const text = await result.response.text();
    let parsedResult: any;
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (e) {
      parsedResult = {
        is_valid: true,
        summary: text.slice(0, 150),
        confidence: "Sedang"
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('Error validating proof:', error);
    return res.status(500).json({ error: error.message || 'Gagal memvalidasi bukti dengan AI' });
  }
};
