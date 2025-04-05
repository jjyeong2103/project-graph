import OpenAI from 'openai';

export async function handler(event) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let body = {};

  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON input' }),
    };
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or invalid messages array' }),
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: body.model || 'gpt-4-turbo',
      messages: body.messages,
      temperature: body.temperature || 0.6,
    });

    // ✅ 명시적으로 JSON 변환
    const result = response.toJSON?.() || response;

    console.log("📦 GPT 응답:", JSON.stringify(result, null, 2));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("❌ GPT API 호출 에러:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
