// 게임 변수들
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const characterSelectScreen = document.getElementById('characterSelect');
const stageSelect = document.getElementById('stageSelect');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const stageElement = document.getElementById('stage');
const finalScoreElement = document.getElementById('finalScore');
const finalStageElement = document.getElementById('finalStage');
const highScoreElement = document.getElementById('highScore');
const mobileControls = document.getElementById('mobileControls');
const pauseBtn = document.getElementById('pauseBtn');

let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 5;
let currentStage = 1;
let highScore = localStorage.getItem('highScore') || 0;
let selectedCharacter = '검사';
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 플레이어 객체
const player = {
    x: 100,
    y: 800, // 1080p에 맞게 Y 위치 조정
    width: 40, // 1080p에 맞게 크기 증가
    height: 40,
    velocityX: 0,
    velocityY: 0,
    jumping: false,
    onGround: false,
    character: '검사',
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    attacking: false,
    skillCooldown: 0,
    suckedEnemies: [],
    health: 300, // 기본 체력 300으로 증가
    maxHealth: 300,
    // 2단 점프 관련 속성 추가
    doubleJumpAvailable: true,
    jumpCount: 0,
    maxJumps: 2,
    // 체력 회복 관련 속성 추가
    healthRegenRate: 2, // 초당 회복량 증가
    healthRegenCooldown: 0, // 회복 쿨다운
    lastDamageTime: 0, // 마지막 데미지를 받은 시간
    // 마인크래프트 스타일 컨트롤 관련 속성
    running: false, // 달리기 상태
    crouching: false, // 앉기 상태
    inventory: [], // 인벤토리
    selectedItem: 0 // 선택된 아이템 인덱스
};

// 게임 객체들
let platforms = [];
let enemies = [];
let bosses = [];
let coins = [];
let powerUps = [];
let particles = [];
let projectiles = [];
let cameraX = 0;
let backgroundObjects = [];

// 게임 설정
const GRAVITY = 0.8;
const JUMP_POWER = 15;
const MOVE_SPEED = 5;
const STAGE_WIDTH = 5000; // 1080p에 맞게 스테이지 너비 증가

// 게임 버전 정보
const GAME_VERSION = 'v1.03';
const GAME_RELEASE_DATE = '2025년 1월';
const GAME_DEVELOPER = 'jinga80';

// 3D 시각 효과 및 밤낮 시스템
const DAY_NIGHT_CYCLE = 240; // 4분 (240초) - 밤 2분, 낮 2분
let dayNightTimer = 0;
let isNight = false;
let skyGradient = null;
let lightingIntensity = 1.0;

// 행성 테마 정보
const PLANET_THEMES = {
    '나무행성': {
        range: [1, 20],
        background: '#228B22',
        platformColor: '#8FBC8F',
        enemyColor: '#32CD32',
        boss: {
            name: '망치거인',
            health: 500,
            color: '#006400',
            attackPattern: 'hammerSmash'
        }
    },
    '불꽃행성': {
        range: [21, 40],
        background: '#8B0000',
        platformColor: '#CD5C5C',
        enemyColor: '#FF4500',
        boss: {
            name: '악마다',
            health: 800,
            color: '#DC143C',
            attackPattern: 'fireStorm'
        }
    },
    '번개행성': {
        range: [41, 60],
        background: '#191970',
        platformColor: '#4169E1',
        enemyColor: '#00BFFF',
        boss: {
            name: '번개악마다',
            health: 1000,
            color: '#00FFFF',
            attackPattern: 'lightningBolt'
        }
    },
    '원소행성': {
        range: [61, 80],
        background: '#4B0082',
        platformColor: '#9370DB',
        enemyColor: '#FF69B4',
        boss: {
            name: '원소악마다',
            health: 1200,
            color: '#FF1493',
            attackPattern: 'elementalChaos'
        }
    },
    '얼음행성': {
        range: [81, 100],
        background: '#2F4F4F',
        platformColor: '#B0C4DE',
        enemyColor: '#87CEEB',
        boss: {
            name: '얼음악마',
            health: 1500,
            color: '#00CED1',
            attackPattern: 'iceAge'
        }
    }
};

// 현재 행성 테마 가져오기
function getCurrentPlanetTheme() {
    for (const [planetName, theme] of Object.entries(PLANET_THEMES)) {
        if (currentStage >= theme.range[0] && currentStage <= theme.range[1]) {
            return { planetName, ...theme };
        }
    }
    return PLANET_THEMES['나무행성']; // 기본값
}

// 캐릭터 정보 (커비 스타일 게임용)
const characters = {
    '검사': { 
        hp: 120, 
        cp: 35, 
        energy: 25, 
        color: '#4a90e2', 
        special: '검',
        ability: '검술마스터',
        description: '강력한 검술로 적을 물리치는 전사',
        jumpPower: 15,
        moveSpeed: 1.0,
        attackPower: 25,
        skillType: '검기'
    },
    '궁수': { 
        hp: 100, 
        cp: 45, 
        energy: 30, 
        color: '#e74c3c', 
        special: '활',
        ability: '정밀사격',
        description: '정확한 화살로 적을 제거하는 궁수',
        jumpPower: 18,
        moveSpeed: 1.1,
        attackPower: 20,
        skillType: '화살폭풍'
    },
    '망치전문가': { 
        hp: 150, 
        cp: 50, 
        energy: 35, 
        color: '#8b4513', 
        special: '망치',
        ability: '파괴의달인',
        description: '거대한 망치로 모든 것을 부수는 힘의 소유자',
        jumpPower: 12,
        moveSpeed: 0.9,
        attackPower: 40,
        skillType: '지진'
    },
    '폭탄전문가': { 
        hp: 110, 
        cp: 60, 
        energy: 40, 
        color: '#ff4500', 
        special: '폭탄',
        ability: '폭발전문가',
        description: '폭발적인 위력으로 적을 제거하는 전문가',
        jumpPower: 16,
        moveSpeed: 1.0,
        attackPower: 35,
        skillType: '폭발'
    },
    '미사일발사달인': { 
        hp: 90, 
        cp: 70, 
        energy: 45, 
        color: '#ff6347', 
        special: '미사일',
        ability: '정밀타격',
        description: '정밀한 미사일로 원거리 적을 제거',
        jumpPower: 14,
        moveSpeed: 1.2,
        attackPower: 30,
        skillType: '미사일폭격'
    },
    '풍선': { 
        hp: 80, 
        cp: 30, 
        energy: 50, 
        color: '#ff69b4', 
        special: '풍선',
        ability: '가벼운몸',
        description: '가벼운 몸으로 높이 점프하는 특수 캐릭터',
        jumpPower: 25,
        moveSpeed: 1.3,
        attackPower: 15,
        skillType: '풍선폭발'
    },
    '왕': { 
        hp: 200, 
        cp: 80, 
        energy: 60, 
        color: '#ffd700', 
        special: '왕관',
        ability: '왕의권위',
        description: '왕의 권위로 모든 적을 압도하는 지배자',
        jumpPower: 13,
        moveSpeed: 0.8,
        attackPower: 45,
        skillType: '왕의명령'
    },
    '스피어맨': { 
        hp: 130, 
        cp: 55, 
        energy: 40, 
        color: '#32cd32', 
        special: '창',
        ability: '창술달인',
        description: '긴 창으로 적을 찌르는 창술의 달인',
        jumpPower: 16,
        moveSpeed: 1.1,
        attackPower: 30,
        skillType: '창의폭풍'
    },
    '어둠의마법사': { 
        hp: 140, 
        cp: 100, 
        energy: 80, 
        color: '#4b0082', 
        special: '어둠',
        ability: '어둠의힘',
        description: '어둠의 힘으로 적을 소멸시키는 마법사',
        jumpPower: 14,
        moveSpeed: 1.0,
        attackPower: 35,
        skillType: '어둠의폭풍'
    },
    '마법사': { 
        hp: 160, 
        cp: 90, 
        energy: 70, 
        color: '#9370db', 
        special: '마법',
        ability: '마법전문가',
        description: '강력한 마법으로 적을 제거하는 현자',
        jumpPower: 15,
        moveSpeed: 1.0,
        attackPower: 40,
        skillType: '마법폭풍'
    },
    '발키리': { 
        hp: 180, 
        cp: 75, 
        energy: 65, 
        color: '#ff1493', 
        special: '날개',
        ability: '신의힘',
        description: '신의 힘을 받은 전사, 날개로 하늘을 날아다님',
        jumpPower: 20,
        moveSpeed: 1.2,
        attackPower: 35,
        skillType: '신의폭풍'
    },
    '방패맨': { 
        hp: 200, 
        cp: 40, 
        energy: 45, 
        color: '#a0522d', 
        special: '방패',
        ability: '철벽방어',
        description: '강력한 방패로 모든 공격을 막아내는 방어의 달인',
        jumpPower: 12,
        moveSpeed: 0.9,
        attackPower: 25,
        skillType: '방패돌진'
    },
    '거인': { 
        hp: 250, 
        cp: 60, 
        energy: 55, 
        color: '#696969', 
        special: '거대',
        ability: '거대한힘',
        description: '거대한 몸집으로 모든 것을 압도하는 거인',
        jumpPower: 10,
        moveSpeed: 0.7,
        attackPower: 50,
        skillType: '거인의분노'
    },
    '미사일': { 
        hp: 60, 
        cp: 85, 
        energy: 90, 
        color: '#ff0000', 
        special: '미사일',
        ability: '초고속',
        description: '초고속으로 적을 관통하는 미사일 캐릭터',
        jumpPower: 22,
        moveSpeed: 1.5,
        attackPower: 45,
        skillType: '초고속돌진'
    }
}; 

