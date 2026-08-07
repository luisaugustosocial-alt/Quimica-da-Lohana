declare const process: {
  env: {
    GEMINI_API_KEY?: string;
  };
};export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Digite uma pergunta." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Chave da IA não configurada." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Você é uma professora de química paciente, didática e amigável. 
Explique química de maneira simples e adequada para estudantes.
Ajude o aluno a entender o raciocínio e não apenas dê respostas.

Pergunta do aluno: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: "Erro ao consultar a IA." });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não consegui responder essa pergunta.";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno." });
  }
}