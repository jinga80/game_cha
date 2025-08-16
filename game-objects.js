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

// cameraX 안전한 값 체크 함수
function ensureValidCameraX() {
    if (!isFinite(cameraX) || isNaN(cameraX)) {
        console.warn('⚠️ cameraX 값 오류 감지, 0으로 초기화:', cameraX);
        cameraX = 0;
    }
}

// 스테이지 관련 변수
let stageProgress = 0; // 스테이지 진행도 (0-100)
let stageComplete = false; // 스테이지 완료 여부
let stageTimer = 0; // 스테이지 타이머

// 위쪽 발사체 클래스
class UpwardProjectile {
    constructor(x, y, type = 'upward', damage = 50) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.velocityX = 0; // 수평 이동 없음
        this.velocityY = -15; // 위쪽으로 이동
        this.direction = 0; // 위쪽 방향
        this.type = type;
        this.damage = damage;
        this.life = 60; // 1초 후 사라짐
        this.exploded = false;
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
        
        // 화면 위로 나가면 제거 (cameraY 대신 고정값 사용)
        if (this.y < -100) {
            this.life = 0;
        }
    }
    
    render(ctx) {
        if (this.exploded) return;
        
        const x = this.x - cameraX;
        const y = this.y; // cameraY 제거, 절대 좌표 사용
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
        
        // 위쪽 발사체 타입별 색상
        let bodyColor = '#FFD700'; // 기본 골드
        let borderColor = '#FF4500'; // 기본 오렌지
        let tailColor = '#FF4500'; // 기본 오렌지
        
        switch(this.type) {
            case 'upward_sword':
                bodyColor = '#FF4500'; // 빨강
                borderColor = '#8B0000'; // 진한 빨강
                tailColor = '#FF0000'; // 빨강
                break;
            case 'upward_arrow':
                bodyColor = '#00FF00'; // 초록
                borderColor = '#006400'; // 진한 초록
                tailColor = '#32CD32'; // 라임
                break;
            case 'upward_hammer':
                bodyColor = '#8B4513'; // 갈색
                borderColor = '#654321'; // 진한 갈색
                tailColor = '#A0522D'; // 시에나
                break;
            case 'upward_bomb':
                bodyColor = '#FF0000'; // 빨강
                borderColor = '#8B0000'; // 진한 빨강
                tailColor = '#FF4500'; // 오렌지
                break;
        }
        
        // 위쪽 발사체 몸체 (위쪽을 향하는 화살표 모양)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + this.height);
        ctx.lineTo(x, y);
        ctx.lineTo(x + this.width, y);
        ctx.closePath();
        ctx.fill();
        
        // 위쪽 발사체 테두리
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 위쪽 발사체 꼬리 효과 (아래쪽에)
        ctx.fillStyle = tailColor;
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + this.height + 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

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
    
    // 무기 업그레이드 지속 시간 감소
    if (player.weaponUpgradeTime > 0) {
        player.weaponUpgradeTime--;
        if (player.weaponUpgradeTime <= 0) {
            resetWeaponUpgrade();
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
    
    // cameraX 값 안전성 체크
    ensureValidCameraX();
    
    // 아이템 충돌 체크
    updateItems();
    
    // 보스 등장 조건 체크
    checkAndSpawnBoss();
    
    // 스테이지 진행도 업데이트
    updateStageProgress();
}

// 발사체 업데이트
function updateProjectiles() {
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        const projectile = player.projectiles[i];
        projectile.update();
        
        // 적과의 충돌 체크 (위쪽 발사체와 일반 발사체 모두 처리)
        enemies.forEach(enemy => {
            // 위쪽 발사체는 날아다니는 적과 더 잘 맞도록 충돌 범위 확장
            let collisionRange = 0;
            if (projectile.velocityY < 0) { // 위쪽으로 발사되는 발사체
                collisionRange = 10; // 충돌 범위 확장
            }
            
            if (projectile.x < enemy.x + enemy.width + collisionRange &&
                projectile.x + projectile.width > enemy.x - collisionRange &&
                projectile.y < enemy.y + enemy.height + collisionRange &&
                projectile.y + projectile.height > enemy.y - collisionRange) {
                
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
                        
                        // 보스 처치 시 스테이지 클리어 체크
                        if (enemy.isBoss) {
                            console.log(`🏆 보스를 처치했습니다! 스테이지 ${currentStage} 클리어!`);
                            stageComplete = true;
                            stageProgress = 100;
                            stageCompleteProcessed = false; // 자동 진행 플래그 초기화
                            
                            // 보스 처치 축하 파티클
                            for (let i = 0; i < 50; i++) {
                                createParticle(
                                    enemy.x + enemy.width/2,
                                    enemy.y + enemy.height/2,
                                    '#FFD700',
                                    (Math.random() - 0.5) * 10,
                                    (Math.random() - 0.5) * 10
                                );
                            }
                            
                            // 보스 처치 효과음 재생
                            if (audioSystem && audioSystem.playStageClearSound) {
                                audioSystem.playStageClearSound();
                            }
                            
                            // 스테이지 클리어 메시지 표시
                            showStageCompleteMessage();
                            
                            // 보스 처치 시 자동으로 스테이지 진행 (코인 수집 불필요)
                            console.log(`🎮 코인을 다 먹지 않아도 보스 처치로 스테이지 진행!`);
                        }
                        
                        // 적 처치 파티클 (캐릭터별 색상)
                        let particleColor = '#FF0000';
                        if (player.character === '검사') particleColor = '#FF4500';
                        else if (player.character === '궁수') particleColor = '#00FF00';
                        else if (player.character === '망치전문가') particleColor = '#8B4513';
                        else if (player.character === '폭탄전문가') particleColor = '#FF0000';
                        
                        createParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, particleColor);
                        
                        // 적 처치 효과음 재생
                        if (audioSystem && audioSystem.playEnemyHitSound) {
                            audioSystem.playEnemyHitSound();
                        }
                        
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

// 아이템 업데이트 (충돌 감지 및 효과 적용)
function updateItems() {
    // 체력 회복 아이템 충돌 체크
    for (let i = healthItems.length - 1; i >= 0; i--) {
        const item = healthItems[i];
        if (!item.collected && 
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            
            // 체력 회복
            const healAmount = item.healAmount || Math.floor(player.maxHealth * 0.25);
            player.health = Math.min(player.health + healAmount, player.maxHealth);
            
            // 아이템 수집 효과
            item.collected = true;
            healthItems.splice(i, 1);
            
            // 회복 파티클 생성
            for (let i = 0; i < 20; i++) {
                createParticle(player.x + player.width/2, player.y, '#00FF00');
            }
            
            // 회복 효과음 재생
            if (audioSystem && audioSystem.playPowerUpSound) {
                audioSystem.playPowerUpSound();
            }
            
            console.log(`💚 체력 회복 아이템 획득! +${healAmount} 체력, 현재 체력: ${player.health}`);
        }
    }
    
    // 무기 업그레이드 아이템 충돌 체크
    for (let i = weaponUpgrades.length - 1; i >= 0; i--) {
        const item = weaponUpgrades[i];
        if (!item.collected && 
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
            
            // 무기 업그레이드 적용
            applyWeaponUpgrade(item.type);
            
            // 아이템 수집 효과
            item.collected = true;
            weaponUpgrades.splice(i, 1);
            
            // 업그레이드 파티클 생성
            for (let i = 0; i < 30; i++) {
                createParticle(player.x + player.width/2, player.y, '#FFD700');
            }
            
            // 업그레이드 효과음 재생
            if (audioSystem && audioSystem.playPowerUpSound) {
                audioSystem.playPowerUpSound();
            }
            
            console.log(`🔫 무기 업그레이드 아이템 획득! 타입: ${item.type}`);
        }
    }
}

// 무기 업그레이드 적용 함수 (Contra 게임 스타일)
function applyWeaponUpgrade(type) {
    switch(type) {
        case 'spread':
            // 산탄총: 여러 갈래로 발사
            player.weaponType = 'spread';
            player.spreadCount = 3; // 3갈래 발사
            player.spreadAngle = 30; // 발사 각도
            console.log('🔫 산탄총 업그레이드! 3갈래 발사');
            break;
            
        case 'homing':
            // 유도탄: 적을 자동으로 추적
            player.weaponType = 'homing';
            player.homingEnabled = true;
            player.homingRange = 300; // 유도 범위
            console.log('🔫 유도탄 업그레이드! 자동 추적 발사');
            break;
            
        case 'rapid':
            // 연사: 발사 속도 증가
            player.weaponType = 'rapid';
            player.rapidFire = true;
            player.attackCooldown = Math.floor(player.attackCooldown * 0.5); // 쿨다운 50% 감소
            console.log('🔫 연사 업그레이드! 발사 속도 증가');
            break;
            
        case 'laser':
            // 레이저: 직선으로 관통하는 강력한 무기
            player.weaponType = 'laser';
            player.laserEnabled = true;
            player.laserDamage = player.attackPower * 2; // 데미지 2배
            console.log('🔫 레이저 업그레이드! 관통 데미지 증가');
            break;
            
        case 'missile':
            // 미사일: 폭발하는 강력한 무기
            player.weaponType = 'missile';
            player.missileEnabled = true;
            player.missileDamage = player.attackPower * 1.5; // 데미지 1.5배
            player.missileExplosionRadius = 100; // 폭발 범위
            console.log('🔫 미사일 업그레이드! 폭발 데미지 증가');
            break;
            
        default:
            console.log('🔫 알 수 없는 무기 업그레이드 타입:', type);
    }
    
    // 무기 업그레이드 지속 시간 설정 (30초)
    player.weaponUpgradeTime = 1800; // 60fps * 30초
}

// 무기 업그레이드 리셋 함수
function resetWeaponUpgrade() {
    player.weaponType = 'normal';
    player.spreadCount = 1;
    player.spreadAngle = 0;
    player.homingEnabled = false;
    player.homingRange = 0;
    player.rapidFire = false;
    player.laserEnabled = false;
    player.laserDamage = player.attackPower;
    player.missileEnabled = false;
    player.missileDamage = player.attackPower;
    player.missileExplosionRadius = 0;
    
    console.log('🔫 무기 업그레이드 효과가 만료되었습니다.');
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
        
        // 날아다니는 적 특별 처리 (새처럼 다이브 공격)
        if (enemy.isFlying) {
            // 공중에서 움직임 (중력 영향 없음)
            enemy.y += enemy.velocityY || 0;
            
            // 새 적 다이브 공격 AI
            if (enemy.isBirdEnemy) {
                const distanceToPlayer = Math.abs(player.x - enemy.x);
                
                // 다이브 공격 쿨다운 감소
                if (enemy.diveAttackCooldown > 0) {
                    enemy.diveAttackCooldown--;
                }
                
                // 플레이어가 가까이 오면 다이브 공격
                if (distanceToPlayer < 300 && enemy.diveAttackCooldown <= 0 && !enemy.diveAttackMode) {
                    enemy.diveAttackMode = true;
                    enemy.diveAttackCooldown = 180; // 3초 쿨다운
                    enemy.originalY = enemy.y;
                    console.log(`🦅 ${enemy.type} 다이브 공격 시작!`);
                }
                
                // 다이브 공격 모드
                if (enemy.diveAttackMode) {
                    if (enemy.y < enemy.originalY + 150) { // 다이브 진행 중
                        enemy.velocityY = 8; // 빠른 하강
                        enemy.velocityX = (player.x > enemy.x) ? 2 : -2; // 플레이어 방향으로 이동
                    } else { // 다이브 완료, 원래 높이로 복귀
                        enemy.diveAttackMode = false;
                        enemy.velocityY = -6; // 위로 상승
                    }
                } else {
                    // 일반 비행 모드 (사인파 움직임)
                    if (enemy.flyingHeight !== undefined) {
                        const time = Date.now() * 0.001;
                        enemy.y = enemy.flyingHeight + Math.sin(time + enemy.x * 0.01) * 30;
                    }
                    
                    // 원래 높이로 복귀
                    if (enemy.y < enemy.originalY - 10) {
                        enemy.velocityY = 2;
                    } else if (enemy.y > enemy.originalY + 10) {
                        enemy.velocityY = -2;
                    } else {
                        enemy.velocityY = 0;
                    }
                }
            } else {
                // 기존 날아다니는 적 처리
                if (enemy.flyingHeight !== undefined) {
                    const time = Date.now() * 0.001;
                    enemy.y = enemy.flyingHeight + Math.sin(time + enemy.x * 0.01) * 30;
                }
            }
            
            // 날아다니는 적은 플랫폼 충돌 무시
        } else {
            // 일반 적 중력 및 점프 처리
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
        }
        
        // 굴러오는 폭탄 몹 특별 처리 (플레이어 접근 시 3초 카운팅 후 자폭)
        if (enemy.isRollingBomb) {
            const distanceToPlayer = Math.sqrt(
                Math.pow(player.x + player.width/2 - (enemy.x + enemy.width/2), 2) +
                Math.pow(player.y + player.height/2 - (enemy.y + enemy.height/2), 2)
            );
            
            // 플레이어가 가까이 오면 카운팅 시작
            if (distanceToPlayer < 200 && !enemy.countdownStarted) {
                enemy.countdownStarted = true;
                enemy.isCountingDown = true;
                enemy.countdownStartTime = Date.now();
                console.log(`💣 폭탄이 플레이어를 감지! 3초 후 폭발!`);
            }
            
            // 카운팅 중일 때
            if (enemy.isCountingDown) {
                const elapsedTime = Date.now() - enemy.countdownStartTime;
                const remainingTime = 3000 - elapsedTime;
                
                if (remainingTime <= 0) {
                    // 시간이 다 되면 폭발
                    createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.explosionRadius);
                    
                    // 플레이어가 폭발 범위 안에 있으면 데미지
                    if (distanceToPlayer < enemy.explosionRadius && !player.invincible) {
                        player.health -= enemy.attackPower;
                        player.invincible = true;
                        player.invincibleTime = 60;
                        console.log(`💥 폭탄 자폭! 플레이어 체력: ${player.health}`);
                    }
                    
                    // 폭탄 제거
                    const index = enemies.indexOf(enemy);
                    if (index > -1) {
                        enemies.splice(index, 1);
                    }
                    return; // 이 적은 더 이상 처리하지 않음
                }
                
                // 카운팅 시각적 효과 (깜빡임 및 색상 변화)
                const countdownProgress = remainingTime / 3000;
                if (countdownProgress < 0.5) {
                    enemy.type = remainingTime % 200 < 100 ? '💣' : '💥';
                } else if (countdownProgress < 0.8) {
                    enemy.type = remainingTime % 300 < 150 ? '💣' : '⚠️';
                }
                
                // 경고 파티클 생성
                if (remainingTime % 500 < 16) { // 0.5초마다
                    createParticle(enemy.x + enemy.width/2, enemy.y, '#FF0000');
                }
                
                // 콘솔에 카운팅 표시
                if (remainingTime % 1000 < 16) { // 1초마다
                    const seconds = Math.ceil(remainingTime / 1000);
                    console.log(`💣 폭탄 폭발까지 ${seconds}초!`);
                }
            }
        }
        
        // 보스 특별 처리 (강력한 AI 및 공격 패턴)
        if (enemy.isBoss) {
            // 보스 상태 초기화
            if (enemy.bossState === undefined) {
                enemy.bossState = 'idle';
                enemy.bossTimer = 0;
                enemy.bossAttackCooldown = 0;
                enemy.bossHealthBar = true;
            }
            
            enemy.bossTimer++;
            
            // 보스 AI 상태 머신
            switch (enemy.bossState) {
                case 'idle':
                    // 대기 상태 (플레이어가 가까이 오면 공격 모드로 전환)
                    if (distanceToPlayer < 400) {
                        enemy.bossState = 'attack';
                        enemy.bossTimer = 0;
                        console.log(`🏆 ${enemy.type} 공격 모드로 전환!`);
                    }
                    break;
                    
                case 'attack':
                    // 공격 모드
                    if (enemy.bossTimer < 120) { // 2초간 공격
                        // 플레이어 방향으로 이동
                        if (enemy.x < player.x) {
                            enemy.velocityX = 2;
                            enemy.direction = 1;
                        } else {
                            enemy.velocityX = -2;
                            enemy.direction = -1;
                        }
                        
                        // 특수 공격 (점프 공격)
                        if (enemy.bossTimer % 60 === 0 && enemy.onGround) {
                            enemy.velocityY = -20;
                            enemy.onGround = false;
                            console.log(`🏆 ${enemy.type} 점프 공격!`);
                        }
                    } else {
                        // 공격 모드 종료, 회복 모드로 전환
                        enemy.bossState = 'recover';
                        enemy.bossTimer = 0;
                        enemy.velocityX = 0;
                        console.log(`🏆 ${enemy.type} 회복 모드로 전환!`);
                    }
                    break;
                    
                case 'recover':
                    // 회복 모드 (체력 회복)
                    if (enemy.bossTimer < 180) { // 3초간 회복
                        enemy.velocityX = 0;
                        // 체력 회복 (매 프레임마다 1씩)
                        if (enemy.health < enemy.maxHealth) {
                            enemy.health = Math.min(enemy.health + 1, enemy.maxHealth);
                        }
                    } else {
                        // 회복 완료, 다시 대기 모드로
                        enemy.bossState = 'idle';
                        enemy.bossTimer = 0;
                        console.log(`🏆 ${enemy.type} 대기 모드로 전환!`);
                    }
                    break;
            }
            
            // 보스 공격 쿨다운
            if (enemy.bossAttackCooldown > 0) {
                enemy.bossAttackCooldown--;
            }
            
            // 보스 특수 능력 (지진 효과)
            if (enemy.bossState === 'attack' && enemy.bossTimer % 120 === 0) {
                // 지진 파티클 생성
                for (let i = 0; i < 10; i++) {
                    createParticle(
                        enemy.x + enemy.width/2 + (Math.random() - 0.5) * 100,
                        enemy.y + enemy.height,
                        '#8B4513'
                    );
                }
                console.log(`🏆 ${enemy.type} 지진 효과!`);
            }
        }
        
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
    const difficulty = window.DIFFICULTY_SETTINGS ? window.DIFFICULTY_SETTINGS[gameDifficulty] : {
        enemyDamage: 1.0
    };
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
                
                // 코인 획득 효과음 재생
                if (audioSystem && audioSystem.playCoinSound) {
                    audioSystem.playCoinSound();
                }
                
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

// 스테이지 진행도 업데이트 (보스 처치 시 자동 진행)
function updateStageProgress() {
    // 보스 처치 시 자동으로 스테이지 진행
    if (stageComplete && !stageCompleteProcessed) {
        stageCompleteProcessed = true;
        console.log(`🏆 보스 처치로 인한 스테이지 ${currentStage} 자동 진행!`);
        
        // 3초 후 다음 스테이지로
        setTimeout(() => {
            nextStage();
        }, 3000);
        return;
    }
    
    // 기존 진행도 시스템 (코인 수집, 적 처치 등)
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

// 스테이지 완료 (코인 수집, 적 처치 등으로 완료)
function completeStage() {
    // 보스 처치로 이미 완료된 경우 중복 실행 방지
    if (stageComplete) {
        console.log(`🏆 보스 처치로 이미 스테이지가 완료되었습니다.`);
        return;
    }
    
    stageComplete = true;
    stageCompleteProcessed = false; // 자동 진행 플래그 초기화
    console.log(`스테이지 ${currentStage} 완료! (코인 수집/적 처치)`);
    
    // 완료 파티클 생성
    for (let i = 0; i < 20; i++) {
        createParticle(
            player.x + player.width/2 + (Math.random() - 0.5) * 100,
            player.y + player.height/2 + (Math.random() - 0.5) * 100,
            '#00FF00'
        );
    }
    
    // 스테이지 완료 효과음 재생
    if (audioSystem && audioSystem.playStageClearSound) {
        audioSystem.playStageClearSound();
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
    
    // 보스 관련 플래그 리셋
    window.bossSpawned = false;
    window.currentStageBossData = null;
    
    console.log(`스테이지 ${currentStage} 시작! (${PLANET_THEMES[currentPlanet].name})`);
    console.log(`🔄 보스 플래그 리셋 완료: bossSpawned=${window.bossSpawned}, currentStageBossData=${!!window.currentStageBossData}`);
    
    // 플레이어 위치 재설정
    player.x = 100;
    player.y = 800;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // 발사체 초기화
    player.projectiles = [];
    player.jumpCount = 0; // 점프 횟수 초기화
    
    // 새로운 스테이지 시작 시 2초간 무적 상태
    player.invincible = true;
    player.invincibleTime = 120; // 2초 (60fps 기준)
    console.log(`🛡️ 스테이지 ${currentStage} 시작! 2초간 무적 상태`);
    
    // 스테이지 재생성
    generateStage();
    
    // UI 업데이트
    updateUI();
}

// 스테이지 생성
function generateStage() {
    console.log(`🚀 스테이지 ${currentStage} 생성 시작... (${PLANET_THEMES[currentPlanet].name})`);
    console.log(`📍 현재 행성: ${currentPlanet}, 행성 테마:`, PLANET_THEMES[currentPlanet]);
    
    // 기존 객체들 초기화
    platforms = [];
    enemies = [];
    coins = [];
    healthItems = []; // 체력 회복 아이템 배열 추가
    weaponUpgrades = []; // 무기 업그레이드 아이템 배열 추가
    particles = [];
    explosions = [];
    
    console.log(`🔄 기존 객체들 초기화 완료`);
    
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
    const enemyPositions = generateEnemyPositions(currentStage);
    
    enemyPositions.forEach(pos => {
        const enemy = {
            x: pos.x,
            y: pos.y,
            width: pos.width || 40,
            height: pos.height || 60,
            type: pos.type,
            health: pos.health,
            maxHealth: pos.health,
            velocityX: pos.velocityX,
            velocityY: pos.velocityY || 0,
            direction: pos.direction,
            attackCooldown: 0,
            attackPower: pos.attackPower,
            state: 'patrol', // AI 상태: patrol, alert, chase
            targetX: pos.x, // 목표 위치
            onGround: true, // 점프를 위한 onGround 추가
            jumping: false // 점프 상태 추가
        };
        
        // 특별한 적 타입별 속성 추가
        if (pos.isFlying) {
            enemy.isFlying = true;
            enemy.flyingHeight = pos.flyingHeight;
        }
        
        if (pos.isBirdEnemy) {
            enemy.isBirdEnemy = true;
            enemy.diveAttackCooldown = pos.diveAttackCooldown || 0;
            enemy.diveAttackMode = pos.diveAttackMode || false;
            enemy.originalY = pos.originalY;
        }
        
        if (pos.isRollingBomb) {
            enemy.isRollingBomb = true;
            enemy.explosionRadius = pos.explosionRadius;
            enemy.fuseTime = pos.fuseTime;
            enemy.isCountingDown = pos.isCountingDown || false;
            enemy.countdownStarted = pos.countdownStarted || false;
            enemy.countdownStartTime = pos.countdownStartTime;
            enemy.warningParticles = pos.warningParticles || [];
        }
        
        if (pos.isBoss) {
            enemy.isBoss = true;
            enemy.bossStage = pos.bossStage || false;
            enemy.isGoldenBoss = pos.isGoldenBoss || false;
            enemy.bossState = 'idle'; // 보스 AI 상태 초기화
            enemy.bossTimer = 0; // 보스 타이머 초기화
            enemy.bossAttackCooldown = 0; // 보스 공격 쿨다운 초기화
            enemy.bossHealthBar = true; // 보스 체력바 표시
        }
        
        enemies.push(enemy);
        
        // 적 생성 로그
        if (pos.isBoss) {
            console.log(`🏆 보스 생성: ${pos.type} at (${pos.x}, ${pos.y})`);
        } else if (pos.isBirdEnemy) {
            console.log(`🦅 새 적 생성: ${pos.type} at (${pos.x}, ${pos.y})`);
        } else if (pos.isRollingBomb) {
            console.log(`💣 폭탄 적 생성: ${pos.type} at (${pos.x}, ${pos.y})`);
        } else {
            console.log(`👹 일반 적 생성: ${pos.type} at (${pos.x}, ${pos.y})`);
        }
    });
    
    console.log(`🎯 적 ${enemies.length}개 생성 완료`);
    
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
    
    // 체력 회복 아이템 생성 (체력 50% 이하일 때 25% 확률로 언덕 위에 생성)
    if (player.health <= player.maxHealth * 0.5 && Math.random() < 0.25) {
        const healthItemX = 1200 + Math.random() * 1000; // 언덕 위에 랜덤 위치
        const healthItemY = 500 + Math.random() * 100; // 언덕 높이
        
        healthItems.push({
            x: healthItemX,
            y: healthItemY,
            width: 30,
            height: 30,
            type: 'health',
            collected: false,
            healAmount: Math.floor(player.maxHealth * 0.25) // 체력 25% 회복
        });
        
        console.log(`💚 체력 회복 아이템 생성: (${healthItemX}, ${healthItemY}), 회복량: ${Math.floor(player.maxHealth * 0.25)}`);
    }
    
    // 무기 업그레이드 아이템 생성 (날아다니는 적과 유사한 로직으로 공중에 생성)
    const weaponUpgradeTypes = ['spread', 'homing', 'rapid', 'laser', 'missile'];
    const selectedType = weaponUpgradeTypes[Math.floor(Math.random() * weaponUpgradeTypes.length)];
    
    if (Math.random() < 0.3) { // 30% 확률로 생성
        const weaponX = 800 + Math.random() * 2000; // 스테이지 중간 부분에 랜덤 위치
        const weaponY = groundLevel - 300 + Math.random() * 200; // 공중에 랜덤 높이
        
        weaponUpgrades.push({
            x: weaponX,
            y: weaponY,
            width: 25,
            height: 25,
            type: selectedType,
            collected: false,
            velocityY: Math.sin(Date.now() * 0.001) * 0.5 // 상하 움직임
        });
        
        console.log(`🔫 무기 업그레이드 아이템 생성: ${selectedType} at (${weaponX}, ${weaponY})`);
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

// 스테이지별 적 위치 및 능력치 생성 (행성 테마별로 다른 적) - 몹 5배 증가 + 새로운 적 타입
function generateEnemyPositions(stageNumber = 1) {
    // canvas가 정의되지 않은 경우를 대비한 안전한 groundLevel 계산
    let groundLevel;
    if (typeof canvas !== 'undefined' && canvas && canvas.height && isFinite(canvas.height)) {
        groundLevel = canvas.height - 100;
    } else {
        // 기본값 사용 (800 - 100 = 700)
        groundLevel = 700;
        console.warn(`⚠️ canvas를 찾을 수 없거나 유효하지 않아 기본 groundLevel 사용: ${groundLevel}`);
    }
    
    // groundLevel 최종 검증
    if (!isFinite(groundLevel) || isNaN(groundLevel)) {
        groundLevel = 700; // 강제로 기본값 설정
        console.error(`❌ groundLevel이 유효하지 않아 강제로 기본값 설정: ${groundLevel}`);
    }
    
    console.log(`🌍 groundLevel 최종값: ${groundLevel}`);
    const positions = [];
    const planetTheme = PLANET_THEMES[currentPlanet];
    
    // 행성별 기본 적 타입
    const basicEnemyType = planetTheme.enemies[0]; // 첫 번째 적 타입
    const eliteEnemyType = planetTheme.enemies[1]; // 두 번째 적 타입
    const specialEnemyType = planetTheme.enemies[2]; // 세 번째 적 타입
    
    // 새로운 적 타입들
    const flyingEnemyType = '🦅'; // 날아다니는 적
    const rollingBombType = '💣'; // 굴러오는 폭탄 몹
    
    // 스테이지별 난이도 증가 계수 (지수적 증가로 더 도전적)
    const stageMultiplier = Math.max(1, Math.pow(stageNumber, 0.8) * 0.4); // 스테이지별로 지수적 증가
    const healthMultiplier = Math.max(1, Math.pow(stageNumber, 0.7) * 0.6); // 체력은 지수적 증가
    const attackMultiplier = Math.max(1, Math.pow(stageNumber, 0.6) * 0.5); // 공격력은 지수적 증가
    const enemyCountMultiplier = Math.max(1, Math.pow(stageNumber, 0.5) * 0.3); // 적 수는 지수적 증가
    const bossHealthMultiplier = Math.max(1, Math.pow(stageNumber, 0.9) * 0.8); // 보스 체력은 더 강한 지수적 증가
    const bossAttackMultiplier = Math.max(1, Math.pow(stageNumber, 0.8) * 0.7); // 보스 공격력은 지수적 증가
    
    console.log(`🎯 스테이지 ${stageNumber} 난이도 계수: 체력 x${healthMultiplier.toFixed(1)}, 공격력 x${attackMultiplier.toFixed(1)}, 적 수 x${enemyCountMultiplier.toFixed(1)}`);
    
    // 기본 적들 (스테이지 전체에 고르게 분산 배치) - 주인공과 겹치지 않도록 최소 거리 확보
    const basicEnemies = [];
    const minDistanceFromPlayer = 800; // 주인공과의 최소 거리
    const stageWidth = 8000; // 스테이지 전체 너비
    const enemyCount = 120; // 총 적 수 (기존 120개 유지)
    
    for (let i = 0; i < enemyCount; i++) {
        // 스테이지 전체에 고르게 분산 (주인공 시작 위치 100을 고려)
        const x = minDistanceFromPlayer + (i * (stageWidth - minDistanceFromPlayer)) / enemyCount;
        const y = groundLevel - 60;
        
        // 좌표값 검증 (더 엄격하게)
        const validX = Math.floor(x);
        const validY = Math.floor(y);
        
        if (isFinite(validX) && isFinite(validY) && !isNaN(validX) && !isNaN(validY) && validX >= 0 && validY >= 0) {
            basicEnemies.push({
                x: validX,
                y: validY,
                type: basicEnemyType,
                health: Math.floor(80 * healthMultiplier),
                velocityX: -1,
                direction: -1,
                attackPower: Math.floor(15 * attackMultiplier)
            });
        } else {
            console.warn(`⚠️ 유효하지 않은 기본 적 좌표: (${validX}, ${validY}), groundLevel: ${groundLevel}`);
        }
    }
    
    positions.push(...basicEnemies);
    
    // 날아다니는 적들 추가 (스테이지 전체에 고르게 분산)
    const flyingEnemies = [];
    for (let i = 0; i < 14; i++) {
        // 스테이지 전체에 고르게 분산 (주인공과 겹치지 않도록)
        const x = minDistanceFromPlayer + (i * (stageWidth - minDistanceFromPlayer)) / 14;
        const y = groundLevel - 200 - (i % 3) * 50; // 높이를 다양하게
        // 좌표값 검증 (더 엄격하게)
        const validFlyingX = Math.floor(x);
        const validFlyingY = Math.floor(y);
        
        if (isFinite(validFlyingX) && isFinite(validFlyingY) && !isNaN(validFlyingX) && !isNaN(validFlyingY) && validFlyingX >= 0 && validFlyingY >= 0) {
            flyingEnemies.push({
                x: validFlyingX,
                y: validFlyingY,
                type: '🦅', // 독수리 이모지로 변경
                health: Math.floor(60 * healthMultiplier),
                velocityX: -1.2, // 더 빠른 속도
                velocityY: Math.sin(i * 0.5) * 0.8, // 더 큰 상하 움직임
                direction: -1,
                attackPower: Math.floor(15 * attackMultiplier), // 공격력 증가
                isFlying: true,
                flyingHeight: validFlyingY,
                isBirdEnemy: true, // 새 적 표시
                diveAttackCooldown: 0, // 다이브 공격 쿨다운
                diveAttackMode: false, // 다이브 공격 모드
                originalY: validFlyingY // 원래 높이 저장
            });
        } else {
            console.warn(`⚠️ 유효하지 않은 날아다니는 적 좌표: (${validFlyingX}, ${validFlyingY}), groundLevel: ${groundLevel}`);
        }
    }
    positions.push(...flyingEnemies);
    
    // 굴러오는 폭탄 몹들 추가 (스테이지 전체에 고르게 분산)
    const rollingBombs = [];
    for (let i = 0; i < 11; i++) {
        // 스테이지 전체에 고르게 분산 (주인공과 겹치지 않도록)
        const x = minDistanceFromPlayer + (i * (stageWidth - minDistanceFromPlayer)) / 11;
        const y = groundLevel - 40;
        
        // 좌표값 검증
        const validX = Math.floor(x);
        const validY = Math.floor(y);
        
        if (isFinite(validX) && isFinite(validY) && !isNaN(validX) && !isNaN(validY) && validX >= 0 && validY >= 0) {
            rollingBombs.push({
                x: validX,
                y: validY,
                type: '💣', // 폭탄 이모지로 변경
                health: Math.floor(40 * healthMultiplier),
                velocityX: -1.5,
                direction: -1,
                attackPower: Math.floor(30 * attackMultiplier), // 폭발 시 높은 데미지
                isRollingBomb: true,
                explosionRadius: 120, // 폭발 범위 증가
                fuseTime: 3000, // 3초 카운팅
                isCountingDown: false, // 카운팅 시작 여부
                countdownStarted: false, // 카운팅 시작 시간
                warningParticles: [] // 경고 파티클
            });
        } else {
            console.warn(`⚠️ 유효하지 않은 폭탄 몹 좌표: (${validX}, ${validY}), groundLevel: ${groundLevel}`);
        }
    }
    positions.push(...rollingBombs);
    
    // 스테이지별 특수 적 추가 (행성 테마에 맞는 타입) - 스테이지별로 능력치 증가
    if (stageNumber >= 5) {
        // 엘리트 적 5개로 증가
        for (let i = 0; i < 5; i++) {
            const x = 5500 + i * 200;
            const y = groundLevel - 60;
            
            // 좌표값 검증
            if (isFinite(x) && isFinite(y) && !isNaN(x) && !isNaN(y) && x >= 0 && y >= 0) {
                positions.push({
                    x: x,
                    y: y,
                    type: eliteEnemyType,
                    health: Math.floor(150 * healthMultiplier),
                    velocityX: -0.8,
                    direction: -1,
                    attackPower: Math.floor(25 * attackMultiplier)
                });
            } else {
                console.warn(`⚠️ 유효하지 않은 엘리트 적 좌표: (${x}, ${y}), groundLevel: ${groundLevel}`);
            }
        }
    }
    
    if (stageNumber >= 10) {
        // 특수 적 5개로 증가
        for (let i = 0; i < 5; i++) {
            const x = 6000 + i * 200;
            positions.push({
                x: x,
                y: groundLevel - 60,
                type: specialEnemyType,
                health: Math.floor(120 * healthMultiplier),
                velocityX: 0,
                direction: 1,
                attackPower: Math.floor(20 * attackMultiplier)
            });
        }
    }
    
    if (stageNumber >= 15) {
        // 엘리트 적과 특수 적 각각 8개씩
        for (let i = 0; i < 8; i++) {
            const x = 6500 + i * 150;
            positions.push({
                x: x,
                y: groundLevel - 60,
                type: eliteEnemyType,
                health: Math.floor(150 * healthMultiplier),
                velocityX: -0.8,
                direction: -1,
                attackPower: Math.floor(25 * attackMultiplier)
            });
        }
        
        for (let i = 0; i < 8; i++) {
            const x = 7000 + i * 150;
            positions.push({
                x: x,
                y: groundLevel - 60,
                type: specialEnemyType,
                health: Math.floor(120 * healthMultiplier),
                velocityX: 0,
                direction: 1,
                attackPower: Math.floor(20 * attackMultiplier)
            });
        }
    }
    
    // 스테이지별 추가 적 생성 (난이도 증가) - 더 일찍 시작하고 점진적 증가
    if (stageNumber >= 10) {
        const additionalEnemies = Math.floor(stageNumber * 1.2); // 10스테이지부터 1.2개씩 추가
        for (let i = 0; i < additionalEnemies; i++) {
            // 스테이지 전체에 고르게 분산
            const x = minDistanceFromPlayer + (i * (stageWidth - minDistanceFromPlayer)) / additionalEnemies;
            const y = groundLevel - 60;
            positions.push({
                x: Math.floor(x),
                y: y,
                type: basicEnemyType,
                health: Math.floor(120 * healthMultiplier), // 기본 적보다 강함
                velocityX: -1.5, // 더 빠름
                direction: -1,
                attackPower: Math.floor(20 * attackMultiplier) // 더 강한 공격력
            });
        }
        console.log(`🎯 스테이지 ${stageNumber}: 추가 적 ${additionalEnemies}개 생성`);
    }
    
    // 보스는 모든 잡몹을 처치한 후에 등장하도록 예약만 해두기 (실제 생성은 나중에)
    // groundLevel이 유효하지 않은 경우를 대비한 안전한 계산
    let bossY;
    if (typeof groundLevel === 'number' && isFinite(groundLevel)) {
        bossY = groundLevel - 200;
    } else {
        // 기본값 사용 (800 - 100 - 200 = 500)
        bossY = 500;
        console.warn(`⚠️ groundLevel이 유효하지 않아 기본 bossY 사용: ${bossY}`);
    }
    
    // y 좌표 최종 검증
    if (!isFinite(bossY) || isNaN(bossY)) {
        console.error(`❌ 보스 y 좌표 최종 오류: groundLevel=${groundLevel}, bossY=${bossY}`);
        console.error(`🔍 변수 상태: groundLevel=${typeof groundLevel} ${groundLevel}, bossY=${typeof bossY} ${bossY}`);
        // 오류 시 보스 데이터를 생성하지 않고 positions만 반환
        console.log(`🚫 보스 데이터 생성 건너뛰기`);
        return positions;
    }
    
    const bossData = {
        x: 2000, // 화면에 보이도록 위치 조정
        y: bossY, // 검증된 y 좌표 사용
        width: 200, // 보스 크기 (일반 적의 5배)
        height: 200,
        type: planetTheme.boss,
        health: Math.floor(500 * bossHealthMultiplier), // 보스 전용 체력 계수 적용
        maxHealth: Math.floor(500 * bossHealthMultiplier),
        velocityX: 0,
        direction: -1,
        attackPower: Math.floor(50 * bossAttackMultiplier), // 보스 전용 공격력 계수 적용
        isBoss: true,
        bossStage: true,
        isGoldenBoss: true, // 디아블로 스타일 보스 표시
        isBossReserved: true // 보스 예약 플래그
    };
    
    // 보스 데이터를 전역 변수에 저장 (나중에 모든 잡몹 처치 후 생성)
    window.currentStageBossData = bossData;
    
    // 보스 데이터 저장 확인 (간소화)
    console.log(`🏆 스테이지 ${stageNumber} 보스 예약: ${planetTheme.boss} (${bossData.x}, ${bossData.y})`);
    
    // 난이도별 적 능력치 조정
    const difficulty = window.DIFFICULTY_SETTINGS ? window.DIFFICULTY_SETTINGS[gameDifficulty] : {
        enemyHealth: 1.0,
        enemySpeed: 1.0
    };
    
    positions.forEach(pos => {
        pos.health = Math.round(pos.health * difficulty.enemyHealth);
        pos.velocityX = pos.velocityX * difficulty.enemySpeed;
    });
    
    // 디버깅: 생성된 적들의 상세 정보 출력
    console.log(`🎯 === 스테이지 ${stageNumber} 적 생성 완료 ===`);
    console.log(`📊 총 적 수: ${positions.length}`);
    
    const basicCount = positions.filter(p => !p.isFlying && !p.isRollingBomb && !p.isBoss).length;
    const flyingCount = positions.filter(p => p.isFlying).length;
    const bombCount = positions.filter(p => p.isRollingBomb).length;
    
    console.log(`👹 기본 적: ${basicCount}개`);
    console.log(`🦅 날아다니는 적: ${flyingCount}개`);
    console.log(`💣 폭탄 적: ${bombCount}개`);
    console.log(`🏆 보스: 예약됨 (모든 잡몹 처치 후 등장)`);
    
    // 각 타입별 첫 번째 적 정보 출력
    const firstFlying = positions.find(p => p.isFlying);
    const firstBomb = positions.find(p => p.isRollingBomb);
    const firstBoss = positions.find(p => p.isBoss);
    
    if (firstFlying) {
        console.log(`🦅 첫 번째 날아다니는 적: ${firstFlying.type} at (${firstFlying.x}, ${firstFlying.y})`);
    }
    if (firstBomb) {
        console.log(`💣 첫 번째 폭탄 적: ${firstBomb.type} at (${firstBomb.x}, ${firstBomb.y})`);
    }
    
    return positions;
}

// 보스 등장 조건 체크 및 생성 함수
function checkAndSpawnBoss() {
    // 보스가 이미 등장했거나 예약되지 않은 경우 리턴
    if (!window.currentStageBossData) {
        console.log(`❌ 보스 데이터가 없습니다.`);
        return;
    }
    
    // 보스가 이미 등장했다고 표시되었지만 실제로는 없는 경우 플래그 리셋
    if (window.bossSpawned) {
        const actualBoss = enemies.find(enemy => enemy.isBoss);
        if (!actualBoss) {
            console.log(`⚠️ 보스 플래그 리셋`);
            window.bossSpawned = false;
        } else {
            return; // 실제 보스가 있으면 리턴
        }
    }
    
    // 모든 잡몹(보스가 아닌 적)이 처치되었는지 체크
    const remainingEnemies = enemies.filter(enemy => !enemy.isBoss);
    
    // 잡몹이 남아있으면 로그 없이 리턴 (로그 스팸 방지)
    if (remainingEnemies.length > 0) {
        return;
    }
    
    if (remainingEnemies.length === 0) {
        console.log(`🎯 모든 잡몹을 처치했습니다! 보스 등장!`);
        
        // 보스 생성
        const bossData = window.currentStageBossData;
        
        // 보스 데이터 유효성 최종 검증
        if (!bossData || !isFinite(bossData.x) || !isFinite(bossData.y)) {
            console.error(`❌ 보스 데이터가 유효하지 않습니다:`, bossData);
            return; // 보스 생성 건너뛰기
        }
        
        const boss = {
            x: bossData.x,
            y: bossData.y,
            width: bossData.width,
            height: bossData.height,
            type: bossData.type,
            health: bossData.health,
            maxHealth: bossData.maxHealth,
            velocityX: bossData.velocityX,
            direction: bossData.direction,
            attackPower: bossData.attackPower,
            isBoss: true,
            bossStage: true,
            isGoldenBoss: true,
            bossState: 'idle', // 보스 AI 상태 초기화
            bossTimer: 0, // 보스 타이머 초기화
            bossAttackCooldown: 0, // 보스 공격 쿨다운 초기화
            bossHealthBar: true // 보스 체력바 표시
        };
        
        // 최종 보스 객체 유효성 검증
        if (!isFinite(boss.x) || !isFinite(boss.y)) {
            console.error(`❌ 생성된 보스 객체가 유효하지 않습니다:`, boss);
            return; // 보스 생성 건너뛰기
        }
        
        enemies.push(boss);
        window.bossSpawned = true; // 보스 등장 플래그 설정
        
        // 보스 등장 효과
        for (let i = 0; i < 30; i++) {
            createParticle(
                boss.x + boss.width/2,
                boss.y + boss.height/2,
                '#FF0000',
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 8
            );
        }
        
        // 보스 등장 효과음 재생
        if (window.audioSystem && window.audioSystem.playBossIntroSound) {
            window.audioSystem.playBossIntroSound();
        }
        
        console.log(`🏆 ${boss.type} 보스 등장! 체력: ${boss.health}, 공격력: ${boss.attackPower}`);
    }
}

// 폭발 효과 생성 함수
function createExplosion(x, y, radius) {
    // 폭발 파티클 생성
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 3 + Math.random() * 2;
        const particleX = x + Math.cos(angle) * speed;
        const particleY = y + Math.sin(angle) * speed;
        
        createParticle(particleX, particleY, '#FF4500'); // 오렌지색 폭발 파티클
    }
    
    // 폭발 효과음 재생
    if (window.audioSystem && window.audioSystem.playExplosionSound) {
        window.audioSystem.playExplosionSound();
    }
    
    console.log(`💥 폭발 효과 생성: (${x}, ${y}), 반지름: ${radius}`);
}

// 보스 등장 강제 테스트 함수 (디버깅용)
function forceSpawnBoss() {
    console.log(`🧪 보스 등장 강제 테스트 시작...`);
    
    if (!window.currentStageBossData) {
        console.log(`❌ 보스 데이터가 없습니다. 스테이지를 먼저 생성해야 합니다.`);
        return;
    }
    
    // 보스 데이터 유효성 검증
    const bossData = window.currentStageBossData;
    if (!isFinite(bossData.x) || !isFinite(bossData.y)) {
        console.error(`❌ 보스 데이터가 유효하지 않습니다:`, bossData);
        console.error(`🔍 x: ${bossData.x}, y: ${bossData.y}`);
        return;
    }
    
    // 보스 플래그 리셋
    window.bossSpawned = false;
    console.log(`🔄 보스 플래그 리셋: bossSpawned = false`);
    
    // 모든 적을 제거 (보스 등장 조건 강제 충족)
    const originalEnemyCount = enemies.length;
    enemies.length = 0;
    console.log(`🗑️ 모든 적 제거 완료 (${originalEnemyCount}개 → 0개)`);
    
    // 보스 등장 조건 체크
    checkAndSpawnBoss();
    
    console.log(`🧪 보스 등장 강제 테스트 완료`);
    console.log(`📊 현재 enemies 배열 상태:`, enemies.length);
    console.log(`🏆 보스 등장 여부:`, window.bossSpawned);
    
    // 생성된 보스 확인
    const spawnedBoss = enemies.find(enemy => enemy.isBoss);
    if (spawnedBoss) {
        console.log(`✅ 보스 생성 성공:`, {
            type: spawnedBoss.type,
            x: spawnedBoss.x,
            y: spawnedBoss.y,
            health: spawnedBoss.health
        });
    } else {
        console.log(`❌ 보스 생성 실패`);
    }
}

console.log('게임 객체 관리 시스템 (적 수 증가 및 대시 기능 구현 버전) 로드 완료!');
console.log('🧪 디버깅: forceSpawnBoss() 함수를 콘솔에서 호출하여 보스 등장을 테스트할 수 있습니다.'); 