// ========================================
// 게임 렌더링 시스템 (game-render.js) - 개선된 버전
// ========================================

// 게임 렌더링 함수
function renderGame() {
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 렌더링 순서
    renderBackground();
    renderPlatforms();
    renderCoins();
    renderEnemies();
    renderParticles();
    renderPlayer();
    renderPauseScreen();
}

// 배경 렌더링
function renderBackground() {
    // 하늘 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 구름들 (더 크고 아름답게)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 8; i++) {
        const x = (i * 300 + Date.now() * 0.005) % (canvas.width + 300) - 150;
        const y = 80 + Math.sin(i * 0.5) * 60;
        const size = 50 + Math.sin(i * 0.3) * 20;
        
        // 구름 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름 몸체
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름 하이라이트
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 원거리 산들
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 400) % (canvas.width + 400);
        const height = 200 + Math.sin(i) * 50;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x + 200, canvas.height - height);
        ctx.lineTo(x + 400, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
}

// 플랫폼 렌더링
function renderPlatforms() {
    platforms.forEach(platform => {
        const x = platform.x - cameraX;
        if (x + platform.width > 0 && x < canvas.width) {
            // 플랫폼 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x + 8, platform.y + 8, platform.width, platform.height);
            
            // 플랫폼 몸체
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, platform.y, platform.width, platform.height);
            
            // 플랫폼 테두리
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, platform.y, platform.width, platform.height);
            
            // 플랫폼 하이라이트
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, platform.y, platform.width, 8);
            
            // 플랫폼 텍스처
            ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
            for (let i = 0; i < platform.width; i += 20) {
                ctx.fillRect(x + i, platform.y + 10, 15, 2);
            }
        }
    });
}

// 적 렌더링
function renderEnemies() {
    enemies.forEach(enemy => {
        const x = enemy.x - cameraX;
        if (x + enemy.width > 0 && x < canvas.width) {
            // 적 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(x + 8, enemy.y + enemy.height + 8, enemy.width - 16, 15);
            
            // 적 몸체
            if (enemy.type === '나무돌이') {
                ctx.fillStyle = '#228B22';
            } else {
                ctx.fillStyle = '#8B0000';
            }
            ctx.fillRect(x, enemy.y, enemy.width, enemy.height);
            
            // 적 테두리
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, enemy.y, enemy.width, enemy.height);
            
            // 적 하이라이트
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, enemy.y, enemy.width, 8);
            
            // 적 눈 (더 크게)
            ctx.fillStyle = '#FFF';
            if (enemy.direction > 0) {
                ctx.fillRect(x + 32, enemy.y + 18, 8, 8);
                ctx.fillRect(x + 32, enemy.y + 33, 8, 8);
            } else {
                ctx.fillRect(x + 2, enemy.y + 18, 8, 8);
                ctx.fillRect(x + 2, enemy.y + 33, 8, 8);
            }
            
            // 적 동공
            ctx.fillStyle = '#000';
            if (enemy.direction > 0) {
                ctx.fillRect(x + 34, enemy.y + 20, 4, 4);
                ctx.fillRect(x + 34, enemy.y + 35, 4, 4);
            } else {
                ctx.fillRect(x + 4, enemy.y + 20, 4, 4);
                ctx.fillRect(x + 4, enemy.y + 35, 4, 4);
            }
            
            // 체력바 (더 크게)
            const healthRatio = enemy.health / enemy.maxHealth;
            const healthBarWidth = enemy.width;
            const healthBarHeight = 8;
            
            // 체력바 배경
            ctx.fillStyle = '#333';
            ctx.fillRect(x, enemy.y - 15, healthBarWidth, healthBarHeight);
            
            // 체력바 (색상 변화)
            if (healthRatio > 0.6) {
                ctx.fillStyle = '#00FF00'; // 초록색
            } else if (healthRatio > 0.3) {
                ctx.fillStyle = '#FFFF00'; // 노란색
            } else {
                ctx.fillStyle = '#FF0000'; // 빨간색
            }
            ctx.fillRect(x, enemy.y - 15, healthBarWidth * healthRatio, healthBarHeight);
            
            // 체력바 테두리
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, enemy.y - 15, healthBarWidth, healthBarHeight);
        }
    });
}

