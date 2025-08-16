// ========================================
// 메인 게임 파일 (game.js)
// ========================================

// 게임 캔버스 및 컨텍스트
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 초기화
function init() {
    console.log('게임 초기화 시작...');
    
    // 캔버스 크기 확인
    if (!canvas) {
        console.error('게임 캔버스를 찾을 수 없습니다!');
        return;
    }
    
    console.log(`캔버스 크기: ${canvas.width} x ${canvas.height}`);
    
    // 오디오 시스템 초기화
    if (typeof initAudioSystem === 'function') {
        initAudioSystem();
        console.log('🎵 오디오 시스템 초기화 완료!');
        console.log('💡 BGM 테스트 버튼을 클릭하여 음악을 재생하세요!');
    } else {
        console.log('⚠️ 오디오 시스템을 찾을 수 없습니다.');
    }
    
    // 게임 초기화
    initGame();
    
    console.log('게임 초기화 완료!');
}

// 페이지 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료!');
    init();
});

// 게임 시작
console.log('메인 게임 파일 로드 완료!');
