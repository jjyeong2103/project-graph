import Swal from 'sweetalert2';

// === [ 전역 변수 선언 ] ===
let canvas, ctx;
let selectedData = [];
let xLabels = [];
let yMax = 0;
let tickStepY = 0;
let xAxisLabel = 'x';
let yAxisLabel = 'y';
let completedInterpretations = new Set();

const predefinedData = [
  { name: "추의 개수(개)에 따른 용수철의 길이(cm)", data: [{ x: "1", y: 4 }, { x: "2", y: 8 }, { x: "3", y: 12 }, { x: "4", y: 16 }, { x: "5", y: 20 }] },
  { name: "모자 뜨기 꾸러미(개)에 따른 모자의 개수(개)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "반려 식물의 키를 관찰하기 시작한 주차(주)에 따른 식물의 키(cm)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "동영상 업로드 후 경과 일수(일)에 따른 조회 수(회)", data: [{ x: "1", y: 15 }, { x: "2", y: 30 }, { x: "3", y: 60 }, { x: "4", y: 85 }, { x: "5", y: 105 }] },
  { name: "달리기를 시작한 시간(분)에 따른 맥박 수(회)", data: [{ x: "0", y: 60 }, { x: "1", y: 100 }, { x: "2", y: 130 }, { x: "3", y: 140 }, { x: "4", y: 150 }] }
];

// === [ 페이지 로드 시 처리 ] ===
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('graphCanvas');
 ctx = canvas.getContext('2d');

  const graphSelect = document.getElementById('graphSelect');
  const allStudentGraphs = JSON.parse(localStorage.getItem("studentGraphs") || "{}");

  // 드롭다운 채우기
  Object.keys(allStudentGraphs).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    graphSelect.appendChild(option);
  });

  // 그래프 선택 시 실행
  graphSelect.addEventListener('change', () => {
    const selectedName = graphSelect.value;
    const selectedSet = predefinedData.find(d => d.name === selectedName);
    if (!selectedSet) return;

    selectedData = allStudentGraphs[selectedName] || selectedSet.data;
    xLabels = selectedData.map(d => d.x);
    yMax = Math.ceil(Math.max(...selectedData.map(d => d.y)) * 1.2);
    tickStepY = getNiceTickInterval(yMax);

    if (selectedName.includes("에 따른")) {
      const [xPart, yPart] = selectedName.split("에 따른");
      xAxisLabel = xPart.trim();
      yAxisLabel = yPart.trim();
    } else {
      xAxisLabel = selectedName;
      yAxisLabel = '';
    }

    // 추가 학습 버튼 클릭 시
    document.getElementById('extraBtn').addEventListener('click', () => {
      const usedNames = new Set([...document.getElementById('graphSelect').options].map(opt => opt.value));
      const remaining = predefinedData.filter(d => !usedNames.has(d.name));
      if (remaining.length === 0) {
        Swal.fire("추가할 그래프가 더 이상 없습니다!");
        return;
      }

     const random = remaining[Math.floor(Math.random() * remaining.length)];
     const graphSelect = document.getElementById('graphSelect');
     const option = document.createElement('option');
     option.value = random.name;
     option.textContent = random.name;
     graphSelect.appendChild(option);
     graphSelect.value = random.name;
     graphSelect.dispatchEvent(new Event('change'));
  });


    // 해석 입력창 비우기
    document.getElementById('interpretation').value = '';
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('feedback').innerHTML = '';

    localStorage.setItem('selectedDataName', selectedName);
    drawGraph();
  });

  // 피드백 버튼 이벤트 연결
  document.getElementById('feedbackBtn').addEventListener('click', requestFeedback);

// 초기 그래프 그리기 (선택된 값 없으면 첫 번째로)
  if (graphSelect.options.length > 0) {
    graphSelect.value = graphSelect.options[0].value;
    graphSelect.dispatchEvent(new Event('change'));
  }
});

