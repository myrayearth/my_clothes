-- =========================================================================
-- 마이그레이션: 레거시 복장 명칭 ➔ 2026 최종 표준 명칭 일괄 업데이트
-- 대상 테이블: public.outfit_logs, public.temperature_evaluations
-- =========================================================================

-- 1. [Outer] 외투 컬럼 1:1 단일 텍스트 치환
-- '나일론 바람막이' ➔ '홑겹 바람막이', '없음' ➔ ''
UPDATE public.outfit_logs SET selected_outer = '홑겹 바람막이' WHERE selected_outer = '나일론 바람막이';
UPDATE public.outfit_logs SET selected_outer = '' WHERE selected_outer = '없음';
UPDATE public.outfit_logs SET selected_outer = '얇은 가디건' WHERE selected_outer IN ('가디건', '여름 얇은 가디건');
UPDATE public.outfit_logs SET selected_outer = '바람막이 / 윈드브레이커' WHERE selected_outer IN ('바람막이', '윈드브레이커');
UPDATE public.outfit_logs SET selected_outer = '청자켓 / 블루종' WHERE selected_outer IN ('청자켓', '데님자켓', '블루종');
UPDATE public.outfit_logs SET selected_outer = '경량 패딩 조끼' WHERE selected_outer IN ('경량 패딩조끼', '경량 조끼 패딩');
UPDATE public.outfit_logs SET selected_outer = '플리스(후리스) 자켓' WHERE selected_outer IN ('플리스', '후리스', '플리스 자켓', '플리스(후리스)');
UPDATE public.outfit_logs SET selected_outer = '라이더 자켓 / 가죽 자켓' WHERE selected_outer IN ('라이더 자켓', '가죽 자켓');
UPDATE public.outfit_logs SET selected_outer = '모직 피코트' WHERE selected_outer = '모직 하프코트';
UPDATE public.outfit_logs SET selected_outer = '두꺼운 롱코트' WHERE selected_outer IN ('울 롱코트', '두꺼운 코트');
UPDATE public.outfit_logs SET selected_outer = '숏패딩' WHERE selected_outer IN ('미들 다운', '미들 다운 패딩');
UPDATE public.outfit_logs SET selected_outer = '방풍 파카 (헤비 다운)' WHERE selected_outer IN ('방풍 파카', '방한 헤비 파카', '방풍 헤비 다운');
UPDATE public.outfit_logs SET selected_outer = '대장급 헤비 다운 롱패딩' WHERE selected_outer = '익스트림 벤치 롱패딩';

-- 2. [Top] 상의 배열(TEXT[]) 치환
-- '셔츠' ➔ '일반 셔츠', '스웨터' ➔ '기본 스웨터', '도톰한 울 니트' ➔ '도톰한 울 스웨터', '두꺼운 울 니트' ➔ '헤비 울 스웨터', '모크넥 니트' ➔ '모크넥 스웨터'
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '셔츠', '일반 셔츠') WHERE '셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '스웨터', '기본 스웨터') WHERE '스웨터' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '니트', '기본 스웨터') WHERE '니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '얇은 니트', '기본 스웨터') WHERE '얇은 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '도톰한 울 니트', '도톰한 울 스웨터') WHERE '도톰한 울 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '도톰한 니트', '도톰한 울 스웨터') WHERE '도톰한 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '두꺼운 울 니트', '헤비 울 스웨터') WHERE '두꺼운 울 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '기모 니트', '헤비 울 스웨터') WHERE '기모 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '모크넥 니트', '모크넥 스웨터') WHERE '모크넥 니트' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '오버핏 반팔 티셔츠', '반팔 티셔츠') WHERE '오버핏 반팔 티셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '코튼 반팔 티셔츠', '반팔 티셔츠') WHERE '코튼 반팔 티셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '카라 티셔츠', '피케 셔츠') WHERE '카라 티셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '7부 티셔츠', '얇은 7부 티') WHERE '7부 티셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '긴팔 티셔츠', '긴팔 티셔츠 (롱슬리브)') WHERE '긴팔 티셔츠' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '긴팔티', '긴팔 티셔츠 (롱슬리브)') WHERE '긴팔티' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '롱슬리브', '긴팔 티셔츠 (롱슬리브)') WHERE '롱슬리브' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '히트텍/내의', '기본 발열내의 (히트텍)') WHERE '히트텍/내의' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '히트텍', '기본 발열내의 (히트텍)') WHERE '히트텍' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '기본 발열내의', '기본 발열내의 (히트텍)') WHERE '기본 발열내의' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '방한 히트텍/내의', '특수 방한내의') WHERE '방한 히트텍/내의' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '기모 후드', '기모 후드티') WHERE '기모 후드' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '기모 집업', '기모 집업 / 스웨터 집업') WHERE '기모 집업' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '니트 집업', '기모 집업 / 스웨터 집업') WHERE '니트 집업' = ANY(selected_top);
UPDATE public.outfit_logs SET selected_top = array_replace(selected_top, '두꺼운 터틀넥', '기모 터틀넥') WHERE '두꺼운 터틀넥' = ANY(selected_top);

