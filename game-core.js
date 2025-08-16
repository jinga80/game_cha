// ========================================
// 게임 핵심 로직 (game-core.js) - 보스 시스템 및 대형 미사일 구현 버전
// ========================================

// 게임 상태 관리
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 5;
let currentStage = 1;
let currentPlanet = 1; // 현재 행성 (1-5)
let isFullscreen = false;
let selectedCharacter = '기본'; // 선택된 캐릭터
let gameDifficulty = '보통'; // 게임 난이도
let isDashing = false; // 대시 상태
let bossStage = false; // 보스 스테이지 여부
let bossDefeated = false; // 보스 처치 여부

// 게임 설정
const GRAVITY = 0.8;
const JUMP_POWER = 18;
const MOVE_SPEED = 6;
const DASH_SPEED = 12; // 대시 속도
const STAGE_WIDTH = 8000; // 맵 크기 대폭 증가

// 행성 테마 설정
const PLANET_THEMES = {
    1: { // 나무행성 (1-20스테이지)
        name: '🌳 나무행성',
        background: {
            sky: ['#4A90E2', '#7FB3D3', '#B8D4E3', '#E8F4F8'],
            mountains: ['#228B22', '#32CD32', '#90EE90'],
            ground: '#8B4513',
            platforms: '#228B22'
        },
        enemies: ['나무돌이', '나무왕', '포탑몬'],
        boss: '🌳 거대나무왕',
        stageRange: [1, 20]
    },
    2: { // 불꽃행성 (21-40스테이지)
        name: '🔥 불꽃행성',
        background: {
            sky: ['#FF4500', '#FF6347', '#FF7F50', '#FFA07A'],
            mountains: ['#8B0000', '#DC143C', '#FF1493'],
            ground: '#8B0000',
            platforms: '#DC143C'
        },
        enemies: ['불돌이', '불왕', '용암몬'],
        boss: '🔥 거대불왕',
        stageRange: [21, 40]
    },
    3: { // 번개행성 (41-60스테이지)
        name: '⚡ 번개행성',
        background: {
            sky: ['#4169E1', '#6495ED', '#87CEEB', '#B0E0E6'],
            mountains: ['#191970', '#483D8B', '#6A5ACD'],
            ground: '#191970',
            platforms: '#483D8B'
        },
        enemies: ['번개돌이', '번개왕', '전기몬'],
        boss: '⚡ 거대번개왕',
        stageRange: [41, 60]
    },
    4: { // 원소행성 (61-80스테이지)
        name: '🌈 원소행성',
        background: {
            sky: ['#9932CC', '#BA55D3', '#DDA0DD', '#E6E6FA'],
            mountains: ['#4B0082', '#800080', '#9370DB'],
            ground: '#4B0082',
            platforms: '#800080'
        },
        enemies: ['원소돌이', '원소왕', '마법몬'],
        boss: '🌈 거대원소왕',
        stageRange: [61, 80]
    },
    5: { // 얼음행성 (81-100스테이지)
        name: '❄️ 얼음행성',
        background: {
            sky: ['#87CEEB', '#B0E0E6', '#E0FFFF', '#F0F8FF'],
            mountains: ['#4682B4', '#5F9EA0', '#B0C4DE'],
            ground: '#4682B4',
            platforms: '#5F9EA0'
        },
        enemies: ['얼음돌이', '얼음왕', '눈사람몬'],
        boss: '❄️ 거대얼음왕',
        stageRange: [81, 100]
    }
};

