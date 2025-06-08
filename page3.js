document.addEventListener('DOMContentLoaded', () => {
  let isRequestingFeedback = false;
  let chart;
  let selectedXLabel = '';
  let selectedYLabel = '';
  let xAxisLabel = '';
  let yAxisLabel = '';
  let rubric = '';
  let completedInterpretations = new Set();
  let currentProblemIndex = 0;

  const axisArrowsPlugin = {
    id: 'axisArrows',
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const arrowSize = 8;
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.lineWidth = 2;

      const xStart = chartArea.left;
      const xEnd = chartArea.right;
      const yZero = scales.y.getPixelForValue(0);

      const yStart = chartArea.bottom;
      const yTop = chartArea.top;
      const xZero = scales.x.getPixelForValue(0);

      ctx.beginPath();
      ctx.moveTo(xStart - 20, yZero);
      ctx.lineTo(xEnd + 10, yZero);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xEnd + 10, yZero);
      ctx.lineTo(xEnd + 2, yZero - arrowSize / 2);
      ctx.moveTo(xEnd + 10, yZero);
      ctx.lineTo(xEnd + 2, yZero + arrowSize / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xZero, yStart + 20);
      ctx.lineTo(xZero, yTop - 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xZero, yTop - 10);
      ctx.lineTo(xZero - arrowSize / 2, yTop - 2);
      ctx.moveTo(xZero, yTop - 10);
      ctx.lineTo(xZero + arrowSize / 2, yTop - 2);
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.fillText('O', xZero - 15, yZero + 16);
      ctx.restore();
    }
  };

  const problemSets = [
    {
      xAxisLabel: "시간(분)",
      yAxisLabel: "이동 거리(m)",
      pattern: "일차",
      question: "집에 걸어가는 시간 따른 이동 거리 사이의 관계를 나타낸 그래프입니다. 이를 해석해 보세요.",
      rubric: `
      - 질적 접근: 그래프의 모양에 대한 언급(직선 형태, 오른쪽 위로 올라가는 형태 등)
      - 양적 접근(점별): 그래프 위 최소 두 점에 대한 언급(전체적 접근과 겹치는 부분이 생길 수도 있음, 예: 1분 걸었을 때 2m 이동, 2분 걸었을 때 4m 이동 등)
      - 양적 접근(구간): 분당 이동거리는 2m임을 언급(속력으로 해석해도 됨)
      - 양적 접근(전체): 전체적인 해석으로 10분동안 걸었다거나 총 이동거리가 20분이라는 것 중 하나에 대한 언급
      `
    },
    {
      xAxisLabel: "시간(분)",
      yAxisLabel: "속력(km/h)",
      pattern: "속력변화",
      question: "자율 주행 자동차의 운행 시간과 속력 사이의 관계를 나타낸 그래프입니다. 이를 해석해 보세요.",
      rubric: `
      - 질적 접근: 그래프 모양에 대한 언급(처음에는 올라가고 중간에는 일정하게 유지되며 마지막에는 내려가는 형태 등)
      - 양적 접근(점별): 그래프 위 최소 두 점에 대한 언급(예: 0분일 때 0km/h, 5분일 때 35km/h, 8분일 때 35km/h, 10분일 때 0km/h)
      - 양적 접근(구간): 0~4분, 5~8분, 8~10분 세 구간에 대한 해석(0~5분 구간에서 속력이 일정하게 증가, 5~8분 구간에서 일정, 8~10분 구간에서 일정하게 감소 등
                                                            단, “속력이 증가했다가 일정했다가 감소했다”는 문장은 질적 접근으로 간주
                                                            시간 범위를 직접 언급하거나, 최소한 어떤 시점에서 어떻게 변화했는지를 수치 기반으로 설명해야 함)
      - 양적 접근(전체): 전체적인 해석으로 10분 동안 운행하고 멈췄다 등에 대한 언급
      `
    },
    {
      xAxisLabel: "시간(초)",
      yAxisLabel: "높이(m)",
      pattern: "주기",
      question: "회전목마가 운행을 시작한 후 시간과 지면으로부터의 높이 사이의 관계를 나타낸 그래프입니다. 이를 해석해 보세요.",
      rubric: `
      - 질적 접근: 그래프의 반복되는 패턴 언급(높이가 올라갔다가 내려갔다를 반복함 등)
      - 양적 접근(점별): 특정 시점에서의 높이를 최소 두 개 언급(예: 0초일 때 높이 1m, 2초일 때 높이 2m 등)
      - 양적 접근(구간): 0~2초, 2~4초와 같이 높이가 올라가고, 내려가는 구간에 대한 언급(2초 동안 높이가 높아지고 2초 동안 낮아짐 등) 
      - 양적 접근(전체): 전체 구간에 대한 높이 변화의 반복 구조나 규칙성 언급(4초마다 반복된다 등)
      `
    },
    {
      xAxisLabel: "시간(분)",
      yAxisLabel: "이동 거리(km)",
      pattern: "증가",
      question: "자전거를 탄 시간과 이동 거리 사이의 관계를 나타낸 그래프입니다. 이를 해석해 보세요.",
      rubric: `
      - 질적 접근: 그래프가 이동과 정지를 번갈아 반복된다는 점 등으로 그래프 전체적인 모양 언급
      - 양적 접근(점별): 특정 시점에서의 이동 거리 최소 두 개 언급(예: 0분 일 때 0km, 180분일 때 40km 등)
      - 양적 접근(구간): 0~60분, 60~80분,80~~120분, 120~160분, 160~180분 총 5개 구간에 대한 수치적 해석 
      - 양적 접근(전체): 전체적으로 180분동안 자전거를 탔거나 40km 이동했다 등을 언급
      - 그래프4는 "다른 그래프를 해석해보세요"가 아니라 "멋지네요! 그래프 해석하기 학습을 완료했습니다!"로 마무리해줘.
      `
    }
  ];

  const btns = [
  document.getElementById('generateBtn1'),
  document.getElementById('generateBtn2'),
  document.getElementById('generateBtn3'),
  document.getElementById('generateBtn4')
];