-- 3. [Bottom] 하의 배열(TEXT[]) 치환
-- '레귤러 데님', '스트레이트 데님' ➔ '기본 데님'
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '레귤러 데님', '기본 데님') WHERE '레귤러 데님' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '스트레이트 데님', '기본 데님') WHERE '스트레이트 데님' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '청바지', '기본 데님') WHERE '청바지' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '데님 팬츠', '기본 데님') WHERE '데님 팬츠' = ANY(selected_bottom);

-- '스탠다드 슬랙스', '와이드 슬랙스', '슬랙스' ➔ '기본 슬랙스'
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '스탠다드 슬랙스', '기본 슬랙스') WHERE '스탠다드 슬랙스' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '와이드 슬랙스', '기본 슬랙스') WHERE '와이드 슬랙스' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '슬랙스', '기본 슬랙스') WHERE '슬랙스' = ANY(selected_bottom);

-- '기모 트레이닝 팬츠', '기모 조거팬츠', '본딩 진' ➔ '기모 트레이닝(조거 등)'
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '기모 트레이닝 팬츠', '기모 트레이닝(조거 등)') WHERE '기모 트레이닝 팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '기모 조거팬츠', '기모 트레이닝(조거 등)') WHERE '기모 조거팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '본딩 진', '기모 트레이닝(조거 등)') WHERE '본딩 진' = ANY(selected_bottom);

-- 기타 하의 표준화
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '반바지', '얇은 반바지') WHERE '반바지' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '면바지', '면바지 / 치노 팬츠') WHERE '면바지' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '치노 팬츠', '면바지 / 치노 팬츠') WHERE '치노 팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '골덴 팬츠', '코듀로이 팬츠 (골덴 바지)') WHERE '골덴 팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '코듀로이 팬츠', '코듀로이 팬츠 (골덴 바지)') WHERE '코듀로이 팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '울 슬랙스', '두꺼운 울 슬랙스') WHERE '울 슬랙스' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '기모 안감 슬랙스', '기모 슬랙스') WHERE '기모 안감 슬랙스' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '기모바지', '기모 슬랙스') WHERE '기모바지' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '본딩 기모 방한바지', '융기모 방한바지') WHERE '본딩 기모 방한바지' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '하의 히트텍/타이즈', '하의 기본 발열내의') WHERE '하의 히트텍/타이즈' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '하의 방한 히트텍/타이즈', '하의 특수 방한내의') WHERE '하의 방한 히트텍/타이즈' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '방풍 팬츠', '기모 방풍 팬츠') WHERE '방풍 팬츠' = ANY(selected_bottom);
UPDATE public.outfit_logs SET selected_bottom = array_replace(selected_bottom, '헤비 패딩 팬츠', '패딩 팬츠') WHERE '헤비 패딩 팬츠' = ANY(selected_bottom);

