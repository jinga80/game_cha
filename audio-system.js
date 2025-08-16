// BGM 데이터 정의 (실제 존재하는 3개 파일만)
const BGM_DATA = {
  'title': 'bgm/PUFF AND MAGIC DRAGON.m4a',
  'young_college': 'bgm/A young music college.m4a',
  'falls_rode': 'bgm/Falls rode.m4a',
  'puff_dragon': 'bgm/PUFF AND MAGIC DRAGON.m4a'
};

// 게임 오디오 시스템
class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.bgm = null;
    this.currentBGM = null;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.bgmVolume = 0.5;
    this.isMuted = false;
    
    this.init();
  }

  init() {
    this.initAudioContext();
    this.loadGameSounds();
    this.createAudioControls();
    
    // 사용자 상호작용 후 BGM 재생 가능하도록 설정
    console.log('🎵 오디오 시스템 초기화 완료!');
    console.log('💡 BGM 테스트 버튼을 클릭하여 음악을 재생하세요!');
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 사용자 상호작용으로 오디오 컨텍스트 활성화
      const activateAudio = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().then(() => {
            console.log('✅ 오디오 컨텍스트가 활성화되었습니다!');
          });
        }
      };
      
      // 클릭, 터치, 키보드 이벤트로 오디오 활성화
      document.addEventListener('click', activateAudio, { once: true });
      document.addEventListener('touchstart', activateAudio, { once: true });
      document.addEventListener('keydown', activateAudio, { once: true });
      
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  async loadGameSounds() {
    // 게임 효과음 로드
    const gameSounds = {
      'jump': 'sfx/jump.wav',
      'coin': 'sfx/coin.wav',
      'enemy_hit': 'sfx/enemy_hit.wav',
      'player_hit': 'sfx/player_hit.wav',
      'explosion': 'sfx/explosion.wav',
      'power_up': 'sfx/power_up.wav',
      'stage_clear': 'sfx/stage_clear.wav',
      'game_over': 'sfx/game_over.wav',
      'menu_select': 'sfx/menu_select.wav',
      'menu_confirm': 'sfx/menu_confirm.wav',
      'portal': 'sfx/portal.wav',
      'magic': 'sfx/magic.wav',
      'sword': 'sfx/sword.wav',
      'arrow': 'sfx/arrow.wav',
      'hammer': 'sfx/hammer.wav',
      'bomb': 'sfx/bomb.wav',
      'dash': 'sfx/dash.wav',
      'landing': 'sfx/landing.wav',
      'boss_intro': 'sfx/boss_intro.wav',
      'boss_defeat': 'sfx/boss_defeat.wav'
    };

    // CORS 오류 방지를 위한 안전 모드
    const isLocalFile = window.location.protocol === 'file:';
    
    if (isLocalFile) {
      console.log('⚠️ 로컬 파일에서 실행 중입니다. 효과음 로딩을 건너뜁니다.');
      console.log('💡 로컬 서버를 실행하여 효과음을 사용하세요: python3 -m http.server 8000');
      return;
    }

    for (const [key, path] of Object.entries(gameSounds)) {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[key] = audioBuffer;
        console.log(`✅ 효과음 로드 완료: ${key}`);
      } catch (e) {
        console.log(`⚠️ 효과음 로드 실패: ${key} - ${e.message}`);
      }
    }
  }

  createAudioControls() {
    // 오디오 컨트롤 UI 생성
    const audioControls = document.createElement('div');
    audioControls.id = 'audioControls';
    audioControls.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      z-index: 1000;
      display: none;
    `;

    audioControls.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">🎵 오디오 컨트롤</div>
      <div style="margin-bottom: 8px;">
        <label>🔊 마스터 볼륨: </label>
        <input type="range" min="0" max="1" step="0.1" value="${this.masterVolume}" 
               onchange="audioSystem.setMasterVolume(this.value)">
        <span>${Math.round(this.masterVolume * 100)}%</span>
      </div>
      <div style="margin-bottom: 8px;">
        <label>🎵 BGM 볼륨: </label>
        <input type="range" min="0" max="1" step="0.1" value="${this.bgmVolume}" 
               onchange="audioSystem.setBGMVolume(this.value)">
        <span>${Math.round(this.bgmVolume * 100)}%</span>
      </div>
      <div style="margin-bottom: 8px;">
        <label>🔊 효과음 볼륨: </label>
        <input type="range" min="0" max="1" step="0.1" value="${this.sfxVolume}" 
               onchange="audioSystem.setSFXVolume(this.value)">
        <span>${Math.round(this.sfxVolume * 100)}%</span>
      </div>
      <div style="margin-bottom: 10px;">
        <button onclick="audioSystem.toggleMute()" style="padding: 5px 10px; border-radius: 5px;">
          ${this.isMuted ? '🔇' : '🔊'} ${this.isMuted ? '음소거 해제' : '음소거'}
        </button>
      </div>
      <div style="margin-bottom: 8px;">
        <button onclick="audioSystem.playTitleBGM()" style="padding: 5px 10px; border-radius: 5px; margin-right: 5px;">
          🎵 타이틀 BGM
        </button>
        <button onclick="audioSystem.playYoungCollegeBGM()" style="padding: 5px 10px; border-radius: 5px; margin-right: 5px;">
          🎵 젊은 음악 대학
        </button>
      </div>
      <div style="margin-bottom: 8px;">
        <button onclick="audioSystem.playFallsRodeBGM()" style="padding: 5px 10px; border-radius: 5px; margin-right: 5px;">
          🎵 폭포 길
        </button>
        <button onclick="audioSystem.stopBGM()" style="padding: 5px 10px; border-radius: 5px;">
          ⏹️ BGM 중지
        </button>
      </div>
      <div style="text-align: center;">
        <button onclick="document.getElementById('audioControls').style.display='none'" 
                style="padding: 5px 15px; border-radius: 5px; background: #ff4444; color: white; border: none;">
          닫기
        </button>
      </div>
    `;

    document.body.appendChild(audioControls);

    // ESC 키로 오디오 컨트롤 토글
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const controls = document.getElementById('audioControls');
        if (controls) {
          controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
        }
      }
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteButton = document.querySelector('#audioControls button');
    if (muteButton) {
      muteButton.textContent = this.isMuted ? '🔇 음소거 해제' : '🔊 음소거';
    }
    
    if (this.isMuted) {
      this.pauseBGM();
    } else {
      this.resumeBGM();
    }
  }

  setMasterVolume(value) {
    this.masterVolume = parseFloat(value);
    this.updateVolumes();
  }

  setSFXVolume(value) {
    this.sfxVolume = parseFloat(value);
    this.updateVolumes();
  }

  setBGMVolume(value) {
    this.bgmVolume = parseFloat(value);
    this.updateVolumes();
  }

  updateVolumes() {
    if (this.bgm) {
      this.bgm.volume = this.bgmVolume * this.masterVolume * (this.isMuted ? 0 : 1);
    }
  }

  playSound(soundName, volume = 1.0) {
    if (this.sounds[soundName] && this.audioContext && !this.isMuted) {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds[soundName];
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 볼륨 설정
      gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;
      
      source.start(0);
      
      return source;
    }
    return null;
  }

  playBGM(bgmName, loop = true) {
    if (this.currentBGM === bgmName) return;
    
    this.stopBGM();
    
    const bgmPath = BGM_DATA[bgmName];
    if (bgmPath) {
      try {
        this.bgm = new Audio(bgmPath);
        this.bgm.loop = loop;
        this.bgm.volume = this.bgmVolume * this.masterVolume * (this.isMuted ? 0 : 1);
        
        // 사용자 상호작용 확인
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        this.bgm.play().catch(e => {
          console.log(`⚠️ BGM 재생 실패: ${bgmName} - ${e.message}`);
          
          if (e.name === 'NotAllowedError' || e.message.includes('user didn\'t interact')) {
            console.log('💡 사용자 상호작용이 필요합니다. BGM 테스트 버튼을 클릭해주세요!');
          } else if (e.name === 'NotAllowedError' || e.message.includes('CORS')) {
            console.log('💡 CORS 오류입니다. 로컬 서버를 실행하세요: python3 -m http.server 8000');
          }
        });
        
        this.currentBGM = bgmName;
        console.log(`🎵 BGM 재생 시작: ${bgmName}`);
      } catch (e) {
        console.log(`❌ BGM 생성 실패: ${bgmName} - ${e.message}`);
      }
    } else {
      console.log(`⚠️ BGM을 찾을 수 없습니다: ${bgmName}`);
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
      this.currentBGM = null;
    }
  }

  pauseBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  resumeBGM() {
    if (this.bgm && this.currentBGM) {
      this.bgm.play().catch(e => {
        console.log('BGM resume failed:', e);
      });
    }
  }

  // 오디오 시스템 상태 확인
  isAudioReady() {
    return this.audioContext && this.audioContext.state === 'running';
  }

  // 안전한 효과음 재생
  safePlaySound(soundName, volume = 1.0) {
    if (!this.isAudioReady()) {
      console.log(`⚠️ 오디오 시스템이 준비되지 않았습니다: ${soundName}`);
      return null;
    }
    return this.playSound(soundName, volume);
  }

  // 게임 상황별 효과음 재생
  playJumpSound() {
    this.safePlaySound('jump', 0.8);
  }

  playCoinSound() {
    this.safePlaySound('coin', 0.6);
  }

  playEnemyHitSound() {
    this.safePlaySound('enemy_hit', 0.7);
  }

  playPlayerHitSound() {
    this.safePlaySound('player_hit', 0.8);
  }

  playExplosionSound() {
    this.safePlaySound('explosion', 0.9);
  }

  playPowerUpSound() {
    this.safePlaySound('power_up', 0.7);
  }

  playStageClearSound() {
    this.safePlaySound('stage_clear', 0.8);
  }

  playGameOverSound() {
    this.safePlaySound('game_over', 0.9);
  }

  playMenuSelectSound() {
    this.safePlaySound('menu_select', 0.5);
  }

  playMenuConfirmSound() {
    this.safePlaySound('menu_confirm', 0.6);
  }

  playPortalSound() {
    this.safePlaySound('portal', 0.8);
  }

  playMagicSound() {
    this.safePlaySound('magic', 0.7);
  }

  playSwordSound() {
    this.safePlaySound('sword', 0.6);
  }

  playArrowSound() {
    this.safePlaySound('arrow', 0.5);
  }

  playHammerSound() {
    this.safePlaySound('hammer', 0.8);
  }

  playBombSound() {
    this.safePlaySound('bomb', 0.9);
  }

  playDashSound() {
    this.safePlaySound('dash', 0.4);
  }

  playLandingSound() {
    this.safePlaySound('landing', 0.5);
  }

  playBossIntroSound() {
    this.safePlaySound('boss_intro', 0.9);
  }

  playBossDefeatSound() {
    this.safePlaySound('boss_defeat', 0.9);
  }

  // 게임 상황별 배경음악 재생 (실제 파일에 맞게)
  playTitleBGM() {
    this.playBGM('title'); // PUFF AND MAGIC DRAGON
  }

  playYoungCollegeBGM() {
    this.playBGM('young_college'); // A young music college
  }

  playFallsRodeBGM() {
    this.playBGM('falls_rode'); // Falls rode
  }

  playPuffDragonBGM() {
    this.playBGM('puff_dragon'); // PUFF AND MAGIC DRAGON (별칭)
  }

  // 게임 상황별 BGM 자동 전환 (실제 파일에 맞게)
  playSituationBGM(situation) {
    switch(situation) {
      case 'title':
      case 'main_menu':
        this.playBGM('title'); // PUFF AND MAGIC DRAGON
        break;
      case 'game_start':
      case 'game_play':
        this.playBGM('young_college'); // A young music college
        break;
      case 'boss_fight':
      case 'intense_battle':
        this.playBGM('falls_rode'); // Falls rode
        break;
      case 'victory':
      case 'success':
        this.playBGM('puff_dragon'); // PUFF AND MAGIC DRAGON
        break;
      case 'game_over':
      case 'defeat':
        this.playBGM('young_college'); // A young music college
        break;
      case 'story_mode':
      case 'narrative':
        this.playBGM('falls_rode'); // Falls rode
        break;
      case 'college_theme':
      case 'academic':
        this.playBGM('young_college'); // A young music college
        break;
      case 'falls_theme':
      case 'nature':
        this.playBGM('falls_rode'); // Falls rode
        break;
      case 'dragon_theme':
      case 'epic':
        this.playBGM('puff_dragon'); // PUFF AND MAGIC DRAGON
        break;
      default:
        this.playBGM('title'); // 기본값: PUFF AND MAGIC DRAGON
    }
  }
}

