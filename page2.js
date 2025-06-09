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
let selectedName = "";  // 현재 선택된 데이터 이름

// ✅ 추가 연습용 데이터 이름만 지정
const extraPracticeNames = [
  "동영상 업로드 후 경과 일수(일)에 따른 조회 수(회)",
  "달리기를 시작한 시간(분)에 따른 맥박 수(회)"
];

const predefinedData = [
  { name: "모자 뜨기 꾸러미(개)에 따른 모자의 개수(개)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "반려 식물의 키를 관찰하기 시작한 주차(주)에 따른 식물의 키(cm)", data: [{ x: "1", y: 2 }, { x: "2", y: 4 }, { x: "3", y: 6 }, { x: "4", y: 8 }, { x: "5", y: 10 }] },
  { name: "추의 개수(개)에 따른 용수철의 길이(cm)", data: [{ x: "1", y: 4 }, { x: "2", y: 8 }, { x: "3", y: 12 }, { x: "4", y: 16 }, { x: "5", y: 20 }] },
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
    selectedName = graphSelect.value; 

   
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
  const completed = new Set(JSON.parse(localStorage.getItem("completedInterpretations") || "[]"));
  const baseNames = predefinedData.slice(0, 3).map(d => d.name);
  const remaining = predefinedData.filter(d =>
    !completed.has(d.name) && !baseNames.includes(d.name)
  );

  if (remaining.length === 0) {
    Swal.fire("추가할 그래프가 더 이상 없습니다!");
    return;
  }

  const random = remaining[Math.floor(Math.random() * remaining.length)];
  const graphSelect = document.getElementById('graphSelect');

  // 이미 드롭다운에 없다면 옵션 추가
  if (![...graphSelect.options].some(opt => opt.value === random.name)) {
    const option = document.createElement('option');
    option.value = random.name;
    option.textContent = random.name;
    graphSelect.appendChild(option);
  }

  graphSelect.value = random.name;
  graphSelect.dispatchEvent(new Event('change'));

    // === [ 마우스 hover 기능 활성화: 추가 연습용 데이터만 적용 ] ===

  canvas.addEventListener("mousemove", handleHover);


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
  const isRunningData = selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)";
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

    // ✅ x=0 위치 계산
  let xZeroOffset = 0;
  const zeroIndex = selectedData.findIndex(d => Number(d.x) === 0);
if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  const zeroIndex = selectedData.findIndex(d => Number(d.x) === 0);
  if (zeroIndex !== -1) {
    const expectedX = stepX * (zeroIndex + 1);
    xZeroOffset = margin - expectedX-5;
  }
}


  let ySteps = Math.floor(yMax / tickStepY);
  if (ySteps < 6) {
    tickStepY = Math.max(1, Math.floor(yMax / 6));
    ySteps = Math.floor(yMax / tickStepY);
  }

  const adjustedYMax = ySteps * tickStepY;

  ctx.save();
  ctx.translate(margin + xZeroOffset, height - margin);
  ctx.scale(1, -1);

  // 배경 격자
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;

  for (let i = 0; i < xLabels.length; i++) {
    const x = stepX * (i + 1) + xZeroOffset;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, usableHeight); ctx.stroke();
  }
  for (let y = 0; y <= adjustedYMax; y += tickStepY) {
    const yPos = (y / adjustedYMax) * usableHeight;
    ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(usableWidth, yPos); ctx.stroke();
  }

  // 축과 화살표
  ctx.strokeStyle = "#000";
ctx.lineWidth = 1.5;

// x축 
const arrowXStart = (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)")
  ? 40   // 🎯 왼쪽 짧게
  : -20;

const arrowXEnd = (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)")
  ? usableWidth * 0.9  // 🎯 오른쪽도 살짝 줄이기
  : usableWidth + 10;

drawArrow(ctx, arrowXStart, 0, arrowXEnd, 0);


// y축 (특정 데이터에만 조정)
if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  drawArrow(ctx, -xZeroOffset, -20, -xZeroOffset, usableHeight + 10); // 🎯 오른쪽으로 보정
} else {
  drawArrow(ctx, 0, -20, 0, usableHeight + 10); // 기본 위치
}


  // 데이터 점 찍기
ctx.fillStyle = "blue";
selectedData.forEach((p, i) => {
  let xOffset = 0;

  const x = stepX * (i + 1) + xZeroOffset;
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
  if (isRunningData && label === "0") return; // 0 생략

  const x = margin + xZeroOffset + stepX * (i + 1);

  if (isRunningData) {
    ctx.fillText(label, x - 58, height - margin + 6); // 달리기 데이터만 오른쪽 이동
  } else {
    ctx.fillText(label, x, height - margin + 6); 
  }
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
  const xLabelX = selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)"
  ? margin + usableWidth / 2 + xZeroOffset   // 🎯 왼쪽 보정
  : margin + usableWidth / 2;

ctx.fillText(xAxisLabel, xLabelX, height - margin + 40);

  ctx.save();
const yLabelOffsetX = selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)" ? margin + xZeroOffset +10 : margin - 40;
ctx.translate(yLabelOffsetX, height - margin - usableHeight / 2 - 10);
ctx.rotate(-Math.PI / 2);

