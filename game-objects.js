// ========================================
// 게임 객체 관리 (game-objects.js)
// ========================================

// 플레이어 객체
const player = {
    x: 100,
    y: 800,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    jumping: false,
    onGround: false,
    health: 300,
    maxHealth: 300,
    direction: 1, // 1: 오른쪽, -1: 왼쪽
    attacking: false,
    attackCooldown: 0
};

// 게임 객체들
let platforms = [];
let enemies = [];
let coins = [];
let particles = [];
let cameraX = 0;

// 플레이어 업데이트
function updatePlayer() {
    // 이동 처리
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.velocityX = -MOVE_SPEED;
        player.direction = -1;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
        player.velocityX = MOVE_SPEED;
        player.direction = 1;
    } else {
        player.velocityX *= 0.8; // 마찰력
    }
    
    // 중력 적용
    player.velocityY += GRAVITY;
    
    // 위치 업데이트
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // 경계 체크
    if (player.x < 0) player.x = 0;
    if (player.x > STAGE_WIDTH - player.width) player.x = STAGE_WIDTH - player.width;
    
    // 플랫폼 충돌 체크
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            if (player.velocityY > 0 && player.y < platform.y) {
                // 위에서 착지
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                player.jumping = false;
            } else if (player.velocityY < 0 && player.y + player.height > platform.y + platform.height) {
                // 아래에서 부딪힘
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            } else if (player.velocityX > 0 && player.x < platform.x) {
                // 왼쪽에서 부딪힘
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (player.velocityX < 0 && player.x + player.width > platform.x + platform.width) {
                // 오른쪽에서 부딪힘
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    });
    
    // 낙사 체크
    if (player.y > canvas.height + 100) {
        loseLife();
    }
    
    // 공격 처리
    if (keys['KeyF'] && !player.attacking && player.attackCooldown <= 0) {
        attack();
    }
    
    // 공격 쿨다운 감소
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }
    
    // 카메라 따라가기
    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > STAGE_WIDTH - canvas.width) cameraX = STAGE_WIDTH - canvas.width;
}

// 적 업데이트
function updateEnemies() {
    enemies.forEach(enemy => {
        // 간단한 AI
        enemy.x += enemy.velocityX;
        
        // 방향 전환
        if (enemy.x <= 0 || enemy.x >= STAGE_WIDTH - enemy.width) {
            enemy.velocityX *= -1;
            enemy.direction *= -1;
        }
        
        // 플레이어와의 충돌 체크
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (!player.attacking) {
                takeDamage(50);
                console.log('적에게 공격받음!');
            }
        }
        
        // 공격 쿨다운 감소
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }
    });
}

// 코인 업데이트
function updateCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            // 플레이어와의 충돌 체크
            if (player.x < coin.x + coin.width &&
                player.x + player.width > coin.x &&
                player.y < coin.y + coin.height &&
                player.y + player.height > coin.y) {
                
                coin.collected = true;
                score += 100;
                createParticle(coin.x + coin.width/2, coin.y + coin.height/2, '#FFD700');
                console.log('코인 획득!');
            }
        }
    });
}

// 파티클 업데이트
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 스테이지 생성
function generateStage() {
    console.log('스테이지 생성 시작...');
    
    // 기존 객체들 초기화
    platforms = [];
    enemies = [];
    coins = [];
    particles = [];
    
    // 지면 플랫폼
    const groundLevel = canvas.height - 100;
    platforms.push({
        x: 0,
        y: groundLevel,
        width: STAGE_WIDTH,
        height: 100,
        type: 'ground'
    });
    
    // 중간 플랫폼들
    const platformPositions = [
        {x: 400, y: 700, width: 200, height: 20},
        {x: 800, y: 600, width: 200, height: 20},
        {x: 1200, y: 500, width: 200, height: 20},
        {x: 1600, y: 400, width: 200, height: 20},
        {x: 2000, y: 300, width: 200, height: 20},
        {x: 2400, y: 400, width: 200, height: 20},
        {x: 2800, y: 500, width: 200, height: 20},
        {x: 3200, y: 600, width: 200, height: 20},
        {x: 3600, y: 700, width: 200, height: 20},
        {x: 4000, y: 600, width: 200, height: 20},
        {x: 4400, y: 500, width: 200, height: 20},
        {x: 4800, y: 400, width: 200, height: 20},
        {x: 5200, y: 300, width: 200, height: 20},
        {x: 5600, y: 400, width: 200, height: 20},
        {x: 6000, y: 500, width: 200, height: 20},
        {x: 6400, y: 600, width: 200, height: 20},
        {x: 6800, y: 700, width: 200, height: 20},
        {x: 7200, y: 600, width: 200, height: 20},
        {x: 7600, y: 500, width: 200, height: 20}
    ];
    
    platformPositions.forEach(pos => {
        platforms.push({
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            type: 'platform'
        });
    });
    
    // 적 생성
    const enemyPositions = [
        {x: 500, y: groundLevel - 60, type: '나무돌이'},
        {x: 1000, y: groundLevel - 60, type: '나무돌이'},
        {x: 1500, y: groundLevel - 60, type: '나무돌이'},
        {x: 2000, y: groundLevel - 60, type: '나무돌이'},
        {x: 2500, y: groundLevel - 60, type: '나무돌이'},
        {x: 3000, y: groundLevel - 60, type: '나무돌이'},
        {x: 3500, y: groundLevel - 60, type: '나무돌이'},
        {x: 4000, y: groundLevel - 60, type: '나무돌이'},
        {x: 4500, y: groundLevel - 60, type: '나무돌이'},
        {x: 5000, y: groundLevel - 60, type: '나무돌이'},
        {x: 5500, y: groundLevel - 60, type: '나무돌이'},
        {x: 6000, y: groundLevel - 60, type: '나무돌이'},
        {x: 6500, y: groundLevel - 60, type: '나무돌이'},
        {x: 7000, y: groundLevel - 60, type: '나무돌이'},
        {x: 7500, y: groundLevel - 60, type: '나무돌이'}
    ];
    
    enemyPositions.forEach(pos => {
        enemies.push({
            x: pos.x,
            y: pos.y,
            width: 40,
            height: 60,
            type: pos.type,
            health: 100,
            maxHealth: 100,
            velocityX: -1,
            direction: -1,
            attackCooldown: 0
        });
    });
    
    // 코인 생성
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * STAGE_WIDTH;
        const y = Math.random() * (canvas.height - 200) + 100;
        coins.push({
            x: x,
            y: y,
            width: 20,
            height: 20,
            collected: false
        });
    }
    
    console.log(`스테이지 생성 완료! 플랫폼: ${platforms.length}, 적: ${enemies.length}, 코인: ${coins.length}`);
}

console.log('게임 객체 관리 시스템 로드 완료!'); 