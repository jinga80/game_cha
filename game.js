// 게임 변수들
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const characterSelectScreen = document.getElementById('characterSelect');
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
    y: 300,
    width: 30,
    height: 30,
    velocityX: 0,
    velocityY: 0,
    jumping: false,
    onGround: false,
    character: '검사',
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    attacking: false,
    skillCooldown: 0,
    suckedEnemies: [],
    health: 120,
    maxHealth: 120
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
const STAGE_WIDTH = 3000;

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

// 모바일 컨트롤 설정
function setupMobileControls() {
    // 이동 컨트롤
    document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.velocityX = -MOVE_SPEED;
        player.direction = -1;
    });
    document.getElementById('leftBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        if (player.velocityX < 0) player.velocityX = 0;
    });
    
    document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.velocityX = MOVE_SPEED;
        player.direction = 1;
    });
    document.getElementById('rightBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        if (player.velocityX > 0) player.velocityX = 0;
    });
    
    // 점프 컨트롤
    document.getElementById('jumpBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });
    
    // 공격 컨트롤
    document.getElementById('attackBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        attack();
    });
    
    // 스킬 컨트롤
    document.getElementById('skillBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill();
    });
    
    // 흡수 컨트롤
    document.getElementById('suckBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        suckEnemy();
    });
    
    // 마우스 클릭도 지원
    document.getElementById('leftBtn').addEventListener('click', () => {
        player.velocityX = -MOVE_SPEED;
        player.direction = -1;
    });
    document.getElementById('rightBtn').addEventListener('click', () => {
        player.velocityX = MOVE_SPEED;
        player.direction = 1;
    });
    document.getElementById('jumpBtn').addEventListener('click', jump);
    document.getElementById('attackBtn').addEventListener('click', attack);
    document.getElementById('skillBtn').addEventListener('click', useSkill);
    document.getElementById('suckBtn').addEventListener('click', suckEnemy);
}

// 키보드 컨트롤 설정
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                player.velocityX = -MOVE_SPEED;
                player.direction = -1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                player.velocityX = MOVE_SPEED;
                player.direction = 1;
                break;
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                jump();
                break;
            case 'KeyJ':
                attack();
                break;
            case 'KeyK':
                useSkill();
                break;
            case 'KeyL':
                suckEnemy();
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if (player.velocityX < 0) player.velocityX = 0;
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (player.velocityX > 0) player.velocityX = 0;
                break;
        }
    });
}

// 점프 함수
function jump() {
    if (!gameRunning || gamePaused) return;
    
    if (!player.jumping && player.onGround) {
        const char = characters[player.character];
        const jumpPower = char ? char.jumpPower : 15;
        
        player.velocityY = -jumpPower;
        player.jumping = true;
        player.onGround = false;
        
        // 점프 파티클 효과
        createJumpParticles();
        
        // 캐릭터별 특별한 점프 효과
        if (char && char.ability === '가벼운몸') {
            player.velocityY *= 0.8;
        } else if (char && char.ability === '거대한힘') {
            createScreenShake();
        }
        
        console.log('점프! 캐릭터:', player.character, '점프력:', jumpPower);
    }
}