// 14개 캐릭터 능력치 및 스킬 시스템
const CHARACTERS = {
    '기본': {
        name: '기본',
        emoji: '👤',
        description: '균형잡힌 능력치',
        stats: {
            health: 300,
            attack: 50,
            speed: 6,
            jumpPower: 18
        },
        specialAbility: '없음',
        specialSkill: '없음'
    },
    '검사': {
        name: '검사',
        emoji: '⚔️',
        description: '높은 공격력',
        stats: {
            health: 250,
            attack: 80,
            speed: 5,
            jumpPower: 16
        },
        specialAbility: '검기 발사',
        specialSkill: '검기 폭풍'
    },
    '궁수': {
        name: '궁수',
        emoji: '🏹',
        description: '원거리 공격',
        stats: {
            health: 200,
            attack: 60,
            speed: 7,
            jumpPower: 20
        },
        specialAbility: '화살 발사',
        specialSkill: '화살 폭풍'
    },
    '망치전문가': {
        name: '망치전문가',
        emoji: '🔨',
        description: '파괴의 달인',
        stats: {
            health: 350,
            attack: 90,
            speed: 4,
            jumpPower: 14
        },
        specialAbility: '망치 던지기',
        specialSkill: '지진'
    },
    '폭탄전문가': {
        name: '폭탄전문가',
        emoji: '💣',
        description: '폭발 전문가',
        stats: {
            health: 180,
            attack: 100,
            speed: 8,
            jumpPower: 22
        },
        specialAbility: '폭탄 설치',
        specialSkill: '폭발'
    },
    '미사일발사달인': {
        name: '미사일발사달인',
        emoji: '🚀',
        description: '정밀 타격',
        stats: {
            health: 220,
            attack: 85,
            speed: 6,
            jumpPower: 18
        },
        specialAbility: '미사일 발사',
        specialSkill: '미사일 폭격'
    },
    '풍선': {
        name: '풍선',
        emoji: '🎈',
        description: '가벼운 몸',
        stats: {
            health: 150,
            attack: 40,
            speed: 9,
            jumpPower: 25
        },
        specialAbility: '공중 부유',
        specialSkill: '풍선 폭발'
    },
    '왕': {
        name: '왕',
        emoji: '👑',
        description: '왕의 권위',
        stats: {
            health: 400,
            attack: 70,
            speed: 5,
            jumpPower: 16
        },
        specialAbility: '왕의 명령',
        specialSkill: '왕의 분노'
    },
    '스피어맨': {
        name: '스피어맨',
        emoji: '🔱',
        description: '창술 달인',
        stats: {
            health: 280,
            attack: 75,
            speed: 6,
            jumpPower: 17
        },
        specialAbility: '창 던지기',
        specialSkill: '창의 폭풍'
    },
    '어둠의마법사': {
        name: '어둠의마법사',
        emoji: '🌑',
        description: '어둠의 힘',
        stats: {
            health: 200,
            attack: 95,
            speed: 5,
            jumpPower: 15
        },
        specialAbility: '어둠의 힘',
        specialSkill: '어둠의 폭풍'
    },
    '마법사': {
        name: '마법사',
        emoji: '🔮',
        description: '마법 전문가',
        stats: {
            health: 180,
            attack: 90,
            speed: 6,
            jumpPower: 18
        },
        specialAbility: '마법 발사',
        specialSkill: '마법 폭풍'
    },
    '발키리': {
        name: '발키리',
        emoji: '🛡️',
        description: '신의 힘',
        stats: {
            health: 400,
            attack: 45,
            speed: 6,
            jumpPower: 19
        },
        specialAbility: '신의 힘',
        specialSkill: '신의 폭풍'
    },
    '방패맨': {
        name: '방패맨',
        emoji: '🛡️',
        description: '철벽 방어',
        stats: {
            health: 450,
            attack: 35,
            speed: 4,
            jumpPower: 14
        },
        specialAbility: '철벽 방어',
        specialSkill: '방패 돌진'
    },
    '거인': {
        name: '거인',
        emoji: '👹',
        description: '거대한 힘',
        stats: {
            health: 500,
            attack: 40,
            speed: 3,
            jumpPower: 12
        },
        specialAbility: '거대한 힘',
        specialSkill: '거인의 분노'
    },
    '미사일': {
        name: '미사일',
        emoji: '🚀',
        description: '초고속',
        stats: {
            health: 120,
            attack: 60,
            speed: 10,
            jumpPower: 28
        },
        specialAbility: '초고속',
        specialSkill: '초고속 돌진'
    }
};

// 난이도별 설정
const DIFFICULTY_SETTINGS = {
    '쉬움': {
        enemyHealth: 0.7,    // 적 체력 70%
        enemyDamage: 0.6,    // 적 데미지 60%
        enemySpeed: 0.8,     // 적 속도 80%
        playerHealth: 1.2,   // 플레이어 체력 120%
        lives: 7             // 생명 7개
    },
    '보통': {
        enemyHealth: 1.0,    // 적 체력 100%
        enemyDamage: 1.0,    // 적 데미지 100%
        enemySpeed: 1.0,     // 적 속도 100%
        playerHealth: 1.0,   // 플레이어 체력 100%
        lives: 5             // 생명 5개
    },
    '어려움': {
        enemyHealth: 1.3,    // 적 체력 130%
        enemyDamage: 1.4,    // 적 데미지 140%
        enemySpeed: 1.2,     // 적 속도 120%
        playerHealth: 0.8,   // 플레이어 체력 80%
        lives: 3             // 생명 3개
    }
};

// 전역 변수로 노출 (다른 파일에서 사용할 수 있도록)
window.DIFFICULTY_SETTINGS = DIFFICULTY_SETTINGS;