-- '내의 + 두꺼운 데님' (복합 항목) ➔ '하의 기본 발열내의', '두꺼운 데님' 2개 항목으로 1:N 분리 매핑
UPDATE public.outfit_logs
SET selected_bottom = array_cat(
    array_remove(selected_bottom, '내의 + 두꺼운 데님'),
    ARRAY['하의 기본 발열내의', '두꺼운 데님']
)
WHERE '내의 + 두꺼운 데님' = ANY(selected_bottom);

-- 4. [Item] 소품 배열(TEXT[]) 치환
-- '신발용 핫팩', '발바닥 핫팩' ➔ '붙이는 핫팩 (신체/발)'
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '신발용 핫팩', '붙이는 핫팩 (신체/발)') WHERE '신발용 핫팩' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '발바닥 핫팩', '붙이는 핫팩 (신체/발)') WHERE '발바닥 핫팩' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '붙이는 핫팩', '붙이는 핫팩 (신체/발)') WHERE '붙이는 핫팩' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '전신 핫팩 세트', '붙이는 핫팩 (신체/발)') WHERE '전신 핫팩 세트' = ANY(selected_items);

-- '손난로 핫팩' ➔ '휴대용 손난로 핫팩'
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '손난로 핫팩', '휴대용 손난로 핫팩') WHERE '손난로 핫팩' = ANY(selected_items);

-- '바라클라바' ➔ '바라클라바 (방한모)'
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '바라클라바', '바라클라바 (방한모)') WHERE '바라클라바' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '방한모자', '바라클라바 (방한모)') WHERE '방한모자' = ANY(selected_items);

-- '가죽 장갑' ➔ '가죽 / 니트 장갑'
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '가죽 장갑', '가죽 / 니트 장갑') WHERE '가죽 장갑' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '장갑', '가죽 / 니트 장갑') WHERE '장갑' = ANY(selected_items);

-- 기타 소품 표준화
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '손풍기', '휴대용 손풍기') WHERE '손풍기' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '캡모자', '캡모자 / 볼캡') WHERE '캡모자' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '볼캡 모자', '캡모자 / 볼캡') WHERE '볼캡 모자' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '손수건', '땀 흡수 손수건') WHERE '손수건' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '얇은 면스카프', '얇은 스카프') WHERE '얇은 면스카프' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '쁘띠 스카프', '얇은 스카프') WHERE '쁘띠 스카프' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '두께감 있는 양말', '도톰한 양말') WHERE '두께감 있는 양말' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '보온 양말', '도톰한 양말') WHERE '보온 양말' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '보온 귀마개', '방한 귀마개') WHERE '보온 귀마개' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '귀마개', '방한 귀마개') WHERE '귀마개' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '방한화/어그부츠', '방한화 / 어그부츠') WHERE '방한화/어그부츠' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '어그부츠', '방한화 / 어그부츠') WHERE '어그부츠' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '기모 스노우 부츠', '방한화 / 어그부츠') WHERE '기모 스노우 부츠' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '넥워머', '방한 넥워머') WHERE '넥워머' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '머플러', '울 머플러') WHERE '머플러' = ANY(selected_items);
UPDATE public.outfit_logs SET selected_items = array_replace(selected_items, '안면마스크', '방풍 마스크') WHERE '안면마스크' = ANY(selected_items);