// 마인크래프트 스타일 모바일 컨트롤 설정
function setupMobileControls() {
    // 이동 컨트롤 (WASD 스타일)
    const moveUpBtn = document.getElementById('moveUp');
    const moveLeftBtn = document.getElementById('moveLeft');
    const moveRightBtn = document.getElementById('moveRight');
    const moveDownBtn = document.getElementById('moveDown');
    
    // 액션 컨트롤
    const jumpBtn = document.getElementById('jump');
    const attackBtn = document.getElementById('attack');
    const skillBtn = document.getElementById('skill');
    const suckBtn = document.getElementById('suck');
    const runBtn = document.getElementById('run');
    const interactBtn = document.getElementById('interact');
    
    // 이동 컨트롤 이벤트
    if (moveUpBtn) {
        moveUpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jump();
        });
    }
    
    if (moveLeftBtn) {
        moveLeftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.velocityX = -MOVE_SPEED;
            player.direction = -1;
        });
        moveLeftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (player.velocityX < 0) {
                player.velocityX = 0;
            }
        });
    }
    
    if (moveRightBtn) {
        moveRightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.velocityX = MOVE_SPEED;
            player.direction = 1;
        });
        moveRightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (player.velocityX > 0) {
                player.velocityX = 0;
            }
        });
    }
    
    if (moveDownBtn) {
        moveDownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // 앉기 기능 (선택사항)
        });
    }
    
    // 액션 컨트롤 이벤트
    if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jump();
        });
    }
    
    if (attackBtn) {
        attackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            attack();
        });
    }
    
    if (skillBtn) {
        skillBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            useSkill();
        });
    }
    
    if (suckBtn) {
        suckBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            suckEnemy();
        });
    }
    
    if (runBtn) {
        runBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.running = true;
        });
        runBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            player.running = false;
        });
    }
    
    if (interactBtn) {
        interactBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            useSkill();
        });
    }
}

// 마인크래프트 스타일 키보드 컨트롤 설정
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.code) {
            // 이동 컨트롤 (WASD)
            case 'KeyW': // W키 - 점프
            case 'Space': // 스페이스바 - 점프
                e.preventDefault();
                jump();
                break;
            case 'KeyA': // A키 - 왼쪽 이동
                e.preventDefault();
                player.velocityX = -MOVE_SPEED;
                player.direction = -1;
                break;
            case 'KeyS': // S키 - 앉기/내려가기
                e.preventDefault();
                // 앉기 기능 (선택사항)
                break;
            case 'KeyD': // D키 - 오른쪽 이동
                e.preventDefault();
                player.velocityX = MOVE_SPEED;
                player.direction = 1;
                break;
            
            // 액션 컨트롤
            case 'KeyE': // E키 - 상호작용/아이템 사용
                e.preventDefault();
                useSkill();
                break;
            case 'KeyQ': // Q키 - 아이템 버리기/적 흡수
                e.preventDefault();
                suckEnemy();
                break;
            case 'KeyF': // F키 - 공격
                e.preventDefault();
                attack();
                break;
            case 'KeyR': // R키 - 달리기 (이동 속도 증가)
                e.preventDefault();
                player.running = true;
                break;
            
            // 기타 컨트롤
            case 'KeyC': // C키 - 캐릭터 정보
                e.preventDefault();
                toggleCharacterInfo();
                break;
            case 'KeyI': // I키 - 인벤토리 (선택사항)
                e.preventDefault();
                toggleInventory();
                break;
            case 'KeyM': // M키 - 맵 (선택사항)
                e.preventDefault();
                toggleMap();
                break;
            case 'Escape': // ESC키 - 일시정지/메뉴
                e.preventDefault();
                togglePause();
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.code) {
            case 'KeyA': // A키 - 왼쪽 이동 중지
                if (player.velocityX < 0) {
                    player.velocityX = 0;
                }
                break;
            case 'KeyD': // D키 - 오른쪽 이동 중지
                if (player.velocityX > 0) {
                    player.velocityX = 0;
                }
                break;
            case 'KeyR': // R키 - 달리기 중지
                player.running = false;
                break;
        }
    });
}

// 점프 함수
function jump() {
    if (!gameRunning || gamePaused) return;
    
    // 2단 점프 시스템: 바닥에 있거나 공중에서 점프 가능할 때
    if (player.onGround || (player.jumpCount < player.maxJumps && player.doubleJumpAvailable)) {
        const char = characters[player.character];
        const jumpPower = char ? char.jumpPower : 15;
        
        // 2단 점프일 때는 점프력 감소
        let finalJumpPower = jumpPower;
        if (player.jumpCount > 0) {
            finalJumpPower = jumpPower * 0.7; // 2단 점프는 70% 점프력
        }
        
        player.velocityY = -finalJumpPower;
        player.jumping = true;
        player.onGround = false;
        player.jumpCount++;
        
        // 점프 파티클 효과
        createJumpParticles();
        
        // 캐릭터별 특별한 점프 효과
        if (char && char.ability === '가벼운몸') {
            // 풍선 캐릭터는 더 부드러운 점프
            player.velocityY *= 0.8;
        } else if (char && char.ability === '거대한힘') {
            // 거인은 점프할 때 화면 흔들림 효과
            createScreenShake();
        }
        
        console.log('점프 성공! 점프 횟수:', player.jumpCount, '캐릭터:', player.character, '점프력:', finalJumpPower, '이동속도:', player.velocityX, '위치:', player.x, player.y);
    } else {
        console.log('점프 실패: 점프 횟수 초과, jumpCount:', player.jumpCount, 'maxJumps:', player.maxJumps, 'onGround:', player.onGround);
    }
}

// 공격 함수
function attack() {
    if (!gameRunning || gamePaused || player.attacking) return;
    
    player.attacking = true;
    
    // 공격 범위 계산
    const attackRange = 50;
    const attackX = player.direction > 0 ? player.x + player.width : player.x - attackRange;
    const attackWidth = attackRange;
    
    // 적 공격
    enemies.forEach(enemy => {
        if (enemy.x < attackX + attackWidth &&
            enemy.x + enemy.width > attackX &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            
            // 적 체력 감소
            enemy.health -= 20;
            
            // 공격 효과
            createHitEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            
            // 적을 밀어내기
            if (player.direction > 0) {
                enemy.x += 30;
            } else {
                enemy.x -= 30;
            }
            
            // 적이 죽었는지 확인
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
                createCoinEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            }
        }
    });
    
    // 보스 공격
    bosses.forEach(boss => {
        if (boss.x < attackX + attackWidth &&
            boss.x + boss.width > attackX &&
            boss.y < player.y + player.height &&
            boss.y + boss.height > player.y) {
            
            // 보스 체력 감소
            boss.health -= 15;
            
            // 공격 효과
            createHitEffect(boss.x + boss.width/2, boss.y + boss.height/2);
            
            // 보스가 죽었는지 확인
            if (boss.health <= 0) {
                boss.dead = true;
                score += 500;
                createCoinEffect(boss.x + boss.width/2, boss.y + boss.height/2);
            }
        }
    });
    
    // 공격 애니메이션 종료
    setTimeout(() => {
        player.attacking = false;
    }, 300);
}

// 스킬 사용 함수
function useSkill() {
    if (!gameRunning || gamePaused || player.skillCooldown > 0) return;
    
    const char = characters[player.character];
    if (!char) return;
    
    player.skillCooldown = 60; // 1초 쿨다운
    
    // 캐릭터별 스킬 효과
    switch(char.skillType) {
        case '검기':
            createSwordWave();
            break;
        case '화살폭풍':
            createArrowStorm();
            break;
        case '지진':
            createEarthquake();
            break;
        case '폭발':
            createExplosion();
            break;
        case '미사일폭격':
            createMissileBarrage();
            break;
        case '풍선폭발':
            createBalloonBurst();
            break;
        case '왕의명령':
            createKingsCommand();
            break;
        case '창의폭풍':
            createSpearStorm();
            break;
        case '어둠의폭풍':
            createDarkStorm();
            break;
        case '마법폭풍':
            createMagicStorm();
            break;
        case '신의폭풍':
            createDivineStorm();
            break;
        case '방패돌진':
            createShieldRush();
            break;
        case '거인의분노':
            createGiantsRage();
            break;
        case '초고속돌진':
            createSpeedRush();
            break;
    }
    
    console.log('스킬 사용!', char.skillType);
}

// 적 흡수 함수 (커비 스타일)
function suckEnemy() {
    if (!gameRunning || gamePaused) return;
    
    const suckRange = 60;
    let sucked = false;
    
    enemies.forEach(enemy => {
        if (!enemy.dead && !enemy.sucked) {
            const distance = Math.abs(enemy.x - player.x);
            if (distance < suckRange) {
                enemy.sucked = true;
                enemy.velocityX = (player.x - enemy.x) * 0.1;
                enemy.velocityY = (player.y - enemy.y) * 0.1;
                
                // 적이 플레이어에게 흡수되는 애니메이션
                if (Math.abs(enemy.x - player.x) < 10 && Math.abs(enemy.y - player.y) < 10) {
                    enemy.dead = true;
                    player.suckedEnemies.push(enemy.type);
                    score += 200;
                    createSuckEffect(player.x, player.y);
                    sucked = true;
                }
            }
        }
    });
    
    if (sucked) {
        console.log('적 흡수! 흡수된 적:', player.suckedEnemies);
    }
} 