// === [ 그래프 그리기 함수 ] ===
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

  ctx.save();
  ctx.translate(margin, height - margin);
  ctx.scale(1, -1);

  // 배경 격자
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  for (let i = 0; i < xLabels.length; i++) {
    const x = stepX * (i + 1);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, usableHeight); ctx.stroke();
  }
  for (let y = 0; y <= adjustedYMax; y += tickStepY) {
    const yPos = (y / adjustedYMax) * usableHeight;
    ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(usableWidth, yPos); ctx.stroke();
  }

  // 축과 화살표
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  drawArrow(ctx, -20, 0, usableWidth + 10, 0);
  drawArrow(ctx, 0, -20, 0, usableHeight + 10);

  // 데이터 점 찍기
  ctx.fillStyle = "blue";
  selectedData.forEach((p, i) => {
    const x = stepX * (i + 1);
    const y = (p.y / adjustedYMax) * usableHeight;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fill();
  });

  ctx.restore();

  // 축 라벨 및 눈금 텍스트
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
    if (Math.abs(y) > 1e-9) {
      const yPos = height - margin - (y / adjustedYMax) * usableHeight;
      ctx.fillText(y.toString(), margin - 10, yPos);
    }
  }

  // 축 이름
  ctx.textAlign = 'center';
  ctx.fillText(xAxisLabel, margin + usableWidth / 2, height - margin + 40);
  ctx.save();
  ctx.translate(margin - 40, height - margin - usableHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yAxisLabel, 0, 0);
  ctx.restore();
  ctx.fillText('O', margin - 10, height - margin + 10);
}

// === [ 보조 함수: 화살표 그리기 ] ===
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

// === [ 보조 함수: 눈금 간격 자동 설정 ] ===
function getNiceTickInterval(range) {
  const rough = range / 10;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow10;
  if (fraction <= 1) return 1 * pow10;
  if (fraction <= 2) return 2 * pow10;
  if (fraction <= 5) return 5 * pow10;
  return 10 * pow10;
}

// === [ requestFeedback 함수는 따로 있음 (생략 가능) ] ===


