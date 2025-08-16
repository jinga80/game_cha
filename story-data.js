// 게임 스토리 데이터
const STORY_DATA = {
  "title": "아이의 모험",
  "player": "모모",
  "version": "1.0",
  "characters": {
    "MOMO": { "name": "모모", "sprite": "sprites/momo_idle.png", "voice": "momo" },
    "IGU": { "name": "나무이구", "sprite": "sprites/namuigu.png", "voice": "wood_soft" },
    "AGWI": { "name": "나무악귀", "sprite": "sprites/namuagwi.png", "voice": "wood_rough" },
    "MOMAMA": { "name": "모마마", "sprite": "sprites/momama.png", "voice": "momama" },
    "NADAY": { "name": "나데이", "sprite": "sprites/naday.png", "voice": "naday" },
    "ZZ": { "name": "즈즈", "sprite": "sprites/zz.png", "voice": "dog" }
  },
  "scenes": [
    {
      "id": "S1",
      "title": "평범한 오후",
      "background": "bg/momo_room.png",
      "music": "bgm/day.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "오늘도 똑같은 하루네… 뭐 재미있는 일 없을까?", "emotion": "idle" },
        { "speaker": "SFX", "text": "또르르…", "sfx": "sfx/roll.wav" },
        { "speaker": "MOMO", "text": "응? 창고 쪽에서 소리가…?", "emotion": "surprise" }
      ],
      "next": "S2"
    },
    {
      "id": "S2",
      "title": "창고 뒤, 빛나는 포털",
      "background": "bg/warehouse_back.png",
      "music": "bgm/mystery.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "저게… 뭐야? 파란빛이 새어나와.", "emotion": "curious" },
        { "speaker": "SFX", "text": "쉬잉—!", "sfx": "sfx/portal_hum.wav" },
        { "speaker": "MOMO", "text": "들어가… 볼까?", "emotion": "decide" }
      ],
      "next": "S3"
    },
    {
      "id": "S3",
      "title": "차원 이동",
      "background": "bg/warp.jpg",
      "music": "bgm/warp.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "우왁—!", "emotion": "fall" },
        { "speaker": "SFX", "text": "파직!", "sfx": "sfx/flash.wav" },
        { "speaker": "MOMO", "text": "여긴… 어디지?", "emotion": "surprise" }
      ],
      "next": "S4"
    },
    {
      "id": "S4",
      "title": "에테리움 평원",
      "background": "bg/ether_field.png",
      "music": "bgm/ether_field.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "하늘이… 움직여? 저건 고래 구름…?", "emotion": "wonder" },
        { "speaker": "IGU", "text": "…누구냐. 여긴 너희 세계가 아니다.", "emotion": "neutral" },
        { "speaker": "MOMO", "text": "나… 길을 잃었어요. 집으로 돌아가야 해요.", "emotion": "ask" },
        { "speaker": "IGU", "text": "돌아가려면 포털의 열쇠를 찾아라. 수호자들이 지키고 있다.", "emotion": "tell" }
      ],
      "next": "S5"
    },
    {
      "id": "S5",
      "title": "숲의 오두막",
      "background": "bg/forest_hut.png",
      "music": "bgm/wood.mp3",
      "lines": [
        { "speaker": "MOMAMA", "text": "길 잃은 아이구나.", "emotion": "warm" },
        { "speaker": "MOMO", "text": "열쇠를 찾아야 집에 돌아갈 수 있대요.", "emotion": "explain" },
        { "speaker": "MOMAMA", "text": "혼자는 위험해. 도움이 될 친구들을 만나보렴.", "emotion": "advise" }
      ],
      "next": "S6"
    },
    {
      "id": "S6",
      "title": "동료 합류",
      "background": "bg/forest_path.png",
      "music": "bgm/friends.mp3",
      "lines": [
        { "speaker": "NADAY", "text": "네가 그 아이? 듣던 것보다 평범하네.", "emotion": "smile" },
        { "speaker": "ZZ", "text": "왈! 난 평범하지 않아. 포털 비밀을 알고 있거든!", "emotion": "talk" },
        { "speaker": "MOMO", "text": "개가… 말을 하네?!", "emotion": "shock" },
        { "speaker": "ZZ", "text": "말도 하고, 뛰기도 잘하지! 열쇠는 유적에 있어.", "emotion": "proud" }
      ],
      "next": "S7"
    },
    {
      "id": "S7",
      "title": "첫 수호자",
      "background": "bg/ruin_gate.png",
      "music": "bgm/boss_intro.mp3",
      "lines": [
        { "speaker": "AGWI", "text": "외부인은 물러가라!", "emotion": "angry" },
        { "speaker": "MOMO", "text": "그 열쇠가 필요해! 싸워야겠어!", "emotion": "resolve" }
      ],
      "battle": { "enemy": "AGWI", "winNext": "S8", "loseNext": "S7_RETRY" }
    },
    {
      "id": "S7_RETRY",
      "title": "다시 도전",
      "background": "bg/ruin_gate.png",
      "music": "bgm/retry.mp3",
      "lines": [
        { "speaker": "ZZ", "text": "호흡을 가다듬고! 꼬리 공격을 조심해!", "emotion": "coach" }
      ],
      "next": "S7"
    },
    {
      "id": "S8",
      "title": "열쇠 조각 획득",
      "background": "bg/ruin_core.png",
      "music": "bgm/reward.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "해냈다! 첫 번째 열쇠 조각!", "emotion": "happy" },
        { "speaker": "ZZ", "text": "좋아. 하지만 나머지는 더 어렵다!", "emotion": "warn" },
        { "speaker": "MOMAMA", "text": "포기하지 마. 네 선택이 이 세계를 바꿔.", "emotion": "support" }
      ],
      "next": "S9"
    },
    {
      "id": "S9",
      "title": "최종 포털 앞",
      "background": "bg/final_portal.png",
      "music": "bgm/final_choice.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "내일이면… 집으로 돌아갈 수 있을까?", "emotion": "think" },
        { "speaker": "NADAY", "text": "돌아갈 수는 있어. 하지만 잊을 순 없지.", "emotion": "calm" },
        { "speaker": "MOMAMA", "text": "남을지, 돌아갈지… 선택은 너의 몫.", "emotion": "serious" }
      ],
      "choice": {
        "prompt": "모모의 선택은?",
        "options": [
          { "label": "현실로 돌아간다", "goto": "E1" },
          { "label": "이곳에 남아 지킨다", "goto": "E2" }
        ]
      }
    },
    {
      "id": "E1",
      "title": "엔딩 — 귀환",
      "background": "bg/momo_room_evening.png",
      "music": "bgm/ending_soft.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "돌아왔다… 그런데, 하늘에 고래 구름이…?", "emotion": "wonder" },
        { "speaker": "SYS", "text": "엔딩: 귀환 — 새로운 일상이 시작됩니다." }
      ],
      "end": true
    },
    {
      "id": "E2",
      "title": "엔딩 — 잔류",
      "background": "bg/momo_room_evening.png",
      "music": "bgm/ending_bold.mp3",
      "lines": [
        { "speaker": "MOMO", "text": "이 세계… 내가 지켜줄게.", "emotion": "resolve" },
        { "speaker": "ZZ", "text": "그럼 모험은 이제부터 시작이지!", "emotion": "happy" },
        { "speaker": "SYS", "text": "엔딩: 잔류 — 추가 퀘스트가 해금되었습니다." }
      ],
      "end": true
    }
  ]
};

// 효과음 데이터
const SFX_DATA = {
  "jump": "sfx/jump.wav",
  "coin": "sfx/coin.wav",
  "enemy_hit": "sfx/enemy_hit.wav",
  "player_hit": "sfx/player_hit.wav",
  "explosion": "sfx/explosion.wav",
  "power_up": "sfx/power_up.wav",
  "stage_clear": "sfx/stage_clear.wav",
  "game_over": "sfx/game_over.wav",
  "menu_select": "sfx/menu_select.wav",
  "menu_confirm": "sfx/menu_confirm.wav",
  "portal": "sfx/portal.wav",
  "magic": "sfx/magic.wav",
  "sword": "sfx/sword.wav",
  "arrow": "sfx/arrow.wav",
  "hammer": "sfx/hammer.wav",
  "bomb": "sfx/bomb.wav"
};

// 배경음악 데이터는 audio-system.js에서 통합 관리됩니다. 