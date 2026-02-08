#!/bin/bash
# 테스트 데이터 생성 스크립트
# 회원 2명 생성, 각 회원이 free/tech 게시판에 20개씩 글 작성

API="http://localhost:3001/api"

echo "=== 회원 생성 ==="

# 회원 1 생성
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"김테스트","email":"test1@ocean.com","password":"Test1234!"}' > /dev/null
echo "✅ 회원1 (test1@ocean.com) 생성 완료"

# 회원 2 생성
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"이테스트","email":"test2@ocean.com","password":"Test1234!"}' > /dev/null
echo "✅ 회원2 (test2@ocean.com) 생성 완료"

# 토큰 획득
TOKEN1=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@ocean.com","password":"Test1234!"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

TOKEN2=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@ocean.com","password":"Test1234!"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "=== 게시글 작성 시작 ==="

# 게시판 ID: free=1, tech=4
BOARDS=("1:free" "4:tech")

# 회원1: 각 게시판에 20개씩
for board in "${BOARDS[@]}"; do
  BOARD_ID="${board%%:*}"
  BOARD_NAME="${board##*:}"
  for i in $(seq 1 20); do
    curl -s -X POST "$API/boards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN1" \
      -d "{\"title\":\"[$BOARD_NAME] 김테스트의 게시글 $i\",\"content\":\"김테스트가 작성한 $BOARD_NAME 게시판의 $i번째 게시글입니다.\",\"boardTypeId\":$BOARD_ID}" > /dev/null
  done
  echo "✅ 김테스트 - $BOARD_NAME 게시판 20개 작성 완료"
done

# 회원2: 각 게시판에 20개씩
for board in "${BOARDS[@]}"; do
  BOARD_ID="${board%%:*}"
  BOARD_NAME="${board##*:}"
  for i in $(seq 1 20); do
    curl -s -X POST "$API/boards" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN2" \
      -d "{\"title\":\"[$BOARD_NAME] 이테스트의 게시글 $i\",\"content\":\"이테스트가 작성한 $BOARD_NAME 게시판의 $i번째 게시글입니다.\",\"boardTypeId\":$BOARD_ID}" > /dev/null
  done
  echo "✅ 이테스트 - $BOARD_NAME 게시판 20개 작성 완료"
done

echo ""
echo "=== 완료 ==="
echo "생성된 데이터:"
echo "- 회원: 2명 (test1@ocean.com, test2@ocean.com)"
echo "- 게시글: 80개 (각 회원 40개, 게시판당 40개)"
