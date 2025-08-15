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
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 사용자 상호작용으로 오디오 컨텍스트 활성화
      document.addEventListener('click', () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
      
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

    for (const [key, path] of Object.entries(gameSounds)) {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[key] = audioBuffer;
      } catch (e) {
        console.log(`Failed to load game sound: ${key}`);
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
      border: 2px solid #fff;
      border-radius: 10px;
      padding: 15px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
      display: none;
    `;

    // 마스터 음소거 버튼
    const muteButton = document.createElement('button');
    muteButton.id = 'muteButton';
    muteButton.textContent = '🔊';
    muteButton.style.cssText = `
      width: 40px;
      height: 40px;
      background: #4CAF50;
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 20px;
      cursor: pointer;
      margin-bottom: 10px;
    `;

    // 볼륨 슬라이더들
    const masterVolumeSlider = this.createVolumeSlider('masterVolume', '마스터 볼륨', this.masterVolume);
    const sfxVolumeSlider = this.createVolumeSlider('sfxVolume', '효과음 볼륨', this.sfxVolume);
    const bgmVolumeSlider = this.createVolumeSlider('bgmVolume', '배경음악 볼륨', this.bgmVolume);

    // 이벤트 리스너
    muteButton.addEventListener('click', () => this.toggleMute());
    masterVolumeSlider.addEventListener('input', (e) => this.setMasterVolume(e.target.value));
    sfxVolumeSlider.addEventListener('input', (e) => this.setSFXVolume(e.target.value));
    bgmVolumeSlider.addEventListener('input', (e) => this.setBGMVolume(e.target.value));

    // UI 조립
    audioControls.appendChild(muteButton);
    audioControls.appendChild(masterVolumeSlider.parentElement);
    audioControls.appendChild(sfxVolumeSlider.parentElement);
    audioControls.appendChild(bgmVolumeSlider.parentElement);

    document.body.appendChild(audioControls);

    // ESC 키로 오디오 컨트롤 토글
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleAudioControls();
      }
    });
  }

  createVolumeSlider(id, label, defaultValue) {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 12px;
      margin-bottom: 5px;
      color: #ccc;
    `;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.1';
    slider.value = defaultValue;
    slider.style.cssText = `
      width: 100px;
      height: 20px;
    `;

    container.appendChild(labelElement);
    container.appendChild(slider);

    return slider;
  }

  toggleAudioControls() {
    const audioControls = document.getElementById('audioControls');
    if (audioControls) {
      audioControls.style.display = audioControls.style.display === 'none' ? 'block' : 'none';
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteButton = document.getElementById('muteButton');
    
    if (this.isMuted) {
      muteButton.textContent = '🔇';
      this.pauseBGM();
    } else {
      muteButton.textContent = '🔊';
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
      this.bgm = new Audio(bgmPath);
      this.bgm.loop = loop;
      this.bgm.volume = this.bgmVolume * this.masterVolume * (this.isMuted ? 0 : 1);
      
      this.bgm.play().catch(e => {
        console.log('BGM play failed:', e);
      });
      
      this.currentBGM = bgmName;
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

  // 게임 상황별 효과음 재생
  playJumpSound() {
    this.playSound('jump', 0.8);
  }

  playCoinSound() {
    this.playSound('coin', 0.6);
  }

  playEnemyHitSound() {
    this.playSound('enemy_hit', 0.7);
  }

  playPlayerHitSound() {
    this.playSound('player_hit', 0.8);
  }

  playExplosionSound() {
    this.playSound('explosion', 0.9);
  }

  playPowerUpSound() {
    this.playSound('power_up', 0.7);
  }

  playStageClearSound() {
    this.playSound('stage_clear', 0.8);
  }

  playGameOverSound() {
    this.playSound('game_over', 0.9);
  }

  playMenuSelectSound() {
    this.playSound('menu_select', 0.5);
  }

  playMenuConfirmSound() {
    this.playSound('menu_confirm', 0.6);
  }

  playPortalSound() {
    this.playSound('portal', 0.8);
  }

  playMagicSound() {
    this.playSound('magic', 0.7);
  }

  playSwordSound() {
    this.playSound('sword', 0.6);
  }

  playArrowSound() {
    this.playSound('arrow', 0.5);
  }

  playHammerSound() {
    this.playSound('hammer', 0.8);
  }

  playBombSound() {
    this.playSound('bomb', 0.9);
  }

  playDashSound() {
    this.playSound('dash', 0.4);
  }

  playLandingSound() {
    this.playSound('landing', 0.5);
  }

  playBossIntroSound() {
    this.playSound('boss_intro', 0.9);
  }

  playBossDefeatSound() {
    this.playSound('boss_defeat', 0.9);
  }

  // 게임 상황별 배경음악 재생
  playTitleBGM() {
    this.playBGM('title');
  }

  playGameBGM() {
    this.playBGM('game');
  }

  playBossBGM() {
    this.playBGM('boss');
  }

  playVictoryBGM() {
    this.playBGM('victory', false);
  }

  playGameOverBGM() {
    this.playBGM('game_over', false);
  }

  playStoryBGM() {
    this.playBGM('story');
  }
}

// 전역 오디오 시스템 인스턴스
let audioSystem;

// 오디오 시스템 초기화
function initAudioSystem() {
  audioSystem = new AudioSystem();
}

// 게임 시작 시 오디오 시스템 활성화
function activateAudioSystem() {
  if (audioSystem && audioSystem.audioContext) {
    audioSystem.audioContext.resume();
  }
} 