// 키보드 입력 상태
const keys = {};

// 게임 초기화
function initGame() {
    console.log('게임 초기화 시작...');
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 전체화면 기능 초기화
    initFullscreen();
    
    // 게임 시작
    console.log('게임 초기화 완료!');
}

// 전체화면 기능 초기화
function initFullscreen() {
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    if (fullscreenToggle) {
        fullscreenToggle.addEventListener('click', toggleFullscreen);
    }
    
    // ESC 키로 전체화면 해제
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// 전체화면 토글
function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

// 전체화면 진입
function enterFullscreen() {
    const gameContainer = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    
    if (gameContainer.requestFullscreen) {
        gameContainer.requestFullscreen();
    } else if (gameContainer.webkitRequestFullscreen) {
        gameContainer.webkitRequestFullscreen();
    } else if (gameContainer.mozRequestFullScreen) {
        gameContainer.mozRequestFullScreen();
    } else if (gameContainer.msRequestFullscreen) {
        gameContainer.msRequestFullscreen();
    }
    
    // 전체화면 모드 CSS 클래스 추가
    document.body.classList.add('fullscreen');
    isFullscreen = true;
    
    // 캔버스 크기 조정
    resizeCanvas();
    
    console.log('전체화면 모드 진입');
}

// 전체화면 해제
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    // 전체화면 모드 CSS 클래스 제거
    document.body.classList.remove('fullscreen');
    isFullscreen = false;
    
    // 캔버스 크기 조정
    resizeCanvas();
    
    console.log('전체화면 모드 해제');
}

// 전체화면 상태 변경 처리
function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
        // 전체화면이 해제된 경우
        document.body.classList.remove('fullscreen');
        isFullscreen = false;
        resizeCanvas();
        console.log('전체화면 모드 해제됨');
    }
}

// 캔버스 크기 조정
function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const gameContainer = document.getElementById('gameContainer');
    
    if (isFullscreen) {
        // 전체화면 모드: 화면 전체 크기
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
    } else {
        // 일반 모드: 1080p 비율 유지하면서 화면에 맞춤
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;
        const aspectRatio = 1920 / 1080;
        
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 키보드 이벤트
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // 게임 중이 아닐 때는 특정 키만 처리
        if (!gameRunning) {
            if (e.code === 'Enter' || e.code === 'Space') {
                startGame();
            }
            return;
        }
        
        // 게임 중 키 처리
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                jump();
                break;
            case 'KeyE':
                e.preventDefault();
                useAreaAttack();
                break;
            case 'KeyF':
                e.preventDefault();
                if (keys['ArrowUp']) {
                    shootUp(); // 위쪽으로 발사
                } else {
                    attack(); // 기본 공격
                }
                break;
            case 'KeyP':
                e.preventDefault();
                togglePause();
                break;
            case 'F11':
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        
        // 대시 키를 떼면 대시 상태 해제
        if (e.code === 'KeyS') {
            isDashing = false;
        }
    });
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', resizeCanvas);
    
    // 버튼 이벤트
    const startButton = document.getElementById('startButton');
    const controlGuideButton = document.getElementById('controlGuideButton');
    const restartButton = document.getElementById('restartButton');
    
    if (startButton) startButton.addEventListener('click', startGame);
    if (controlGuideButton) controlGuideButton.addEventListener('click', showControlGuide);
    if (restartButton) restartButton.addEventListener('click', restartGame);
}

// 게임 시작
function startGame() {
    console.log('게임 시작!');
    
    // UI 숨기기
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const characterSelectScreen = document.getElementById('characterSelectScreen');
    
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (characterSelectScreen) characterSelectScreen.style.display = 'none';
    
    // 게임 UI 표시
    const gameUI = document.getElementById('gameUI');
    if (gameUI) gameUI.style.display = 'block';
    
    // 게임 캔버스 표시
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        console.log('게임 캔버스 찾음:', gameCanvas);
        gameCanvas.style.display = 'block';
        gameCanvas.style.background = '#000'; // 검정 배경으로 초기화
        gameCanvas.style.width = '100%';
        gameCanvas.style.height = '100%';
        gameCanvas.style.maxWidth = '95vw';
        gameCanvas.style.maxHeight = '95vh';
        
        // 캔버스 컨텍스트 확인
        const ctx = gameCanvas.getContext('2d');
        if (ctx) {
            console.log('캔버스 컨텍스트 성공:', ctx);
            // 캔버스 초기화
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        } else {
            console.error('캔버스 컨텍스트 실패!');
        }
    } else {
        console.error('게임 캔버스를 찾을 수 없습니다!');
    }
    
    // 게임 상태 초기화
    gameRunning = true;
    gamePaused = false;
    score = 0;
    currentStage = 1;
    currentPlanet = 1; // 첫 번째 행성부터 시작
    bossStage = false;
    bossDefeated = false;
    
    // 난이도별 설정 적용
    const difficulty = DIFFICULTY_SETTINGS[gameDifficulty];
    lives = difficulty.lives;
    
    // 플레이어 초기화
    resetPlayer();
    
    // 카메라 초기화
    cameraX = 0;
    
    // 스테이지 생성
    generateStage();
    
    // UI 업데이트
    updateUI();
    
    // 캔버스 크기 조정
    resizeCanvas();
    
    // 첫 번째 프레임 즉시 렌더링
    renderGame();
    
    // 게임 루프 시작
    gameLoop();
    
    // 게임 배경음악 재생
    if (audioSystem && audioSystem.playGameBGM) {
        audioSystem.playGameBGM();
    }
    
    console.log('게임 시작 완료! 캔버스:', gameCanvas);
}

