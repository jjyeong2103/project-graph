import OpenAI from 'openai';

export async function handler(event) {
  // OpenAI 객체는 함수 안에서 초기화해야 환경변수가 제대로 읽힘
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  let body = {};

  // 🔍 JSON 파싱 안전 처리
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    } else {
      console.warn("⚠️ Request body is empty");
    }
  } catch (e) {
    console.error("❌ JSON 파싱 에러:", e);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Invalid JSON input' }),
    };
  }

  const model = body.model || 'gpt-4-turbo';

  console.log("✅ 모델:", model);
  console.log("✅ 메시지 수:", body.messages?.length || 0);
  console.log("✅ 메시지 내용:", JSON.stringify(body.messages, null, 2));

  // 🔒 필수 입력 검사
  if (!body.messages || !Array.isArray(body.messages)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: 'Missing or invalid "messages" array in request body.' }),
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: body.messages,
      temperature: body.temperature || 0.6,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("❌ GPT API 호출 에러:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
