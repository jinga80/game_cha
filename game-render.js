// ========================================
// 게임 렌더링 시스템 (game-render.js) - HD2D 스타일 적용 버전
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
    renderProjectiles();
    renderExplosions();
    renderParticles();
    renderPlayer();
    renderStageProgress();
    renderStageCompleteMessage();
    renderPauseScreen();
}

// 배경 렌더링 (행성 테마별 HD2D 스타일)
function renderBackground() {
    const planetTheme = PLANET_THEMES[currentPlanet];
    
    // 하늘 그라데이션 (행성 테마별 색상)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, planetTheme.background.sky[0]);
    gradient.addColorStop(0.3, planetTheme.background.sky[1]);
    gradient.addColorStop(0.7, planetTheme.background.sky[2]);
    gradient.addColorStop(1, planetTheme.background.sky[3]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 원거리 산들 (행성 테마별 색상)
    ctx.fillStyle = planetTheme.background.mountains[0] + '66'; // 40% 투명도
    for (let i = 0; i < 6; i++) {
        const x = (i * 350) % (canvas.width + 400);
        const height = 150 + Math.sin(i * 0.8) * 40;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x + 150, canvas.height - height);
        ctx.lineTo(x + 300, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    
    // 중간 거리 산들
    ctx.fillStyle = planetTheme.background.mountains[1] + '99'; // 60% 투명도
    for (let i = 0; i < 4; i++) {
        const x = (i * 500) % (canvas.width + 600);
        const height = 100 + Math.sin(i * 1.2) * 30;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x + 200, canvas.height - height);
        ctx.lineTo(x + 400, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    
    // 행성별 특수 효과
    if (currentPlanet === 2) { // 불꽃행성
        // 용암 효과
        ctx.fillStyle = '#FF4500';
        for (let i = 0; i < 8; i++) {
            const x = (i * 1000) % (canvas.width + 200);
            const y = canvas.height - 50 + Math.sin(Date.now() * 0.005 + i) * 10;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (currentPlanet === 3) { // 번개행성
        // 번개 효과
        if (Math.random() < 0.1) {
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }
    } else if (currentPlanet === 4) { // 원소행성
        // 마법 효과
        ctx.fillStyle = '#9932CC' + '33';
        for (let i = 0; i < 10; i++) {
            const x = (i * 200 + Date.now() * 0.002) % canvas.width;
            const y = 100 + Math.sin(i * 0.5) * 50;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (currentPlanet === 5) { // 얼음행성
        // 눈 효과
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 30; i++) {
            const x = (i * 100 + Date.now() * 0.001) % canvas.width;
            const y = (i * 50 + Date.now() * 0.002) % canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 구름들 (행성별 색상)
    const cloudColor = currentPlanet === 2 ? 'rgba(255, 69, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)';
    ctx.fillStyle = cloudColor;
    for (let i = 0; i < 5; i++) {
        const x = (i * 400 + Date.now() * 0.003) % (canvas.width + 400) - 200;
        const y = 60 + Math.sin(i * 0.7) * 40;
        const size = 40 + Math.sin(i * 0.4) * 15;
        
        // 구름 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 3, y + 3, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름 몸체
        ctx.fillStyle = cloudColor;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 구름 하이라이트
        ctx.fillStyle = cloudColor.replace('0.8', '0.9');
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 플랫폼 렌더링 (행성 테마별 HD2D 스타일)
function renderPlatforms() {
    const planetTheme = PLANET_THEMES[currentPlanet];
    
    platforms.forEach(platform => {
        const x = platform.x - cameraX;
        if (x + platform.width > 0 && x < canvas.width) {
            // 플랫폼 그림자 (HD2D 스타일)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(x + 6, platform.y + 6, platform.width, platform.height);
            
            // 플랫폼 몸체 (행성 테마별 색상)
            if (platform.type === 'ground') {
                // 지면은 행성 테마 색상
                ctx.fillStyle = platform.color || planetTheme.background.ground;
            } else {
                // 중간 플랫폼은 행성 테마 색상
                const baseColor = platform.color || planetTheme.background.platforms;
                const gradient = ctx.createLinearGradient(x, platform.y, x, platform.y + platform.height);
                gradient.addColorStop(0, baseColor);
                gradient.addColorStop(0.5, baseColor);
                gradient.addColorStop(1, baseColor);
                ctx.fillStyle = gradient;
            }
            ctx.fillRect(x, platform.y, platform.width, platform.height);
            
            // 플랫폼 테두리 (행성 테마별 색상)
            ctx.strokeStyle = platform.color || planetTheme.background.platforms;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, platform.y, platform.width, platform.height);
            
            // 플랫폼 하이라이트 (행성 테마별 색상)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(x, platform.y, platform.width, 6);
            
            // 플랫폼 텍스처 (HD2D 스타일)
            if (platform.type === 'ground') {
                // 지면 텍스처
                ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
                for (let i = 0; i < platform.width; i += 25) {
                    ctx.fillRect(x + i, platform.y + 15, 20, 3);
                }
            } else {
                // 중간 플랫폼 텍스처
                ctx.fillStyle = 'rgba(160, 82, 45, 0.5)';
                for (let i = 0; i < platform.width; i += 30) {
                    ctx.fillRect(x + i, platform.y + 10, 25, 2);
                }
            }
        }
    });
}

// 적 렌더링 (AI 상태 표시 추가)
function renderEnemies() {
    enemies.forEach(enemy => {
        const x = enemy.x - cameraX;
        if (x + enemy.width > 0 && x < canvas.width) {
            // 적 그림자 (HD2D 스타일)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x + 6, enemy.y + enemy.height + 6, enemy.width - 12, 12);
            
            // 적 몸체 (AI 상태에 따른 색상 변화)
            let bodyColor;
            if (enemy.type === '나무돌이') {
                bodyColor = enemy.state === 'chase' ? '#FF4500' : '#228B22';
            } else if (enemy.type === '나무왕') {
                bodyColor = enemy.state === 'chase' ? '#8B0000' : '#006400';
            } else if (enemy.type === '포탑몬') {
                bodyColor = enemy.state === 'chase' ? '#FF0000' : '#8B0000';
            } else {
                bodyColor = enemy.state === 'chase' ? '#FF0000' : '#8B0000';
            }
            
            // 적 몸체 그라데이션 (HD2D 스타일)
            const enemyGradient = ctx.createLinearGradient(x, enemy.y, x, enemy.y + enemy.height);
            enemyGradient.addColorStop(0, bodyColor);
            enemyGradient.addColorStop(0.7, bodyColor);
            enemyGradient.addColorStop(1, '#000');
            ctx.fillStyle = enemyGradient;
            ctx.fillRect(x, enemy.y, enemy.width, enemy.height);
            
            // 적 테두리 (HD2D 스타일)
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, enemy.y, enemy.width, enemy.height);
            
            // 적 하이라이트 (HD2D 스타일)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, enemy.y, enemy.width, 8);
            
            // 적 눈 (HD2D 스타일)
            ctx.fillStyle = '#FFF';
            if (enemy.direction > 0) {
                ctx.fillRect(x + 32, enemy.y + 18, 8, 8);
                ctx.fillRect(x + 32, enemy.y + 33, 8, 8);
            } else {
                ctx.fillRect(x + 2, enemy.y + 18, 8, 8);
                ctx.fillRect(x + 2, enemy.y + 35, 8, 8);
            }
            
            // 적 동공 (HD2D 스타일)
            ctx.fillStyle = '#000';
            if (enemy.direction > 0) {
                ctx.fillRect(x + 34, enemy.y + 20, 4, 4);
                ctx.fillRect(x + 34, enemy.y + 35, 4, 4);
            } else {
                ctx.fillRect(x + 4, enemy.y + 20, 4, 4);
                ctx.fillRect(x + 4, enemy.y + 35, 4, 4);
            }
            
            // AI 상태 표시 (적 위에)
            let stateColor, stateText;
            if (enemy.state === 'chase') {
                stateColor = '#FF0000';
                stateText = '⚡';
            } else if (enemy.state === 'alert') {
                stateColor = '#FFD700';
                stateText = '⚠️';
            } else {
                stateColor = '#00FF00';
                stateText = '🔄';
            }
            
            ctx.fillStyle = stateColor;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(stateText, x + enemy.width/2, enemy.y - 5);
            ctx.textAlign = 'left';
            
            // 체력바 (HD2D 스타일)
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

// 발사체 렌더링
function renderProjectiles() {
    player.projectiles.forEach(projectile => {
        projectile.render(ctx);
    });
}

// 폭발 효과 렌더링
function renderExplosions() {
    explosions.forEach(explosion => {
        explosion.render(ctx);
    });
}

// 코인 렌더링 (HD2D 스타일)
function renderCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            const x = coin.x - cameraX;
            if (x + coin.width > 0 && x < canvas.width) {
                // 코인 그림자 (HD2D 스타일)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(x + coin.width/2 + 4, coin.y + coin.height/2 + 4, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 몸체 (HD2D 스타일)
                const coinGradient = ctx.createRadialGradient(
                    x + coin.width/2, coin.y + coin.height/2, 0,
                    x + coin.width/2, coin.y + coin.height/2, coin.width/2
                );
                coinGradient.addColorStop(0, '#FFD700');
                coinGradient.addColorStop(0.7, '#FFA500');
                coinGradient.addColorStop(1, '#FF8C00');
                ctx.fillStyle = coinGradient;
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 테두리 (HD2D 스타일)
                ctx.strokeStyle = '#B8860B';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // 코인 하이라이트 (HD2D 스타일)
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(x + coin.width/2 - 3, coin.y + coin.height/2 - 3, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // 코인 반짝임 효과 (HD2D 스타일)
                ctx.fillStyle = '#FFD700';
                ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.015);
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                
                // 코인 중앙 홀 (HD2D 스타일)
                ctx.fillStyle = '#B8860B';
                ctx.beginPath();
                ctx.arc(x + coin.width/2, coin.y + coin.height/2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

// 파티클 렌더링 (HD2D 스타일)
function renderParticles() {
    particles.forEach(particle => {
        const x = particle.x - cameraX;
        if (x > 0 && x < canvas.width) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 50;
            
            // 파티클 크기 변화
            const size = particle.size || 4;
            ctx.beginPath();
            ctx.arc(x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 파티클 꼬리 효과 (HD2D 스타일)
            if (particle.life > 20) {
                ctx.globalAlpha = (particle.life - 20) / 30 * 0.6;
                ctx.beginPath();
                ctx.arc(x - particle.velocityX * 3, particle.y - particle.velocityY * 3, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 파티클 하이라이트 (HD2D 스타일)
            ctx.globalAlpha = particle.life / 50 * 0.8;
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(x - 1, particle.y - 1, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

// 플레이어 렌더링 (HD2D 스타일)
function renderPlayer() {
    const x = player.x - cameraX;
    
    // 무적 상태일 때 깜빡임 효과
    if (player.invincible && Math.floor(player.invincibleTime / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    // 플레이어 그림자 (HD2D 스타일)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + 6, player.y + player.height + 6, player.width - 12, 12);
    
    // 플레이어 몸체 그라데이션 (HD2D 스타일)
    const playerGradient = ctx.createLinearGradient(x, player.y, x, player.y + player.height);
    playerGradient.addColorStop(0, '#4169E1');
    playerGradient.addColorStop(0.7, '#1E90FF');
    playerGradient.addColorStop(1, '#000080');
    ctx.fillStyle = playerGradient;
    ctx.fillRect(x, player.y, player.width, player.height);
    
    // 플레이어 테두리 (HD2D 스타일)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, player.y, player.width, player.height);
    
    // 플레이어 하이라이트 (HD2D 스타일)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(x, player.y, player.width, 12);
    
    // 플레이어 눈 (HD2D 스타일)
    ctx.fillStyle = '#FFF';
    if (player.direction > 0) {
        ctx.fillRect(x + 38, player.y + 18, 10, 10);
        ctx.fillRect(x + 38, player.y + 33, 10, 10);
    } else {
        ctx.fillRect(x + 2, player.y + 18, 10, 10);
        ctx.fillRect(x + 2, player.y + 35, 10, 10);
    }
    
    // 플레이어 동공 (HD2D 스타일)
    ctx.fillStyle = '#000';
    if (player.direction > 0) {
        ctx.fillRect(x + 40, player.y + 20, 6, 6);
        ctx.fillRect(x + 40, player.y + 35, 6, 6);
    } else {
        ctx.fillRect(x + 4, player.y + 20, 6, 6);
        ctx.fillRect(x + 4, player.y + 35, 6, 6);
    }
    
    // 플레이어 입 (HD2D 스타일)
    ctx.fillStyle = '#FF69B4';
    if (player.direction > 0) {
        ctx.fillRect(x + 28, player.y + 42, 18, 6);
    } else {
        ctx.fillRect(x + 4, player.y + 42, 18, 6);
    }
    
    // 공격 상태 표시 (HD2D 스타일)
    if (player.attacking) {
        // 공격 방향 표시
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = 0.8;
        
        if (player.direction > 0) {
            // 오른쪽 공격
            ctx.fillRect(x + player.width, player.y + 10, 30, 30);
        } else {
            // 왼쪽 공격
            ctx.fillRect(x - 30, player.y + 10, 30, 30);
        }
        
        ctx.globalAlpha = 1;
    }
    
    // 플레이어 체력바 (HD2D 스타일)
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
    
    // 무적 상태 표시
    if (player.invincible) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, player.y - 2, player.width + 4, player.height + 4);
    }
    
    // 무적 시간 복원
    ctx.globalAlpha = 1;
}

// 스테이지 진행도 렌더링
function renderStageProgress() {
    // 스테이지 진행도 바 (화면 상단 중앙)
    const progressBarWidth = 400;
    const progressBarHeight = 20;
    const progressBarX = (canvas.width - progressBarWidth) / 2;
    const progressBarY = 30;
    
    // 진행도 바 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // 진행도 바 테두리
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    
    // 진행도 바 (그라데이션)
    const progressGradient = ctx.createLinearGradient(progressBarX, 0, progressBarX + progressBarWidth, 0);
    progressGradient.addColorStop(0, '#00FF00');
    progressGradient.addColorStop(0.5, '#FFFF00');
    progressGradient.addColorStop(1, '#FF0000');
    
    ctx.fillStyle = progressGradient;
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth * (stageProgress / 100), progressBarHeight);
    
    // 진행도 텍스트
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`스테이지 ${currentStage} 진행도: ${Math.round(stageProgress)}%`, canvas.width / 2, progressBarY - 10);
    
    // 스테이지 정보
    ctx.fillStyle = '#87CEEB';
    ctx.font = '14px Arial';
    ctx.fillText(`남은 적: ${enemies.length} | 남은 코인: ${coins.filter(c => !c.collected).length}`, canvas.width / 2, progressBarY + 35);
    
    ctx.textAlign = 'left';
}

// 스테이지 완료 메시지 렌더링
function renderStageCompleteMessage() {
    if (stageComplete) {
        // 배경 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 완료 메시지
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🎉 스테이지 ${currentStage} 완료! 🎉`, canvas.width / 2, canvas.height / 2 - 50);
        
        // 다음 스테이지 안내
        ctx.fillStyle = '#87CEEB';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`다음 스테이지로 이동 중...`, canvas.width / 2, canvas.height / 2 + 20);
        
        // 진행도 표시
        ctx.fillStyle = '#FFD700';
        ctx.font = '24px Arial';
        ctx.fillText(`3초 후 자동으로 다음 스테이지로 이동합니다`, canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = 'left';
    }
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

// UI 렌더링 (행성 정보 포함)
function updateUI() {
    const stageDisplay = document.getElementById('stageDisplay');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const heartsContainer = document.getElementById('heartsContainer');
    const healthDisplay = document.getElementById('healthDisplay');
    const healthFill = document.getElementById('healthFill');
    
    if (stageDisplay) {
        const planetTheme = PLANET_THEMES[currentPlanet];
        stageDisplay.innerHTML = `${planetTheme.name}<br><span style="font-size: 0.8em;">스테이지 ${currentStage}</span>`;
    }
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
    
    // 행성 정보 표시 (새로운 요소)
    let planetInfo = document.getElementById('planetInfo');
    if (!planetInfo) {
        planetInfo = document.createElement('div');
        planetInfo.id = 'planetInfo';
        planetInfo.className = 'planet-info';
        document.querySelector('.top-info-bar').appendChild(planetInfo);
    }
    
    const planetTheme = PLANET_THEMES[currentPlanet];
    planetInfo.innerHTML = `
        <span class="label">행성:</span>
        <span class="value">${planetTheme.name}</span>
    `;
}

console.log('게임 렌더링 시스템 (HD2D 스타일 적용 버전) 로드 완료!'); 