// 게임 재시작
function restartGame() {
    console.log('게임 재시작!');
    startGame();
}

// 게임 일시정지 토글
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    console.log(gamePaused ? '게임 일시정지' : '게임 재개');
}

// 점프 함수 (캐릭터별 능력치 적용)
function jump() {
    if (player.onGround && !player.jumping) {
        // 첫 번째 점프 (캐릭터별 점프력 적용)
        const jumpPower = player.jumpPower || JUMP_POWER;
        player.velocityY = -jumpPower;
        player.jumping = true;
        player.onGround = false;
        player.jumpCount = 1;
        
        // 점프 파티클 생성
        createParticle(player.x + player.width/2, player.y + player.height, '#87CEEB');
        
        // 점프 효과음 재생
        if (audioSystem && audioSystem.playJumpSound) {
            audioSystem.playJumpSound();
        }
        
        console.log(`${player.character} 첫 번째 점프! (점프력: ${jumpPower})`);
    } else if (player.jumping && player.jumpCount < 3) {
        // 두 번째, 세 번째 점프 (공중에서)
        const baseJumpPower = player.jumpPower || JUMP_POWER;
        const jumpPower = player.jumpCount === 2 ? baseJumpPower * 0.8 : baseJumpPower * 0.6;
        player.velocityY = -jumpPower;
        player.jumpCount++;
        
        // 점프 파티클 생성 (색상 구분)
        let particleColor;
        if (player.jumpCount === 2) {
            particleColor = '#FFD700'; // 골드
        } else {
            particleColor = '#FF4500'; // 오렌지
        }
        createParticle(player.x + player.width/2, player.y + player.height, particleColor);
        
        console.log(`${player.character} ${player.jumpCount}번째 점프! (점프력: ${jumpPower})`);
    }
}

// 플레이어 리셋
function resetPlayer() {
    player.x = 100;
    player.y = 800;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // 선택된 캐릭터의 능력치 적용
    const character = CHARACTERS[selectedCharacter];
    if (character) {
        player.character = selectedCharacter;
        player.maxHealth = character.stats.health;
        player.health = character.stats.health;
        player.attackPower = character.stats.attack;
        player.speed = character.stats.speed;
        player.jumpPower = character.stats.jumpPower;
        
        console.log(`캐릭터 ${selectedCharacter} 능력치 적용: 체력 ${character.stats.health}, 공격력 ${character.stats.attack}, 속도 ${character.stats.speed}`);
    } else {
        // 기본 능력치
        player.character = '기본';
        player.maxHealth = 300;
        player.health = 300;
        player.attackPower = 50;
        player.speed = 6;
        player.jumpPower = 18;
    }
    
    // 난이도별 능력치 조정
    const difficulty = DIFFICULTY_SETTINGS[gameDifficulty];
    player.maxHealth = Math.round(player.maxHealth * difficulty.playerHealth);
    player.health = player.maxHealth;
    
    player.attacking = false;
    player.attackCooldown = 0;
    player.invincible = false;
    player.invincibleTime = 0;
    player.projectiles = []; // 발사체 배열 초기화
    player.jumpCount = 0; // 점프 횟수 초기화
    isDashing = false; // 대시 상태 초기화
    
    // 대형 미사일 쿨다운 초기화
    player.missileCooldown = 0;
    
    // 광역 공격 쿨다운 초기화
    player.areaAttackCooldown = 0;
    
    // 화면 흔들림 효과 초기화
    player.screenShake = 0;
    
    // 무기 업그레이드 초기화
    player.weaponType = 'normal';
    player.spreadCount = 1;
    player.spreadAngle = 0;
    player.homingEnabled = false;
    player.homingRange = 0;
    player.rapidFire = false;
    player.laserEnabled = false;
    player.laserDamage = player.attackPower || 50;
    player.missileEnabled = false;
    player.missileDamage = player.attackPower || 50;
    player.missileExplosionRadius = 0;
    player.weaponUpgradeTime = 0;
}