// 전역 오디오 시스템 인스턴스
let audioSystem;

// 오디오 시스템 초기화
function initAudioSystem() {
  audioSystem = new AudioSystem();
  
  // 전역 변수로 노출
  window.audioSystem = audioSystem;
  
  console.log('🎵 오디오 시스템 초기화 완료!');
  console.log('✅ audioSystem이 전역에 노출되었습니다.');
}

// 게임 시작 시 오디오 시스템 활성화
function activateAudioSystem() {
  if (audioSystem && audioSystem.audioContext) {
    audioSystem.audioContext.resume();
  }
}

// 전역 BGM 제어 함수들 (실제 파일에 맞게)
window.playTitleBGM = () => {
  if (audioSystem) {
    audioSystem.playTitleBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.playYoungCollegeBGM = () => {
  if (audioSystem) {
    audioSystem.playYoungCollegeBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.playFallsRodeBGM = () => {
  if (audioSystem) {
    audioSystem.playFallsRodeBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.playPuffDragonBGM = () => {
  if (audioSystem) {
    audioSystem.playPuffDragonBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

// 상황별 BGM 자동 전환
window.playSituationBGM = (situation) => {
  if (audioSystem) {
    audioSystem.playSituationBGM(situation);
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

// BGM 제어 함수들
window.stopBGM = () => {
  if (audioSystem) {
    audioSystem.stopBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.pauseBGM = () => {
  if (audioSystem) {
    audioSystem.pauseBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.resumeBGM = () => {
  if (audioSystem) {
    audioSystem.resumeBGM();
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.setBGMVolume = (volume) => {
  if (audioSystem) {
    audioSystem.setBGMVolume(volume);
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
  }
};

window.getBGMVolume = () => {
  if (audioSystem) {
    return audioSystem.bgmVolume;
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
    return 0;
  }
};

window.isBGMPlaying = () => {
  if (audioSystem) {
    return audioSystem.currentBGM !== null;
  } else {
    console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
    return false;
  }
};

// 콘솔에 로드 완료 메시지 출력
console.log('🎵 오디오 시스템 로드 완료!');
console.log('✅ 사용 가능한 BGM 파일:');
console.log('   🎵 title: PUFF AND MAGIC DRAGON.m4a');
console.log('   🎵 young_college: A young music college.m4a');
console.log('   🎵 falls_rode: Falls rode.m4a');
console.log('   🎵 puff_dragon: PUFF AND MAGIC DRAGON.m4a (별칭)');
console.log('�� 게임에서 BGM을 즐기세요!'); 