ctx.fillText(yAxisLabel, 0, 0);
ctx.restore();

  ctx.fillText('O', margin - 10, height - margin + 10);

  // === [ drawGraph 함수 마지막 부분에 추가 ] ===
canvas.removeEventListener("mousemove", handleHover);  // 중복 방지
if (extraPracticeNames.includes(selectedName)) {
  canvas.addEventListener("mousemove", handleHover);
}

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

function handleHover(event) {
  if (!extraPracticeNames.includes(selectedName)) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  let hoverX = mouseX;
if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  hoverX -= -180;  // 🎯 마우스 위치 왼쪽으로 보정
}

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const margin = 65;
  const usableWidth = width - margin * 2;
  const usableHeight = height - margin * 2;
  const stepX = usableWidth / (xLabels.length + 1);

  // 먼저 xZeroOffset 계산
  let xZeroOffset = 0;
  if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  const zeroIndex = selectedData.findIndex(d => Number(d.x) === 0);
  if (zeroIndex !== -1) {
    const usableWidth = width - margin * 2;
    const stepX = usableWidth / (xLabels.length - 1);  // ❗ x=0 포함한 개수 기준으로
    const zeroX = stepX * zeroIndex;
    xZeroOffset = margin - zeroX;
  }
}

  ctx.save();
if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  ctx.translate(margin + xZeroOffset, height - margin);
} else {
  ctx.translate(margin, height - margin);
}
ctx.scale(1, -1);

  // yMax와 tickStepY를 기준으로 adjustedYMax 재계산
  let ySteps = Math.floor(yMax / tickStepY);
  if (ySteps < 6) {
    tickStepY = Math.max(1, Math.floor(yMax / 6));
    ySteps = Math.floor(yMax / tickStepY);
  }
  const adjustedYMax = ySteps * tickStepY;

  const ctx2 = canvas.getContext("2d");
  ctx2.setTransform(1, 0, 0, 1, 0, 0);
  ctx2.clearRect(0, 0, width, height);
  drawGraph();  // 기존 그래프 다시 그림

  for (let i = 0; i < selectedData.length; i++) {
  let dataX = stepX * (i + 1);
  let graphX = margin + stepX * (i + 1);
  let xOffset = 0;

  if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
    dataX = stepX * (i + 1);
    graphX = margin + xZeroOffset + dataX;
    xOffset = xZeroOffset;
  }

  const graphY = height - margin - (selectedData[i].y / adjustedYMax) * usableHeight;
  const dx = hoverX- graphX;
  const dy = mouseY - graphY;

  if (Math.sqrt(dx * dx + dy * dy) < 10) {
    ctx2.beginPath();
    ctx2.setLineDash([4, 4]);
    ctx2.strokeStyle = 'gray';

    if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
        ctx2.moveTo(margin, graphY);  // ✅ graphY는 이미 위에서 계산된 값
        ctx2.lineTo(mouseX, graphY);  
    } else {
      ctx2.moveTo(margin, graphY);
      ctx2.lineTo(graphX, graphY);
    }

    ctx2.stroke();
    ctx2.setLineDash([]);

    ctx2.fillStyle = 'black';
    ctx2.font = '12px sans-serif';
    ctx2.textAlign = 'right';
    ctx2.textBaseline = 'middle';

    let yLabelX;