// 스테이지 생성 함수
function generateStage() {
    console.log('스테이지 생성 시작');
    
    platforms = [];
    enemies = [];
    bosses = [];
    coins = [];
    powerUps = [];
    backgroundObjects = [];
    
    const theme = getCurrentPlanetTheme();
    
    // 기본 바닥 플랫폼 (완전한 평지) - 1080p에 맞게 조정
    const groundLevel = canvas.height - 150; // 1080p에 맞게 조정
    
    console.log('지면 레벨:', groundLevel);
    
    // 메인 바닥 플랫폼 (전체 너비)
    platforms.push({
        x: 0,
        y: groundLevel,
        width: STAGE_WIDTH,
        height: 150, // 1080p에 맞게 높이 증가
        type: 'ground'
    });
    
    // 중간중간 언덕 추가 (낙사 방지) - 1080p에 맞게 조정
    const hillPositions = [500, 1200, 2000, 2800, 3600, 4400];
    hillPositions.forEach(x => {
        // 언덕 높이 (낙사 방지용)
        platforms.push({
            x: x - 80,
            y: groundLevel - 100, // 1080p에 맞게 조정
            width: 160,
            height: 100,
            type: 'hill'
        });
        
        // 언덕 위 작은 플랫폼
        platforms.push({
            x: x - 50,
            y: groundLevel - 130,
            width: 100,
            height: 30,
            type: 'platform'
        });
    });
    
    // 중간 높이 플랫폼들 (점프로 도달 가능) - 1080p에 맞게 조정
    const midPlatforms = [800, 1600, 2400, 3200, 4000];
    midPlatforms.forEach(x => {
        platforms.push({
            x: x,
            y: groundLevel - 200, // 1080p에 맞게 조정
            width: 120,
            height: 30,
            type: 'mid-platform'
        });
    });
    
    // 높은 플랫폼들 (2단 점프로 도달 가능) - 1080p에 맞게 조정
    const highPlatforms = [1000, 1800, 2600, 3400, 4200];
    highPlatforms.forEach(x => {
        platforms.push({
            x: x,
            y: groundLevel - 300, // 1080p에 맞게 조정
            width: 100,
            height: 30,
            type: 'high-platform'
        });
    });
    
    // 적 생성 (언덕과 플랫폼 위에 배치) - 1080p에 맞게 조정
    const enemyPositions = [];
    
    if (isNight) {
        // 밤에는 나무왕과 포탑몬만 등장
        enemyPositions.push(
            {x: 600, y: groundLevel - 130, type: '나무왕'},
            {x: 1400, y: groundLevel - 200, type: '포탑몬'},
            {x: 2200, y: groundLevel - 130, type: '나무왕'},
            {x: 3000, y: groundLevel - 200, type: '포탑몬'},
            {x: 3800, y: groundLevel - 300, type: '나무왕'},
            {x: 4600, y: groundLevel - 130, type: '포탑몬'}
        );
    } else {
        // 낮에는 나무돌이만 등장
        enemyPositions.push(
            {x: 600, y: groundLevel - 130, type: '나무돌이'},
            {x: 1400, y: groundLevel - 200, type: '나무돌이'},
            {x: 2200, y: groundLevel - 130, type: '나무돌이'},
            {x: 3000, y: groundLevel - 200, type: '나무돌이'},
            {x: 3800, y: groundLevel - 300, type: '나무돌이'},
            {x: 4600, y: groundLevel - 130, type: '나무돌이'}
        );
    }
    
    enemyPositions.forEach(pos => {
        enemies.push(createEnemy(pos.x, pos.y, pos.type));
    });
    
    // 보스 생성 (스테이지 끝에) - 1080p에 맞게 조정
    if (currentStage % 20 === 0) {
        const bossType = theme.bossType;
        bosses.push({
            x: STAGE_WIDTH - 300,
            y: groundLevel - 150,
            width: 120, // 1080p에 맞게 크기 증가
            height: 120,
            health: 300, // 1080p에 맞게 체력 증가
            maxHealth: 300,
            type: bossType,
            phase: 1,
            attackCooldown: 0,
            direction: -1
        });
    }
    
    // 코인 생성 (플랫폼 위에) - 1080p에 맞게 조정
    const coinPositions = [700, 1500, 2300, 3100, 3900];
    coinPositions.forEach(x => {
        coins.push({
            x: x,
            y: groundLevel - 250,
            width: 30, // 1080p에 맞게 크기 증가
            height: 30,
            collected: false
        });
    });
    
    // 파워업 생성 - 1080p에 맞게 조정
    const powerUpPositions = [900, 1700, 2500, 3300, 4100];
    powerUpPositions.forEach(x => {
        powerUps.push({
            x: x,
            y: groundLevel - 350,
            width: 35, // 1080p에 맞게 크기 증가
            height: 35,
            type: 'health',
            collected: false
        });
    });
    
    // 배경 오브젝트 생성 - 1080p에 맞게 조정
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * STAGE_WIDTH;
        const y = groundLevel - Math.random() * 100;
        const type = getBackgroundObjectType(theme);
        backgroundObjects.push({
            x: x,
            y: y,
            width: 40 + Math.random() * 30, // 1080p에 맞게 크기 증가
            height: 40 + Math.random() * 30,
            type: type
        });
    }
    
    console.log('스테이지 생성 완료');
    console.log('플랫폼 수:', platforms.length);
    console.log('적 수:', enemies.length);
    console.log('보스 수:', bosses.length);
}

// 행성별 적 타입 생성
function getRandomEnemyType(planetName) {
    const enemyTypes = {
        '나무행성': ['나무정령', '풀괴물', '자연의수호자', '숲의악마'],
        '불꽃행성': ['불정령', '용암거인', '화염악마', '열정의수호자'],
        '번개행성': ['번개정령', '전기구름', '번개의악마', '속도의수호자'],
        '원소행성': ['원소정령', '혼돈의구체', '원소악마', '균형의수호자'],
        '얼음행성': ['얼음정령', '서리거인', '얼음악마', '냉기의수호자']
    };
    
    const types = enemyTypes[planetName] || enemyTypes['나무행성'];
    return types[Math.floor(Math.random() * types.length)];
}

// 배경 오브젝트 타입 반환
function getBackgroundObjectType(theme) {
    const types = ['tree', 'rock', 'bush', 'flower'];
    return types[Math.floor(Math.random() * types.length)];
}

// 다음 스테이지로 진행
function nextStage() {
    currentStage++;
    score += 500; // 스테이지 클리어 보너스
    
    if (currentStage > 100) {
        // 게임 클리어!
        gameClear();
        return;
    }
    
    // 새로운 스테이지 생성
    generateStage();
    
    // 플레이어 위치 초기화
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // UI 업데이트
    updateUI();
    
    console.log(`스테이지 ${currentStage} 시작!`);
}

// 게임 클리어
function gameClear() {
    gameRunning = false;
    alert('🎉 축하합니다! 모든 스테이지를 클리어했습니다! 🎉');
    showCharacterSelect();
}

// 보스 공격 패턴
function updateBosses() {
    bosses.forEach(boss => {
        if (boss.dead) return;
        
        boss.attackCooldown--;
        
        if (boss.attackCooldown <= 0) {
            // 보스 공격 패턴 실행
            executeBossAttack(boss);
            boss.attackCooldown = 120; // 2초 쿨다운
        }
        
        // 보스 이동
        if (Math.abs(boss.x - player.x) > 100) {
            boss.velocityX = (player.x - boss.x) * 0.02;
        }
        
        boss.x += boss.velocityX;
        boss.y += boss.velocityY;
        
        // 보스 체력이 50% 이하일 때 2단계
        if (boss.health < boss.maxHealth * 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.attackCooldown = 0;
            console.log(`${boss.type} 2단계 진입!`);
        }
    });
}

// 보스 공격 패턴 실행
function executeBossAttack(boss) {
    switch(boss.attackPattern) {
        case 'hammerSmash':
            // 망치 거인: 망치로 땅을 내려쳐 충격파 생성
            createShockwave(boss.x, boss.y + boss.height);
            break;
        case 'fireStorm':
            // 악마다: 불꽃 폭풍으로 화면 전체 공격
            createFireStorm();
            break;
        case 'lightningBolt':
            // 번개 악마다: 번개 공격
            createLightningBolt(boss.x, boss.y);
            break;
        case 'elementalChaos':
            // 원소 악마다: 모든 속성 공격
            createElementalChaos();
            break;
        case 'iceAge':
            // 얼음 악마: 얼음 폭풍
            createIceStorm();
            break;
    }
}

// 보스 공격 효과들
function createShockwave(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + (i - 5) * 30,
            y: y + 20,
            vx: (i - 5) * 2,
            vy: -5,
            life: 40,
            color: '#8B4513'
        });
    }
}

function createFireStorm() {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 60,
            color: '#FF4500'
        });
    }
}

function createLightningBolt(x, y) {
    projectiles.push({
        x: x,
        y: y,
        vx: (player.x - x) * 0.1,
        vy: (player.y - y) * 0.1,
        width: 20,
        height: 20,
        damage: 40,
        life: 30,
        type: 'lightning'
    });
}