// 위쪽 발사 함수 (F키 + 위쪽 방향키)
function shootUp() {
    // 공격 쿨다운 체크
    if (player.attackCooldown > 0) return;
    
    player.attacking = true;
    player.attackCooldown = 8; // 공격 쿨다운 (0.13초)
    
    // 발사체 생성 위치 계산 (플레이어 위쪽 중앙)
    const projectileX = player.x + player.width / 2;
    const projectileY = player.y;
    
    // 캐릭터별 발사체 타입 결정
    let projectileType = 'upward';
    let projectileDamage = player.attackPower || 50;
    
    // 특수 캐릭터별 공격 효과 (위쪽 발사 시 추가 데미지)
    if (player.character === '검사') {
        projectileType = 'upward_sword';
        projectileDamage = Math.round(projectileDamage * 1.4); // 검사는 위쪽 발사 시 40% 추가 데미지
    } else if (player.character === '궁수') {
        projectileType = 'upward_arrow';
        projectileDamage = Math.round(projectileDamage * 1.3); // 궁수는 위쪽 발사 시 30% 추가 데미지
    } else if (player.character === '망치전문가') {
        projectileType = 'upward_hammer';
        projectileDamage = Math.round(projectileDamage * 1.5); // 망치전문가는 위쪽 발사 시 50% 추가 데미지
    } else if (player.character === '폭탄전문가') {
        projectileType = 'upward_bomb';
        projectileDamage = Math.round(projectileDamage * 1.6); // 폭탄전문가는 위쪽 발사 시 60% 추가 데미지
    }
    
    // 위쪽으로 발사되는 발사체 생성
    const projectile = new UpwardProjectile(projectileX, projectileY, projectileType, projectileDamage);
    player.projectiles.push(projectile);
    
    // 위쪽 발사 파티클 생성 (캐릭터별 색상)
    let particleColor = '#FFD700'; // 기본 골드
    if (player.character === '검사') particleColor = '#FF4500'; // 빨강
    else if (player.character === '궁수') particleColor = '#00FF00'; // 초록
    else if (player.character === '망치전문가') particleColor = '#8B4513'; // 갈색
    else if (player.character === '폭탄전문가') particleColor = '#FF0000'; // 빨강
    
    // 위쪽으로 향하는 파티클 효과
    for (let i = 0; i < 8; i++) {
        createParticle(projectileX, projectileY, particleColor, 0, -3 - Math.random() * 2);
    }
    
    console.log(`${player.character} 위쪽 발사! 데미지: ${projectileDamage}, 타입: ${projectileType}`);
    
    // 위쪽 발사 효과음 재생
    if (audioSystem && audioSystem.playSwordSound) {
        audioSystem.playSwordSound();
    }
    
    // 위쪽 발사 애니메이션 효과
    createUpwardAttackEffect(projectileX, projectileY);
    
    // 공격 상태를 즉시 해제하여 연속 공격 가능하게 함
    setTimeout(() => {
        player.attacking = false;
    }, 100); // 0.1초 후 공격 상태 해제
}