// 공격 함수
function attack() {
    if (!gameRunning || gamePaused || player.attacking) return;
    
    const char = characters[player.character];
    if (!char) return;
    
    player.attacking = true;
    
    // 공격 범위 내의 적들 체크
    const attackRange = 50;
    enemies.forEach(enemy => {
        const distance = Math.abs(enemy.x - player.x);
        if (distance < attackRange && !enemy.dead) {
            enemy.health -= char.attackPower;
            if (enemy.health <= 0) {
                enemy.dead = true;
                score += 100;
            }
            createHitEffect(enemy.x, enemy.y);
        }
    });
    
    // 보스 공격 체크
    bosses.forEach(boss => {
        const distance = Math.abs(boss.x - player.x);
        if (distance < attackRange && !boss.dead) {
            boss.health -= char.attackPower * 0.5; // 보스는 데미지 감소
            createHitEffect(boss.x, boss.y);
        }
    });
    
    // 공격 애니메이션 시간
    setTimeout(() => {
        player.attacking = false;
    }, 300);
    
    console.log('공격! 공격력:', char.attackPower);
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
    const theme = getCurrentPlanetTheme();
    console.log(`스테이지 ${currentStage} 생성: ${theme.planetName}`);
    
    // 플랫폼 생성
    platforms = [];
    for (let i = 0; i < 15; i++) {
        platforms.push({
            x: i * 200,
            y: 350 - Math.random() * 100,
            width: 150 + Math.random() * 100,
            height: 20,
            color: theme.platformColor
        });
    }
    
    // 적 생성
    enemies = [];
    const enemyCount = 5 + Math.floor(currentStage / 10); // 스테이지가 올라갈수록 적 증가
    
    for (let i = 0; i < enemyCount; i++) {
        const enemyType = getRandomEnemyType(theme.planetName);
        enemies.push({
            x: 300 + i * 300,
            y: 300,
            width: 25,
            height: 25,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: 0,
            health: 50 + currentStage * 5,
            maxHealth: 50 + currentStage * 5,
            damage: 10 + currentStage * 2,
            type: enemyType,
            color: theme.enemyColor,
            dead: false,
            sucked: false,
            attackCooldown: 0
        });
    }
    
    // 보스 생성 (스테이지 구간 마지막에만)
    bosses = [];
    if (currentStage % 20 === 0) {
        const boss = theme.boss;
        bosses.push({
            x: 2500,
            y: 200,
            width: 80,
            height: 80,
            velocityX: 0,
            velocityY: 0,
            health: boss.health,
            maxHealth: boss.health,
            damage: 30 + currentStage * 3,
            type: boss.name,
            color: boss.color,
            dead: false,
            attackPattern: boss.attackPattern,
            attackCooldown: 0,
            phase: 1
        });
        console.log(`보스 등장: ${boss.name} (체력: ${boss.health})`);
    }
    
    // 코인 생성
    coins = [];
    for (let i = 0; i < 20; i++) {
        coins.push({
            x: 200 + i * 150,
            y: 200 + Math.random() * 100,
            width: 15,
            height: 15,
            collected: false,
            value: 10 + Math.floor(currentStage / 5) * 5
        });
    }
    
    // 파워업 생성
    powerUps = [];
    if (Math.random() < 0.3) { // 30% 확률로 파워업 생성
        powerUps.push({
            x: 800 + Math.random() * 1000,
            y: 250,
            width: 25,
            height: 25,
            type: 'health',
            collected: false
        });
    }
    
    // 배경 객체 생성
    backgroundObjects = [];
    for (let i = 0; i < 25; i++) {
        backgroundObjects.push({
            x: i * 120,
            y: Math.random() * 200 + 50,
            size: Math.random() * 4 + 2,
            type: getBackgroundObjectType(theme.planetName)
        });
    }
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

// 행성별 배경 객체 타입
function getBackgroundObjectType(planetName) {
    const objectTypes = {
        '나무행성': ['🌳', '🌲', '🌿', '🍃'],
        '불꽃행성': ['🔥', '🌋', '💥', '⚡'],
        '번개행성': ['⚡', '🌩️', '💫', '✨'],
        '원소행성': ['🌈', '💎', '🌟', '🔮'],
        '얼음행성': ['❄️', '🧊', '🌨️', '💎']
    };
    
    const types = objectTypes[planetName] || objectTypes['나무행성'];
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
    if (gamePaused) return;
    
    // 중력 적용
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // 플레이어 이동
    player.x += player.velocityX;
    
    // 경계 체크
    if (player.x < 0) player.x = 0;
    if (player.x > STAGE_WIDTH - player.width) player.x = STAGE_WIDTH - player.width;
    
    // 바닥 충돌 체크
    player.onGround = false;
    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height + 5 &&
            player.velocityY > 0) {
            
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.jumping = false;
            player.onGround = true;
            break;
        }
    }
    
    // 게임 오버 체크
    if (player.y > canvas.height) {
        loseLife();
    }
    
    // 스킬 쿨다운 감소
    if (player.skillCooldown > 0) {
        player.skillCooldown--;
    }
}