function createElementalChaos() {
    const colors = ['#FF4500', '#00BFFF', '#32CD32', '#9370DB'];
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 50,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function createIceStorm() {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1,
            life: 80,
            color: '#87CEEB'
        });
    }
} 

// 게임 업데이트 함수들
function updatePlayer() {
    // 중력 적용
    player.velocityY += GRAVITY;
    
    // 달리기 상태에 따른 이동 속도 계산
    let currentMoveSpeed = MOVE_SPEED;
    if (player.running) {
        currentMoveSpeed = MOVE_SPEED * 1.5; // 달리기 시 1.5배 속도
    }
    
    // 플레이어 이동
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // 경계 체크
    if (player.x < 0) player.x = 0;
    if (player.x > STAGE_WIDTH - player.width) player.x = STAGE_WIDTH - player.width;
    
    // 플랫폼 충돌 검사
    let onGround = false;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y < platform.y + platform.height) {
            
            if (player.velocityY > 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                onGround = true;
                player.jumpCount = 0; // 착지 시 점프 횟수 초기화
                player.doubleJumpAvailable = true;
            }
        }
    });
    
    player.onGround = onGround;
    
    // 스킬 쿨다운 감소
    if (player.skillCooldown > 0) {
        player.skillCooldown--;
    }
    
    // 2단 점프 가능 여부 관리
    if (player.onGround) {
        player.doubleJumpAvailable = true;
    }
    
    // 점프 상태 관리
    if (player.velocityY > 0) {
        player.jumping = true;
    }
}

// 적 업데이트
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.health <= 0) {
            enemy.dead = true;
            return;
        }
        
        // 중력 적용
        enemy.velocityY += GRAVITY;
        enemy.y += enemy.velocityY;
        
        // 플랫폼 충돌 검사
        let onGround = false;
        platforms.forEach(platform => {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y + enemy.height > platform.y &&
                enemy.y < platform.y + platform.height) {
                
                if (enemy.velocityY > 0) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velocityY = 0;
                    onGround = true;
                }
            }
        });
        enemy.onGround = onGround;
        
        // 타입별 행동 패턴
        switch(enemy.type) {
            case '나무돌이':
                // 좌우 이동
                enemy.velocityX = enemy.direction * enemy.moveSpeed;
                enemy.x += enemy.velocityX;
                
                // 방향 전환 (플랫폼 끝에 도달하면)
                if (enemy.x <= 0 || enemy.x + enemy.width >= STAGE_WIDTH) {
                    enemy.direction *= -1;
                }
                break;
                
            case '나무왕':
                // 느리게 좌우 이동
                enemy.velocityX = enemy.direction * enemy.moveSpeed;
                enemy.x += enemy.velocityX;
                
                // 방향 전환
                if (enemy.x <= 0 || enemy.x + enemy.width >= STAGE_WIDTH) {
                    enemy.direction *= -1;
                }
                
                // 공격 쿨다운 감소
                if (enemy.attackCooldown > 0) {
                    enemy.attackCooldown--;
                }
                break;
                
            case '포탑몬':
                // 제자리에 고정, 공격만
                if (enemy.attackCooldown > 0) {
                    enemy.attackCooldown--;
                }
                break;
        }
        
        // 플레이어와의 충돌 검사
        if (enemy.x < player.x + player.width &&
            enemy.x + enemy.width > player.x &&
            enemy.y < player.y + player.height &&
            enemy.y + enemy.height > player.y) {
            
            // 플레이어가 공격 중이 아니라면 데미지
            if (!player.attacking) {
                player.health -= enemy.attackPower;
                player.lastDamageTime = Date.now();
                createHitEffect(player.x, player.y);
                
                // 플레이어를 밀어내기
                if (player.x < enemy.x) {
                    player.x -= 20;
                } else {
                    player.x += 20;
                }
            }
        }
    });
    
    // 죽은 적 제거
    enemies = enemies.filter(enemy => !enemy.dead);
}

// 코인 업데이트
function updateCoins() {
    coins.forEach(coin => {
        if (!coin.collected && 
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            score += coin.value;
            createCoinEffect(coin.x, coin.y);
        }
    });
}

// 파워업 업데이트
function updatePowerUps() {
    powerUps.forEach(powerUp => {
        if (!powerUp.collected && 
            player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y) {
            
            powerUp.collected = true;
            if (powerUp.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 50);
            }
            createPowerUpEffect(powerUp.x, powerUp.y);
        }
    });
}

// 파티클 업데이트
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
    });
}

// 투사체 업데이트
function updateProjectiles() {
    projectiles = projectiles.filter(projectile => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;
        
        // 적과의 충돌 체크
        enemies.forEach(enemy => {
            if (!enemy.dead &&
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y) {
                
                enemy.health -= projectile.damage;
                if (enemy.health <= 0) {
                    enemy.dead = true;
                    score += 150;
                }
                createHitEffect(enemy.x, enemy.y);
                return false; // 투사체 제거
            }
        });
        
        return projectile.life > 0;
    });
}

// 카메라 업데이트
function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    cameraX = Math.max(0, Math.min(targetX, STAGE_WIDTH - canvas.width));
}

// 스테이지 클리어 체크
function checkStageClear() {
    const allEnemiesDead = enemies.every(enemy => enemy.dead);
    const allBossesDead = bosses.every(boss => boss.dead);
    
    if (allEnemiesDead && allBossesDead) {
        setTimeout(() => {
            nextStage();
        }, 1000);
    }
}

// 효과 생성 함수들
function createJumpParticles() {
    const char = characters[player.character];
    const particleCount = char && char.ability === '신의힘' ? 8 : 5;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            life: 30,
            color: char ? char.color : '#fff'
        });
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 20 - 10,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 20,
            color: '#ff0000'
        });
    }
}

function createSuckEffect(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + Math.random() * 30 - 15,
            y: y + Math.random() * 30 - 15,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 40,
            color: '#00ffff'
        });
    }
}

function createCoinEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 3 - 2,
            life: 25,
            color: '#ffd700'
        });
    }
}

function createPowerUpEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 35,
            color: '#ff69b4'
        });
    }
}

// 화면 흔들림 효과
function createScreenShake() {
    canvas.style.transform = 'translate(2px, 2px)';
    setTimeout(() => {
        canvas.style.transform = 'translate(-2px, -2px)';
        setTimeout(() => {
            canvas.style.transform = 'translate(0, 0)';
        }, 50);
    }, 50);
} 

// 렌더링 함수
function render() {
    const ctx = canvas.getContext('2d');
    
    // 3D 하늘 그라데이션 렌더링
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 구름 렌더링 (낮에만)
    if (!isNight) {
        renderClouds();
    }
    
    // 별 렌더링 (밤에만)
    if (isNight) {
        renderStars();
    }
    
    // 태양/달 렌더링
    renderCelestialBody();
    
    // 배경 오브젝트 렌더링 (조명 효과 적용)
    backgroundObjects.forEach(obj => {
        if (obj.x > cameraX - 50 && obj.x < cameraX + canvas.width + 50) {
            renderBackgroundObject(obj);
        }
    });
    
    // 플랫폼 렌더링
    platforms.forEach(platform => {
        if (platform.x > cameraX - 100 && platform.x < cameraX + canvas.width + 100) {
            renderPlatform(platform);
        }
    });
    
    // 코인 렌더링
    coins.forEach(coin => {
        if (!coin.collected && coin.x > cameraX - 50 && coin.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x - cameraX + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 코인 반짝임 효과
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // 파워업 렌더링
    powerUps.forEach(powerUp => {
        if (!powerUp.collected && powerUp.x > cameraX - 50 && powerUp.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(powerUp.x - cameraX, powerUp.y, powerUp.width, powerUp.height);
            
            // 파워업 테두리
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(powerUp.x - cameraX, powerUp.y, powerUp.width, powerUp.height);
        }
    });
    
    // 적 렌더링
    enemies.forEach(enemy => {
        if (!enemy.dead && enemy.x > cameraX - 50 && enemy.x < cameraX + canvas.width + 50) {
            renderEnemy(enemy);
        }
    });
    
    // 보스 렌더링
    bosses.forEach(boss => {
        if (!boss.dead && boss.x > cameraX - 100 && boss.x < cameraX + canvas.width + 100) {
            renderBoss(boss);
        }
    });
    
    // 파티클 렌더링
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fillRect(particle.x - cameraX, particle.y, particle.width, particle.height);
        ctx.globalAlpha = 1.0;
    });
    
    // 플레이어 렌더링
    renderPlayer();
    
    // UI 렌더링
    renderUI();
    
    // 밤낮 상태 표시
    renderDayNightStatus();
}

// 캐릭터 그리기 함수
function drawCharacter(x, y, characterName) {
    const char = characters[characterName];
    if (!char) return;
    
    // 기본 캐릭터 몸체
    ctx.fillStyle = char.color;
    ctx.fillRect(x, y, player.width, player.height);
    
    // 캐릭터별 특별한 특징 그리기
    switch(char.special) {
        case '검':
            // 검 그리기
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + player.width, y + 5, 20, 3);
            break;
        case '활':
            // 활 그리기
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(x + player.width/2, y + player.height/2, 15, 0, Math.PI, false);
            ctx.stroke();
            break;
        case '망치':
            // 망치 그리기
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + player.width, y + 5, 25, 8);
            break;
        case '폭탄':
            // 폭탄 그리기
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + player.width/2, y + player.height/2, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
        case '미사일':
            // 미사일 그리기
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(x + player.width, y + 5, 20, 4);
            break;
        case '풍선':
            // 풍선 그리기
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(x + player.width/2, y + player.height/2, 12, 0, Math.PI * 2);
            ctx.fill();
            break;
        case '왕관':
            // 왕관 그리기
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + 5, y - 8, 20, 8);
            break;
        case '창':
            // 창 그리기
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(x + player.width, y + 5, 30, 3);
            break;
        case '어둠':
            // 어둠의 마법사 모자
            ctx.fillStyle = '#4B0082';
            ctx.fillRect(x + 3, y - 10, 24, 10);
            break;
        case '마법':
            // 마법사 모자
            ctx.fillStyle = '#9370DB';
            ctx.fillRect(x + 3, y - 10, 24, 10);
            break;
        case '날개':
            // 발키리 날개
            ctx.fillStyle = '#FF1493';
            ctx.fillRect(x - 15, y + 5, 15, 20);
            ctx.fillRect(x + player.width, y + 5, 15, 20);
            break;
        case '방패':
            // 방패 그리기
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x - 8, y + 5, 8, 20);
            break;
        case '거대':
            // 거인 크기 조정
            ctx.fillStyle = char.color;
            ctx.fillRect(x - 5, y - 5, player.width + 10, player.height + 10);
            break;
    }
    
    // 공격 중일 때 효과
    if (player.attacking) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(x - 10, y - 10, player.width + 20, player.height + 20);
    }
}

