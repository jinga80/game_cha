# 🎵 효과음 (SFX) 파일 디렉토리

이 디렉토리는 게임에 사용되는 모든 효과음 파일들을 포함합니다.

## 📁 파일 목록

### 🎮 게임 액션 효과음
- `jump.wav` - 점프 효과음
- `coin.wav` - 코인 획득 효과음
- `enemy_hit.wav` - 적 처치 효과음
- `player_hit.wav` - 플레이어 피격 효과음
- `explosion.wav` - 폭발 효과음
- `power_up.wav` - 파워업 효과음
- `stage_clear.wav` - 스테이지 클리어 효과음
- `game_over.wav` - 게임 오버 효과음

### 🎯 메뉴 및 UI 효과음
- `menu_select.wav` - 메뉴 선택 효과음
- `menu_confirm.wav` - 메뉴 확인 효과음

### 🌟 특수 효과음
- `portal.wav` - 포털 효과음
- `magic.wav` - 마법 효과음
- `dash.wav` - 대시 효과음
- `landing.wav` - 착지 효과음

### ⚔️ 캐릭터별 공격 효과음
- `sword.wav` - 검 공격 효과음
- `arrow.wav` - 화살 공격 효과음
- `hammer.wav` - 망치 공격 효과음
- `bomb.wav` - 폭탄 공격 효과음

### 🏆 보스 관련 효과음
- `boss_intro.wav` - 보스 등장 효과음
- `boss_defeat.wav` - 보스 처치 효과음

## 📝 사용법

게임에서 효과음을 재생하려면:

```javascript
// 점프 효과음 재생
audioSystem.playJumpSound();

// 코인 획득 효과음 재생
audioSystem.playCoinSound();

// 캐릭터별 공격 효과음 재생
audioSystem.playSwordSound();
audioSystem.playArrowSound();
audioSystem.playHammerSound();
audioSystem.playBombSound();
```

## 🎨 효과음 제작 가이드

효과음을 제작할 때 다음 사항을 고려하세요:

1. **파일 형식**: WAV 형식 권장 (고품질)
2. **길이**: 0.1초 ~ 2초 (게임에 적합한 길이)
3. **볼륨**: 일관된 볼륨 레벨
4. **품질**: 44.1kHz, 16bit 이상 권장

## 🔧 파일 추가 시

새로운 효과음을 추가할 때는 `audio-system.js`의 `loadGameSounds()` 함수에 경로를 추가하고, 해당 재생 함수도 구현해야 합니다. 