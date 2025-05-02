import Swal from 'sweetalert2';

let canvas, ctx;
let selectedData = [];
let xLabels = [];
let yMax = 0;
let tickStepY = 0;
let xAxisLabel = 'x';
let yAxisLabel = 'y';

const predefinedData = [
  { name: "추의 개수에 따른 용수철의 길이", data: [{ x: "1", y: 4 }, { x: "2", y: 8 }, { x: "3", y: 12 }, { x: "4", y: 16 }, { x: "5", y: 20 }] },
  { name: "모자 뜨기 꾸러미에 따른 모자의 개수", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "지면의 높이에 따른 기온", data: [{ x: "0", y: 24 }, { x: "1", y: 18 }, { x: "2", y: 12 }, { x: "3", y: 6 }, { x: "4", y: 0 }] },
  { name: "동영상 업로드 후 경과 일수에 따른 조회 수", data: [{ x: "1", y: 15 }, { x: "2", y: 30 }, { x: "3", y: 60 }, { x: "4", y: 85 }, { x: "5", y: 105 }] },
  { name: "반려 식물의 키를 관찰하기 시작한 주차와 식물의 키", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "음료수 캔 개수에 따른 이산화탄소 배출량", data: [{ x: "1", y: 100 }, { x: "2", y: 200 }, { x: "3", y: 300 }, { x: "4", y: 400 }, { x: "5", y: 500 }] }
];

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('graphCanvas');
  ctx = canvas.getContext('2d');

  const selectedIndex = parseInt(localStorage.getItem('selectedDataIndex'));
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= predefinedData.length) {
    Swal.fire({
      icon: 'error',
      title: '데이터 없음',
      text: '이전 단계에서 선택된 데이터가 없습니다.',
      confirmButtonText: '확인'
    });
    return;
  }

  const selectedSet = predefinedData[selectedIndex];
  selectedData = selectedSet.data;
  xLabels = selectedData.map(d => d.x);
  yMax = Math.ceil(Math.max(...selectedData.map(d => d.y)) * 1.2);
  tickStepY = getNiceTickInterval(yMax);

  // 라벨에서 "에 따른" 제거
  if (selectedSet.name.includes("에 따른")) {
    const [xPart, yPart] = selectedSet.name.split("에 따른");
    xAxisLabel = xPart.trim();
    yAxisLabel = yPart.trim();
  } else {
    xAxisLabel = selectedSet.name;
    yAxisLabel = '';
  }
  

  drawGraph();

  document.getElementById('feedbackBtn').addEventListener('click', requestFeedback);
});

function drawGraph() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const margin = 65;
  const usableWidth = width - margin * 2;
  const usableHeight = height - margin * 2;
  const stepX = usableWidth / (xLabels.length + 1);

  let ySteps = Math.floor(yMax / tickStepY);
  if (ySteps < 6) {
    tickStepY = Math.max(1, Math.floor(yMax / 6));
    ySteps = Math.floor(yMax / tickStepY);
  }
  const adjustedYMax = ySteps * tickStepY;
  const stepY = usableHeight / adjustedYMax * tickStepY;

  ctx.save();
  ctx.translate(margin, height - margin);
  ctx.scale(1, -1);

  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  for (let i = 0; i < xLabels.length; i++) {
    const x = stepX * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, usableHeight);
    ctx.stroke();
  }
  for (let y = 0; y <= adjustedYMax; y += tickStepY) {
    const yPos = (y / adjustedYMax) * usableHeight;
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(usableWidth, yPos);
    ctx.stroke();
  }


  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  drawArrow(ctx, -20, 0, usableWidth + 10, 0);
  drawArrow(ctx, 0, -20, 0, usableHeight + 10);

  ctx.fillStyle = "blue";
  selectedData.forEach((p, i) => {
    const x = stepX * (i + 1);
    const y = (p.y / adjustedYMax) * usableHeight;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.restore();

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  xLabels.forEach((label, i) => {
    const x = margin + stepX * (i + 1);
    ctx.fillText(label, x, height - margin + 6);
  });

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= adjustedYMax; y += tickStepY) {
  if (Math.abs(y) > 1e-9) {  // 사실상 0이면 건너뜀
    const yPos = height - margin - (y / adjustedYMax) * usableHeight;
    ctx.fillText(y.toString(), margin - 10, yPos);
  }
}

  ctx.textAlign = 'center';
  ctx.fillText(xAxisLabel, margin + usableWidth / 2, height - margin + 40);
  ctx.save();
  ctx.translate(margin - 40, height - margin - usableHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yAxisLabel, 0, 0);
  ctx.restore();

  ctx.fillText('O', margin - 10, height - margin + 10);
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headLength = 8;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

async function requestFeedback() {
  const interpretationInput = document.getElementById('interpretation');
  const feedbackDiv = document.getElementById('feedback');

  const studentText = interpretationInput.value.trim();
  if (!studentText) {
    feedbackDiv.textContent = '해석을 먼저 작성해주세요.';
    feedbackDiv.classList.remove('hidden');
    return;
  }

  const csvData = selectedData.map(p => `${p.x},${p.y}`).join('\n');
  const prompt = `
<역할>
너는 중학교 1학년 수학 교사야. 학생이 선택한 데이터에 따라 학생이 작성한 그래프 해석을 평가해줘.
피드백은 단계별로 순차적으로 제공할 거야.
힌트를 한번에 다 주지마. 학생의 답안이 달라지는 것에 따라 피드백을 줘
</역할>

<피드백 단계>
1. 학생이 "잘 모르겠다" 같은 답변을 하면, 우선 질적 접근(전체적인 패턴, 그래프의 모양 등)에 대한 해석을 도와주는 피드백을 줘.
2. 학생 답변이 (1,2), (2,4)처럼 단순히 점만 나열되어 있으면, 점별 접근 피드백을 주되 x, y 변수를 연결해서 해석할 수 있도록 유도해줘.
3. 마지막으로 학생 상황에 맞게 개선 방향을 제안해줘.
</피드백 단계>

<피드백 제시 방법>
질적 접근, 점별 접근 피드백을 표 형태로 정리해줘.
각 칸에는 해당 피드백 내용을 채워 넣어.
</피드백 제시 방법>

<예외 상황 대처>
만약 학생 답변이 그래프 해석과 전혀 관련 없는 내용이면, "그래프 해석과 관련없는 답변입니다."라고만 답해주고 추가 설명은 하지마.
</예외 상황 대처>

[CSV 데이터]
${xAxisLabel},${yAxisLabel}
${csvData}

[학생의 해석]
${studentText}

학생의 눈높이에 맞춰 친절하고 구체적으로 설명해줘.`;

  feedbackDiv.textContent = '피드백을 가져오는 중입니다...';
  feedbackDiv.classList.remove('hidden');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: '너는 중학교 수학 교사로서 학생의 그래프 해석을 피드백하는 역할이야.' },
          { role: 'user', content: prompt }
        ]
      }),
    });

    const result = await response.json();
    const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다.';
    feedbackDiv.textContent = feedback;
  } catch (error) {
    console.error(error);
    feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다.';
  }
}

function getNiceTickInterval(range) {
  const rough = range / 10;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow10;

  if (fraction <= 1) return 1 * pow10;
  if (fraction <= 2) return 2 * pow10;
  if (fraction <= 5) return 5 * pow10;
  return 10 * pow10;
}