// 게임 루프
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    // 밤낮 시스템 업데이트
    updateDayNightSystem();
    
    // 플레이어 업데이트
    updatePlayer();
    
    // 적 업데이트
    updateEnemies();
    
    // 보스 업데이트
    updateBosses();
    
    // 코인 업데이트
    updateCoins();
    
    // 파워업 업데이트
    updatePowerUps();
    
    // 파티클 업데이트
    updateParticles();
    
    // 투사체 업데이트
    updateProjectiles();
    
    // 카메라 업데이트
    updateCamera();
    
    // 체력 회복 업데이트
    updateHealthRegeneration();
    
    // 스테이지 클리어 체크
    checkStageClear();
    
    // 렌더링
    render();
    
    // 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 게임 시작
function startGame() {
    console.log('startGame 함수 호출됨');
    
    try {
        gameRunning = true;
        gamePaused = false;
        score = 0;
        lives = 5; // 기본 생명 5개
        
        // UI 화면들 숨기기
        if (startScreen) startScreen.style.display = 'none';
        if (characterSelectScreen) characterSelectScreen.style.display = 'none';
        if (stageSelect) stageSelect.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        
        // 게임 컨트롤 표시 (PC 전용이므로 모바일 컨트롤 숨김)
        if (mobileControls) mobileControls.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'block';
        
        // 플레이어 초기화
        player.x = 100;
        player.y = 800; // 1080p에 맞게 Y 위치 조정
        player.velocityX = 0;
        player.velocityY = 0;
        player.health = player.maxHealth; // 300
        player.jumpCount = 0;
        player.doubleJumpAvailable = true;
        player.lastDamageTime = 0;
        player.healthRegenCooldown = 0;
        
        // 밤낮 시스템 초기화
        dayNightTimer = 0;
        isNight = false;
        createSkyGradient();
        
        // 스테이지 생성
        generateStage();
        
        // UI 업데이트
        updateUI();
        
        console.log('게임 시작 준비 완료');
        console.log('캔버스 크기:', canvas.width, 'x', canvas.height);
        console.log('플레이어 위치:', player.x, player.y);
        
        // 게임 루프 시작
        gameLoop();
    } catch (error) {
        console.error('게임 시작 중 오류:', error);
    }
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    console.log('게임 오버!');
    
    // 게임 오버 화면 표시
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
        
        // 최종 점수 표시
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = score;
        }
        
        // 달성한 스테이지 표시
        const finalStageElement = document.getElementById('finalStage');
        if (finalStageElement) {
            finalStageElement.textContent = currentStage;
        }
    }
    
    // 모바일 컨트롤 숨기기
    if (mobileControls) {
        mobileControls.style.display = 'none';
    }
    
    // 일시정지 버튼 숨기기
    if (pauseBtn) {
        pauseBtn.style.display = 'none';
    }
}

// 생명 잃기
function loseLife() {
    lives--;
    console.log(`생명 감소! 남은 생명: ${lives}`);
    
    if (lives <= 0) {
        gameOver();
    } else {
        // 플레이어 위치 초기화
        player.x = 100;
        player.y = 800; // 1080p에 맞게 Y 위치 조정
        player.velocityX = 0;
        player.velocityY = 0;
        player.health = player.maxHealth; // 체력 완전 회복
        player.jumpCount = 0;
        player.doubleJumpAvailable = true;
        player.lastDamageTime = 0;
        player.healthRegenCooldown = 0;
        
        // 스테이지 재생성
        generateStage();
        
        // UI 업데이트
        updateUI();
    }
}

// UI 업데이트
function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    stageElement.textContent = currentStage;
}

// 일시정지 토글
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseBtn.textContent = '▶️';
    } else {
        pauseBtn.textContent = '⏸️';
    }
}

// 캐릭터 선택
function selectCharacter(characterName) {
    selectedCharacter = characterName;
    startGame();
}

// 캐릭터 선택 화면 표시
function showCharacterSelect() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    characterSelectScreen.style.display = 'flex';
    mobileControls.style.display = 'none';
    pauseBtn.style.display = 'none';
}

// 뒤로 가기
function goBack() {
    characterSelectScreen.style.display = 'none';
    startScreen.style.display = 'flex';
}

// 게임 재시작
function restartGame() {
    gameOverScreen.style.display = 'none';
    startGame();
}

// 초기화
function init() {
    console.log('게임 초기화 시작');
    
    try {
        // DOM 요소 확인
        if (!ensureDOMElements()) {
            console.error('필수 DOM 요소들이 로드되지 않았습니다.');
            return;
        }
        
        // 모바일 컨트롤 설정
        setupMobileControls();
        
        // 키보드 컨트롤 설정
        setupKeyboardControls();
        
        // 초기 하늘 그라데이션 생성
        createSkyGradient();
        
        console.log('게임 초기화 완료');
        
        // 시작 화면 표시
        if (startScreen) {
            startScreen.style.display = 'flex';
        }
    } catch (error) {
        console.error('게임 초기화 중 오류:', error);
    }
}

// 페이지 로드 시 초기화
window.addEventListener('load', init); 

// 스킬 효과 함수들
function createSwordWave() {
    // 검기 파동 생성
    projectiles.push({
        x: player.x + (player.direction * 40),
        y: player.y,
        vx: player.direction * 8,
        vy: 0,
        width: 30,
        height: 20,
        damage: 30,
        life: 30,
        type: 'sword'
    });
}

function createArrowStorm() {
    // 화살 폭풍 생성
    for (let i = 0; i < 5; i++) {
        projectiles.push({
            x: player.x,
            y: player.y + i * 10,
            vx: 10,
            vy: (i - 2) * 2,
            width: 15,
            height: 5,
            damage: 25,
            life: 45,
            type: 'arrow'
        });
    }
}

function createEarthquake() {
    // 지진 효과 - 모든 적에게 데미지
    enemies.forEach(enemy => {
        if (!enemy.dead) {
            enemy.health -= 20;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
            }
            createHitEffect(enemy.x, enemy.y);
        }
    });
    
    // 지진 파티클 효과
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x + (i - 7) * 20,
            y: player.y + 30,
            vx: (i - 7) * 1,
            vy: -Math.random() * 3 - 2,
            life: 40,
            color: '#8B4513'
        });
    }
}

function createExplosion() {
    // 폭발 효과 - 범위 공격
    const explosionRange = 100;
    enemies.forEach(enemy => {
        const distance = Math.abs(enemy.x - player.x);
        if (distance < explosionRange && !enemy.dead) {
            enemy.health -= 35;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
            }
            createHitEffect(enemy.x, enemy.y);
        }
    });
    
    // 폭발 파티클 효과
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 50,
            color: '#FF4500'
        });
    }
}

function createMissileBarrage() {
    // 미사일 폭격
    for (let i = 0; i < 8; i++) {
        projectiles.push({
            x: player.x,
            y: player.y + (i - 4) * 15,
            vx: 12,
            vy: (i - 4) * 1.5,
            width: 20,
            height: 8,
            damage: 30,
            life: 60,
            type: 'missile'
        });
    }
}

function createBalloonBurst() {
    // 풍선 폭발 - 높은 점프와 함께 파티클
    player.velocityY = -20;
    player.jumping = true;
    player.onGround = false;
    
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 60,
            color: '#FF69B4'
        });
    }
}

function createKingsCommand() {
    // 왕의 명령 - 모든 적을 약화
    enemies.forEach(enemy => {
        if (!enemy.dead) {
            enemy.damage = Math.max(1, enemy.damage * 0.5);
            enemy.velocityX *= 0.5;
        }
    });
    
    // 왕의 권위 파티클
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 70,
            color: '#FFD700'
        });
    }
}