// === [ 피드백 요청 함수 ] ===
async function requestFeedback() {

  const selectedName = localStorage.getItem('selectedDataName');


  const interpretationInput = document.getElementById('interpretation');
  const feedbackDiv = document.getElementById('feedback');

  const studentText = interpretationInput.value.trim();
  if (!studentText) {
    feedbackDiv.textContent = '해석을 먼저 작성해주세요.';
    feedbackDiv.classList.remove('opacity-0');
    feedbackDiv.classList.add('opacity-100');
    return;
  }

  const studentId = localStorage.getItem('studentId') || '';
  const studentName = localStorage.getItem('studentName') || '';
  const startTime = localStorage.getItem('startTime') || '';
  const selectedDataName = selectedName || '';

  const prompt = `
  <역할>
  너는 중학교 1학년 수학 교사야. 
  학생 이름은 "${studentName}"야. 학생이 선택한 데이터에 따라 학생이 작성한 그래프 해석을 평가해줘.
  피드백을 쓸 때 학생 이름을 "${studentName}"처럼 자연스럽게 넣어도 좋아.
  피드백은 단계별로 순차적으로 제공할 거야.
  힌트를 한번에 다 주지마. 학생의 답안이 달라지는 것에 따라 피드백을 줘.
  </역할>

  <그래프 정보>
  [x축]: ${xAxisLabel}
  [y축]: ${yAxisLabel}
  </그래프 정보>

  <피드백 단계>
  1. 학생이 "잘 모르겠다" 같은 답변을 하면, 우선 그래프의 전체적인 모습(패턴, 그래프의 모양 등)에 대한 해석을 도와주는 피드백을 줘.
  2. 학생 답변이 (1,2), (2,4), (3,6)처럼 단순히 점만 나열되어 있으면, 각각의 점을 바탕으로 x축과 y축을 연결해서 해석하도록 유도해줘.
  3. 한꺼번에 주지 말고, 학생이 각각의 점에 대해 설명했다면 그래프 전체 모습에 대해 힌트를 주고, 반대로 전체적인 모습만 말했다면 각각의 점을 다시 살펴보도록 유도해줘.
  4. 구간에 대한 관찰, 전체적인 규칙성에 대한 피드백도 추가해 줘.
  5. 마지막으로 학생 상황에 맞는 개선 방향을 제안해 줘.
  6. 학생이 단위도 틀리지 않고, 각각의 점과 전체적인 해석을 모두 잘 했다면, 마지막에 **"다른 그래프를 해석해 보세요!"**라고 안내해 줘.
  </피드백 단계>

  <피드백 제시 방법>
  중학교 1학년 학생이 이해하기 쉽게 꼭 **3문장**으로 짧게 설명하는데, 반말은 안 되고! 어미는 반드시 '~하세요', '~보세요' 방식으로 써줘.
  "질적 접근", "점별 접근" 같은 용어는 절대 쓰지 말고, 대신 그래프를 해석할 때 전체적인 모습과 하나하나의 점이 어떻게 변하는지 쉽게 설명해줘.
  또한 HTML로 출력할 거니까 <div> 태그로 묶어서 보여주고, 중요한 부분은 <strong> 태그로 강조해줘.
  </피드백 제시 방법>

  ⚠ 매우 중요:
  - 피드백을 줄 때, 학생 답안에서 **단위(예: cm, 회 등)가 빠지거나 틀린 경우** 반드시 지적해야 해. 단위가 빠지면 내용이 맞더라도 **"아주 잘했다"**고 평가하지 말고, 단위도 꼭 포함해서 다시 써야 한다고 강조해.
  - '개씩', 'cm씩', '회씩'처럼 단위를 수량과 함께 표현한 경우는 별도로 다시 단위를 요구하지마.
  - 숫자마다 단위를 반복하지 않아도 되며, "추의 개수가 1, 2, 3개일 때, 용수철의 길이는 4, 8, 12cm가 된다"처럼 마지막에 단위를 붙이는 건 그대로 인정해.
  - 그래프 해석은 반드시 **x축(독립변수, 가로축) → y축(종속변수, 세로축)** 방향으로만 해석해야 해. x축의 값이 변할 때 y축이 어떻게 변하는지 중심으로 써야 해.
  - 학생 답변에서 y축(세로축)을 기준으로 해석하는 내용은 절대 포함하지 마.
  - 학생의 답변이 이미 명확하다면 추가적인 설명(예: 가로축/세로축 언급, 불필요한 예시 제시 등)은 하지 말고, 짧게 칭찬만 해 줘.
  - 정답인 문장을 구체적으로 제시하지 말고, 학생이 스스로 해석할 수 있도록 유도하는 방식으로 피드백을 줘.
  - 피드백은 반드시 **수학적인 해석**만 제공해야 하며, 그래프의 패턴, 수의 규칙성, 변수 간 관계 등 수학적인 관점에서만 평가해. 용수철이 왜 늘어나는지 같은 과학적 이유는 절대 언급하지 마.
  - 학생이 그래프 해석과 전혀 관련 없는 답변을 하면 "그래프 해석과 관련없는 답변입니다."라고만 출력하고 다른 설명은 하지 마.
  - 학생의 표현이 문법적으로 어색하더라도, 수학적으로 의미 전달이 명확하다면 **굳이 문장 표현을 고치라고 하지 마**.
  - 예를 들어 “1,2,3,4,5개를 뜨면 2,4,6,8,10개가 된다”는 문장은 수학적으로 관계를 잘 표현하고 있으므로, 어색한 표현이라도 그대로 인정해.
  - **표현을 고칠 것을 요구하는 피드백은 지양**하고, 수학적 관찰과 단위, 관계성에만 집중해 줘.
  `; 
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
      { role: 'system', content: '너는 중학교 수학 교사로서 학생의 그래프 해석을 점진적으로 피드백하는 역할이야.' },
      { role: 'user', content: `${prompt}\n<학생 답변>\n${studentText}` }
      ],
      temperature: 0.6
    })
  });


    const result = await response.json();
    const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다.';
    feedbackDiv.innerHTML = feedback;


        // 구글폼 기록
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
    const formData = new FormData();
    formData.append('entry.1271583286', studentId);
    formData.append('entry.430525333', studentName);
    formData.append('entry.1017432853', startTime);
    formData.append('entry.1918871612', selectedDataName);
    formData.append('entry.760324373', studentText);
    formData.append('entry.650944383', feedback);

    fetch(formUrl, { method: 'POST', mode: 'no-cors', body: formData });


     if (feedback.includes("다른 그래프를 해석해 보세요")) {
      completedInterpretations.add(selectedName);
      localStorage.setItem("completedInterpretations", JSON.stringify([...completedInterpretations]));

      // 드롭다운에 ✅ 추가
      const graphSelect = document.getElementById('graphSelect');
      [...graphSelect.options].forEach(option => {
        if (option.value === selectedName) {
          option.textContent = ' ✅' + selectedName ;
        }
      });
    }

    const nextStepBtn = document.getElementById('nextStepBtn');
    const extraBtn = document.getElementById('extraBtn');
    if (completedInterpretations.size >= 3) {
        nextStepBtn.disabled = false;
        nextStepBtn.classList.remove('bg-gray-400');
        nextStepBtn.classList.add('bg-green-500');

        extraBtn.disabled = false;
        extraBtn.classList.remove('bg-gray-400');
        extraBtn.classList.add('bg-yellow-500');
    }
  } catch (error) {
    console.error(error);
    feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다.';
  }
}