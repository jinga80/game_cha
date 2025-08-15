// ========================================
// 게임 객체 관리 (game-objects.js) - 적 수 증가 및 대시 기능 구현 버전
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
    attackCooldown: 0,
    invincible: false, // 무적 상태
    invincibleTime: 0, // 무적 시간
    projectiles: [], // 발사체 배열
    jumpCount: 0, // 점프 횟수
    character: '기본' // 선택된 캐릭터
};

// 게임 객체들
let platforms = [];
let enemies = [];
let coins = [];
let particles = [];
let cameraX = 0;

// 스테이지 관련 변수
let stageProgress = 0; // 스테이지 진행도 (0-100)
let stageComplete = false; // 스테이지 완료 여부
let stageTimer = 0; // 스테이지 타이머

// 발사체 클래스
class Projectile {
    constructor(x, y, direction, type = 'normal', damage = 50) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.velocityX = direction * 12; // 발사 속도
        this.velocityY = 0;
        this.direction = direction;
        this.type = type;
        this.damage = damage; // 데미지 추가
        this.life = 60; // 1초 후 사라짐
        this.exploded = false;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
        
        // 화면 밖으로 나가면 제거
        if (this.x < cameraX - 100 || this.x > cameraX + canvas.width + 100) {
            this.life = 0;
        }
    }
    
    render(ctx) {
        if (this.exploded) return;
        
        const x = this.x - cameraX;
        if (x < 0 || x > canvas.width) return;
        
        // 발사체 타입별 색상
        let bodyColor = '#FFD700'; // 기본 골드
        let borderColor = '#FF4500'; // 기본 오렌지
        let tailColor = '#FF4500'; // 기본 오렌지
        
        switch(this.type) {
            case 'sword':
                bodyColor = '#FF4500'; // 빨강
                borderColor = '#8B0000'; // 진한 빨강
                tailColor = '#FF0000'; // 빨강
                break;
            case 'arrow':
                bodyColor = '#00FF00'; // 초록
                borderColor = '#006400'; // 진한 초록
                tailColor = '#32CD32'; // 라임
                break;
            case 'hammer':
                bodyColor = '#8B4513'; // 갈색
                borderColor = '#654321'; // 진한 갈색
                tailColor = '#A0522D'; // 시에나
                break;
            case 'bomb':
                bodyColor = '#FF0000'; // 빨강
                borderColor = '#8B0000'; // 진한 빨강
                tailColor = '#FF4500'; // 오렌지
                break;
        }
        
        // 발사체 몸체
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 발사체 테두리
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 발사체 꼬리 효과
        ctx.fillStyle = tailColor;
        ctx.beginPath();
        ctx.arc(x + this.width/2 - this.direction * 8, this.y + this.height/2, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 폭발 효과 클래스
class Explosion {
    constructor(x, y, size = 50) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.particles = [];
        this.life = 30;
        
        // 폭발 파티클 생성
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * size,
                y: y + (Math.random() - 0.5) * size,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                color: ['#FF4500', '#FFD700', '#FF6347', '#FF8C00'][Math.floor(Math.random() * 4)],
                life: 30 + Math.random() * 20
            });
        }
    }
    
    update() {
        this.life--;
        this.particles.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityX *= 0.95; // 마찰력
            particle.velocityY *= 0.95;
            particle.life--;
        });
        
        // 죽은 파티클 제거
        this.particles = this.particles.filter(p => p.life > 0);
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        const x = this.x - cameraX;
        if (x < 0 || x > canvas.width) return;
        
        // 폭발 중심
        ctx.fillStyle = `rgba(255, 69, 0, ${this.life / 30})`;
        ctx.beginPath();
        ctx.arc(x, this.y, this.size * (1 - this.life / 30), 0, Math.PI * 2);
        ctx.fill();
        
        // 폭발 파티클들
        this.particles.forEach(particle => {
            const px = particle.x - cameraX;
            if (px > 0 && px < canvas.width) {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life / 50;
                ctx.beginPath();
                ctx.arc(px, particle.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }
}

// 폭발 효과 배열
let explosions = [];

// 플레이어 업데이트
function updatePlayer() {
    // 이동 처리 (캐릭터별 속도 적용)
    let currentMoveSpeed = player.speed || MOVE_SPEED;
    let currentDashSpeed = currentMoveSpeed * 2; // 대시는 기본 속도의 2배
    
    if (keys['KeyS'] && (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyD'] || keys['ArrowRight'])) {
        currentMoveSpeed = currentDashSpeed; // 대시 속도
        isDashing = true;
        
        // 대시 파티클 생성
        if (Math.random() < 0.3) {
            createParticle(player.x + player.width/2, player.y + player.height, '#00FFFF');
        }
    }
    
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.velocityX = -currentMoveSpeed;
        player.direction = -1;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
        player.velocityX = currentMoveSpeed;
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
                player.jumpCount = 0; // 착지 시 점프 횟수 초기화
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
    if (keys['KeyF'] && player.attackCooldown <= 0) {
        attack();
    }
    
    // 공격 쿨다운 감소
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }
    
    // 무적 시간 감소
    if (player.invincibleTime > 0) {
        player.invincibleTime--;
        if (player.invincibleTime <= 0) {
            player.invincible = false;
        }
    }
    
    // 발사체 업데이트
    updateProjectiles();
    
    // 폭발 효과 업데이트
    updateExplosions();
    
    // 카메라 따라가기
    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > STAGE_WIDTH - canvas.width) cameraX = STAGE_WIDTH - canvas.width;
    
    // 스테이지 진행도 업데이트
    updateStageProgress();
}

// 발사체 업데이트
function updateProjectiles() {
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        const projectile = player.projectiles[i];
        projectile.update();
        
        // 적과의 충돌 체크
        enemies.forEach(enemy => {
            if (projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y) {
                
                // 캐릭터별 데미지 적용
                const damage = projectile.damage || 50;
                enemy.health -= damage;
                
                // 폭발 효과 생성 (데미지에 따라 크기 조정)
                const explosionSize = Math.min(60 + damage * 0.5, 100);
                explosions.push(new Explosion(projectile.x + projectile.width/2, projectile.y + projectile.height/2, explosionSize));
                
                // 발사체 제거
                player.projectiles.splice(i, 1);
                
                // 데미지 파티클 생성
                createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000');
                
                // 적이 죽었는지 체크
                if (enemy.health <= 0) {
                    const enemyIndex = enemies.indexOf(enemy);
                    if (enemyIndex > -1) {
                        enemies.splice(enemyIndex, 1);
                        score += 200;
                        
                        // 적 처치 파티클 (캐릭터별 색상)
                        let particleColor = '#FF0000';
                        if (player.character === '검사') particleColor = '#FF4500';
                        else if (player.character === '궁수') particleColor = '#00FF00';
                        else if (player.character === '망치전문가') particleColor = '#8B4513';
                        else if (player.character === '폭탄전문가') particleColor = '#FF0000';
                        
                        createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, particleColor);
                        
                        console.log(`${player.character}가 ${enemy.type}를 처치! 데미지: ${damage}`);
                    }
                } else {
                    console.log(`${player.character}가 ${enemy.type}에게 ${damage} 데미지! 남은 체력: ${enemy.health}`);
                }
                
                return;
            }
        });
        
        // 수명이 다한 발사체 제거
        if (projectile.life <= 0) {
            player.projectiles.splice(i, 1);
        }
    }
}