function createSpearStorm() {
    // 창의 폭풍
    for (let i = 0; i < 6; i++) {
        projectiles.push({
            x: player.x + (player.direction * 30),
            y: player.y + (i - 2.5) * 12,
            vx: player.direction * 10,
            vy: (i - 2.5) * 2,
            width: 25,
            height: 6,
            damage: 35,
            life: 40,
            type: 'spear'
        });
    }
}

function createDarkStorm() {
    // 어둠의 폭풍
    for (let i = 0; i < 18; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 80,
            color: '#4B0082'
        });
    }
    
    // 어둠의 힘으로 적 약화
    enemies.forEach(enemy => {
        if (!enemy.dead) {
            enemy.health -= 15;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
            }
        }
    });
}

function createMagicStorm() {
    // 마법 폭풍
    const magicColors = ['#9370DB', '#FF69B4', '#00BFFF', '#32CD32'];
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            life: 65,
            color: magicColors[Math.floor(Math.random() * magicColors.length)]
        });
    }
}

function createDivineStorm() {
    // 신의 폭풍
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            life: 90,
            color: '#FF1493'
        });
    }
    
    // 신의 힘으로 체력 회복
    player.health = Math.min(player.maxHealth, player.health + 30);
}

function createShieldRush() {
    // 방패 돌진 - 무적 상태와 함께 돌진
    player.health = player.maxHealth; // 체력 완전 회복
    
    // 돌진 효과
    enemies.forEach(enemy => {
        if (!enemy.dead && Math.abs(enemy.x - player.x) < 80) {
            enemy.health -= 25;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
            }
        }
    });
    
    // 방패 효과 파티클
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 45,
            color: '#A0522D'
        });
    }
}

function createGiantsRage() {
    // 거인의 분노 - 화면 흔들림과 함께 강력한 공격
    createScreenShake();
    
    // 모든 적에게 강력한 데미지
    enemies.forEach(enemy => {
        if (!enemy.dead) {
            enemy.health -= 50;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 150;
            }
            createHitEffect(enemy.x, enemy.y);
        }
    });
    
    // 거인의 분노 파티클
    for (let i = 0; i < 35; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 100,
            color: '#696969'
        });
    }
}

function createSpeedRush() {
    // 초고속 돌진
    player.velocityX = player.direction * 15; // 초고속 이동
    
    // 돌진 경로의 적들에게 데미지
    enemies.forEach(enemy => {
        if (!enemy.dead && Math.abs(enemy.x - player.x) < 100) {
            enemy.health -= 40;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 120;
            }
        }
    });
    
    // 속도 효과 파티클
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 55,
            color: '#FF0000'
        });
    }
} 

// 체력 회복 함수
function healPlayer(amount) {
    if (!gameRunning || gamePaused) return;
    
    player.health = Math.min(player.maxHealth, player.health + amount);
    console.log('체력 회복! 현재 체력:', player.health, '/', player.maxHealth);
    
    // 회복 효과 파티클 생성
    createHealEffect(player.x, player.y);
}

// 체력 회복 효과 생성
function createHealEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x + player.width/2,
            y: y + player.height/2,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 2,
            life: 40,
            color: '#00FF00' // 초록색 회복 효과
        });
    }
}

// 자동 체력 회복 시스템
function updateHealthRegeneration() {
    if (!gameRunning || gamePaused) return;
    
    const currentTime = Date.now();
    
    // 데미지를 받은 후 5초 후에 자동 회복 시작
    if (currentTime - player.lastDamageTime > 5000) {
        player.healthRegenCooldown++;
        
        // 1초마다 체력 회복 (60프레임 기준)
        if (player.healthRegenCooldown >= 60) {
            if (player.health < player.maxHealth) {
                healPlayer(player.healthRegenRate);
            }
            player.healthRegenCooldown = 0;
        }
    }
} 

// 스테이지 선택 화면 표시
function showStageSelect() {
    console.log('showStageSelect 함수 호출됨');
    
    if (!ensureDOMElements()) {
        console.error('DOM 요소 확인 실패');
        return;
    }
    
    try {
        characterSelectScreen.style.display = 'none';
        stageSelect.style.display = 'flex';
        
        // 선택된 캐릭터 이름 표시
        const selectedCharNameElement = document.getElementById('selectedCharName');
        if (selectedCharNameElement) {
            selectedCharNameElement.textContent = selectedCharacter;
        }
        
        console.log('스테이지 선택 화면 표시 완료');
    } catch (error) {
        console.error('스테이지 선택 화면 표시 중 오류:', error);
    }
}

// 캐릭터 선택 화면으로 돌아가기
function goBackToCharacterSelect() {
    console.log('goBackToCharacterSelect 함수 호출됨');
    
    if (!ensureDOMElements()) {
        console.error('DOM 요소 확인 실패');
        return;
    }
    
    try {
        stageSelect.style.display = 'none';
        characterSelectScreen.style.display = 'flex';
        console.log('캐릭터 선택 화면으로 돌아가기 완료');
    } catch (error) {
        console.error('캐릭터 선택 화면으로 돌아가기 중 오류:', error);
    }
}

// 스테이지 선택
function selectStage(stageNumber) {
    console.log(`selectStage 함수 호출됨: 스테이지 ${stageNumber}`);
    
    try {
        currentStage = stageNumber;
        console.log(`스테이지 ${currentStage} 선택됨`);
        
        // 스테이지 선택 화면 숨기기
        if (stageSelect) {
            stageSelect.style.display = 'none';
        }
        
        // 게임 시작
        startGame();
    } catch (error) {
        console.error('스테이지 선택 중 오류:', error);
    }
}

// 캐릭터 선택
function selectCharacter(characterName) {
    console.log(`selectCharacter 함수 호출됨: ${characterName}`);
    
    try {
        selectedCharacter = characterName;
        console.log(`캐릭터 선택됨: ${selectedCharacter}`);
        
        // 스테이지 선택 화면으로 이동
        showStageSelect();
    } catch (error) {
        console.error('캐릭터 선택 중 오류:', error);
    }
}

// 적 타입 정의
function getRandomEnemyType() {
    const types = ['나무돌이', '나무왕', '포탑몬'];
    return types[Math.floor(Math.random() * types.length)];
}

// 적 생성 함수
function createEnemy(x, y, type) {
    const enemy = {
        x: x,
        y: y,
        width: 40,
        height: 40,
        velocityX: 0,
        velocityY: 0,
        type: type,
        health: 0,
        maxHealth: 0,
        direction: Math.random() < 0.5 ? 1 : -1,
        moveSpeed: 0,
        attackCooldown: 0,
        onGround: false,
        // 타입별 특성 설정
        ...getEnemyStats(type)
    };
    
    return enemy;
}

// 적 타입별 능력치
function getEnemyStats(type) {
    switch(type) {
        case '나무돌이':
            return {
                health: 30,
                maxHealth: 30,
                moveSpeed: 1,
                attackPower: 10,
                color: '#8B4513',
                ability: '기본 공격'
            };
        case '나무왕':
            return {
                health: 80,
                maxHealth: 80,
                moveSpeed: 0.8,
                attackPower: 25,
                color: '#228B22',
                ability: '강력한 공격'
            };
        case '포탑몬':
            return {
                health: 50,
                maxHealth: 50,
                moveSpeed: 0,
                attackPower: 20,
                color: '#696969',
                ability: '원거리 공격'
            };
        default:
            return {
                health: 30,
                maxHealth: 30,
                moveSpeed: 1,
                attackPower: 10,
                color: '#8B4513',
                ability: '기본 공격'
            };
    }
}

