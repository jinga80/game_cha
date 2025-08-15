// ========================================
// 게임 렌더링 시스템 (game-render.js) - 발사체 및 폭발 효과 추가 버전
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

// 적 렌더링 (AI 상태 표시 추가)
function renderEnemies() {
    enemies.forEach(enemy => {
        const x = enemy.x - cameraX;
        if (x + enemy.width > 0 && x < canvas.width) {
            // 적 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(x + 8, enemy.y + enemy.height + 8, enemy.width - 16, 15);
            
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
            
            ctx.fillStyle = bodyColor;
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
            ctx.globalAlpha = particle.life / 50;
            
            // 파티클 크기 변화
            const size = particle.size || 4;
            ctx.beginPath();
            ctx.arc(x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 파티클 꼬리 효과
            if (particle.life > 20) {
                ctx.globalAlpha = (particle.life - 20) / 30 * 0.6;
                ctx.beginPath();
                ctx.arc(x - particle.velocityX * 3, particle.y - particle.velocityY * 3, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 파티클 하이라이트
            ctx.globalAlpha = particle.life / 50 * 0.8;
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
    
    // 무적 상태일 때 깜빡임 효과
    if (player.invincible && Math.floor(player.invincibleTime / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
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
        ctx.fillRect(x + 2, player.y + 35, 10, 10);
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

console.log('게임 렌더링 시스템 (발사체 및 폭발 효과 추가 버전) 로드 완료!'); 