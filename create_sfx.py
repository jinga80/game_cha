#!/usr/bin/env python3
"""
게임 효과음 WAV 파일 생성기
실제 오디오 데이터가 포함된 WAV 파일들을 생성합니다.
"""

import wave
import struct
import math
import os

def create_sine_wave(frequency, duration, sample_rate=44100, amplitude=0.3):
    """사인파를 생성하여 WAV 파일로 저장"""
    num_samples = int(sample_rate * duration)
    
    # WAV 파일 생성
    with wave.open(f"sfx/{frequency}hz_{duration}s.wav", 'w') as wav_file:
        # WAV 파일 설정
        wav_file.setnchannels(1)  # 모노
        wav_file.setsampwidth(2)  # 16비트
        wav_file.setframerate(sample_rate)
        
        # 오디오 데이터 생성
        for i in range(num_samples):
            # 사인파 계산
            value = amplitude * math.sin(2 * math.pi * frequency * i / sample_rate)
            # 16비트 정수로 변환
            packed_value = struct.pack('<h', int(value * 32767))
            wav_file.writeframes(packed_value)

def create_effect_sound(filename, frequency, duration, sample_rate=44100, amplitude=0.3):
    """특정 효과음 WAV 파일 생성"""
    num_samples = int(sample_rate * duration)
    
    # sfx 폴더가 없으면 생성
    os.makedirs('sfx', exist_ok=True)
    
    with wave.open(f"sfx/{filename}", 'w') as wav_file:
        wav_file.setnchannels(1)  # 모노
        wav_file.setsampwidth(2)  # 16비트
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            value = amplitude * math.sin(2 * math.pi * frequency * i / sample_rate)
            packed_value = struct.pack('<h', int(value * 32767))
            wav_file.writeframes(packed_value)

def create_various_effects():
    """다양한 효과음 생성"""
    effects = [
        # 기본 게임 액션 효과음
        ('jump.wav', 800, 0.2),      # 점프 - 높은 톤, 짧음
        ('coin.wav', 1200, 0.1),     # 코인 - 높은 톤, 매우 짧음
        ('enemy_hit.wav', 400, 0.15), # 적 처치 - 낮은 톤, 짧음
        ('player_hit.wav', 200, 0.3), # 플레이어 피격 - 매우 낮은 톤, 중간
        ('explosion.wav', 150, 0.5),  # 폭발 - 매우 낮은 톤, 길음
        ('power_up.wav', 1000, 0.25), # 파워업 - 높은 톤, 중간
        ('stage_clear.wav', 800, 1.0), # 스테이지 클리어 - 높은 톤, 길음
        ('game_over.wav', 300, 0.8),  # 게임 오버 - 낮은 톤, 길음
        
        # 메뉴 및 UI 효과음
        ('menu_select.wav', 600, 0.1), # 메뉴 선택 - 중간 톤, 짧음
        ('menu_confirm.wav', 800, 0.15), # 메뉴 확인 - 높은 톤, 짧음
        
        # 특수 효과음
        ('portal.wav', 500, 0.4),     # 포털 - 중간 톤, 중간
        ('magic.wav', 1200, 0.3),     # 마법 - 높은 톤, 중간
        ('dash.wav', 700, 0.2),       # 대시 - 높은 톤, 짧음
        ('landing.wav', 400, 0.15),   # 착지 - 낮은 톤, 짧음
        
        # 캐릭터별 공격 효과음
        ('sword.wav', 600, 0.2),      # 검 공격 - 중간 톤, 짧음
        ('arrow.wav', 800, 0.15),     # 화살 공격 - 높은 톤, 짧음
        ('hammer.wav', 300, 0.3),     # 망치 공격 - 낮은 톤, 중간
        ('bomb.wav', 200, 0.4),      # 폭탄 공격 - 매우 낮은 톤, 중간
        
        # 보스 관련 효과음
        ('boss_intro.wav', 150, 1.0), # 보스 등장 - 매우 낮은 톤, 길음
        ('boss_defeat.wav', 800, 0.8), # 보스 처치 - 높은 톤, 길음
        
        # 새로운 효과음들
        ('area_attack.wav', 400, 0.5), # 광역 공격 - 낮은 톤, 중간
        ('upward_shot.wav', 900, 0.2), # 위쪽 발사 - 높은 톤, 짧음
        ('health_item.wav', 600, 0.15), # 체력 회복 - 중간 톤, 짧음
        ('weapon_upgrade.wav', 1000, 0.3), # 무기 업그레이드 - 높은 톤, 중간
        ('rolling_bomb.wav', 250, 0.4), # 굴러오는 폭탄 - 낮은 톤, 중간
        ('bird_enemy.wav', 1200, 0.2), # 새 적 - 높은 톤, 짧음
        ('next_stage.wav', 700, 0.6),  # 다음 스테이지 - 높은 톤, 중간
    ]
    
    print("🎵 게임 효과음 WAV 파일 생성 중...")
    
    for filename, frequency, duration in effects:
        try:
            create_effect_sound(filename, frequency, duration)
            print(f"✅ {filename} 생성 완료 ({frequency}Hz, {duration}s)")
        except Exception as e:
            print(f"❌ {filename} 생성 실패: {e}")
    
    print(f"\n🎉 총 {len(effects)}개의 효과음 파일 생성 완료!")
    print("💡 이제 게임에서 효과음을 들을 수 있습니다!")

if __name__ == "__main__":
    create_various_effects()
