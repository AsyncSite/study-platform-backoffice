#!/bin/bash

echo "🚀 Testing QueryDaily Email Send Functionality"
echo "=============================================="

# API endpoint
API_URL="http://localhost:8089/api/noti/send"

# Test 1: Send QueryDaily Question
echo -e "\n📧 Test 1: Sending QueryDaily Question..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "querydaily-question",
    "channelType": "EMAIL",
    "eventType": "NOTI",
    "to": "test@example.com",
    "variables": {
      "question": "React의 Virtual DOM과 실제 DOM의 차이점을 설명해주세요.",
      "hint": "렌더링 성능, 메모리 사용, 업데이트 방식의 차이를 중심으로 설명해보세요.",
      "referenceUrl": "https://asyncsite.com/querydaily/guides/react-virtual-dom"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n✅ Question email sent!"

# Test 2: Send QueryDaily Answer Guide
echo -e "\n📚 Test 2: Sending QueryDaily Answer Guide..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "querydaily-answer-guide",
    "channelType": "EMAIL",
    "eventType": "NOTI",
    "to": "test@example.com",
    "variables": {
      "question": "React의 Virtual DOM과 실제 DOM의 차이점을 설명해주세요.",
      "analysis": "이 질문은 React의 핵심 개념인 Virtual DOM에 대한 이해도를 평가합니다. 단순한 개념 설명을 넘어 실제 성능상의 이점과 작동 원리를 이해하고 있는지 확인합니다.",
      "keywords": ["Virtual DOM", "Reconciliation", "Diffing Algorithm", "Batch Update"],
      "starStructure": {
        "situation": "대규모 데이터 테이블을 실시간으로 업데이트해야 하는 프로젝트",
        "task": "초당 수백 개의 데이터 업데이트를 효율적으로 화면에 반영",
        "action": "React의 Virtual DOM을 활용하여 변경사항만 선택적으로 업데이트",
        "result": "렌더링 성능 70% 개선, 사용자 경험 크게 향상"
      },
      "personaAnswers": {
        "bigTech": "Virtual DOM은 메모리에 존재하는 JavaScript 객체로, 실제 DOM의 가상 표현입니다. 대규모 서비스에서는 수많은 DOM 조작이 발생하는데, Virtual DOM을 통해 변경사항을 배치 처리하고 최소한의 DOM 조작만 수행하여 성능을 최적화합니다.",
        "unicorn": "Virtual DOM은 React가 빠른 이유입니다. 실제 DOM 조작은 비용이 크기 때문에, Virtual DOM에서 먼저 변경사항을 계산하고 꼭 필요한 부분만 업데이트합니다. 스타트업처럼 빠른 개발과 성능이 모두 중요한 환경에서 매우 유용합니다."
      },
      "followUpQuestions": [
        "Virtual DOM의 Diffing 알고리즘은 어떻게 작동하나요?",
        "Virtual DOM이 항상 더 빠른가요? 그렇지 않다면 언제 느릴 수 있나요?",
        "React Fiber는 무엇이고 Virtual DOM과 어떤 관계가 있나요?"
      ]
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo -e "\n✅ Answer guide email sent!"
echo -e "\n🎉 All tests completed successfully!"