// 폭발 효과 업데이트
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.update();
        
        if (explosion.life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// 적 업데이트 (AI 강화 및 점프 기능 추가)
function updateEnemies() {
    enemies.forEach(enemy => {
        // 플레이어와의 거리 계산
        const distanceToPlayer = Math.abs(player.x - enemy.x);
        const playerDirection = player.x > enemy.x ? 1 : -1;
        
        // AI 상태 결정 (범위 확장!)
        if (distanceToPlayer < 350) { // 200 → 350으로 확장
            // 플레이어가 가까우면 추적 모드
            enemy.state = 'chase';
            enemy.targetX = player.x;
            
            // 플레이어 방향으로 이동
            if (enemy.x < player.x) {
                enemy.velocityX = 3; // 2 → 3으로 증가
                enemy.direction = 1;
            } else {
                enemy.velocityX = -3; // -2 → -3으로 증가
                enemy.direction = -1;
            }
            
            // 적 점프 시스템 (플레이어가 높은 곳에 있을 때)
            if (player.y < enemy.y - 50 && enemy.onGround && Math.random() < 0.02) {
                enemy.velocityY = -15; // 적 점프력
                enemy.onGround = false;
                enemy.jumping = true;
                console.log(`${enemy.type}가 점프!`);
            }
            
        } else if (distanceToPlayer < 600) { // 400 → 600으로 확장
            // 플레이어가 중간 거리에 있으면 경계 모드
            enemy.state = 'alert';
            
            // 플레이어 방향을 바라보기
            enemy.direction = playerDirection;
            
            // 천천히 플레이어 방향으로 이동
            if (enemy.x < player.x) {
                enemy.velocityX = 1; // 0.5 → 1로 증가
            } else {
                enemy.velocityX = -1; // -0.5 → -1로 증가
            }
            
        } else {
            // 플레이어가 멀리 있으면 순찰 모드
            enemy.state = 'patrol';
            
            // 랜덤한 방향으로 이동
            if (Math.random() < 0.02) { // 2% 확률로 방향 전환
                enemy.direction *= -1;
            }
            
            enemy.velocityX = enemy.direction * 1.2; // 0.8 → 1.2로 증가
        }
        
        // 적 중력 및 점프 처리
        enemy.velocityY += 0.6; // 적 중력 (플레이어보다 약함)
        enemy.y += enemy.velocityY;
        
        // 적 플랫폼 충돌 체크
        enemy.onGround = false;
        platforms.forEach(platform => {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y < platform.y + platform.height &&
                enemy.y + enemy.height > platform.y) {
                
                if (enemy.velocityY > 0 && enemy.y < platform.y) {
                    // 위에서 착지
                    enemy.y = platform.y - enemy.height;
                    enemy.velocityY = 0;
                    enemy.onGround = true;
                    enemy.jumping = false;
                }
            }
        });
        
        // 이동 적용
        enemy.x += enemy.velocityX;
        
        // 경계 체크
        if (enemy.x <= 0 || enemy.x >= STAGE_WIDTH - enemy.width) {
            enemy.direction *= -1;
            enemy.velocityX *= -1;
        }
        
        // 적 공격 쿨다운 감소
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }
        
        // 플레이어와의 충돌 체크 (적 공격)
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            if (!player.attacking && !player.invincible && enemy.attackCooldown <= 0) {
                // 적이 플레이어를 공격
                enemyAttack(enemy);
            }
        }
        
        // 적이 화면 밖으로 나가면 제거
        if (enemy.x < cameraX - 100 || enemy.x > cameraX + canvas.width + 100) {
            const index = enemies.indexOf(enemy);
            if (index > -1) {
                enemies.splice(index, 1);
                // 적 제거 시 점수 추가
                score += 50;
            }
        }
    });
}

