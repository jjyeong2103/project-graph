document.addEventListener('DOMContentLoaded', () => {
  let isRequestingFeedback = false; // 중복 호출 방지 flag
  let chart;
  let selectedType = '';
  let selectedXLabel = '';
  let selectedYLabel = '';
  let xAxisLabel = '';
  let yAxisLabel = '';
  let completedInterpretations = new Set();
  let currentProblemIndex = 0;

  // 좌표축, 원점 표시 플러그인
  const axisArrowsPlugin = {
    id: 'axisArrows',
    afterDraw(chart, args, options) {
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

      // x축
      ctx.beginPath();
      ctx.moveTo(xStart - 20, yZero);
      ctx.lineTo(xEnd + 10, yZero);
      ctx.stroke();

      // x축 오른쪽 화살표
      ctx.beginPath();
      ctx.moveTo(xEnd + 10, yZero);
      ctx.lineTo(xEnd + 2, yZero - arrowSize / 2);
      ctx.moveTo(xEnd + 10, yZero);
      ctx.lineTo(xEnd + 2, yZero + arrowSize / 2);
      ctx.stroke();

      // y축
      ctx.beginPath();
      ctx.moveTo(xZero, yStart + 20);
      ctx.lineTo(xZero, yTop - 10);
      ctx.stroke();

      // y축 위쪽 화살표
      ctx.beginPath();
      ctx.moveTo(xZero, yTop - 10);
      ctx.lineTo(xZero - arrowSize / 2, yTop - 2);
      ctx.moveTo(xZero, yTop - 10);
      ctx.lineTo(xZero + arrowSize / 2, yTop - 2);
      ctx.stroke();

      // 원점에 O 표시
      ctx.font = '14px sans-serif';
      ctx.fillText('O', xZero - 15, yZero + 16);

      ctx.restore();
    }
  };

  const problemSets = [
   {
    xAxisLabel: "시간(분)",
    yAxisLabel: "속력(km/h)",
    pattern: "속력변화",
    question: "자율 주행 자동차의 운행이 시작된 후 시간에 따른 자동차의 속력 변화를 나타낸 그래프이다. 이를 해석해 보세요."
  },
  {
    xAxisLabel: "시간(초)",
    yAxisLabel: "높이(m)",
    pattern: "주기",
    question: "회전목마의 시간에 따른 지면에서의 높이 변화를 나타낸 그래프이다. 이를 해석해 보세요."
  },
  {
    xAxisLabel: "시간(분)",
    yAxisLabel: "이동 거리(km)",
    pattern: "증가",
    question: "자전거를 타고 달린 시간에 따른 이동 거리의 변화를 나타낸 그래프이다. 이를 해석해 보세요."
  }
];

  const btn1 = document.getElementById('generateBtn1');
  const btn2 = document.getElementById('generateBtn2');
  const btn3 = document.getElementById('generateBtn3');

  if (btn1 && btn2 && btn3) {
    btn1.addEventListener('click', () => {
      currentProblemIndex = 0;
      generateGraph();
    });
    btn2.addEventListener('click', () => {
      currentProblemIndex = 1;
      generateGraph();
    });
    btn3.addEventListener('click', () => {
      currentProblemIndex = 2;
      generateGraph();
    });
  }


  function generateGraph() {
    const problemSet = problemSets[currentProblemIndex];
    xAxisLabel = problemSet.xAxisLabel;
    yAxisLabel = problemSet.yAxisLabel;
    selectedXLabel = xAxisLabel;
    selectedYLabel = yAxisLabel;
    selectedType = problemSet.pattern === '증가' ? 'increasing'
               : problemSet.pattern === '감소' ? 'decreasing'
               : 'periodic';

document.getElementById('questionText').textContent = problemSet.question;

    const ctx = document.getElementById('graphCanvas').getContext('2d');
    if (chart) chart.destroy();

    // ✅ "시간(분)-이동 거리(km)" 그래프일 때 특수 처리
    if (xAxisLabel === "시간(분)" && yAxisLabel === "이동 거리(km)") {
      const dataPoints = [
        { x: 0, y: 0 },
        { x: 30, y: 10 },
        { x: 60, y: 20 },
        { x: 90, y: 20 },
        { x: 120, y: 30 },
        { x: 150, y: 30 },
        { x: 180, y: 40 },
        { x: 210, y: 40 },
        { x: 240, y: 50 }
      ];

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            data: dataPoints,
            borderColor: 'blue',
            backgroundColor: 'blue',
            fill: false,
            pointRadius: 6,
            tension: 0
          }]
        },
        options: {
          plugins: {
            legend: {
              display: false
            }
          },
          layout: {
            padding: {
              right: 30
            }
          },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: xAxisLabel
              },
              min: 0,
              grid: {
                color: '#ddd',
                lineWidth: 1
              },
              ticks: {
                stepSize: 30,
                callback: function(value) {
                  return value === 0 ? '' : value;
                }
              }
            },
            y: {
              title: {
                display: true,
                text: yAxisLabel
              },
              min: 0,
              grid: {
                color: '#ddd',
                lineWidth: 1
              },
              ticks: {
                callback: function(value) {
                  return value === 0 ? '' : value;
                }
              }
            }
          }
        },
        plugins: [axisArrowsPlugin]
      });
      }
      else if (xAxisLabel === "시간(초)" && yAxisLabel === "높이(m)") {
        const dataPoints = [];
        for (let x = 0; x <= 10; x += 0.5) {
          dataPoints.push({ x, y: 1.5 + 0.5 * Math.cos(0.5 * Math.PI * x) });
        }
    
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              data: dataPoints,
              borderColor: 'blue',
              backgroundColor: 'blue',
              fill: false,
              pointRadius: 0,
              tension: 0.4
            }]
          },
          options: {
            plugins: {
              legend: {
                display: false
              }
            },
            layout: {
              padding: {
                right: 30
              }
            },
            scales: {
              x: {
                type: 'linear',
                title: {
                  display: true,
                  text: xAxisLabel
                },
                min: 0,
                max: 10,
                grid: {
                  color: '#ddd',
                  lineWidth: 1
                },
                ticks: {
                  stepSize: 1,
                  callback: function(value) {
                    return value === 0 ? '' : value;
                  }
                }
              },
              y: {
                title: {
                  display: true,
                  text: yAxisLabel
                },
                min: 0,
                max: 2.5,
                grid: {
                  color: '#ddd',
                  lineWidth: 1
                },
                ticks: {
                  callback: function(value) {
                    return value === 0 ? '' : value;
                  }
                }
              }
            }
          },
          plugins: [axisArrowsPlugin]
        });
      }
      else if (xAxisLabel === "시간(분)" && yAxisLabel === "속력(km/h)") {
        const dataPoints = [
            { x: 0, y: 0 },
            { x: 5, y: 35 },
            { x: 8, y: 35 },
            { x: 10, y: 0 }
        ];
    
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: dataPoints,
                    borderColor: 'blue',
                    backgroundColor: 'blue',
                    fill: false,
                    pointRadius: 6,
                    tension: 0
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },
                layout: {
                    padding: {
                        right: 30
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: xAxisLabel
                        },
                        min: 0,
                        max: 10,
                        grid: {
                            color: '#ddd',
                            lineWidth: 1
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value === 0 ? '' : value;
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        },
                        min: 0,
                        max: 40,
                        grid: {
                            color: '#ddd',
                            lineWidth: 1
                        },
                        ticks: {
                            callback: function(value) {
                                return value === 0 ? '' : value;
                            }
                        }
                    }
                }
            },
            plugins: [axisArrowsPlugin]
        });
      }
          currentProblemIndex++;
  if (currentProblemIndex >= problemSets.length) {
    currentProblemIndex = 0;  // 반복 가능하게 만들기 (원한다면)
  }

  const generateBtn = document.getElementById('generateBtn');
