document.addEventListener('DOMContentLoaded', () => {
  let chart;
  let selectedType = '';
  let selectedXLabel = '';
  let selectedYLabel = '';

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
      yAxisLabel: "거리(km)",
      pattern: "증가",
      question: "자전거를 타고 달린 시간에 따른 이동 거리의 변화를 나타낸 그래프이다. 이를 해석해 보세요."
    },
    {
      xAxisLabel: "시간(초)",
      yAxisLabel: "높이(m)",
      pattern: "주기",
      question: "회전목마의 시간에 따른 지면에서의 높이 변화를 나타낸 그래프이다. 이를 해석해 보세요."
    },
    {
      xAxisLabel: "시간(분)",
      yAxisLabel: "속력(km/h)",
      pattern: "속력변화",
      question: "자율 주행 자동차의 운행이 시작된 후 시간에 따른 자동차의 속력 변화를 나타낸 그래프이다. 이를 해석해 보세요."
    }
  ];

  function generateGraph() {
    const randomSet = problemSets[Math.floor(Math.random() * problemSets.length)];
    const { xAxisLabel, yAxisLabel, pattern, question } = randomSet;

    document.getElementById('questionText').textContent = question;
    selectedXLabel = xAxisLabel;
    selectedYLabel = yAxisLabel;
    selectedType = pattern === '증가' ? 'increasing' : pattern === '감소' ? 'decreasing' : 'periodic';

    const ctx = document.getElementById('graphCanvas').getContext('2d');
    if (chart) chart.destroy();

    // ✅ "시간(분)-거리(km)" 그래프일 때 특수 처리
    if (xAxisLabel === "시간(분)" && yAxisLabel === "거리(km)") {
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
              tension: 0.3
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
  }

  function requestFeedback() {
    const interpretationInput = document.getElementById('interpretation');
    const feedbackDiv = document.getElementById('feedback');
  
    // ✅ student 정보 가져오기
    const studentId = localStorage.getItem('studentId') || '';
    const studentName = localStorage.getItem('studentName') || '';
    const startTime = localStorage.getItem('startTime') || '';
  
    if (!interpretationInput || !feedbackDiv) {
      console.error('필요한 요소를 찾을 수 없습니다 (#interpretation 또는 #feedback).');
      return;
    }
  
    const text = interpretationInput.value.trim();
    if (!text) {
      feedbackDiv.textContent = '해석을 먼저 작성해주세요';
      feedbackDiv.classList.remove('hidden');
      return;
    }
  
    // ✅ fetch 요청 전 메시지 표시
    feedbackDiv.textContent = '피드백을 가져오는 중입니다';
    feedbackDiv.classList.remove('hidden');
  
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
    6. 학생이 단위도 틀리지 않고, 각각의 점과 전체적인 해석을 모두 잘 했다면, 마지막에 "다음 단계로 넘어가 보세요!"라고 안내해 줘.
    </피드백 단계>

    <피드백 제시 방법>
    중학교 1학년 학생이 이해하기 쉽게 간결하게 설명하는데, 반말은 안 되고! 어미는 반드시 '~하세요', '~보세요' 방식으로 써줘.
    "질적 접근", "점별 접근" 같은 용어는 절대 쓰지 말고, 대신 그래프를 해석할 때 전체적인 모습과 하나하나의 점이 어떻게 변하는지 쉽게 설명해줘.
    또한 HTML로 출력할 거니까 <div> 태그로 묶어서 보여주고, 중요한 부분은 <strong> 태그로 강조해줘.
    </피드백 제시 방법>

    ⚠ 매우 중요:
    - 피드백을 줄 때, 학생 답안에서 **단위(예: cm, 회 등)가 빠지거나 틀린 경우** 반드시 지적해야 해. 단위가 빠지면 내용이 맞더라도 **"아주 잘했다"**고 평가하지 말고, 단위도 꼭 포함해서 다시 써야 한다고 강조해.
    - 숫자마다 단위를 반복하지 않아도 되며, "추의 개수가 1, 2, 3개일 때, 용수철의 길이는 4, 8, 12cm가 된다"처럼 마지막에 단위를 붙이는 건 그대로 인정해.
    - 그래프 해석은 반드시 **x축(독립변수, 가로축) → y축(종속변수, 세로축)** 방향으로만 해석해야 해. x축의 값이 변할 때 y축이 어떻게 변하는지 중심으로 써야 해.
    - 학생 답변에서 y축(세로축)을 기준으로 해석하는 내용은 절대 포함하지 마.
    - 학생의 답변이 이미 명확하다면 추가적인 설명(예: 가로축/세로축 언급, 불필요한 예시 제시 등)은 하지 말고, 짧게 칭찬만 해 줘.
    - 피드백은 반드시 **수학적인 해석**만 제공해야 하며, 그래프의 패턴, 수의 규칙성, 변수 간 관계 등 수학적인 관점에서만 평가해. 용수철이 왜 늘어나는지 같은 과학적 이유는 절대 언급하지 마.
    - 학생이 그래프 해석과 전혀 관련 없는 답변을 하면 "그래프 해석과 관련없는 답변입니다."라고만 출력하고 다른 설명은 하지 마.

    [학생의 해석]
    ${text}
  `;
  
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` 
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '너는 수학 교사로서 중학생이 작성한 그래프 해석을 피드백하는 역할이야.' },
        { role: 'user', content: `${prompt}\n<학생의 해석>\n${text}` }
      ],
      temperature: 0.6
    }),
  })
  
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 서버 에러:', response.status, errorText);
        throw new Error(`서버 응답 오류: ${response.status} - ${errorText}`);
      }
      return response.json();
    })
    .then(result => {
      const feedback = result.choices?.[0]?.message?.content || '피드백을 가져오는 데 실패했습니다.';
      feedbackDiv.innerHTML = feedback;
      feedbackDiv.classList.remove('hidden');
  
      // ✅ 구글폼 전송
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeN2JCNj5pzz0r3TwRagOtK6oSCIZQoEYsCJF_crbmykdJkyg/formResponse';
      const formData = new FormData();
      formData.append('entry.1271583286', studentId);
      formData.append('entry.430525333', studentName);
      formData.append('entry.1017432853', startTime);
      formData.append('entry.1576105498', `${selectedXLabel} - ${selectedYLabel}`);
      formData.append('entry.80725412', text);
      formData.append('entry.634512883', feedback);
  
      fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
    })
    .catch(err => {
      console.error('❗ 피드백 요청 중 오류 발생:', err);
      feedbackDiv.textContent = '피드백 요청 중 오류가 발생했습니다.';
      feedbackDiv.classList.remove('hidden');
    });
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