// 공격 함수 (캐릭터별 공격력 적용)
function attack() {
    // 공격 쿨다운 체크
    if (player.attackCooldown > 0) return;
    
    player.attacking = true;
    player.attackCooldown = 8; // 공격 쿨다운 (0.13초)
    
    // 발사체 생성 위치 계산
    let projectileX, projectileY;
    if (player.direction > 0) {
        // 오른쪽 방향
        projectileX = player.x + player.width;
        projectileY = player.y + player.height / 2;
    } else {
        // 왼쪽 방향
        projectileX = player.x;
        projectileY = player.y + player.height / 2;
    }
    
    // 캐릭터별 발사체 타입 결정
    let projectileType = 'normal';
    let projectileDamage = player.attackPower || 50;
    
    // 특수 캐릭터별 공격 효과
    if (player.character === '검사') {
        projectileType = 'sword';
        projectileDamage = Math.round(projectileDamage * 1.2); // 검사는 20% 추가 데미지
    } else if (player.character === '궁수') {
        projectileType = 'arrow';
        projectileDamage = Math.round(projectileDamage * 1.1); // 궁수는 10% 추가 데미지
    } else if (player.character === '망치전문가') {
        projectileType = 'hammer';
        projectileDamage = Math.round(projectileDamage * 1.3); // 망치전문가는 30% 추가 데미지
    } else if (player.character === '폭탄전문가') {
        projectileType = 'bomb';
        projectileDamage = Math.round(projectileDamage * 1.4); // 폭탄전문가는 40% 추가 데미지
    }
    
    // 발사체 생성
    const projectile = new Projectile(projectileX, projectileY, player.direction, projectileType, projectileDamage);
    player.projectiles.push(projectile);
    
    // 공격 파티클 생성 (캐릭터별 색상)
    let particleColor = '#FFD700'; // 기본 골드
    if (player.character === '검사') particleColor = '#FF4500'; // 빨강
    else if (player.character === '궁수') particleColor = '#00FF00'; // 초록
    else if (player.character === '망치전문가') particleColor = '#8B4513'; // 갈색
    else if (player.character === '폭탄전문가') particleColor = '#FF0000'; // 빨강
    
    createParticle(projectileX, projectileY, particleColor);
    
    console.log(`${player.character} 공격! 데미지: ${projectileDamage}, 타입: ${projectileType}`);
    
    // 캐릭터별 공격 효과음 재생
    if (audioSystem) {
        switch (projectileType) {
            case 'sword':
                audioSystem.playSwordSound();
                break;
            case 'arrow':
                audioSystem.playArrowSound();
                break;
            case 'hammer':
                audioSystem.playHammerSound();
                break;
            case 'bomb':
                audioSystem.playBombSound();
                break;
            default:
                audioSystem.playSwordSound(); // 기본 검 효과음
        }
    }
    
    // 공격 애니메이션 효과
    createAttackEffect(projectileX, projectileY);
    
    // 공격 상태를 즉시 해제하여 연속 공격 가능하게 함
    setTimeout(() => {
        player.attacking = false;
    }, 100); // 0.1초 후 공격 상태 해제
}

// 대형 미사일 발사 함수
function fireMissile() {
    if (player.missileCooldown > 0) return;
    
    player.missileCooldown = 600; // 10초 (60fps * 10)
    
    // 미사일 생성 위치 계산
    let missileX, missileY;
    if (player.direction > 0) {
        missileX = player.x + player.width;
        missileY = player.y + player.height / 2;
    } else {
        missileX = player.x;
        missileY = player.y + player.height / 2;
    }
    
    // 대형 미사일 생성
    const missile = new Missile(missileX, missileY, player.direction);
    player.projectiles.push(missile);
    
    // 미사일 발사 파티클 생성
    for (let i = 0; i < 15; i++) {
        createParticle(missileX, missileY, '#FF4500', 
            (Math.random() - 0.5) * 8, 
            (Math.random() - 0.5) * 8);
    }
    
    console.log('대형 미사일 발사!');
}

// 공격 이펙트 생성
function createAttackEffect(x, y) {
    // 공격 시작 파티클
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const velocityX = Math.cos(angle) * 3;
        const velocityY = Math.sin(angle) * 3;
        
        createParticle(x, y, '#FFD700', velocityX, velocityY);
    }
    
    // 공격 방향 파티클
    const direction = player.direction;
    for (let i = 0; i < 5; i++) {
        const offsetX = direction * (i * 8);
        const offsetY = (Math.random() - 0.5) * 20;
        
        createParticle(
            x + offsetX, 
            y + offsetY, 
            '#FF4500', 
            direction * 6, 
            (Math.random() - 0.5) * 4
        );
    }
}

// 광역 공격 시스템 (E버튼)
function useAreaAttack() {
    // 쿨다운 체크 (5초)
    if (player.areaAttackCooldown > 0) {
        console.log(`⏰ 광역 공격 쿨다운: ${Math.ceil(player.areaAttackCooldown / 60)}초 남음`);
        return;
    }
    
    console.log('💥 광역 공격 발동!');
    
    // 광역 공격 쿨다운 설정 (5초)
    player.areaAttackCooldown = 300; // 60fps * 5초
    
    // 광역 공격 범위
    const attackRadius = 200;
    const attackDamage = 150; // 기본 공격력의 3배
    
    // 주변 적들에게 데미지 적용
    let hitCount = 0;
    enemies.forEach(enemy => {
        const distance = Math.sqrt(
            Math.pow(player.x + player.width/2 - (enemy.x + enemy.width/2), 2) +
            Math.pow(player.y + player.height/2 - (enemy.y + enemy.height/2), 2)
        );
        
        if (distance <= attackRadius) {
            // 적에게 데미지 적용
            enemy.health -= attackDamage;
            hitCount++;
            
            // 적이 죽었는지 확인
            if (enemy.health <= 0) {
                // 적 제거
                const index = enemies.indexOf(enemy);
                if (index > -1) {
                    enemies.splice(index, 1);
                    console.log(`💀 ${enemy.type} 처치!`);
                }
            } else {
                // 적 밀어내기 효과
                const pushDirection = player.x > enemy.x ? -1 : 1;
                enemy.velocityX = pushDirection * 8;
                enemy.velocityY = -5;
            }
            
            // 적 피격 파티클
            createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000');
        }
    });
    
    // 광역 공격 시각적 효과
    createAreaAttackEffect(player.x + player.width/2, player.y + player.height/2, attackRadius);
    
    // 공격 효과음 재생
    if (window.audioSystem && window.audioSystem.playExplosionSound) {
        window.audioSystem.playExplosionSound();
    }
    
    console.log(`💥 광역 공격으로 ${hitCount}마리의 적을 공격했습니다!`);
}