// 적 공격 함수
function enemyAttack(enemy) {
    // 적 공격 쿨다운 설정
    enemy.attackCooldown = 120; // 2초 (60fps 기준)
    
    // 플레이어에게 데미지 (적 타입에 따라 다른 데미지)
    let damage = 0;
    if (enemy.type === '나무돌이') {
        damage = 15; // 나무돌이는 약한 공격
    } else if (enemy.type === '나무왕') {
        damage = 25; // 나무왕은 중간 공격
    } else if (enemy.type === '포탑몬') {
        damage = 20; // 포탑몬은 중간 공격
    } else {
        damage = 20; // 기본 데미지
    }
    
    // 난이도별 데미지 조정
    const difficulty = DIFFICULTY_SETTINGS[gameDifficulty];
    damage = Math.round(damage * difficulty.enemyDamage);
    
    // 플레이어에게 데미지 적용
    takeDamage(damage);
    
    // 공격 파티클 생성
    createParticle(player.x + player.width/2, player.y + player.height/2, '#FF0000');
    
    // 플레이어를 밀어내기
    if (enemy.x < player.x) {
        player.velocityX = 8; // 오른쪽으로 밀어내기
    } else {
        player.velocityX = -8; // 왼쪽으로 밀어내기
    }
    
    console.log(`${enemy.type}의 공격! 데미지: ${damage}`);
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
                
                // 스테이지 진행도 증가
                stageProgress += 2;
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

// 스테이지 진행도 업데이트
function updateStageProgress() {
    // 플레이어 위치에 따른 진행도 계산
    const progressFromPosition = (player.x / STAGE_WIDTH) * 60; // 위치 기반 60%
    
    // 코인 수집 기반 진행도 (이미 updateCoins에서 처리됨)
    const progressFromCoins = stageProgress;
    
    // 적 처치 기반 진행도
    const totalEnemies = 25; // 스테이지당 총 적 수 증가
    const remainingEnemies = enemies.length;
    const defeatedEnemies = totalEnemies - remainingEnemies;
    const progressFromEnemies = (defeatedEnemies / totalEnemies) * 30; // 적 처치 기반 30%
    
    // 전체 진행도 계산
    const totalProgress = Math.min(progressFromPosition + progressFromCoins + progressFromEnemies, 100);
    
    if (totalProgress >= 100 && !stageComplete) {
        completeStage();
    }
}

// 스테이지 완료
function completeStage() {
    stageComplete = true;
    console.log(`스테이지 ${currentStage} 완료!`);
    
    // 완료 파티클 생성
    for (let i = 0; i < 20; i++) {
        createParticle(
            player.x + player.width/2 + (Math.random() - 0.5) * 100,
            player.y + player.height/2 + (Math.random() - 0.5) * 100,
            '#00FF00'
        );
    }
    
    // 스테이지 완료 메시지 표시
    showStageCompleteMessage();
    
    // 3초 후 다음 스테이지로
    setTimeout(() => {
        nextStage();
    }, 3000);
}

// 스테이지 완료 메시지 표시
function showStageCompleteMessage() {
    // 메시지 파티클 생성
    const message = `스테이지 ${currentStage} 완료!`;
    console.log(message);
    
    // 화면에 메시지 표시 (렌더링에서 처리)
}

// 다음 스테이지로
function nextStage() {
    currentStage++;
    
    // 행성 변경 체크 (20스테이지마다)
    if (currentStage > 20 && currentPlanet < 5) {
        currentPlanet++;
        console.log(`🎉 새로운 행성으로 이동! ${PLANET_THEMES[currentPlanet].name}`);
        
        // 행성 변경 축하 파티클
        for (let i = 0; i < 50; i++) {
            createParticle(
                canvas.width / 2 + (Math.random() - 0.5) * 400,
                canvas.height / 2 + (Math.random() - 0.5) * 300,
                ['#FFD700', '#FF4500', '#00FF00', '#0080FF', '#FF00FF'][currentPlanet - 1],
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
        }
    }
    
    stageProgress = 0;
    stageComplete = false;
    stageTimer = 0;
    
    console.log(`스테이지 ${currentStage} 시작! (${PLANET_THEMES[currentPlanet].name})`);
    
    // 플레이어 위치 재설정
    player.x = 100;
    player.y = 800;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // 발사체 초기화
    player.projectiles = [];
    player.jumpCount = 0; // 점프 횟수 초기화
    
    // 스테이지 재생성
    generateStage();
    
    // UI 업데이트
    updateUI();
}

// 스테이지 생성
function generateStage() {
    console.log(`스테이지 ${currentStage} 생성 시작... (${PLANET_THEMES[currentPlanet].name})`);
    
    // 기존 객체들 초기화
    platforms = [];
    enemies = [];
    coins = [];
    particles = [];
    explosions = [];
    
    // 현재 행성 테마 가져오기
    const planetTheme = PLANET_THEMES[currentPlanet];
    
    // 지면 플랫폼 (행성 테마에 맞는 색상)
    const groundLevel = canvas.height - 100;
    platforms.push({
        x: 0,
        y: groundLevel,
        width: STAGE_WIDTH,
        height: 100,
        type: 'ground',
        color: planetTheme.background.ground
    });
    
    // 중간 플랫폼들 (행성 테마에 맞는 색상)
    const platformPositions = [
        {x: 400, y: 700, width: 200, height: 20},
        {x: 800, y: 650, width: 200, height: 20},
        {x: 1200, y: 600, width: 200, height: 20},
        {x: 1600, y: 550, width: 200, height: 20},
        {x: 2000, y: 500, width: 200, height: 20},
        {x: 2400, y: 550, width: 200, height: 20},
        {x: 2800, y: 600, width: 200, height: 20},
        {x: 3200, y: 650, width: 200, height: 20},
        {x: 3600, y: 700, width: 200, height: 20},
        {x: 4000, y: 650, width: 200, height: 20},
        {x: 4400, y: 600, width: 200, height: 20},
        {x: 4800, y: 550, width: 200, height: 20},
        {x: 5200, y: 500, width: 200, height: 20},
        {x: 5600, y: 550, width: 200, height: 20},
        {x: 6000, y: 600, width: 200, height: 20},
        {x: 6400, y: 650, width: 200, height: 20},
        {x: 6800, y: 700, width: 200, height: 20},
        {x: 7200, y: 650, width: 200, height: 20},
        {x: 7600, y: 600, width: 200, height: 20}
    ];
    
    platformPositions.forEach(pos => {
        platforms.push({
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            type: 'platform',
            color: planetTheme.background.platforms
        });
    });
    
    platformPositions.forEach(pos => {
        platforms.push({
            x: pos.x,
            y: pos.y,
            width: pos.width,
            height: pos.height,
            type: 'platform'
        });
    });
    
    // 적 생성 (스테이지별로 다른 적 배치, 수량 대폭 증가)
    const enemyPositions = generateEnemyPositions();
    
    enemyPositions.forEach(pos => {
        enemies.push({
            x: pos.x,
            y: pos.y,
            width: 40,
            height: 60,
            type: pos.type,
            health: pos.health,
            maxHealth: pos.health,
            velocityX: pos.velocityX,
            velocityY: 0, // 점프를 위한 velocityY 추가
            direction: pos.direction,
            attackCooldown: 0,
            attackPower: pos.attackPower,
            state: 'patrol', // AI 상태: patrol, alert, chase
            targetX: pos.x, // 목표 위치
            onGround: true, // 점프를 위한 onGround 추가
            jumping: false // 점프 상태 추가
        });
    });
    
    // 코인 생성 (HD2D 스타일에 맞게 최적화)
    coins = [];
    
    // 지면 코인들 (더 넓은 간격)
    for (let i = 0; i < 25; i++) {
        const x = 150 + i * 320; // 400 → 320으로 간격 축소
        const y = groundLevel - 30; // 지면 위
        coins.push({
            x: x,
            y: y,
            width: 20,
            height: 20,
            collected: false
        });
    }
    
    // 플랫폼 위 코인들 (더 많은 플랫폼에 배치)
    platformPositions.forEach((platform, index) => {
        if (index % 3 === 0 || index % 3 === 1) { // 2/3 플랫폼에 코인 배치
            coins.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 30,
                width: 20,
                height: 20,
                collected: false
            });
        }
    });
    
    // 공중 코인들 (HD2D 스타일에 맞게 조정)
    for (let i = 0; i < 20; i++) {
        const x = 200 + i * 400;
        const y = 300 + Math.sin(i * 0.3) * 80; // 사인파 형태로 배치 (높이 조정)
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

// 스테이지별 적 위치 및 능력치 생성 (행성 테마별로 다른 적)
function generateEnemyPositions() {
    const groundLevel = canvas.height - 100;
    const positions = [];
    const planetTheme = PLANET_THEMES[currentPlanet];
    
    // 행성별 기본 적 타입
    const basicEnemyType = planetTheme.enemies[0]; // 첫 번째 적 타입
    const eliteEnemyType = planetTheme.enemies[1]; // 두 번째 적 타입
    const specialEnemyType = planetTheme.enemies[2]; // 세 번째 적 타입
    
    // 기본 적들 (행성 테마에 맞는 타입)
    const basicEnemies = [
        // 첫 번째 구간 (0-2000)
        {x: 300, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 600, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 900, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 1200, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 1500, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 1800, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        
        // 두 번째 구간 (2000-4000)
        {x: 2200, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 2500, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 2800, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 3100, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 3400, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 3700, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        
        // 세 번째 구간 (4000-6000)
        {x: 4200, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 4500, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 4800, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 5100, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 5400, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 5700, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        
        // 네 번째 구간 (6000-8000)
        {x: 6200, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 6500, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 6800, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 7100, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 7400, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15},
        {x: 7700, y: groundLevel - 60, type: basicEnemyType, health: 80, velocityX: -1, direction: -1, attackPower: 15}
    ];
    
    positions.push(...basicEnemies);
    
    // 스테이지별 특수 적 추가 (행성 테마에 맞는 타입)
    if (currentStage >= 5) {
        positions.push(
            {x: 5500, y: groundLevel - 60, type: eliteEnemyType, health: 150, velocityX: -0.8, direction: -1, attackPower: 25}
        );
    }
    
    if (currentStage >= 10) {
        positions.push(
            {x: 6000, y: groundLevel - 60, type: specialEnemyType, health: 120, velocityX: 0, direction: 1, attackPower: 20}
        );
    }
    
    if (currentStage >= 15) {
        positions.push(
            {x: 6500, y: groundLevel - 60, type: eliteEnemyType, health: 150, velocityX: -0.8, direction: -1, attackPower: 25},
            {x: 7000, y: groundLevel - 60, type: specialEnemyType, health: 120, velocityX: 0, direction: 1, attackPower: 20}
        );
    }
    
    // 보스 스테이지 (5의 배수 스테이지)
    if (currentStage % 5 === 0) {
        bossStage = true;
        const bossX = STAGE_WIDTH - 500; // 맵 끝부분에 보스 배치
        positions.push({
            x: bossX,
            y: groundLevel - 120, // 보스는 더 크게
            width: 80, // 보스 크기
            height: 120,
            type: planetTheme.boss,
            health: 500,
            maxHealth: 500,
            velocityX: 0,
            direction: -1,
            attackPower: 50,
            isBoss: true
        });
        console.log(`보스 스테이지! ${planetTheme.boss} 등장!`);
    }
    
    // 난이도별 적 능력치 조정
    const difficulty = DIFFICULTY_SETTINGS[gameDifficulty];
    positions.forEach(pos => {
        pos.health = Math.round(pos.health * difficulty.enemyHealth);
        pos.velocityX = pos.velocityX * difficulty.enemySpeed;
    });
    
    return positions;
}

console.log('게임 객체 관리 시스템 (적 수 증가 및 대시 기능 구현 버전) 로드 완료!'); 