// 초기 상태: 버튼 1만 활성화
btns.forEach((btn, idx) => {
  if (!btn) return;

  if (idx === 0) {
    btn.disabled = false;
    btn.classList.remove('bg-gray-400');
    btn.classList.add('bg-blue-500');
  } else {
    btn.disabled = true;
    btn.classList.remove('bg-blue-500');
    btn.classList.add('bg-gray-400');
  }

  // 버튼 클릭 이벤트 등록
  btn.addEventListener('click', () => {
    currentProblemIndex = idx;
    generateGraph();
  });
});

  function generateGraph() {
    const problemSet = problemSets[currentProblemIndex];
    xAxisLabel = problemSet.xAxisLabel;
    yAxisLabel = problemSet.yAxisLabel;
    selectedXLabel = xAxisLabel;
    selectedYLabel = yAxisLabel;
    rubric = problemSet.rubric; 

      document.getElementById('interpretation').value = '';
      document.getElementById('feedback').innerHTML = '';
      document.getElementById('feedback').classList.add('hidden');

      document.getElementById('questionText').textContent = problemSet.question;  

      const ctx = document.getElementById('graphCanvas').getContext('2d');
      if (chart) chart.destroy();


    let dataPoints = [];
    let datasetOptions = {
    borderColor: 'blue',
    backgroundColor: 'blue',
   fill: false,
    tension: 0
};

if (xAxisLabel === "시간(분)" && yAxisLabel === "이동 거리(m)") {
  for (let x = 0; x <= 10; x += 0.1) dataPoints.push({ x, y: 2 * x });
  datasetOptions.pointRadius = 0;
  datasetOptions.hoverRadius = 6;
  datasetOptions.pointHitRadius = 10;
  datasetOptions.pointHoverBackgroundColor = 'red';
} else if (xAxisLabel === "시간(분)" && yAxisLabel === "속력(km/h)") {
  dataPoints = [ { x: 0, y: 0 }, { x: 5, y: 35 }, { x: 8, y: 35 }, { x: 10, y: 0 } ];
  datasetOptions.pointRadius = 0;
} else if (xAxisLabel === "시간(초)" && yAxisLabel === "높이(m)") {
  for (let x = 0; x <= 10; x += 0.1) {
    dataPoints.push({ x, y: 1.5 - 0.5 * Math.cos((2 * Math.PI / 4) * x) });
  }
  datasetOptions.pointRadius = 0;
  datasetOptions.tension = 0.3;
} else if (xAxisLabel === "시간(분)" && yAxisLabel === "이동 거리(km)") {
  dataPoints = [
    { x: 0, y: 0 }, { x: 30, y: 10 }, { x: 60, y: 20 },
    { x: 80, y: 20 }, { x: 120, y: 30 }, { x: 160, y: 30 }, { x: 180, y: 40 }
  ];
  datasetOptions.pointRadius = 0;
}

chart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [{
      data: dataPoints,
      ...datasetOptions
    }]
  },
  options: {
    plugins: {
      legend: { display: false },
      tooltip: {
  displayColors: false,
  callbacks: {
    title: () => '',
    label: function (context) {
      const x = context.parsed.x.toFixed(1);
      const y = context.parsed.y.toFixed(1);
      return `(${x}, ${y})`;
    }
  }
}
    },
    layout: {
      padding: { right: 30 }
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: xAxisLabel },
        min: 0,
        ticks: {
          callback: function (value) {
            return value === 0 ? '' : value;
          }
        }
      },
      y: {
        title: { display: true, text: yAxisLabel },
        min: 0,
        ticks: {
          callback: function (value) {
            return value === 0 ? '' : value;
          }
        }
      }
    }
  },
  plugins: [axisArrowsPlugin] // ✅ 이 부분이 options 밖에 있어야 하므로 위에서 닫힌 후 붙여야 함
});
  }


  async function requestFeedback() {
    if (isRequestingFeedback) return;
    isRequestingFeedback = true;

    const interpretationInput = document.getElementById('interpretation');
    const feedbackDiv = document.getElementById('feedback');
    const studentText = interpretationInput?.value.trim();

    if (!studentText) {
      feedbackDiv.textContent = '해석을 먼저 작성해주세요.';
      feedbackDiv.classList.remove('opacity-0');
      feedbackDiv.classList.add('opacity-100');
      isRequestingFeedback = false;
      return;
    }

    const studentName = localStorage.getItem('studentName') || '학생';
    const selectedDataName = `${selectedXLabel}-${selectedYLabel}`;

    if (!xAxisLabel || !yAxisLabel) {
      feedbackDiv.textContent = '먼저 그래프를 선택하거나 생성한 뒤 해석을 작성해주세요.';
      feedbackDiv.classList.remove('opacity-0');
      feedbackDiv.classList.add('opacity-100');
      isRequestingFeedback = false;
      return;
    }

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

  <루브릭>
  ${rubric}
  </루브릭>

  <피드백 단계>
  1. 학생이 "잘 모르겠다" 같은 답변을 하면, 우선 그래프의 전체적인 모습(패턴, 그래프의 모양 등)에 대한 해석을 도와주는 피드백을 줘.
  2. 학생 답변이 (1,2), (2,4), (3,6)처럼 단순히 점만 나열되어 있으면, 각각의 점을 바탕으로 x축과 y축을 연결해서 해석하도록 유도해줘.
  3. 한꺼번에 주지 말고, 학생이 각각의 점에 대해 설명했다면 그래프 전체 모습에 대해 힌트를 주고, 반대로 전체적인 모습만 말했다면 각각의 점을 다시 살펴보도록 유도해줘.
  예: "반려 식물의 키를 관찰하기 시작한지 1, 2, 3주일 때, 식물의 키는 2, 4, 6cm가 된다"처럼 각각의 값을 연결해서 해석한 경우도 '양적 해석'으로 인정해.
  4. 구간에 대한 관찰, 전체적인 규칙성에 대한 피드백도 추가해 줘. 근데 답을 온전히 주지마.
  5. 마지막으로 학생 상황에 맞는 개선 방향을 제안해 줘.
  6. 학생이 단위도 틀리지 않고, 해석을 모두 잘 했다면, 마지막 줄에 **반드시 "다른 그래프를 해석해 보세요!"**라고 말해줘.
  **절대 "다른 그래프도", "다른 그래프도 해석해 보세요", "더 다양한 그래프를", "이제 다른 그래프도 해석해 보세요", "더 다양한 그래프를 해석해 보세요", "다른 그래프도 잘 해석할 수 있을 것 같아요", "다른 그래프도 잘 해석할 수 있을 거예요" 등으로 쓰지마.**
  </피드백 단계>

  <피드백 제시 방법>
  중학교 1학년 학생이 이해하기 쉽게 꼭 **3문장**으로 짧게 설명하는데, **반말은 안 되고!** 어미는 반드시 **'~하세요', '~보세요' 방식**으로 써줘.
  학생이 이미 잘 작성한 건 굳이 다시 언급하며 설명하지마.
  "질적 접근", "양적 접근" 같은 용어는 절대 쓰지 마.
  또한 HTML로 출력할 거니까 <div> 태그로 묶어서 보여주고, 중요한 부분은 <strong> 태그로 강조해줘.
  </피드백 제시 방법>

  ⚠ 매우 중요:
  - 학생의 문장이 문법적으로 어색하거나 "추가 1개일 때"처럼 표현이 다소 자연스럽지 않더라도, **수학적으로 의미가 명확하다면 절대 표현을 고치려고 하지 마.**
  - 피드백은 **오직 수학적 해석(관계 파악, 단위 포함, 점별 해석 여부)에만 집중**해. 속력이 증가하고 감소하는 이유는 묻지마.
  - 단위가 생략되지 않고 문장 안에 한 번 이상 포함되어 있으며 의미가 명확하면, '단위가 틀렸다'고 지적하지 마.
    예를 들어 "0~60분,90~120분, 150~180분, 210~240분 동안 각각 20km,10km, 10km, 10km를 이동한다"처럼 단위가 각 수 뒤에 반복되지 않더라도 올바른 문장이야.
  - "1분에서 2분 사이"와 같은 표현은 "1~2분","1,2분 사이"로 표현해도 같은 것으로 간주해야 해.
  - 그래프 해석은 반드시 **x축(독립변수, 가로축) → y축(종속변수, 세로축)** 방향으로만 해석해야 해. x축의 값이 변할 때 y축이 어떻게 변하는지 중심으로 써야 해.
  - 학생이의 해석에서 실제 데이터에서 x값에 따른 y값의 차이를 비교해보고 그 값이 정확한지 판단해.
  - 학생 답변에서 y축(세로축)을 기준으로 해석하는 내용은 절대 포함하지 마. 그렇게 해석했다면 수정 피드백을 줘.
  - 피드백은 반드시 **수학적인 해석**만 제공해야 하며, 그래프의 패턴, 수의 규칙성, 변수 간 관계 등 수학적인 관점에서만 평가해.
  - 속도까지는 요구하지 마.
  - 그래프에 나타나지 않은 점에 대해 예측해보게 하는 것은 하지마.
  - 정비례, 반비례 관계는 아직 학습하지 않았기 때문에 학생이 언급했을 때 그 부분은 다음 시간에 구체적으로 배울 것이라고 말해줘.
  - 학생이 그래프 해석과 전혀 관련 없는 답변을 하면 "그래프 해석과 관련없는 답변입니다."라고만 출력하고 다른 설명은 하지 마.
  - 학생이 양적 해석 없이 전체적인 경향만 언급한 경우에는 **잘했다고 하더라도 "다른 그래프를 해석해 보세요!" 메시지를 출력하지 마.**
  - “다른 그래프를 해석해 보세요!”는 반드시 학생이 **양적 해석과 질적 경향을 모두 충족**할 때만 출력해야 해.
  `;

    feedbackDiv.textContent = '피드백 생성 중...';
    feedbackDiv.classList.remove('hidden');

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: '너는 중학교 수학 교사로서 학생의 그래프 해석을 점진적으로 피드백하는 역할이야.' },
            {  role: 'user', content: `${prompt}\n<학생 답변>\n${studentText}` }
          ],
          temperature: 0.6
        })
      });

      const data = await res.json();
      const feedback = data.choices?.[0]?.message?.content || '피드백 생성 실패';
      feedbackDiv.innerHTML = feedback;

      // 구글 폼 입력
       const studentId = localStorage.getItem('studentId') || '';
       const studentName = localStorage.getItem('studentName') || '';
       const startTime = localStorage.getItem('startTime') || '';

       const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
       const formData = new FormData();

       formData.append('entry.1271583286', studentId);
       formData.append('entry.430525333', studentName);
       formData.append('entry.1017432853', startTime);
       formData.append('entry.1576105498', selectedDataName);
       formData.append('entry.80725412', studentText);
       formData.append('entry.634512883', feedback);

       fetch(formUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: formData
      });


      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = feedback;
      const plain = tempDiv.textContent.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

      if (plain.includes("다른그래프를해석해보세요!")) {
      completedInterpretations.add(selectedDataName);
      localStorage.setItem("completedInterpretations", JSON.stringify([...completedInterpretations]));

      const completed = completedInterpretations.size;

  // 그래프 1 해석 완료 시 -> 버튼2 활성화
  if (completed === 1) {
    const btn2 = document.getElementById('generateBtn2');
    if (btn2) {
      btn2.disabled = false;
      btn2.classList.remove('bg-gray-400');
      btn2.classList.add('bg-blue-500');
    }
  }

  // 그래프 2 해석 완료 시 -> 버튼3 활성화
  if (completed === 2) {
    const btn3 = document.getElementById('generateBtn3');
    if (btn3) {
      btn3.disabled = false;
      btn3.classList.remove('bg-gray-400');
      btn3.classList.add('bg-blue-500');
    }
  }

  // 그래프 3 해석 완료 시 -> 버튼4 활성화
  if (completed === 3) {
    const btn4 = document.getElementById('generateBtn4');
    if (btn4) {
      btn4.disabled = false;
      btn4.classList.remove('bg-gray-400');
      btn4.classList.add('bg-blue-500');
    }
  }
}

    } catch (err) {
      feedbackDiv.textContent = '❗ 피드백 오류: ' + err.message;
    } finally {
      isRequestingFeedback = false;
    }
  }

  window.generateGraph = generateGraph;
  window.requestFeedback = requestFeedback;

  const feedbackBtn = document.getElementById('feedbackBtn');
  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', requestFeedback);
  }
});