// 위쪽 발사 애니메이션 효과
function createUpwardAttackEffect(x, y) {
    // 위쪽으로 향하는 파티클 효과
    for (let i = 0; i < 15; i++) {
        const velocityX = (Math.random() - 0.5) * 4; // 좌우로 약간 흔들림
        const velocityY = -8 - Math.random() * 4; // 위쪽으로 강하게
        createParticle(x, y, '#FFD700', velocityX, velocityY);
    }
    
    // 위쪽 발사 빛 효과
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const velocityX = Math.cos(angle) * 3;
        const velocityY = Math.sin(angle) * 3 - 5; // 위쪽으로 약간 치우침
        createParticle(x, y, '#FF4500', velocityX, velocityY);
    }
    
    // 위쪽 발사 시 화면 흔들림 (약간)
    player.screenShake = 8;
}

// 광역 공격 시각적 효과
function createAreaAttackEffect(x, y, radius) {
    // 중심 폭발 파티클
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const velocityX = Math.cos(angle) * 8;
        const velocityY = Math.sin(angle) * 8;
        
        createParticle(x, y, '#FFD700', velocityX, velocityY);
    }
    
    // 원형 충격파 파티클
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const particleX = x + Math.cos(angle) * radius;
        const particleY = y + Math.sin(angle) * radius;
        
        createParticle(particleX, particleY, '#FF4500');
    }
    
    // 화면 흔들림 효과 (렌더링에서 처리)
    player.screenShake = 20;
}

// 파티클 생성 (향상된 버전)
function createParticle(x, y, color, velocityX = 0, velocityY = 0) {
    particles.push({
        x: x,
        y: y,
        velocityX: velocityX + (Math.random() - 0.5) * 2,
        velocityY: velocityY + (Math.random() - 0.5) * 2,
        color: color,
        life: 30 + Math.random() * 20,
        size: 3 + Math.random() * 3
    });
}

// 데미지 받기 (개선된 버전)
function takeDamage(damage) {
    // 무적 상태가 아닐 때만 데미지 받기
    if (player.invincible) {
        console.log('무적 상태로 데미지 무시!');
        return;
    }
    
    player.health -= damage;
    if (player.health < 0) player.health = 0;
    
    // 무적 상태 설정 (1초간)
    player.invincible = true;
    player.invincibleTime = 60; // 60프레임 = 1초
    
    // 데미지 파티클 생성
    createParticle(player.x + player.width/2, player.y, '#FF0000');
    
    // 화면 흔들림 효과 (렌더링에서 처리)
    
    console.log(`데미지 받음: ${damage}, 남은 생명: ${lives}`);
    
    // 체력이 0이 되면 생명 감소
    if (player.health <= 0) {
        loseLife();
    }
    
    updateUI();
}

// 체력 회복 함수
function healPlayer(amount) {
    player.health = Math.min(player.health + amount, player.maxHealth);
    
    // 회복 파티클 생성
    for (let i = 0; i < 10; i++) {
        createParticle(player.x + player.width/2, player.y, '#00FF00');
    }
    
    console.log(`체력 회복: +${amount}, 현재 체력: ${player.health}`);
    updateUI();
}

// 생명 감소
function loseLife() {
    lives--;
    console.log(`생명 감소! 남은 생명: ${lives}`);
    
    if (lives <= 0) {
        gameOver();
    } else {
        // 플레이어 위치 재설정
        resetPlayer();
        
        // 스테이지 재생성
        generateStage();
        
        updateUI();
    }
}

