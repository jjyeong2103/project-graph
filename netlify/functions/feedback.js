// netlify/functions/feedback.js
export async function handler(event) {
  const { studentText, prompt } = JSON.parse(event.body);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '너는 중학교 수학 교사로서 학생의 그래프 해석을 점진적으로 피드백하는 역할이야.' },
        { role: 'user', content: `${prompt}\n<학생 답변>\n${studentText}` }
      ]
    }),
  });

  const result = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