if (generateBtn) {
  generateBtn.disabled = true;
}  // 피드백 후에만 다시 클릭 가능
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
    isRequestingFeedback = false;           // 중복 방지 해제
    return;
  }

  const studentId = localStorage.getItem('studentId') || '';
  const studentName = localStorage.getItem('studentName') || '';
  const startTime = localStorage.getItem('startTime') || '';
  const selectedDataName = localStorage.getItem('selectedDataName') || '';

  if (!xAxisLabel || !yAxisLabel) {
    feedbackDiv.textContent = '먼저 그래프를 선택하거나 생성한 뒤 해석을 작성해주세요.';
    feedbackDiv.classList.remove('opacity-0');
    feedbackDiv.classList.add('opacity-100');
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

  <피드백 단계>
  1. 학생이 "잘 모르겠다" 같은 답변을 하면, 우선 그래프의 양적 해석을 도와주는 피드백을 줘. 양적 해석은 점별, 구간, 전체적 접근인데 한꺼번에 힌트를 주지 말고 각각 조금씩 힌트를 줘.
  2. 학생 답변이 (1,2), (2,4), (3,6)처럼 단순히 점만 나열되어 있으면, 각각의 점을 바탕으로 x축과 y축을 연결해서 해석하도록 유도해줘.
  3. 양적 해석은 각각 두 점에 대한 해석, 그래프 형태가 **달라지는 구간에 대한 해석(즉, 기울기나 y값의 변화가 있는 구간)**, 그리고 전체적 해석 1가지로 나눠서 해석해줘.
  4. 마지막으로 학생 상황에 맞는 개선 방향을 제안해 줘.
  5. 양적 해석(두 점에 대한 해석, 그래프 형태가 달라지는 모든 구간에 대한 해석, 전체적 해석 1가지)을 모두 잘 했다면
     마지막 줄에 **반드시 "다른 그래프를 해석해 보세요!"**라고 말해줘. **절대 "다른 그래프도 해석해 보세요", "더 많은 그래프를 해석해 보세요"라고 쓰지마.**
  </피드백 단계>

  <피드백 제시 방법>
  중학교 1학년 학생이 이해하기 쉽게 꼭 **3문장**으로 짧게 설명하는데, **반말은 안 되고!** 어미는 반드시 **'~하세요', '~보세요' 방식**으로 써줘.
  "질적 접근", "양적 접근" 같은 용어는 절대 쓰지 말고, 대신 그래프를 해석할 때 전체적인 모습과 하나하나의 점이 어떻게 변하는지 쉽게 설명해줘.
  또한 HTML로 출력할 거니까 <div> 태그로 묶어서 보여주고, 중요한 부분은 <strong> 태그로 강조해줘.
  </피드백 제시 방법>

  ⚠ 매우 중요:
  - 양적 접근(점별 접근)은 모든 점에 대해 할 필요 없이 적어도 한 점에 대해서만 해도 괜찮아.
  - 학생의 문장이 문법적으로 어색하거나 "추가 1개일 때"처럼 표현이 다소 자연스럽지 않더라도, **수학적으로 의미가 명확하다면 절대 표현을 고치려고 하지 마.**
  - 피드백은 **오직 수학적 해석(관계 파악, 단위 포함, 점별 해석 여부)에만 집중**해.
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
      { role: 'system', content: '너는 중학교 수학 교사야. 학생의 그래프 해석을 피드백해줘.' },
      { role: 'user', content: `${prompt}\n<학생의 해석>\n${studentText}` }
    ],
    temperature: 0.6
  })
});

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 오류: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const feedback = result.choices?.[0]?.message?.content || '피드백 생성에 실패했습니다.';
    feedbackDiv.innerHTML = feedback;

    // 완료된 그래프 처리
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = feedback;
    const plainText = tempDiv.textContent.replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (plainText.includes("다른그래프를해석해보세요!")) {
      completedInterpretations.add(selectedDataName);
      localStorage.setItem("completedInterpretations", JSON.stringify([...completedInterpretations]));

      const graphSelect = document.getElementById('graphSelect');
      [...graphSelect.options].forEach(opt => {
        if (opt.value === selectedDataName && !opt.textContent.startsWith('✅')) {
          opt.textContent = '✅ ' + selectedDataName;
        }
      });
    }

    // 버튼 상태 업데이트
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

    // 구글폼 전송
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
    const formData = new FormData();
    formData.append('entry.1271583286', studentId);
    formData.append('entry.430525333', studentName);
    formData.append('entry.1017432853', startTime);
    formData.append('entry.1576105498', `${selectedXLabel} - ${selectedYLabel}`);
    formData.append('entry.80725412', studentText);
    formData.append('entry.634512883', feedback);

    fetch(formUrl, { method: 'POST', mode: 'no-cors', body: formData });

  } catch (err) {
    console.error('❌ 피드백 요청 실패:', err);
    feedbackDiv.textContent = '❗ 피드백 요청 중 오류가 발생했습니다.';
  } finally {
    isRequestingFeedback = false;           // 중복 방지 해제
  }
}  
  

  // 해석 저장 함수 (유지)
  function submitInterpretation() {
    const text = document.getElementById('interpretation').value.trim();
    if (!text) return;

    const interpretationsDiv = document.getElementById('interpretations');
    const newEntry = document.createElement('p');
    newEntry.textContent = `학생: ${text}`;
    interpretationsDiv.appendChild(newEntry);

    document.getElementById('interpretation').value = '';
  }

  // 전역 등록
  window.generateGraph = generateGraph;
  window.requestFeedback = requestFeedback;
  window.submitInterpretation = submitInterpretation;
 
  // 피드백 버튼
  const feedbackBtn = document.getElementById('feedbackBtn');
  if (feedbackBtn) {
  feedbackBtn.addEventListener('click', requestFeedback);
}
});