-- 5. [동일 동기화] public.temperature_evaluations 테이블 (존재할 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temperature_evaluations') THEN
    UPDATE public.temperature_evaluations SET selected_outer = '홑겹 바람막이' WHERE selected_outer = '나일론 바람막이';
    UPDATE public.temperature_evaluations SET selected_outer = '' WHERE selected_outer = '없음';
    UPDATE public.temperature_evaluations SET selected_outer = '바람막이 / 윈드브레이커' WHERE selected_outer IN ('바람막이', '윈드브레이커');
    UPDATE public.temperature_evaluations SET selected_outer = '청자켓 / 블루종' WHERE selected_outer IN ('청자켓', '데님자켓', '블루종');
    UPDATE public.temperature_evaluations SET selected_outer = '플리스(후리스) 자켓' WHERE selected_outer IN ('플리스', '후리스', '플리스 자켓');
    UPDATE public.temperature_evaluations SET selected_outer = '라이더 자켓 / 가죽 자켓' WHERE selected_outer IN ('라이더 자켓', '가죽 자켓');
    UPDATE public.temperature_evaluations SET selected_outer = '숏패딩' WHERE selected_outer IN ('미들 다운', '미들 다운 패딩');
    UPDATE public.temperature_evaluations SET selected_outer = '방풍 파카 (헤비 다운)' WHERE selected_outer IN ('방풍 파카', '방한 헤비 파카', '방풍 헤비 다운');
    UPDATE public.temperature_evaluations SET selected_outer = '대장급 헤비 다운 롱패딩' WHERE selected_outer = '익스트림 벤치 롱패딩';

    UPDATE public.temperature_evaluations SET selected_top = array_replace(selected_top, '셔츠', '일반 셔츠') WHERE '셔츠' = ANY(selected_top);
    UPDATE public.temperature_evaluations SET selected_top = array_replace(selected_top, '스웨터', '기본 스웨터') WHERE '스웨터' = ANY(selected_top);
    UPDATE public.temperature_evaluations SET selected_top = array_replace(selected_top, '도톰한 울 니트', '도톰한 울 스웨터') WHERE '도톰한 울 니트' = ANY(selected_top);
    UPDATE public.temperature_evaluations SET selected_top = array_replace(selected_top, '두꺼운 울 니트', '헤비 울 스웨터') WHERE '두꺼운 울 니트' = ANY(selected_top);
    UPDATE public.temperature_evaluations SET selected_top = array_replace(selected_top, '모크넥 니트', '모크넥 스웨터') WHERE '모크넥 니트' = ANY(selected_top);

    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '레귤러 데님', '기본 데님') WHERE '레귤러 데님' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '스트레이트 데님', '기본 데님') WHERE '스트레이트 데님' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '스탠다드 슬랙스', '기본 슬랙스') WHERE '스탠다드 슬랙스' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '와이드 슬랙스', '기본 슬랙스') WHERE '와이드 슬랙스' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '기모 트레이닝 팬츠', '기모 트레이닝(조거 등)') WHERE '기모 트레이닝 팬츠' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '기모 조거팬츠', '기모 트레이닝(조거 등)') WHERE '기모 조거팬츠' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations SET selected_bottom = array_replace(selected_bottom, '본딩 진', '기모 트레이닝(조거 등)') WHERE '본딩 진' = ANY(selected_bottom);
    UPDATE public.temperature_evaluations
    SET selected_bottom = array_cat(
        array_remove(selected_bottom, '내의 + 두꺼운 데님'),
        ARRAY['하의 기본 발열내의', '두꺼운 데님']
    )
    WHERE '내의 + 두꺼운 데님' = ANY(selected_bottom);

    UPDATE public.temperature_evaluations SET selected_items = array_replace(selected_items, '신발용 핫팩', '붙이는 핫팩 (신체/발)') WHERE '신발용 핫팩' = ANY(selected_items);
    UPDATE public.temperature_evaluations SET selected_items = array_replace(selected_items, '발바닥 핫팩', '붙이는 핫팩 (신체/발)') WHERE '발바닥 핫팩' = ANY(selected_items);
    UPDATE public.temperature_evaluations SET selected_items = array_replace(selected_items, '손난로 핫팩', '휴대용 손난로 핫팩') WHERE '손난로 핫팩' = ANY(selected_items);
    UPDATE public.temperature_evaluations SET selected_items = array_replace(selected_items, '바라클라바', '바라클라바 (방한모)') WHERE '바라클라바' = ANY(selected_items);
    UPDATE public.temperature_evaluations SET selected_items = array_replace(selected_items, '가죽 장갑', '가죽 / 니트 장갑') WHERE '가죽 장갑' = ANY(selected_items);
  END IF;
END $$;