// 적 업데이트
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.dead) return;
        
        // 적 이동
        enemy.x += enemy.velocityX;
        enemy.y += enemy.velocityY;
        
        // 중력 적용
        enemy.velocityY += GRAVITY;
        
        // 플랫폼 충돌 체크
        for (let platform of platforms) {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y + enemy.height >= platform.y &&
                enemy.y + enemy.height <= platform.y + platform.height &&
                enemy.velocityY > 0) {
                
                enemy.y = platform.y - enemy.height;
                enemy.velocityY = 0;
                break;
            }
        }
        
        // 경계 체크
        if (enemy.x < 0 || enemy.x > STAGE_WIDTH) {
            enemy.velocityX *= -1;
        }
        
        // 플레이어 공격
        enemy.attackCooldown--;
        if (enemy.attackCooldown <= 0 && Math.abs(enemy.x - player.x) < 40) {
            player.health -= enemy.damage;
            enemy.attackCooldown = 60;
            createHitEffect(player.x, player.y);
        }
    });
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
    const theme = getCurrentPlanetTheme();
    
    // 배경 그리기
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 객체 그리기
    backgroundObjects.forEach(obj => {
        if (obj.x > cameraX - 50 && obj.x < cameraX + canvas.width + 50) {
            ctx.font = `${obj.size * 5}px Arial`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillText(obj.type, obj.x - cameraX, obj.y);
        }
    });
    
    // 플랫폼 그리기
    platforms.forEach(platform => {
        if (platform.x > cameraX - 100 && platform.x < cameraX + canvas.width + 100) {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x - cameraX, platform.y, platform.width, platform.height);
        }
    });
    
    // 코인 그리기
    coins.forEach(coin => {
        if (!coin.collected && coin.x > cameraX - 50 && coin.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(coin.x - cameraX + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 파워업 그리기
    powerUps.forEach(powerUp => {
        if (!powerUp.collected && powerUp.x > cameraX - 50 && powerUp.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(powerUp.x - cameraX, powerUp.y, powerUp.width, powerUp.height);
        }
    });
    
    // 적 그리기
    enemies.forEach(enemy => {
        if (!enemy.dead && enemy.x > cameraX - 50 && enemy.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.width, enemy.height);
            
            // 체력바 그리기
            const healthBarWidth = enemy.width;
            const healthBarHeight = 4;
            const healthPercentage = enemy.health / enemy.maxHealth;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x - cameraX, enemy.y - 8, healthBarWidth, healthBarHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(enemy.x - cameraX, enemy.y - 8, healthBarWidth * healthPercentage, healthBarHeight);
        }
    });
    
    // 보스 그리기
    bosses.forEach(boss => {
        if (!boss.dead && boss.x > cameraX - 100 && boss.x < cameraX + canvas.width + 100) {
            ctx.fillStyle = boss.color;
            ctx.fillRect(boss.x - cameraX, boss.y, boss.width, boss.height);
            
            // 보스 체력바 그리기
            const healthBarWidth = boss.width;
            const healthBarHeight = 8;
            const healthPercentage = boss.health / boss.maxHealth;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(boss.x - cameraX, boss.y - 12, healthBarWidth, healthBarHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(boss.x - cameraX, boss.y - 12, healthBarWidth * healthPercentage, healthBarHeight);
            
            // 보스 이름 표시
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(boss.type, boss.x - cameraX + boss.width/2, boss.y - 20);
            ctx.textAlign = 'left';
        }
    });
    
    // 투사체 그리기
    projectiles.forEach(projectile => {
        if (projectile.x > cameraX - 50 && projectile.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(projectile.x - cameraX, projectile.y, projectile.width, projectile.height);
        }
    });
    
    // 파티클 그리기
    particles.forEach(particle => {
        if (particle.x > cameraX - 50 && particle.x < cameraX + canvas.width + 50) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            ctx.beginPath();
            ctx.arc(particle.x - cameraX, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
    
    // 플레이어 그리기
    drawCharacter(player.x - cameraX, player.y, player.character);
    
    // 플레이어 체력바 그리기
    const healthBarWidth = player.width;
    const healthBarHeight = 6;
    const healthPercentage = player.health / player.maxHealth;
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(player.x - cameraX, player.y - 10, healthBarWidth, healthBarHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x - cameraX, player.y - 10, healthBarWidth * healthPercentage, healthBarHeight);
    
    // 게임 정보 표시
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`스테이지: ${currentStage}`, 10, 30);
    ctx.fillText(`점수: ${score}`, 10, 50);
    ctx.fillText(`생명: ${lives}`, 10, 70);
    
    // 현재 행성 정보
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`행성: ${theme.planetName}`, 10, 90);
    
    // 캐릭터 정보
    if (characters[player.character]) {
        const char = characters[player.character];
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(`캐릭터: ${player.character}`, 10, 110);
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`HP: ${player.health}/${player.maxHealth}`, 10, 130);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`능력: ${char.ability}`, 10, 150);
        ctx.fillStyle = '#FF69B4';
        ctx.fillText(`점프력: ${char.jumpPower}`, 10, 170);
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`속도: ${char.moveSpeed.toFixed(1)}x`, 10, 190);
        
        // 스킬 쿨다운 표시
        if (player.skillCooldown > 0) {
            ctx.fillStyle = '#FF4500';
            ctx.fillText(`스킬 쿨다운: ${Math.ceil(player.skillCooldown / 60)}초`, 10, 210);
        }
    }
    
    // 일시정지 표시
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('일시정지', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
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
    if (!gameRunning) return;
    
    updatePlayer();
    updateEnemies();
    updateBosses();
    updateCoins();
    updatePowerUps();
    updateParticles();
    updateProjectiles();
    updateCamera();
    checkStageClear();
    render();
    
    requestAnimationFrame(gameLoop);
}

// 게임 시작
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 5;
    currentStage = 1;
    
    // 플레이어 초기화
    player.character = selectedCharacter;
    player.health = characters[selectedCharacter]?.hp || 120;
    player.maxHealth = player.health;
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // 첫 번째 스테이지 생성
    generateStage();
    
    // UI 숨기기
    startScreen.style.display = 'none';
    characterSelectScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // 컨트롤 표시
    mobileControls.style.display = 'flex';
    pauseBtn.style.display = 'block';
    
    // 게임 루프 시작
    gameLoop();
    
    console.log('게임 시작!');
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    
    // 최고 점수 저장
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // 게임 오버 화면 표시
    finalScoreElement.textContent = score;
    finalStageElement.textContent = currentStage;
    highScoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
    
    // 컨트롤 숨기기
    mobileControls.style.display = 'none';
    pauseBtn.style.display = 'none';
    
    console.log('게임 오버!');
}

// 생명 잃기
function loseLife() {
    lives--;
    player.health = player.maxHealth;
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    
    if (lives <= 0) {
        gameOver();
    } else {
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
    // 모바일 컨트롤 설정
    setupMobileControls();
    
    // 키보드 컨트롤 설정
    setupKeyboardControls();
    
    // 일시정지 버튼 초기 숨김
    pauseBtn.style.display = 'none';
    
    // 초기 화면 표시
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    characterSelectScreen.style.display = 'none';
    
    // 최고 점수 표시
    highScoreElement.textContent = highScore;
    
    console.log('게임 초기화 완료!');
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