// 최고 점수 저장 및 불러오기
function saveHighScore(playerName, score) {
    const highScores = JSON.parse(localStorage.getItem('gameChaHighScores') || '[]');
    highScores.push({ name: playerName, score: score, date: new Date().toLocaleDateString() });
    
    // 점수순으로 정렬 (높은 점수 우선)
    highScores.sort((a, b) => b.score - a.score);
    
    // 상위 10개만 유지
    if (highScores.length > 10) {
        highScores.splice(10);
    }
    
    localStorage.setItem('gameChaHighScores', JSON.stringify(highScores));
    console.log(`🏆 최고 점수 저장: ${playerName} - ${score}점`);
}

function loadHighScores() {
    return JSON.parse(localStorage.getItem('gameChaHighScores') || '[]');
}

// 게임 오버
function gameOver() {
    console.log('게임 오버!');
    gameRunning = false;
    
    // 게임 오버 효과음 재생
    if (audioSystem && audioSystem.playGameOverSound) {
        audioSystem.playGameOverSound();
    }
    
    // 게임 배경음악 중지
    if (audioSystem && audioSystem.stopBGM) {
        audioSystem.stopBGM();
    }
    
    // 최종 점수 설정
    const finalScore = document.getElementById('finalScore');
    const finalStage = document.getElementById('finalStage');
    
    if (finalScore) finalScore.textContent = score;
    if (finalStage) finalStage.textContent = currentStage;
    
    // 최고 점수 체크 및 사용자 이름 입력
    const highScores = loadHighScores();
    const isNewHighScore = highScores.length === 0 || score > highScores[0].score;
    
    if (isNewHighScore) {
        const playerName = prompt(`🎉 새로운 최고 점수! ${score}점\n플레이어 이름을 입력해주세요:`, 'Player');
        if (playerName && playerName.trim()) {
            saveHighScore(playerName.trim(), score);
            alert(`🏆 축하합니다! ${playerName}님의 ${score}점이 최고 점수로 기록되었습니다!`);
        }
    }
    
    // 게임 오버 화면 표시
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.style.display = 'block';
}

// 컨트롤 가이드 표시
function showControlGuide() {
    const guide = `
🎮 **게임 컨트롤 가이드**

**이동:**
- A / ←: 왼쪽 이동
- D / →: 오른쪽 이동
- 스페이스바: 점프 (3단 점프 가능!)
- S: 대시 (빠른 이동)

**액션:**
- F: 무기 발사 (골드 발사체, 연속 발사!)
- E: 대형 미사일 (광역 데미지, 10초 쿨다운!)
- P: 일시정지
- F11: 전체화면 토글

**전체화면:**
- 우측 상단 ⛶ 버튼 클릭
- 또는 F11 키 사용

**게임 시스템:**
- F키로 적을 연속 공격하세요! (0.13초마다!)
- E키로 대형 미사일을 발사하세요! (광역 데미지!)
- 발사체가 적에게 맞으면 폭발 효과와 함께 데미지!
- 3단 점프로 더 높은 곳으로 이동 가능!
- S키로 대시하여 빠르게 이동!
- 적을 물리치고 코인을 모으세요!
- 스테이지 진행도가 100%가 되면 다음 스테이지로!
- 체력이 0이 되면 생명이 감소합니다
- 무적 시간 동안은 추가 데미지를 받지 않습니다
- 체력 회복 아이템을 먹어 체력을 회복하세요!

**보스 시스템:**
- 5스테이지마다 강력한 보스 등장!
- 보스를 처치하면 다음 구간으로 진행!
- 보스는 일반 적보다 훨씬 강력합니다!

**적 AI (강화됨!):**
- 플레이어가 가까우면 추적 모드로 전환 (범위 확장!)
- 중간 거리에서는 경계 모드
- 멀리 있으면 순찰 모드로 랜덤 이동
- 적들도 점프를 합니다!
- 원거리 공격 적, 폭발 적 등 다양한 적 등장!

**게임 목표:**
- 높은 점수를 기록하세요!
- 최대한 많은 스테이지를 클리어하세요!
- 연속 공격으로 적들을 물리치세요!
- 보스를 처치하여 다음 구간으로 진행하세요!
    `;
    
    alert(guide);
}

// 게임 루프
function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        // 업데이트
        updatePlayer();
        updateEnemies();
        updateCoins();
        updateProjectiles();
        updateBossProjectiles(); // 보스 미사일 업데이트 추가
        updateExplosions();
        updateParticles();
        updateStageProgress();
        
        // 렌더링
        renderGame();
    }
    
    // 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 게임 시작
console.log('게임 핵심 로직 (보스 시스템 및 대형 미사일 구현 버전) 로드 완료!'); 