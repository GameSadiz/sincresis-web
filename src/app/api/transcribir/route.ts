import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DiarizedSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

function formatearTranscripcion(segments: DiarizedSegment[]): string {
  return segments
    .map((seg) => {
      const m = Math.floor(seg.start / 60)
        .toString()
        .padStart(2, "0");
      const s = Math.floor(seg.start % 60)
        .toString()
        .padStart(2, "0");
      return `[${m}:${s}] Hablante ${seg.speaker}: ${seg.text}`;
    })
    .join("\n");
}

export async function POST(request: Request) {
  const { entrevistaId } = await request.json();

  if (!entrevistaId || typeof entrevistaId !== "string") {
    return NextResponse.json({ error: "entrevistaId requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // RLS ya limita esta consulta a la propia entrevista del participante o
  // a cualquiera si es equipo; si no hay fila, el usuario no tiene acceso.
  const { data: entrevista } = await supabase
    .from("entrevistas")
    .select("id, audio_url")
    .eq("id", entrevistaId)
    .maybeSingle();

  if (!entrevista || !entrevista.audio_url) {
    return NextResponse.json({ error: "Entrevista no encontrada" }, { status: 404 });
  }

  const admin = createAdminClient();

  const { data: audioBlob, error: downloadError } = await admin.storage
    .from("audios-entrevistas")
    .download(entrevista.audio_url);

  if (downloadError || !audioBlob) {
    return NextResponse.json({ error: "No se pudo descargar el audio" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const file = await toFile(audioBlob, entrevista.audio_url.split("/").pop());

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe-diarize",
      response_format: "diarized_json",
      chunking_strategy: "auto",
    });

    const segments = (transcription as unknown as { segments: DiarizedSegment[] }).segments ?? [];
    const texto = formatearTranscripcion(segments);

    const { error: updateError } = await admin
      .from("entrevistas")
      .update({ transcripcion: texto })
      .eq("id", entrevistaId);

    if (updateError) {
      return NextResponse.json({ error: "No se pudo guardar la transcripción" }, { status: 500 });
    }

    return NextResponse.json({ transcripcion: texto });
  } catch (err) {
    console.error("Error transcribiendo entrevista", entrevistaId, err);
    return NextResponse.json({ error: "Fallo la transcripción" }, { status: 500 });
  }
}
