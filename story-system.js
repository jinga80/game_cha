// 스토리 시스템 관리
class StorySystem {
  constructor() {
    this.currentScene = null;
    this.currentLineIndex = 0;
    this.isStoryMode = false;
    this.storyUI = null;
    this.audioContext = null;
    this.sounds = {};
    this.bgm = null;
    
    this.init();
  }

  init() {
    this.createStoryUI();
    this.initAudio();
    this.loadSounds();
  }

  createStoryUI() {
    // 스토리 UI 요소 생성
    const storyContainer = document.createElement('div');
    storyContainer.id = 'storyContainer';
    storyContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    `;

    // 배경 이미지
    const backgroundImg = document.createElement('div');
    backgroundImg.id = 'storyBackground';
    backgroundImg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      opacity: 0.7;
    `;

    // 대화창
    const dialogBox = document.createElement('div');
    dialogBox.id = 'dialogBox';
    dialogBox.style.cssText = `
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 800px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #fff;
      border-radius: 15px;
      padding: 20px;
      color: white;
      font-family: 'Arial', sans-serif;
      z-index: 1001;
    `;

    // 화자 이름
    const speakerName = document.createElement('div');
    speakerName.id = 'speakerName';
    speakerName.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: #ffd700;
      margin-bottom: 10px;
      text-align: center;
    `;

    // 대사 텍스트
    const dialogText = document.createElement('div');
    dialogText.id = 'dialogText';
    dialogText.style.cssText = `
      font-size: 16px;
      line-height: 1.5;
      text-align: center;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 진행 버튼
    const nextButton = document.createElement('button');
    nextButton.id = 'nextButton';
    nextButton.textContent = '다음';
    nextButton.style.cssText = `
      position: absolute;
      right: 20px;
      bottom: 20px;
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;

    // 선택지 컨테이너
    const choiceContainer = document.createElement('div');
    choiceContainer.id = 'choiceContainer';
    choiceContainer.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    `;

    // UI 조립
    dialogBox.appendChild(speakerName);
    dialogBox.appendChild(dialogText);
    dialogBox.appendChild(nextButton);
    dialogBox.appendChild(choiceContainer);

    storyContainer.appendChild(backgroundImg);
    storyContainer.appendChild(dialogBox);

    document.body.appendChild(storyContainer);
    this.storyUI = storyContainer;

    // 이벤트 리스너
    nextButton.addEventListener('click', () => this.nextLine());
    nextButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.nextLine();
      }
    });
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  async loadSounds() {
    // 효과음 로드
    for (const [key, path] of Object.entries(SFX_DATA)) {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[key] = audioBuffer;
      } catch (e) {
        console.log(`Failed to load sound: ${key}`);
      }
    }
  }

  playSound(soundName) {
    if (this.sounds[soundName] && this.audioContext) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.sounds[soundName];
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  playBGM(bgmName) {
    // audio-system.js의 BGM 함수 사용
    if (typeof window.playSituationBGM === 'function') {
      window.playSituationBGM(bgmName);
    } else if (typeof window.playBGM === 'function') {
      window.playBGM(bgmName);
    } else {
      console.log('⚠️ 오디오 시스템이 초기화되지 않았습니다.');
    }
  }

  startStory(sceneId = 'S1') {
    this.isStoryMode = true;
    this.currentScene = STORY_DATA.scenes.find(s => s.id === sceneId);
    this.currentLineIndex = 0;
    
    if (this.currentScene) {
      this.showStoryUI();
      this.displayCurrentLine();
      
      // 배경음악 재생
      if (this.currentScene.music) {
        this.playBGM(this.currentScene.music.replace('bgm/', '').replace('.mp3', ''));
      }
    }
  }

  showStoryUI() {
    if (this.storyUI) {
      this.storyUI.style.display = 'flex';
      
      // 배경 이미지 설정
      const backgroundImg = document.getElementById('storyBackground');
      if (backgroundImg && this.currentScene.background) {
        backgroundImg.style.backgroundImage = `url(${this.currentScene.background})`;
      }
    }
  }

  hideStoryUI() {
    if (this.storyUI) {
      this.storyUI.style.display = 'none';
    }
    this.isStoryMode = false;
  }

  displayCurrentLine() {
    if (!this.currentScene || this.currentLineIndex >= this.currentScene.lines.length) {
      this.endScene();
      return;
    }

    const line = this.currentScene.lines[this.currentLineIndex];
    const speakerName = document.getElementById('speakerName');
    const dialogText = document.getElementById('dialogText');
    const choiceContainer = document.getElementById('choiceContainer');

    // 화자 이름 설정
    if (line.speaker === 'SFX') {
      speakerName.textContent = '';
      speakerName.style.display = 'none';
    } else if (line.speaker === 'SYS') {
      speakerName.textContent = '시스템';
      speakerName.style.display = 'block';
    } else {
      const character = STORY_DATA.characters[line.speaker];
      speakerName.textContent = character ? character.name : line.speaker;
      speakerName.style.display = 'block';
    }

    // 대사 텍스트 설정
    dialogText.textContent = line.text;

    // 효과음 재생
    if (line.sfx) {
      this.playSound(line.sfx.replace('sfx/', '').replace('.wav', ''));
    }

    // 감정에 따른 텍스트 색상 변경
    if (line.emotion) {
      this.applyEmotionStyle(line.emotion);
    }

    // 선택지가 있는 경우 표시
    if (this.currentScene.choice && this.currentLineIndex === this.currentScene.lines.length - 1) {
      this.showChoices();
    } else {
      choiceContainer.style.display = 'none';
    }
  }

  applyEmotionStyle(emotion) {
    const dialogText = document.getElementById('dialogText');
    const speakerName = document.getElementById('speakerName');
    
    // 기본 스타일 초기화
    dialogText.style.color = 'white';
    speakerName.style.color = '#ffd700';
    
    switch (emotion) {
      case 'angry':
        dialogText.style.color = '#ff6b6b';
        speakerName.style.color = '#ff4444';
        break;
      case 'happy':
        dialogText.style.color = '#51cf66';
        speakerName.style.color = '#40c057';
        break;
      case 'sad':
        dialogText.style.color = '#74c0fc';
        speakerName.style.color = '#339af0';
        break;
      case 'surprise':
        dialogText.style.color = '#ffd43b';
        speakerName.style.color = '#fcc419';
        break;
      case 'curious':
        dialogText.style.color = '#da77f2';
        speakerName.style.color = '#cc5de8';
        break;
    }
  }

  showChoices() {
    const choiceContainer = document.getElementById('choiceContainer');
    choiceContainer.innerHTML = '';
    choiceContainer.style.display = 'flex';

    const choice = this.currentScene.choice;
    
    choice.options.forEach((option, index) => {
      const choiceButton = document.createElement('button');
      choiceButton.textContent = option.label;
      choiceButton.style.cssText = `
        padding: 15px 30px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;
      `;
      
      choiceButton.addEventListener('mouseenter', () => {
        choiceButton.style.background = '#45a049';
      });
      
      choiceButton.addEventListener('mouseleave', () => {
        choiceButton.style.background = '#4CAF50';
      });
      
      choiceButton.addEventListener('click', () => {
        this.makeChoice(option.goto);
      });
      
      choiceContainer.appendChild(choiceButton);
    });
  }

  makeChoice(gotoSceneId) {
    this.startStory(gotoSceneId);
  }

  nextLine() {
    this.currentLineIndex++;
    
    if (this.currentLineIndex >= this.currentScene.lines.length) {
      if (this.currentScene.choice) {
        // 선택지가 있는 경우 마지막 라인을 다시 표시
        this.currentLineIndex = this.currentScene.lines.length - 1;
        this.displayCurrentLine();
      } else if (this.currentScene.battle) {
        // 전투가 있는 경우
        this.startBattle(this.currentScene.battle);
      } else if (this.currentScene.next) {
        // 다음 씬으로 이동
        this.startStory(this.currentScene.next);
      } else if (this.currentScene.end) {
        // 엔딩
        this.endStory();
      }
    } else {
      this.displayCurrentLine();
    }
  }

  startBattle(battleData) {
    // 전투 모드로 전환
    this.hideStoryUI();
    
    // 게임 모드로 전환
    if (typeof startGame === 'function') {
      startGame();
    }
    
    // 전투 결과에 따른 다음 씬 설정
    this.battleResult = battleData;
  }

  endStory() {
    this.hideStoryUI();
    
    // 게임 모드로 전환
    if (typeof startGame === 'function') {
      startGame();
    }
  }

  // 전투 결과 처리
  handleBattleResult(victory) {
    if (this.battleResult) {
      const nextSceneId = victory ? this.battleResult.winNext : this.battleResult.loseNext;
      if (nextSceneId) {
        this.startStory(nextSceneId);
      }
    }
  }
}

// 전역 스토리 시스템 인스턴스
let storySystem;

// 스토리 시스템 초기화
function initStorySystem() {
  storySystem = new StorySystem();
}

// 스토리 시작 함수
function startStoryMode() {
  if (storySystem) {
    storySystem.startStory();
  }
} 