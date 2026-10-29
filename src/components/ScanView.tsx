import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Player } from '../types/hxh';
import { sound } from '../services/sound';

interface ScanViewProps {
  player: Player;
  cards: Card[];
  onProcessScan: (rawCode: string) => Promise<{
    success: boolean;
    points: number;
    title: string;
    message: string;
    hint?: string;
  }> | {
    success: boolean;
    points: number;
    title: string;
    message: string;
    hint?: string;
  };
  onNavigateToHints: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  player,
  cards,
  onProcessScan,
  onNavigateToHints
}) => {
  const [camStatus, setCamStatus] = useState<'INIT...' | 'GYO ACTIVÉ' | 'CAM INDISPO'>('INIT...');
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [modalResult, setModalResult] = useState<{
    success: boolean;
    points: number;
    title: string;
    message: string;
    hint?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCooldownRef = useRef(false);

  // Stop camera helper
  const stopCam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const handleScanCode = useCallback(async (code: string) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;

    const res = await onProcessScan(code);
    if (res.success) {
      sound.playSuccess();
    } else {
      sound.playError();
    }
    setModalResult(res);

    setTimeout(() => {
      isCooldownRef.current = false;
    }, 2200);
  }, [onProcessScan]);

  // Start camera and scanner
  const startCam = useCallback(async () => {
    stopCam();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamStatus('GYO ACTIVÉ');

      // Scan loop using canvas & jsQR if available, or BarcodeDetector
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < videoRef.current.HAVE_ENOUGH_DATA) return;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        // 1. Try native BarcodeDetector if available
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await barcodeDetector.detect(canvas);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              handleScanCode(barcodes[0].rawValue);
              return;
            }
          } catch {}
        }

        // 2. Try jsQR if loaded via window
        if ((window as any).jsQR) {
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const decoded = (window as any).jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (decoded?.data) {
              handleScanCode(decoded.data);
            }
          } catch {}
        }
      }, 250);

    } catch (e) {
      setCamStatus('CAM INDISPO');
    }
  }, [facing, handleScanCode, stopCam]);

  useEffect(() => {
    startCam();
    return () => {
      stopCam();
    };
  }, [startCam, stopCam]);

  const flipCamera = () => {
    sound.playClick();
    setFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const closeModal = () => {
    sound.playClick();
    setModalResult(null);
  };

  const scannedCount = player.scannedCodeIds.length;

  return (
    <div className="scan-page-layout">
      {/* Header title with Japanese */}
      <div style={{ width: '100%', maxWidth: 340, flexShrink: 0 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>念レーダー <em>RADAR NEN</em></h1>
          <p>GYO ACTIVÉ — EXAMEN OFFICIEL PAR LE CLUB LDC</p>
        </div>
      </div>

      {/* Radar Camera Frame */}
      <div className="radar-container" id="radar-container">
        <video ref={videoRef} className="radar-video" playsInline muted autoPlay />

        <div className="radar-hud">
          {/* Top Row Status & Flip */}
          <div className="radar-top-row">
            <div className="radar-status-chip">
              <span
                className="radar-pulse-dot"
                id="status-dot"
                style={{ background: camStatus === 'GYO ACTIVÉ' ? 'var(--hunter-green)' : '#666' }}
              />
              <span>{camStatus}</span>
            </div>
            <button
              onClick={flipCamera}
              style={{
                background: 'rgba(4,7,16,0.8)',
                border: '1px solid rgba(0,242,254,0.3)',
                color: 'var(--hunter-cyan)',
                fontFamily: 'var(--font-code)',
                fontSize: 9,
                letterSpacing: 1,
                padding: '4px 9px',
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              ↺ CHANGER
            </button>
          </div>

          {/* Central Reticle & Laser */}
          <div className="radar-reticle" />
          <div className="scan-laser" />

          {/* Bottom Prompt */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-code)',
              fontSize: 9,
              letterSpacing: 2,
              color: 'var(--hunter-green)',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(0,0,0,0.9)'
            }}
          >
            CADREZ LE QR CODE
          </div>
        </div>
      </div>

      {/* Live Info / Instruction */}
      <div className="scan-instruction-card">
        <div>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            CARTES VALIDÉES
          </div>
          <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 15, letterSpacing: 1, color: '#fff' }}>
            OBTENUES : <span style={{ color: 'var(--hunter-green)' }}>{scannedCount}</span> / <span>{cards.length}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            STATUT
          </div>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: 'var(--hunter-cyan)' }}>
            GYO ACTIF
          </div>
        </div>
      </div>

      {/* LDC Club Creator Signature */}
      <div className="ldc-footer-credit" style={{ width: '100%', maxWidth: 340, flexShrink: 0, marginTop: 10 }}>
        <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span>•</span> MADE BY LDC CLUB <span className="dot">✦</span>
      </div>

      {/* RESULT MODAL */}
      {modalResult && (
        <div className="modal-overlay open">
          <div
            className="modal-box"
            style={{ borderColor: modalResult.success ? 'var(--hunter-green)' : 'var(--hunter-danger)' }}
          >
            {/* Verdict Banner */}
            <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 26, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
              {modalResult.success ? (
                <span style={{ color: 'var(--hunter-green)', textShadow: 'var(--glow-green)' }}>
                  ✓ CODE VALIDÉ !
                </span>
              ) : (
                <span style={{ color: 'var(--hunter-danger)' }}>
                  ✗ CODE INVALIDE
                </span>
              )}
            </div>

            {/* Points Tag (if valid) */}
            {modalResult.success && (
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 22, fontWeight: 700, color: 'var(--hunter-gold)', marginBottom: 8, textShadow: 'var(--glow-gold)' }}>
                +{modalResult.points} POINTS NEN
              </div>
            )}

            {/* Title */}
            <h3 style={{ fontFamily: 'var(--font-hxh)', fontSize: 16, letterSpacing: 1.5, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>
              {modalResult.title}
            </h3>

            {/* Message */}
            <p style={{ fontFamily: 'var(--font-jp)', fontSize: 12, color: 'var(--ash)', lineHeight: 1.6, marginBottom: 16 }}>
              {modalResult.message}
            </p>

            {/* Hint revealed (if valid) */}
            {modalResult.success && modalResult.hint && (
              <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,240,118,0.35)', borderRadius: 4, padding: 12, marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, letterSpacing: 2, color: 'var(--hunter-green)', textTransform: 'uppercase', marginBottom: 6 }}>
                  ▸ INDICE DÉBLOQUÉ
                </div>
                <p style={{ fontFamily: 'var(--font-jp)', fontSize: 12, color: '#d8d8e8', lineHeight: 1.6 }}>
                  {modalResult.hint}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button className="btn btn-outline btn-full btn-sm" onClick={closeModal}>
                FERMER
              </button>
              <button
                className="btn btn-green btn-full btn-sm"
                onClick={() => {
                  closeModal();
                  onNavigateToHints();
                }}
              >
                VOIR ARCHIVES →
              </button>
            </div>

            {/* LDC Club Creator Signature */}
            <div className="ldc-footer-credit">
              <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span className="dot">✦</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