// 적 렌더링 함수
function renderEnemy(enemy) {
    const ctx = canvas.getContext('2d');
    
    // 3D 효과를 위한 그림자
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * lightingIntensity})`;
    ctx.fillRect(enemy.x + 8, enemy.y + enemy.height + 5, enemy.width - 16, 12);
    
    // 적 몸체 (타입별 색상)
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // 3D 효과를 위한 테두리
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // 타입별 특별한 특징 (이미지 기반)
    switch(enemy.type) {
        case '나무돌이':
            // 나무돌이 - 연한 베이지색 몸체, 흙/나무 질감
            ctx.fillStyle = '#D2B48C'; // 연한 베이지색
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 흙/나무 질감 패턴
            ctx.fillStyle = '#A0522D';
            for(let i = 0; i < enemy.width; i += 8) {
                for(let j = 0; j < enemy.height; j += 8) {
                    if (Math.random() > 0.7) {
                        ctx.fillRect(enemy.x + i, enemy.y + j, 4, 4);
                    }
                }
            }
            
            // 얼굴 - 검은색 눈과 입
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6); // 왼쪽 눈
            ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6); // 오른쪽 눈
            ctx.fillRect(enemy.x + 12, enemy.y + enemy.height - 12, 16, 4); // 입
            
            // 팔 - 수평으로 뻗은 팔
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(enemy.x - 8, enemy.y + 10, 8, 12); // 왼쪽 팔
            ctx.fillRect(enemy.x + enemy.width, enemy.y + 10, 8, 12); // 오른쪽 팔
            
            // 다리
            ctx.fillRect(enemy.x + 5, enemy.y + enemy.height, 8, 8); // 왼쪽 다리
            ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + enemy.height, 8, 8); // 오른쪽 다리
            break;
            
        case '나무왕':
            // 나무왕 - 나무돌이보다 크고, 왕관 착용
            ctx.fillStyle = '#CD853F'; // 약간 어두운 베이지색
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 흙/나무 질감 패턴
            ctx.fillStyle = '#8B4513';
            for(let i = 0; i < enemy.width; i += 10) {
                for(let j = 0; j < enemy.height; j += 10) {
                    if (Math.random() > 0.6) {
                        ctx.fillRect(enemy.x + i, enemy.y + j, 6, 6);
                    }
                }
            }
            
            // 얼굴
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 7, 7); // 왼쪽 눈
            ctx.fillRect(enemy.x + enemy.width - 17, enemy.y + 10, 7, 7); // 오른쪽 눈
            ctx.fillRect(enemy.x + 14, enemy.y + enemy.height - 14, 18, 5); // 입
            
            // 왕관 - 붉은색 왕관
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(enemy.x + 5, enemy.y - 10, enemy.width - 10, 10);
            // 왕관 장식
            ctx.fillStyle = '#FFD700';
            for(let i = 0; i < 3; i++) {
                ctx.fillRect(enemy.x + 8 + i * 12, enemy.y - 15, 4, 5);
            }
            
            // 팔과 다리
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(enemy.x - 10, enemy.y + 12, 10, 15); // 왼쪽 팔
            ctx.fillRect(enemy.x + enemy.width, enemy.y + 12, 10, 15); // 오른쪽 팔
            ctx.fillRect(enemy.x + 6, enemy.y + enemy.height, 10, 10); // 왼쪽 다리
            ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + enemy.height, 10, 10); // 오른쪽 다리
            break;
            
        case '포탑몬':
            // 포탑몬 - 원통형 포탑 형태
            ctx.fillStyle = '#696969'; // 회색
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 포탑 몸체 그라데이션 효과
            const towerGradient = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x + enemy.width, enemy.y);
            towerGradient.addColorStop(0, '#808080');
            towerGradient.addColorStop(0.5, '#696969');
            towerGradient.addColorStop(1, '#808080');
            ctx.fillStyle = towerGradient;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 포신 - 검은색 포신이 오른쪽으로 뻗음
            ctx.fillStyle = '#2F4F4F';
            ctx.fillRect(enemy.x + enemy.width, enemy.y + 8, 12, 24);
            
            // 포탑 기지
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(enemy.x + 5, enemy.y + enemy.height - 8, enemy.width - 10, 8);
            
            // 얼굴 - 눈만 있음
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6); // 왼쪽 눈
            ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6); // 오른쪽 눈
            
            // 다리
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(enemy.x + 8, enemy.y + enemy.height, 8, 8); // 왼쪽 다리
            ctx.fillRect(enemy.x + enemy.width - 16, enemy.y + enemy.height, 8, 8); // 오른쪽 다리
            break;
    }
    
    // 3D 효과를 위한 하이라이트
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * lightingIntensity})`;
    ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, 4);
    
    // 체력바 표시
    const healthBarWidth = enemy.width;
    const healthBarHeight = 6;
    const healthBarX = enemy.x;
    const healthBarY = enemy.y - 15;
    
    // 체력바 배경
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 체력바 (현재 체력 비율)
    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
    
    // 체력바 테두리
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 체력 수치 표시
    ctx.fillStyle = '#FFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${enemy.health}/${enemy.maxHealth}`, enemy.x + enemy.width/2, healthBarY - 2);
    ctx.textAlign = 'left';
}

// 플랫폼 렌더링 함수
function renderPlatform(platform) {
    const ctx = canvas.getContext('2d');
    
    switch(platform.type) {
        case 'ground':
            // 메인 바닥 - 잔디와 흙 표현
            // 잔디 레이어
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(platform.x - cameraX, platform.y, platform.width, 20);
            
            // 흙 레이어
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x - cameraX, platform.y + 20, platform.width, platform.height - 20);
            
            // 잔디 장식
            ctx.fillStyle = '#228B22';
            for(let i = 0; i < platform.width; i += 30) {
                ctx.fillRect(platform.x - cameraX + i, platform.y - 5, 2, 5);
                ctx.fillRect(platform.x - cameraX + i + 15, platform.y - 8, 2, 8);
            }
            break;
            
        case 'hill':
            // 언덕 - 자연스러운 곡선 표현
            ctx.fillStyle = '#228B22';
            ctx.fillRect(platform.x - cameraX, platform.y, platform.width, platform.height);
            
            // 언덕 꼭대기 잔디
            ctx.fillStyle = '#90EE90';
            ctx.fillRect(platform.x - cameraX, platform.y, platform.width, 15);
            
            // 언덕 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(platform.x - cameraX + 5, platform.y + platform.height, platform.width - 10, 10);
            break;
            
        case 'platform':
        case 'mid-platform':
        case 'high-platform':
            // 플랫폼 - 나무 판자 표현
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x - cameraX, platform.y, platform.width, platform.height);
            
            // 나무 판자 테두리
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x - cameraX, platform.y, platform.width, platform.height);
            
            // 나무 판자 무늬
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 1;
            for(let i = 0; i < platform.width; i += 15) {
                ctx.beginPath();
                ctx.moveTo(platform.x - cameraX + i, platform.y);
                ctx.lineTo(platform.x - cameraX + i, platform.y + platform.height);
                ctx.stroke();
            }
            break;
    }
}

