// ========================================
// 게임 핵심 로직 (game-core.js) - 밸런스 개선 버전
// ========================================

// 게임 상태 관리
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 5;
let currentStage = 1;
let isFullscreen = false;

// 게임 설정
const GRAVITY = 0.8;
const JUMP_POWER = 18;
const MOVE_SPEED = 6;
const STAGE_WIDTH = 8000; // 맵 크기 대폭 증가

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
                if (player.onGround) {
                    jump();
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
    
    if (startScreen) startScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    // 게임 상태 초기화
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 5;
    currentStage = 1;
    
    // 플레이어 초기화
    resetPlayer();
    
    // 카메라 초기화
    cameraX = 0;
    
    // 스테이지 생성
    generateStage();
    
    // UI 업데이트
    updateUI();
    
    // 게임 루프 시작
    gameLoop();
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

// 점프 함수
function jump() {
    if (player.onGround && !player.jumping) {
        player.velocityY = -JUMP_POWER;
        player.jumping = true;
        player.onGround = false;
        
        // 점프 파티클 생성
        createParticle(player.x + player.width/2, player.y + player.height, '#87CEEB');
        
        console.log('점프!');
    }
}

// 플레이어 리셋
function resetPlayer() {
    player.x = 100;
    player.y = 800;
    player.velocityX = 0;
    player.velocityY = 0;
    player.health = 300;
    player.attacking = false;
    player.attackCooldown = 0;
    player.invincible = false;
    player.invincibleTime = 0;
}

// 공격 함수
function attack() {
    player.attacking = true;
    player.attackCooldown = 30;
    
    // 공격 범위 내의 적 체크
    const attackRange = 80;
    enemies.forEach(enemy => {
        const distance = Math.abs(player.x - enemy.x);
        if (distance < attackRange) {
            enemy.health -= 50;
            if (enemy.health <= 0) {
                // 적 제거
                const index = enemies.indexOf(enemy);
                if (index > -1) {
                    enemies.splice(index, 1);
                    score += 200;
                    createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000');
                }
            }
        }
    });
    
    // 공격 파티클 생성
    createParticle(player.x + (player.direction > 0 ? player.width : 0), player.y + player.height/2, '#FFD700');
    
    console.log('공격!');
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
    
    console.log(`데미지 받음: ${damage}, 남은 체력: ${player.health}`);
    
    // 체력이 0이 되면 생명 감소
    if (player.health <= 0) {
        loseLife();
    }
    
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

// 게임 오버
function gameOver() {
    console.log('게임 오버!');
    gameRunning = false;
    
    // 최종 점수 설정
    const finalScore = document.getElementById('finalScore');
    const finalStage = document.getElementById('finalStage');
    
    if (finalScore) finalScore.textContent = score;
    if (finalStage) finalStage.textContent = currentStage;
    
    // 게임 오버 화면 표시
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.style.display = 'block';
}

// 파티클 생성
function createParticle(x, y, color) {
    particles.push({
        x: x,
        y: y,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4,
        color: color,
        life: 30
    });
}

// 컨트롤 가이드 표시
function showControlGuide() {
    const guide = `
🎮 **게임 컨트롤 가이드**

**이동:**
- A / ←: 왼쪽 이동
- D / →: 오른쪽 이동
- 스페이스바: 점프

**액션:**
- F: 공격
- P: 일시정지
- F11: 전체화면 토글

**전체화면:**
- 우측 상단 ⛶ 버튼 클릭
- 또는 F11 키 사용

**게임 시스템:**
- 적을 물리치고 코인을 모으세요!
- 스테이지 진행도가 100%가 되면 다음 스테이지로!
- 체력이 0이 되면 생명이 감소합니다
- 무적 시간 동안은 추가 데미지를 받지 않습니다

**게임 목표:**
- 높은 점수를 기록하세요!
- 최대한 많은 스테이지를 클리어하세요!
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
        updateParticles();
        
        // 렌더링
        renderGame();
    }
    
    // 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 게임 시작
console.log('게임 핵심 로직 (밸런스 개선 버전) 로드 완료!'); 