// 코인 렌더링
function renderCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            const x = coin.x - cameraX;
            if (x + coin.width > 0 && x < canvas.width) {
                // 코인 그림자
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(x + coin.width/2 + 3, coin.y + coin.height/2 + 3, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 몸체
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 테두리
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // 코인 하이라이트
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(x + coin.width/2 - 4, coin.y + coin.height/2 - 4, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 반짝임 효과
                ctx.fillStyle = '#FFD700';
                ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                
                // 코인 중앙 홀
                ctx.fillStyle = '#B8860B';
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

// 파티클 렌더링
function renderParticles() {
    particles.forEach(particle => {
        const x = particle.x - cameraX;
        if (x > 0 && x < canvas.width) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            
            // 파티클 크기 변화
            const size = 4 + (30 - particle.life) / 8;
            ctx.beginPath();
            ctx.arc(x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 파티클 꼬리 효과
            if (particle.life > 20) {
                ctx.globalAlpha = (particle.life - 20) / 10 * 0.6;
                ctx.beginPath();
                ctx.arc(x - particle.velocityX * 3, particle.y - particle.velocityY * 3, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 파티클 하이라이트
            ctx.globalAlpha = particle.life / 30 * 0.8;
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(x - 1, particle.y - 1, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

// 플레이어 렌더링
function renderPlayer() {
    const x = player.x - cameraX;
    
    // 플레이어 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 8, player.y + player.height + 8, player.width - 16, 15);
    
    // 플레이어 몸체
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x, player.y, player.width, player.height);
    
    // 플레이어 테두리
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, player.y, player.width, player.height);
    
    // 플레이어 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, player.y, player.width, 12);
    
    // 플레이어 눈 (더 크게)
    ctx.fillStyle = '#FFF';
    if (player.direction > 0) {
        ctx.fillRect(x + 38, player.y + 18, 10, 10);
        ctx.fillRect(x + 38, player.y + 33, 10, 10);
    } else {
        ctx.fillRect(x + 2, player.y + 18, 10, 10);
        ctx.fillRect(x + 2, player.y + 33, 10, 10);
    }
    
    // 플레이어 동공
    ctx.fillStyle = '#000';
    if (player.direction > 0) {
        ctx.fillRect(x + 40, player.y + 20, 6, 6);
        ctx.fillRect(x + 40, player.y + 35, 6, 6);
    } else {
        ctx.fillRect(x + 4, player.y + 20, 6, 6);
        ctx.fillRect(x + 4, player.y + 35, 6, 6);
    }
    
    // 플레이어 입 (더 크게)
    ctx.fillStyle = '#FF69B4';
    if (player.direction > 0) {
        ctx.fillRect(x + 28, player.y + 42, 18, 6);
    } else {
        ctx.fillRect(x + 4, player.y + 42, 18, 6);
    }
    
    // 공격 상태 표시
    if (player.attacking) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + (player.direction > 0 ? player.width : -25), player.y + 12, 25, 35);
        
        // 공격 이펙트
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + (player.direction > 0 ? player.width + 12 : -12), player.y + 18);
        ctx.lineTo(x + (player.direction > 0 ? player.width + 25 : -25), player.y + 28);
        ctx.stroke();
        
        // 공격 파티클
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 5; i++) {
            const px = x + (player.direction > 0 ? player.width + 15 : -15) + (Math.random() - 0.5) * 20;
            const py = player.y + 20 + Math.random() * 20;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // 플레이어 체력바 (더 크게)
    const healthRatio = player.health / player.maxHealth;
    const healthBarWidth = player.width;
    const healthBarHeight = 8;
    
    // 체력바 배경
    ctx.fillStyle = '#333';
    ctx.fillRect(x, player.y - 20, healthBarWidth, healthBarHeight);
    
    // 체력바 (색상 변화)
    if (healthRatio > 0.6) {
        ctx.fillStyle = '#00FF00'; // 초록색
    } else if (healthRatio > 0.3) {
        ctx.fillStyle = '#FFFF00'; // 노란색
    } else {
        ctx.fillStyle = '#FF0000'; // 빨간색
    }
    ctx.fillRect(x, player.y - 20, healthBarWidth * healthRatio, healthBarHeight);
    
    // 체력바 테두리
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, player.y - 20, healthBarWidth, healthBarHeight);
}

// 일시정지 화면 렌더링
function renderPauseScreen() {
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️ 일시정지', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '28px Arial';
        ctx.fillText('P키를 눌러 계속하기', canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = 'left';
    }
}

// UI 렌더링 (HTML로 처리되므로 여기서는 추가 렌더링 불필요)
function updateUI() {
    const stageDisplay = document.getElementById('stageDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const heartsContainer = document.getElementById('heartsContainer');
    const healthDisplay = document.getElementById('healthDisplay');
    const healthFill = document.getElementById('healthFill');
    
    if (stageDisplay) stageDisplay.textContent = currentStage;
    if (scoreDisplay) scoreDisplay.textContent = score;
    if (livesDisplay) livesDisplay.textContent = lives;
    if (healthDisplay) healthDisplay.textContent = player.health;
    
    // 체력바 업데이트
    if (healthFill) {
        const healthRatio = player.health / player.maxHealth;
        healthFill.style.width = (healthRatio * 100) + '%';
    }
    
    // 하트 아이콘 업데이트
    if (heartsContainer) {
        heartsContainer.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heartsContainer.appendChild(heart);
        }
    }
}

console.log('게임 렌더링 시스템 (개선된 버전) 로드 완료!'); 