// 배경 오브젝트 렌더링 함수
function renderBackgroundObject(obj) {
    const ctx = canvas.getContext('2d');
    
    switch(obj.type) {
        case 'tree':
            // 나무
            // 나무 줄기
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obj.x - cameraX, obj.y + obj.height/2, obj.width/3, obj.height/2);
            
            // 나뭇잎
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/2, obj.y + obj.height/3, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 나뭇잎 장식
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/3, obj.y + obj.height/4, obj.width/4, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'rock':
            // 바위
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 바위 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/2 + 2, obj.y + obj.height/2 + 2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'bush':
            // 관목
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 관목 장식
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/3, obj.y + obj.height/3, obj.width/3, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'flower':
            // 꽃
            // 꽃잎
            ctx.fillStyle = '#FF69B4';
            for(let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const petalX = obj.x - cameraX + obj.width/2 + Math.cos(angle) * obj.width/3;
                const petalY = obj.y + obj.height/2 + Math.sin(angle) * obj.height/3;
                ctx.beginPath();
                ctx.arc(petalX, petalY, obj.width/4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 꽃 중앙
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(obj.x - cameraX + obj.width/2, obj.y + obj.height/2, obj.width/6, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        default:
            // 기본 오브젝트
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obj.x - cameraX, obj.y, obj.width, obj.height);
    }
}

// 밤낮 시스템 업데이트
function updateDayNightSystem() {
    dayNightTimer++;
    
    // 4분 주기로 밤낮 전환
    if (dayNightTimer >= DAY_NIGHT_CYCLE) {
        dayNightTimer = 0;
    }
    
    // 밤낮 상태 결정 (0-120초: 낮, 120-240초: 밤)
    isNight = dayNightTimer >= 120;
    
    // 조명 강도 계산 (낮: 1.0, 밤: 0.3)
    lightingIntensity = isNight ? 0.3 : 1.0;
    
    // 하늘 그라데이션 생성
    createSkyGradient();
}

// 하늘 그라데이션 생성
function createSkyGradient() {
    const ctx = canvas.getContext('2d');
    
    if (isNight) {
        // 밤하늘 - 어두운 파란색에서 검은색
        skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#0B1426');    // 어두운 파란색
        skyGradient.addColorStop(0.5, '#1a1a2e');  // 중간 어두운 파란색
        skyGradient.addColorStop(1, '#16213e');     // 더 어두운 파란색
    } else {
        // 낮하늘 - 밝은 파란색에서 하늘색
        skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');    // 하늘색
        skyGradient.addColorStop(0.5, '#B0E0E6');  // 파우더 블루
        skyGradient.addColorStop(1, '#E0F6FF');     // 매우 밝은 하늘색
    }
}

// 구름 렌더링 (낮에만)
function renderClouds() {
    const ctx = canvas.getContext('2d');
    
    // 구름 위치 (고정)
    const cloudPositions = [
        {x: 100, y: 80, size: 60},
        {x: 300, y: 60, size: 80},
        {x: 500, y: 100, size: 50},
        {x: 700, y: 70, size: 70}
    ];
    
    cloudPositions.forEach(cloud => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cloud.x - cameraX * 0.5, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(cloud.x - cameraX * 0.5 + 2, cloud.y + 2, cloud.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 별 렌더링 (밤에만)
function renderStars() {
    const ctx = canvas.getContext('2d');
    
    // 별 위치 (고정)
    const starPositions = [
        {x: 50, y: 50, size: 2},
        {x: 150, y: 80, size: 1},
        {x: 250, y: 40, size: 3},
        {x: 350, y: 90, size: 1},
        {x: 450, y: 60, size: 2},
        {x: 550, y: 100, size: 1},
        {x: 650, y: 70, size: 2},
        {x: 750, y: 50, size: 1}
    ];
    
    starPositions.forEach(star => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(star.x - cameraX * 0.3, star.y, star.size, star.size);
        
        // 별 반짝임 효과
        if (Math.random() > 0.95) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(star.x - cameraX * 0.3, star.y, star.size * 2, star.size * 2);
        }
    });
}

// 태양/달 렌더링
function renderCelestialBody() {
    const ctx = canvas.getContext('2d');
    
    if (isNight) {
        // 달 - 밤에만
        ctx.fillStyle = '#F0F8FF';
        ctx.beginPath();
        ctx.arc(100, 100, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 달 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(102, 102, 30, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // 태양 - 낮에만
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(100, 100, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // 태양 빛 효과
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(100, 100, 50, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 플레이어 렌더링
function renderPlayer() {
    const ctx = canvas.getContext('2d');
    
    // 플레이어 그림자
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * lightingIntensity})`;
    ctx.fillRect(player.x - cameraX + 8, player.y + player.height + 8, player.width - 16, 16);
    
    // 플레이어 몸체
    drawCharacter(player.x - cameraX, player.y, player.character);
    
    // 플레이어 체력바 (1080p에 맞게 크기 조정)
    const healthBarWidth = player.width;
    const healthBarHeight = 8;
    const healthPercentage = player.health / player.maxHealth;
    
    // 체력바 배경
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - cameraX, player.y - 15, healthBarWidth, healthBarHeight);
    
    // 체력바 (현재 체력 비율)
    if (healthPercentage > 0.6) {
        ctx.fillStyle = '#00FF00'; // 초록색 (체력 높음)
    } else if (healthPercentage > 0.3) {
        ctx.fillStyle = '#FFFF00'; // 노란색 (체력 중간)
    } else {
        ctx.fillStyle = '#FF0000'; // 빨간색 (체력 낮음)
    }
    ctx.fillRect(player.x - cameraX, player.y - 15, healthBarWidth * healthPercentage, healthBarHeight);
    
    // 체력바 테두리
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - cameraX, player.y - 15, healthBarWidth, healthBarHeight);
}

// UI 렌더링
function renderUI() {
    const ctx = canvas.getContext('2d');
    const theme = getCurrentPlanetTheme();
    
    // 게임 정보 표시
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial'; // 1080p에 맞게 폰트 크기 증가
    ctx.fillText(`스테이지: ${currentStage}`, 20, 50);
    ctx.fillText(`점수: ${score}`, 20, 80);
    
    // 생명을 하트 아이콘으로 표시
    ctx.fillStyle = '#FF69B4';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('생명:', 20, 110);
    
    // 하트 아이콘 그리기
    for (let i = 0; i < lives; i++) {
        drawHeart(ctx, 120 + i * 40, 95, 25);
    }
    
    // 현재 행성 정보
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`행성: ${theme.planetName}`, 20, 150);
    
    // 버전 정보 표시 (우측 상단)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${GAME_VERSION}`, canvas.width - 20, 40);
    ctx.font = '16px Arial';
    ctx.fillText(`by ${GAME_DEVELOPER}`, canvas.width - 20, 60);
    ctx.fillText(`${GAME_RELEASE_DATE}`, canvas.width - 20, 80);
    ctx.textAlign = 'left';
    
    // 캐릭터 정보
    if (characters[player.character]) {
        const char = characters[player.character];
        ctx.fillStyle = '#FF69B4';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`캐릭터: ${player.character}`, 20, 180);
        
        // 체력바 그래픽 표시
        ctx.fillStyle = '#FF0000';
        ctx.fillText(`HP: ${player.health}/${player.maxHealth}`, 20, 210);
        
        // 체력바 그리기
        const healthBarWidth = 300;
        const healthBarHeight = 25;
        const healthBarX = 20;
        const healthBarY = 220;
        
        // 체력바 배경
        ctx.fillStyle = '#333';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 체력바 (현재 체력 비율)
        const healthRatio = player.health / player.maxHealth;
        if (healthRatio > 0.6) {
            ctx.fillStyle = '#00FF00'; // 초록색 (체력 높음)
        } else if (healthRatio > 0.3) {
            ctx.fillStyle = '#FFFF00'; // 노란색 (체력 중간)
        } else {
            ctx.fillStyle = '#FF0000'; // 빨간색 (체력 낮음)
        }
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthRatio, healthBarHeight);
        
        // 체력바 테두리
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 체력 수치 표시
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.health}/${player.maxHealth}`, healthBarX + healthBarWidth/2, healthBarY + 18);
        ctx.textAlign = 'left';
        
        // 캐릭터 능력 정보
        ctx.fillStyle = '#FFD700';
        ctx.font = '18px Arial';
        ctx.fillText(`능력: ${char.ability}`, 20, 270);
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(`점프력: ${char.jumpPower}`, 20, 295);
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`속도: ${char.moveSpeed.toFixed(1)}x`, 20, 320);
        
        // 2단 점프 정보 표시
        ctx.fillStyle = '#00BFFF';
        ctx.font = '18px Arial';
        ctx.fillText(`2단 점프: ${player.jumpCount}/${player.maxJumps}`, 20, 350);
        
        // 체력 회복 상태 표시
        const timeSinceDamage = Date.now() - player.lastDamageTime;
        if (timeSinceDamage > 5000 && player.health < player.maxHealth) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`체력 회복 중...`, 20, 380);
        }
        
        // 스킬 쿨다운 표시
        if (player.skillCooldown > 0) {
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`스킬 쿨다운: ${Math.ceil(player.skillCooldown / 60)}초`, 20, 400);
        }
    }
    
    // 일시정지 표시
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('일시정지', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

// 하트 아이콘 그리기 함수
function drawHeart(ctx, x, y, size) {
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    
    // 하트 모양 그리기
    const leftCurve = size * 0.3;
    const rightCurve = size * 0.3;
    const bottomCurve = size * 0.4;
    
    ctx.moveTo(x + size/2, y + size/4);
    
    // 왼쪽 곡선
    ctx.bezierCurveTo(
        x + size/2, y,
        x + leftCurve, y,
        x + leftCurve, y + size/4
    );
    
    // 왼쪽 아래 곡선
    ctx.bezierCurveTo(
        x + leftCurve, y + size/2,
        x + size/2, y + size * 0.8,
        x + size/2, y + size * 0.8
    );
    
    // 오른쪽 아래 곡선
    ctx.bezierCurveTo(
        x + size/2, y + size * 0.8,
        x + size - rightCurve, y + size/2,
        x + size - rightCurve, y + size/4
    );
    
    // 오른쪽 곡선
    ctx.bezierCurveTo(
        x + size - rightCurve, y,
        x + size/2, y,
        x + size/2, y + size/4
    );
    
    ctx.fill();
    
    // 하트 하이라이트
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
}

// 밤낮 상태 표시
function renderDayNightStatus() {
    const ctx = canvas.getContext('2d');
    
    // 밤낮 상태 표시 (좌측 하단)
    ctx.fillStyle = isNight ? '#4169E1' : '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(isNight ? '🌙 밤' : '☀️ 낮', 10, canvas.height - 20);
    
    // 시간 표시
    const remainingTime = isNight ? 
        (DAY_NIGHT_CYCLE - dayNightTimer) / 60 : 
        (120 - dayNightTimer) / 60;
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`남은 시간: ${Math.ceil(remainingTime)}분`, 10, canvas.height - 40);
}

// 보스 렌더링
function renderBoss(boss) {
    const ctx = canvas.getContext('2d');
    
    // 보스 그림자
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * lightingIntensity})`;
    ctx.fillRect(boss.x - cameraX + 10, boss.y + boss.height + 8, boss.width - 20, 15);
    
    // 보스 몸체
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(boss.x - cameraX, boss.y, boss.width, boss.height);
    
    // 보스 테두리
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(boss.x - cameraX, boss.y, boss.width, boss.height);
    
    // 보스 체력바
    const healthBarWidth = boss.width;
    const healthBarHeight = 8;
    const healthPercentage = boss.health / boss.maxHealth;
    
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(boss.x - cameraX, boss.y - 12, healthBarWidth, healthBarHeight);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(boss.x - cameraX, boss.y - 12, healthBarWidth * healthPercentage, healthBarHeight);
    
    // 보스 이름 표시
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.type, boss.x - cameraX + boss.width/2, boss.y - 20);
    ctx.textAlign = 'left';
}

// DOM 요소가 로드되었는지 확인하는 함수
function ensureDOMElements() {
    if (!characterSelectScreen) {
        console.error('characterSelectScreen 요소를 찾을 수 없습니다.');
        return false;
    }
    if (!stageSelect) {
        console.error('stageSelect 요소를 찾을 수 없습니다.');
        return false;
    }
    return true;
}

// 캐릭터 정보 토글
function toggleCharacterInfo() {
    console.log('캐릭터 정보 토글');
    // 캐릭터 정보 표시/숨김 로직 (선택사항)
}

// 인벤토리 토글
function toggleInventory() {
    console.log('인벤토리 토글');
    // 인벤토리 표시/숨김 로직 (선택사항)
}

// 맵 토글
function toggleMap() {
    console.log('맵 토글');
    // 맵 표시/숨김 로직 (선택사항)
}

// 컨트롤 가이드 표시
function showControlGuide() {
    const controlGuide = `
🎮 **마인크래프트 스타일 컨트롤 가이드**

**이동 컨트롤:**
- W / ↑ / 스페이스바: 점프
- A / ←: 왼쪽 이동
- S / ↓: 앉기 (선택사항)
- D / →: 오른쪽 이동
- R: 달리기 (이동 속도 1.5배)

**액션 컨트롤:**
- F: 공격
- E: 스킬 사용
- Q: 적 흡수
- C: 캐릭터 정보
- I: 인벤토리 (선택사항)
- M: 맵 (선택사항)

**기타:**
- ESC: 일시정지/메뉴
- 마우스: 시점 조작 (선택사항)
    `;
    
    console.log(controlGuide);
    alert(controlGuide);
}