if (selectedName === "달리기를 시작한 시간(분)에 따른 맥박 수(회)") {
  yLabelX = margin + xZeroOffset - 75; // 🎯 기존보다 더 왼쪽으로
} else {
  yLabelX = margin - 10;
}
ctx2.fillText(`${selectedData[i].y}`, yLabelX, graphY);
    break;
  }
}

}



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
  피드백을 쓸 때 학생 이름을 "${studentName} 학생"처럼 자연스럽게 넣어.
  피드백은 단계별로 순차적으로 제공할 거야.
  힌트를 한번에 다 주지마. 학생의 답안이 달라지는 것에 따라 피드백을 줘.
  </역할>

  <그래프 정보>
  [x축]: ${xAxisLabel}
  [y축]: ${yAxisLabel}
  </그래프 정보>

  <피드백 단계>
  1. 학생이 "잘 모르겠다" 같은 답변을 하면, 우선 그래프의 전체적인 모습(패턴, 그래프의 모양 등)에 대한 해석을 도와주는 피드백을 줘.
  2. 학생이 양적 접근을 먼저 했다면 양적 접근(점 5개 전체, 구간에 대한 관찰)에서 부족한 것을 보충하면서 질적 접근(수치적 설명이 없는 그래프의 개형)을 할 수 있도록 하면 되고,
     학생이 질적 접근(수치적 설명이 없는 그래프의 개형)을 먼저 했다면 질적 접근에서 부족한 부분한 것을 보충하면서 양적 접근을 할 수 있도록 안내해.
  단, 학생 답변이 (1,2), (2,4), (3,6)처럼 단순히 점만 나열되어 있으면, 각각의 점을 바탕으로 x축과 y축을 연결해서 해석하도록 유도해줘.
  예: "추의 개수가 1, 2, 3개일 때, 용수철의 길이는 4, 8, 12cm가 된다"처럼 각각의 값을 연결해서 해석한 경우도 '양적 해석'으로 인정해.
  예: "반려 식물의 키를 관찰하기 시작한지 1, 2, 3주일 때, 식물의 키는 2, 4, 6cm가 된다"처럼 각각의 값을 연결해서 해석한 경우도 '양적 해석'으로 인정해.
  3. 마지막으로 학생 상황에 맞는 개선 방향을 제안해 줘.
  4. 학생이 단위도 틀리지 않고, 모든 점과 전체적인 해석을 모두 잘 했다면, 마지막 줄에 **반드시 "다른 그래프를 해석해 보세요!"**라고 말해줘.
  **절대 "다른 그래프도", "다른 그래프도 해석해 보세요", "더 다양한 그래프를", "이제 다른 그래프도 해석해 보세요", "더 다양한 그래프를 해석해 보세요"라고 쓰지마.**
  </피드백 단계>

  <피드백 제시 방법>
  중학교 1학년 학생이 이해하기 쉽게 꼭 **3문장**으로 짧게 설명하는데, **반말은 안 되고!** 어미는 반드시 **'~하세요', '~보세요' 방식**으로 써줘.
  학생이 이미 잘 해석한 건 굳이 다시 언급하며 설명하지마.
  "질적 접근", "양적 접근" 같은 용어는 절대 쓰지 말고, 대신 그래프를 해석할 때 전체적인 모습과 하나하나의 점이 어떻게 변하는지 쉽게 설명해줘.
  또한 HTML로 출력할 거니까 <div> 태그로 묶어서 보여주고, 중요한 부분은 <strong> 태그로 강조해줘.
  </피드백 제시 방법>

  ⚠ 매우 중요:
  - 학생의 문장이 문법적으로 어색하거나 표현이 다소 자연스럽지 않더라도, **수학적으로 의미가 명확하다면 절대 표현을 고치려고 하지 마.**
  - 피드백은 **오직 수학적 해석(x축 이름과 y축 이름, 관계 파악, 단위 포함, 점별 해석 여부, 규칙성, 수치적 해석이 없는 그래프 모양)에만 집중**해.
  - **A에 따른 B 데이터에서 축의 이름(A와 B)을 제대로 말하는 것**도 그래프 해석에서는 수학적 해석이야. 잘못 작성했다면 피드백 줘.
  - '개씩', 'cm씩', '회씩'처럼 단위를 수량과 함께 표현한 경우는 별도로 다시 단위를 요구하지마.
  - 숫자마다 단위를 반복하지 않아도 돼. 예를 들어 "0~60분, 60~90분, 150~180분, 210~240분은 각각 20km, 10km, 10km를 이동했다"처럼 **각 수 뒤에 단위를 붙이지 않고 마지막에만 써도 의미가 명확하다면 올바른 표현으로 인정해야 해.**
  - 단위가 한 번이라도 포함되어 있고, 문장의 의미가 명확한 경우는 단위 오류로 판단하지 마.
  - 단위를 축약해서 한 문장 안에서 정리한 경우에도 누락으로 간주하지 마. 단위가 **한 문장 안에서 수치에 명확히 연결되어 있다면**, 반복하지 않아도 단위 누락으로 판단하지 마.
  - "추가 1개일 때 용수철의 길이는 4cm이다", "추가 2개일 때 8cm이다"처럼 문장 중간 또는 끝에 단위가 포함된 경우도 단위를 정확히 사용한 것으로 간주해야 해.
  - "1분에서 2분 사이"와 같은 표현은 "1~2분","1,2분 사이"로 표현해도 같은 것으로 간주해야 해.
  - 그래프 해석은 반드시 **x축(독립변수, 가로축) → y축(종속변수, 세로축)** 방향으로만 해석해야 해. x축의 값이 변할 때 y축이 어떻게 변하는지 중심으로 써야 해.
  - 학생의 해석에서 실제 데이터에서 x값에 따른 y값의 차이를 비교해보고 그 값이 정확한지 판단해.
  - 양적 해석으로 인정하려면 x축 값에 따른 y축 값을 5개를 모두 언급해야 하며, 단순히 하나 둘 언급하는 것만으로는 부족하다고 간주해.
  - “1,2,3일 때 2,4,6cm가 된다”처럼 쉼표로 나열된 문장도 각 점의 대응 관계를 나타낸 것이므로, 점별 해석으로 인정해.
  - 나열된 수들을 한 문장으로 정리했더라도, x축과 y축의 값을 짝지어 표현한 경우는 개별 점을 언급한 것으로 간주해.
  - 학생 답변에서 y축(세로축)을 기준으로 해석하는 내용은 절대 포함하지 마. 그렇게 해석했다면 수정 피드백을 줘.
  - 학생의 답변이 이미 명확하다면 추가적인 설명(예: 가로축/세로축 언급, 불필요한 예시 제시 등), 반복 언급은 하지 말고, 짧게 칭찬만 해 줘.
  - 정답인 문장을 구체적으로 제시하지 말고, 학생이  반드시 학생에게 <strong>질문 형태</strong>로 유도해. 
  - 학생이 그래프의 전체적인 모양(질적인 해석)을 언급하지 않았을 경우, 그것을 대신 설명해 주지 마.  
    예: “이 그래프의 전체적인 모습은 어떻게 생겼는지도 생각해 보세요”처럼, 학생이 스스로 모양을 해석할 수 있도록 유도만 해.
    <strong>절대로 ‘x축이 증가할 때 y축도 일정하게 증가한다’ 같은 문장을 GPT가 직접 제공하지 마.</strong>
  - 피드백은 반드시 **수학적인 해석**만 제공해야 하며, 그래프의 패턴, 수의 규칙성, 변수 간 관계 등 수학적인 관점에서만 평가해. 용수철이 왜 늘어나는지 같은 과학적 이유는 절대 언급하지 마.
  - 그래프에 나타나지 않은 점에 대해 예측해보게 하는 것은 하지마.
  - 정비례, 반비례 관계는 아직 학습하지 않았기 때문에 학생이 언급했을 때 그 부분은 다음 시간에 구체적으로 배울 것이라고 말해줘.
  - 학생이 그래프 해석과 전혀 관련 없는 답변을 하면 "그래프 해석과 관련없는 답변입니다."라고만 출력하고 다른 설명은 하지 마.
  - 학생의 표현이 문법적으로 어색하더라도, 수학적으로 의미 전달이 명확하다면 **굳이 문장 표현을 고치라고 하지 마**. 예를 들어 “1,2,3,4,5개를 뜨면 2,4,6,8,10개가 된다”는 문장은 수학적으로 관계를 잘 표현하고 있으므로, 어색한 표현이라도 그대로 인정해.
  - “1개씩 늘 때 4cm씩 늘어난다”는 식의 전체 규칙을 언급했더라도, 개별 점에 대한 언급이 없으면 마지막 완료 문구는 생략해.
  - “다른 그래프를 해석해 보세요!”라는 문장은 절대 아무 답변에나 쓰면 안 돼.
    이 문장은 <strong>다음 두 가지 조건을 모두 만족할 때만</strong> 써야 해:
    (1) 숫자를 쓰지 않고, 그래프의 전체적인 모양이나 패턴을 <strong>직접</strong> 언급한 문장이 반드시 있어야 해.
    예: 일정하게 증가한다, 같은 간격으로 커진다, 일직선처럼 보인다, 점이 위로 올라간다 등
    → "2cm씩 커진다"처럼 수치를 포함한 문장은 여기에 해당하지 않아.
    (2) 학생이 그래프에 나온 모든 점(예: 5개)에 대해 x값과 y값을 대응시켜 정확하게 수치를 사용하여 설명했고,
    (3) x축이 커질 때 y축이 어떻게 변하는지 규칙도 잘 설명한 경우.  
    위 조건 중 하나라도 부족하면 절대 출력하지 마.
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


// ✅ HTML 태그 제거 후 순수 텍스트 추출 + 공백 제거
const tempDiv = document.createElement('div');
tempDiv.innerHTML = feedback;
const plainText = tempDiv.textContent || tempDiv.innerText || "";
const normalized = plainText.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

if (normalized.includes("다른그래프를해석해보세요!")) {
  completedInterpretations.add(selectedName);
  localStorage.setItem("completedInterpretations", JSON.stringify([...completedInterpretations]));

  const graphSelect = document.getElementById('graphSelect');
  [...graphSelect.options].forEach(option => {
  if (option.value === selectedName && !option.textContent.startsWith('✅')) {
    option.textContent = '✅ ' + selectedName;
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